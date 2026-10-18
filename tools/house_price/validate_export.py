#!/usr/bin/env python3
"""Validate a freshly exported city JSON before it is committed.

Two independent gates:

1. Absolute floors -- catches a totally broken export.
2. Regression against the previously committed file -- catches a *partial*
   scrape, which is the failure mode that actually bit us: on 2026-08-02 the
   export dropped from 5951 communities to 4112 (-31%) and the old
   "districts >= 3" check waved it through to production.

Also reports whether anything other than `updated_at` changed, so the workflow
can skip a no-op commit (and the full site rebuild it triggers).

Usage:
    python validate_export.py --new <path> [--prev <path>] [--max-drop 0.10]

Exits non-zero on validation failure. Writes `changed=true|false` to
$GITHUB_OUTPUT when running under GitHub Actions.
"""

import argparse
import json
import os
import sys
from history import history_integrity_errors

# Absolute floors: below these the export is broken, regardless of history.
MIN_DISTRICTS = 3
MIN_CITY_HISTORY = 12


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def metrics(data):
    """The counts that a partial scrape silently erodes."""
    districts = data.get("districts", {})
    return {
        "districts": len(districts),
        "city_history": len(data.get("city_history", [])),
        "district_history": sum(len(d.get("history") or []) for d in districts.values()),
        "communities": sum(len(d.get("communities") or []) for d in districts.values()),
    }


def check_floors(m):
    errors = []
    if m["districts"] < MIN_DISTRICTS:
        errors.append(f"too few districts: {m['districts']} < {MIN_DISTRICTS}")
    if m["city_history"] < MIN_CITY_HISTORY:
        errors.append(f"too few city_history rows: {m['city_history']} < {MIN_CITY_HISTORY}")
    if m["communities"] == 0:
        errors.append("no communities at all")
    return errors


def check_regression(new, prev, max_drop):
    """Fail if any metric shrank by more than `max_drop` versus the last export."""
    errors = []
    for key, prev_val in prev.items():
        if prev_val == 0:
            continue
        new_val = new[key]
        drop = (prev_val - new_val) / prev_val
        if drop > max_drop:
            errors.append(
                f"{key} dropped {drop:.1%} ({prev_val} -> {new_val}), "
                f"exceeds max allowed {max_drop:.0%}"
            )
    return errors


def content_changed(new_data, prev_data):
    """Compare payloads ignoring `updated_at`, which changes every single run."""
    def meaningful(value):
        if isinstance(value, dict):
            return {k: meaningful(v) for k, v in value.items() if k not in {"updated_at", "last_attempt_at"}}
        if isinstance(value, list):
            return [meaningful(v) for v in value]
        return value
    a, b = meaningful(new_data), meaningful(prev_data)
    return a != b


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--new", required=True, help="freshly exported JSON")
    parser.add_argument("--prev", help="previously committed JSON, if available")
    parser.add_argument(
        "--max-drop",
        type=float,
        default=0.10,
        help="max tolerated shrinkage of any metric vs. --prev (default: 0.10)",
    )
    args = parser.parse_args()

    try:
        new_data = load(args.new)
    except Exception as e:  # noqa: BLE001 - any failure here means a broken export
        print(f"Validation FAILED: cannot read {args.new}: {e}", file=sys.stderr)
        return 1

    new_m = metrics(new_data)
    print(f"New export: {new_m}")
    quality = new_data.get("meta", {}).get("quality", {})
    if quality.get("status") == "degraded":
        message = (f"采集降级: 获取 {quality.get('fresh_communities', 0)} 条新报价，"
                   f"沿用 {quality.get('carried_communities', 0)} 条旧报价；"
                   "数量校验通过不代表数据新鲜或完整。")
        print(f"::warning::{message}")
        summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as summary:
                summary.write("\n### 房价数据采集状态\n\n" + message + "\n\n")
                summary.write("|区域|来源|状态|本次获取|沿用|原因|\n|---|---|---|---:|---:|---|\n")
                for district in new_data.get("districts", {}).values():
                    for source, status in district.get("community_sources", {}).items():
                        summary.write(f"|{district['name']}|{source}|{status['status']}|{status['fetched_count']}|{status['carried_count']}|{status.get('reason', '')}|\n")

    errors = check_floors(new_m)

    changed = True
    if args.prev:
        try:
            prev_data = load(args.prev)
        except Exception as e:  # noqa: BLE001
            print(f"Validation FAILED: cannot read previous export ({e}); history comparison is required", file=sys.stderr)
            return 1
        else:
            prev_m = metrics(prev_data)
            print(f"Previous:   {prev_m}")
            errors += check_regression(new_m, prev_m, args.max_drop)
            errors += history_integrity_errors(new_data, prev_data)
            changed = content_changed(new_data, prev_data)
            blocks = [new_data, *new_data.get("districts", {}).values()]
            revised = sum(b.get("history_status", {}).get("revision_count", 0) for b in blocks)
            carried = sum(b.get("history_status", {}).get("carried_fields", 0) for b in blocks)
            if revised or carried:
                message = f"月度历史：保留 {carried} 个本次缺失的历史价格字段，记录 {revised} 个发布值修订。"
                print(f"::warning::{message}")
                if os.environ.get("GITHUB_STEP_SUMMARY"):
                    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
                        summary.write("\n" + message + "\n")
    else:
        print("No previous export to compare against, regression check skipped")

    if errors:
        for e in errors:
            print(f"Validation FAILED: {e}", file=sys.stderr)
        return 1

    print(f"Validation passed. Content changed (ignoring updated_at): {changed}")

    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
