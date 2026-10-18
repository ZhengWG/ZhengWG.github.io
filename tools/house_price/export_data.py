"""导出房价数据为 JSON，供博客前端页面使用。

用法 (standalone):
    cd tools/house_price
    pip install -r requirements.txt
    python export_data.py -o ../../assets/data/house_price -c hz
"""

import argparse
import json
import os
import sys
import tempfile
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))

# 加载 .env（贝壳等 API 凭证），勿提交 .env 到版本库
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

from config import CITIES, HISTORY_START_YEAR, CURRENT_YEAR
from scrapers.gotohui import GoToHuiScraper
from scrapers.local_json import LocalJsonSource, merge_named_rows
from history import reconcile_history, history_integrity_errors
from quality import reconcile_communities, quality_summary, combine_status
from scrapers.fang import FangScraper
from scrapers.nbs import NBSScraper
from scrapers.market_reports import MarketReportScraper, merge_reports

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MAPPINGS_DIR = os.path.join(os.path.dirname(__file__), "mappings")
_KEYWORDS_CACHE = None
_OVERRIDE_CACHE = None


def _load_community_to_sub_district():
    """可选：mappings/community_to_sub_district.json 中的小区名 -> 板块名精确映射。"""
    global _OVERRIDE_CACHE
    if _OVERRIDE_CACHE is not None:
        return _OVERRIDE_CACHE
    path = os.path.join(MAPPINGS_DIR, "community_to_sub_district.json")
    if not os.path.isfile(path):
        _OVERRIDE_CACHE = {}
        return _OVERRIDE_CACHE
    try:
        with open(path, "r", encoding="utf-8") as f:
            _OVERRIDE_CACHE = json.load(f)
    except Exception:
        _OVERRIDE_CACHE = {}
    return _OVERRIDE_CACHE


def _load_sub_district_keywords():
    """加载 板块名 -> 关键词列表 映射，用于把小区归到板块并聚合均价。"""
    global _KEYWORDS_CACHE
    if _KEYWORDS_CACHE is not None:
        return _KEYWORDS_CACHE
    path = os.path.join(MAPPINGS_DIR, "sub_district_keywords.json")
    if not os.path.isfile(path):
        _KEYWORDS_CACHE = {}
        return _KEYWORDS_CACHE
    try:
        with open(path, "r", encoding="utf-8") as f:
            _KEYWORDS_CACHE = json.load(f)
    except Exception:
        _KEYWORDS_CACHE = {}
    return _KEYWORDS_CACHE


def aggregate_sub_district_prices(city_key, district_key, communities):
    """用本区小区列表 + 板块映射/关键词，聚合出各板块均价。

    - 若存在 community_to_sub_district.json，先用「小区名 -> 板块名」精确匹配定位板块。
    - 否则用 sub_district_keywords.json 按关键词匹配；多命中时取最长关键词（更精确）。
    """
    override = _load_community_to_sub_district()
    override_dist = (override.get(city_key) or {}).get(district_key) or {}
    keywords_map = _load_sub_district_keywords()
    by_city = keywords_map.get(city_key) or {}
    by_district = by_city.get(district_key) or {}
    if not communities:
        return []
    if not by_district and not override_dist and not any(c.get("sub_district") for c in communities):
        return []

    buckets = {}
    # Once an explicit board is available, use that source alone. Never mix
    # differently dated/provider-defined reference prices in one estimate.
    mapped = [c for c in communities if c.get("source") == "fang" and c.get("sub_district")]
    candidates = mapped or [c for c in communities if c.get("source", "gotohui") == "gotohui"]
    for c in candidates:
        name = (c.get("community") or "").strip()
        if not name:
            continue
        price = c.get("price")
        if price is None or price <= 0:
            continue
        sub_name = None
        if c.get("sub_district"):
            sub_name = c["sub_district"]
        elif name in override_dist:
            sub_name = override_dist[name]
        elif by_district:
            best_len = 0
            for sub, keywords in by_district.items():
                if not keywords:
                    continue
                for kw in keywords:
                    if kw in name and len(kw) > best_len:
                        best_len = len(kw)
                        sub_name = sub
        if sub_name is None:
            continue
        if sub_name not in buckets:
            buckets[sub_name] = {"prices": [], "stale": False,
                                 "source": c.get("source", "gotohui"), "key": c.get("sub_district_key")}
        buckets[sub_name]["prices"].append(price)
        buckets[sub_name]["stale"] |= c.get("stale", False) or not c.get("observed_month")

    result = []
    for sub_name, b in buckets.items():
        if not b["prices"]:
            continue
        avg_price = round(sum(b["prices"]) / len(b["prices"]), 0)
        # Different source months cannot be averaged into a market MoM rate.
        result.append({"sub_district_name": sub_name, "price": avg_price, "mom_pct": None,
                       "sample_count": len(b["prices"]), "estimated": True, "stale": b["stale"],
                       "source": b["source"], "key": b["key"]})
    return result


