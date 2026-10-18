"""Keep usable observations without disguising a failed scrape as fresh data."""

from copy import deepcopy
from datetime import date


def reconcile_communities(fresh, previous, scrape_status, local=(), today=None, source="gotohui"):
    today = today or date.today().isoformat()
    previous = previous or {}
    def identity(row):
        return (row.get("source") or "gotohui", row.get("source_id") or row["community"])
    old = {identity(r): r for r in previous.get("communities", [])}
    rows = {}
    fetched_keys = set()
    # Preserve missing observations even after a partial scrape. Completeness
    # describes the new fetch, not the size of the merged/published list.
    for key, row in old.items():
        rows[key] = {**deepcopy(row), "source": key[0]}
        if key[0] == source:
            rows[key]["stale"] = True
    for row in fresh:
        if row.get("price") is None or row["price"] <= 0:
            continue
        key = identity(row)
        fetched_keys.add(key)
        item = {**row, "source": key[0], "fetched_at": today, "stale": False}
        observations = deepcopy(old.get(key, {}).get("observations", []))
        if item.get("observed_month"):
            observation = {k: item.get(k) for k in ("observed_month", "price", "mom_pct", "source", "source_url")}
            observations = [o for o in observations if (o.get("source"), o.get("observed_month")) != (item.get("source"), item["observed_month"])]
            observations.append(observation)
        if observations:
            item["observations"] = sorted(observations, key=lambda o: o["observed_month"])
        rows[key] = item
    # A manual supplement is an observation, not evidence that the scraper ran.
    for row in local:
        key = identity(row)
        if key in fetched_keys:
            continue
        item = deepcopy(rows.get(key, {}))
        # A committed snapshot must not overwrite a newer live observation on
        # the next day when the live provider happens to fail.
        old_month, new_month = item.get("observed_month"), row.get("observed_month")
        old_fetch, new_fetch = item.get("fetched_at"), row.get("fetched_at")
        if old_month and new_month and old_month > new_month:
            continue
        if old_fetch and (not new_fetch or old_fetch > new_fetch):
            continue
        item.update(row)
        item["stale"] = True
        rows[key] = item
    source_rows = [r for r in rows.values() if r.get("source") == source]
    fetched = sum(key[0] == source for key in fetched_keys)
    carried = sum(bool(r.get("stale")) for r in source_rows)
    complete = bool(scrape_status.get("complete")) and fetched > 0
    status = "fresh" if complete and not carried else "partial" if fetched else "carried_forward" if source_rows else "unavailable"
    prev_status = (previous.get("community_sources") or {}).get(source) or previous.get("community_status") or {}
    return list(rows.values()), {
        "status": status, "complete": complete,
        "fetched_count": fetched, "carried_count": carried,
        "last_attempt_at": today,
        "last_success_at": today if complete else prev_status.get("last_success_at"),
        "reason": scrape_status.get("reason", "unknown"),
    }


def combine_status(sources, today=None):
    statuses = list(sources.values())
    fetched = sum(s.get("fetched_count", 0) for s in statuses)
    carried = sum(s.get("carried_count", 0) for s in statuses)
    complete = bool(statuses) and all(s.get("complete") for s in statuses)
    return {"status": "fresh" if complete and not carried else "partial" if fetched else "carried_forward" if carried else "unavailable",
            "complete": complete, "fetched_count": fetched, "carried_count": carried,
            "last_attempt_at": today or date.today().isoformat()}


def quality_summary(data):
    statuses = [d.get("community_status", {}) for d in data.get("districts", {}).values()]
    return {
        "status": "ok" if statuses and all(s.get("status") == "fresh" for s in statuses) else "degraded",
        "fresh_communities": sum(s.get("fetched_count", 0) for s in statuses),
        "carried_communities": sum(s.get("carried_count", 0) for s in statuses),
        "incomplete_districts": [d["name"] for d in data.get("districts", {}).values() if not d.get("community_status", {}).get("complete")],
    }
