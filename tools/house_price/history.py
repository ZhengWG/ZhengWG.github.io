"""Month-level preservation and an append-only audit of source revisions."""
from copy import deepcopy
from datetime import date
import math
import re

PRICE_FIELDS = ("second_hand_price", "new_house_price")


def valid_month(value):
    return isinstance(value, str) and bool(re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value))


def valid_price(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0


def _merge(previous, incoming, source, series, revisions, today):
    by_month = {r["date"]: deepcopy(r) for r in previous}
    for row in incoming:
        month = row.get("date")
        if not valid_month(month):
            continue
        values = {k: row[k] for k in PRICE_FIELDS if valid_price(row.get(k))}
        if not values:
            continue
        current = by_month.setdefault(month, {"date": month, **dict.fromkeys(PRICE_FIELDS)})
        for field, value in values.items():
            before = current.get(field)
            if valid_price(before) and before != value:
                provider = source.get((month, field)) if isinstance(source, dict) else source
                revisions.append({"series": series, "source": provider, "date": month, "field": field,
                                  "before": before, "after": value, "detected_at": today})
            current[field] = value
    return [by_month[k] for k in sorted(by_month)]


def reconcile_history(previous, fresh_by_source, field="history", today=None):
    """Retain missing months/fields; audit changes before replacing known values.

    Legacy published rows have unknown field-level provenance. Keep an exact
    legacy archive instead of retroactively assigning them to a provider.
    """
    today = today or date.today().isoformat()
    previous = previous or {}
    published = deepcopy(previous.get(field, []))
    archives = deepcopy(previous.get("history_sources", {}))
    if not archives and published:
        archives["legacy"] = deepcopy(published)
    revisions = deepcopy(previous.get("history_revisions", []))
    revision_start = len(revisions)
    fetched = set()
    effective, origins = {}, {}
    invalid = 0
    for source, rows in fresh_by_source.items():
        for row in rows:
            if not valid_month(row.get("date")):
                invalid += 1
                continue
            for key in PRICE_FIELDS:
                value = row.get(key)
                if valid_price(value):
                    fetched.add((row["date"], key))
                    effective.setdefault(row["date"], {"date": row["date"]})[key] = value
                    origins[(row["date"], key)] = source
                elif value is not None:
                    invalid += 1
        archives[source] = _merge(archives.get(source, []), rows, source, source, revisions, today)
    published = _merge(published, list(effective.values()), origins, "published", revisions, today)
    carried = sum((r["date"], key) not in fetched for r in previous.get(field, [])
                  for key in PRICE_FIELDS if valid_price(r.get(key)))
    return {field: published, "history_sources": archives, "history_revisions": revisions,
            "history_status": {"status": "fresh" if fetched and not carried and not invalid else "partial" if fetched else "carried_forward",
                               "fetched_fields": len(fetched), "carried_fields": carried, "invalid_fields": invalid,
                               "revision_count": sum(r["series"] == "published" for r in revisions[revision_start:]),
                               "last_attempt_at": today}}


def history_integrity_errors(new, previous):
    """Reject even one missing month/value or an unlogged historical revision."""
    errors = []

    def inspect_block(current, old, label, field):
        log = current.get("history_revisions", [])
        old_log = old.get("history_revisions", [])
        if log[:len(old_log)] != old_log:
            errors.append(f"{label}: historical revision log was removed or changed")
        fresh_log = log[len(old_log):]

        def inspect_rows(rows, old_rows, series):
            seen = set()
            for row in rows:
                month = row.get("date")
                if not valid_month(month) or month in seen:
                    errors.append(f"{label}/{series}: invalid or duplicate month {month}")
                seen.add(month)
            by_date = {r.get("date"): r for r in rows}
            for row in old_rows:
                month = row["date"]
                if month not in by_date:
                    errors.append(f"{label}/{series}: lost month {month}")
                    continue
                for key in PRICE_FIELDS:
                    before = row.get(key)
                    if not valid_price(before):
                        continue
                    after = by_date[month].get(key)
                    if not valid_price(after):
                        errors.append(f"{label}/{series}: lost value {month}/{key}")
                    elif after != before:
                        # Several providers may revise one field within a run.
                        value = before
                        for revision in fresh_log:
                            if (revision.get("series"), revision.get("date"), revision.get("field"), revision.get("before")) == (series, month, key, value):
                                value = revision.get("after")
                        if value != after:
                            errors.append(f"{label}/{series}: unlogged revision {month}/{key}")

        inspect_rows(current.get(field, []), old.get(field, []), "published")
        for source, rows in old.get("history_sources", {}).items():
            inspect_rows(current.get("history_sources", {}).get(source, []), rows, source)

    if previous.get("city_key") != new.get("city_key"):
        errors.append("cannot merge history from a different city")
    inspect_block(new, previous, "city", "city_history")
    for key, old in previous.get("districts", {}).items():
        if key not in new.get("districts", {}):
            errors.append(f"lost district {key}")
        else:
            inspect_block(new["districts"][key], old, key, "history")
    return errors