def _load_prev_export(path):
    if not path or not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError) as exc:
        raise ValueError(f"无法读取上次导出，停止以保护历史 ({path}): {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError(f"上次导出不是 JSON 对象: {path}")
    return data


def _carry_forward_communities(district_data, prev_data, district_key):
    """If this scrape got no communities, keep the last published list.

    House listing pages are the flaky part of gotohui (history can succeed
    while /house-{id} returns an empty table). Dropping 5000+ rows then fails
    validation and blocks publishing the history we did get.
    """
    if district_data.get("communities"):
        return
    prev_comms = (((prev_data or {}).get("districts") or {}).get(district_key) or {}).get("communities") or []
    if not prev_comms:
        return
    previous = prev_data["districts"][district_key]
    district_data["communities"], district_data["community_status"] = reconcile_communities(
        [], previous, {"complete": False, "reason": "empty_scrape"},
    )


def export_city(scraper, city_key, start_year, end_year, prev_data=None, fang=None, nbs=None, reports=None):
    city = CITIES[city_key]
    if prev_data and prev_data.get("city_key") != city_key:
        raise ValueError("Previous export belongs to another city")
    print(f"[{city['name']}] 开始导出...")

    result = {
        "city": city["name"],
        "city_key": city_key,
        "updated_at": date.today().isoformat(),
        "start_year": start_year,
        "end_year": end_year,
        "city_history": [],
        "district_list": [],
        "districts": {},
        "meta": {
            "schema_version": 4,
            "sources": [
                {"name": "聚汇", "role": "城市/区域历史与小区", "status": "active"},
                {"name": "小区聚合", "role": "板块样本估算", "status": "unavailable"},
                {"name": "贝壳开放平台", "role": "适配器未实现", "status": "unavailable"},
                {"name": "本地 JSON", "role": "第三方数据补充", "status": "active" if LocalJsonSource.exists(city_key) else "optional"},
            ],
        },
    }
    local_meta = LocalJsonSource.source_meta(city_key)
    if local_meta:
        result["meta"]["sources"][-1] = local_meta
    local_notes = LocalJsonSource.notes(city_key)
    if local_notes:
        result["meta"]["notes"] = local_notes

    print(f"  获取城市历史数据...")
    city_df = scraper.get_city_history(city_key, start_year, end_year)
    if not city_df.empty:
        result["city_history"] = [
            {
                "date": row["date"].strftime("%Y-%m"),
                "second_hand_price": row.get("second_hand_price"),
                "new_house_price": row.get("new_house_price"),
            }
            for _, row in city_df.iterrows()
        ]
    result.update(reconcile_history(prev_data, {
        "gotohui": clean_nan(result["city_history"]), "local_json": LocalJsonSource.get_city_history(city_key),
    }, field="city_history"))

    print(f"  获取区域列表...")
    dist_list = scraper.get_district_list(city_key)
    if not dist_list.empty:
        result["district_list"] = [
            {
                "district": row["district"],
                "price": row.get("price"),
                "yoy": row.get("yoy"),
                "mom_pct": row.get("mom_pct"),
            }
            for _, row in dist_list.iterrows()
        ]
    result["district_list"] = merge_named_rows(
        result["district_list"], LocalJsonSource.get_district_list(city_key), "district"
    )

    for dk, dinfo in city["districts"].items():
        dname = dinfo["name"]
        print(f"  获取 {dname} 数据...")
        district_data = {"name": dname, "history": [], "communities": [], "sub_districts": {}}
        previous = ((prev_data or {}).get("districts") or {}).get(dk, {})

        df = scraper.get_district_history(city_key, dk, start_year, end_year)
        if not df.empty:
            district_data["history"] = [
                {
                    "date": row["date"].strftime("%Y-%m"),
                    "second_hand_price": row.get("second_hand_price"),
                    "new_house_price": row.get("new_house_price"),
                }
                for _, row in df.iterrows()
            ]
        district_data.update(reconcile_history(previous, {
            "gotohui": clean_nan(district_data["history"]), "local_json": LocalJsonSource.get_district_history(city_key, dk),
        }))

        comm_df = scraper.get_community_prices(city_key, dk)
        if not comm_df.empty:
            district_data["communities"] = [
                {
                    **row.to_dict(),
                }
                for _, row in comm_df.iterrows()
                if row.get("price") is not None
            ]

        # 可插拔补充源：按来源/ID合并；旧快照不覆盖新观测或本轮实时抓取。
        local_rows = LocalJsonSource.get_communities(city_key, dk)
        district_data["communities"], gotohui_status = reconcile_communities(
            clean_nan(district_data["communities"]), previous,
            scraper.community_status.get(dinfo["gotohui_id"], {}), local_rows,
        )
        district_data["community_sources"] = {"gotohui": gotohui_status}
        if fang:
            fang_rows, fang_report = fang.get_communities(city_key, dname)
            district_data["communities"], fang_status = reconcile_communities(
                fang_rows, {**previous, "communities": district_data["communities"]}, fang_report, source="fang",
            )
            district_data["community_sources"]["fang"] = fang_status
        district_data["community_status"] = combine_status(district_data["community_sources"])
        print(f"    小区状态: {district_data['community_status']}")

        # 板块级细分：仅用 config 的板块名 + 小区聚合均价（聚汇区级页无真实板块表，不解析）
        config_subs = dinfo.get("sub_districts") or {}
        name_to_key = {v if isinstance(v, str) else v.get("name", ""): k for k, v in config_subs.items()}
        for sk, name_or_dict in config_subs.items():
            name = name_or_dict if isinstance(name_or_dict, str) else name_or_dict.get("name", sk)
            district_data["sub_districts"][sk] = {"name": name, "history": [], "price": None, "yoy": None}

        # 用本区小区数据按板块关键词聚合得到板块均价（不依赖聚汇板块页或贝壳 API）
        agg_list = aggregate_sub_district_prices(city_key, dk, district_data["communities"])
        for item in agg_list:
            name = item.get("sub_district_name")
            if not name:
                continue
            sk = name_to_key.get(name) or item.get("key")
            if not sk:
                continue
            if sk not in district_data["sub_districts"]:
                district_data["sub_districts"][sk] = {"name": name, "history": [], "yoy": None}
            if sk in district_data["sub_districts"]:
                if item.get("price") is not None:
                    district_data["sub_districts"][sk]["price"] = item["price"]
                district_data["sub_districts"][sk].update({k: item[k] for k in ("mom_pct", "sample_count", "estimated", "stale", "source")})

        result["districts"][dk] = district_data

    # The overview ranking can fail independently of the monthly history.
    # Reconstruct like-for-like changes from explicit calendar months instead
    # of publishing an empty ranking or reviving the old ambiguous yoy column.
    if not result["district_list"]:
        for district in result["districts"].values():
            prices = {r["date"]: r["second_hand_price"] for r in district["history"]
                      if r.get("second_hand_price") is not None and r["second_hand_price"] >= 1000}
            if not prices:
                continue
            latest_month = max(prices)
            year, month = map(int, latest_month.split("-"))
            previous_month = f"{year - (month == 1)}-{12 if month == 1 else month - 1:02d}"
            def change(key):
                return round((prices[latest_month] / prices[key] - 1) * 100, 2) if key in prices else None
            result["district_list"].append({"district": district["name"], "price": prices[latest_month],
                "observed_month": latest_month, "yoy": change(f"{year - 1}-{month:02d}"),
                "mom_pct": change(previous_month), "source": "gotohui_history"})
    result["meta"]["quality"] = quality_summary(result)
    result["meta"]["sources"][0]["status"] = "active" if all(
        d["community_sources"]["gotohui"]["status"] == "fresh" for d in result["districts"].values()
    ) else "degraded"
    if any(s.get("price") for d in result["districts"].values() for s in d["sub_districts"].values()):
        result["meta"]["sources"][1]["status"] = "estimated"
    if fang:
        count = sum(d["community_sources"]["fang"]["fetched_count"] for d in result["districts"].values())
        result["meta"]["sources"].append({"name": "房天下", "role": "小区参考挂牌价/板块/在售数（分页抽样）",
                                           "status": "sampled" if count else "unavailable", "fetched_count": count})
    previous_indices = (prev_data or {}).get("price_indices", [])
    latest_index = nbs.get_latest(city["name"]) if nbs else None
    indices = {r["date"]: r for r in previous_indices}
    if latest_index:
        indices[latest_index["date"]] = latest_index
    result["price_indices"] = sorted(indices.values(), key=lambda r: r["date"])
    result["meta"]["sources"].append({"name": "国家统计局", "role": "70城住宅价格指数（非均价）",
                                       "status": "active" if latest_index else "degraded" if indices else "unavailable"})
    previous_reports = (prev_data or {}).get("market_reports", [])
    fresh_reports = reports.get_reports(city_key, city['name'], previous_reports) if reports else []
    result['market_reports'] = merge_reports(previous_reports, fresh_reports)
    result['market_report_status'] = reports.status if reports else {}
    if reports:
        for source, name in [('creprice', '禧泰公开月报'), ('cih', '中指公开月报')]:
            status = reports.status.get(source, {}).get('status', 'unavailable')
            if status == 'unavailable' and any(r['source'] == source for r in previous_reports):
                status = 'degraded'
            result['meta']['sources'].append({'name': name, 'role': '月度市场报告（独立口径）', 'status': status})
    return result


def clean_nan(obj):
    if isinstance(obj, float) and (obj != obj):
        return None
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nan(i) for i in obj]
    return obj


def main():
    parser = argparse.ArgumentParser(description="Export house price data to JSON")
    parser.add_argument(
        "--output", "-o",
        default=os.path.join(os.path.dirname(__file__), "../../assets/data/house_price"),
        help="Output directory",
    )
    parser.add_argument("--cities", "-c", nargs="+", default=["hz"],
                        help="City keys to export (default: hz)")
    parser.add_argument("--start-year", type=int, default=HISTORY_START_YEAR)
    parser.add_argument("--end-year", type=int, default=CURRENT_YEAR)
    parser.add_argument("--fang-pages", type=int, default=5, help="Fang sample pages per district, 0 to disable (default: 5)")
    parser.add_argument(
        "--prev",
        help="Previous city JSON; defaults to the existing output file to preserve history",
    )
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    scraper = GoToHuiScraper()
    if args.prev and not os.path.isfile(args.prev):
        parser.error("--prev 文件不存在；停止以保护历史")

    for ck in args.cities:
        if ck not in CITIES:
            print(f"Unknown city: {ck}, skipping")
            continue
        out_path = os.path.join(args.output, f"{ck}.json")
        prev_data = _load_prev_export(args.prev or out_path)
        data = export_city(scraper, ck, args.start_year, args.end_year, prev_data=prev_data,
                           fang=FangScraper(max_pages=max(0, min(args.fang_pages, 100))) if args.fang_pages else None,
                           nbs=NBSScraper(), reports=MarketReportScraper())
        data = clean_nan(data)
        errors = history_integrity_errors(data, prev_data) if prev_data else []
        if errors:
            raise ValueError("历史完整性检查失败，原文件未改动: " + "; ".join(errors))
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=args.output,
                                             prefix=f".{ck}-", suffix=".json", delete=False) as f:
                temp_path = f.name
                json.dump(data, f, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            os.replace(temp_path, out_path)
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
        print(f"  ✓ Exported: {out_path} ({os.path.getsize(out_path) / 1024:.0f} KB)")

    print("Done!")


if __name__ == "__main__":
    main()
