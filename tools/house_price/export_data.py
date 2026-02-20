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

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
_KEYWORDS_CACHE = None
_OVERRIDE_CACHE = None


def _load_community_to_sub_district():
    """可选：小区名 -> 板块名 精确映射（data/community_to_sub_district.json），用于定位板块。"""
    global _OVERRIDE_CACHE
    if _OVERRIDE_CACHE is not None:
        return _OVERRIDE_CACHE
    path = os.path.join(DATA_DIR, "community_to_sub_district.json")
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
    path = os.path.join(DATA_DIR, "sub_district_keywords.json")
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
    if not by_district and not override_dist:
        return []

    buckets = {}
    for c in communities:
        name = (c.get("community") or "").strip()
        if not name:
            continue
        price = c.get("price")
        if price is None or price <= 0:
            continue
        mom = c.get("mom_pct")

        sub_name = None
        if name in override_dist:
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
            buckets[sub_name] = {"prices": [], "yoys": []}
        buckets[sub_name]["prices"].append(price)
        if mom is not None:
            buckets[sub_name]["yoys"].append(mom)

    result = []
    for sub_name, b in buckets.items():
        if not b["prices"]:
            continue
        avg_price = round(sum(b["prices"]) / len(b["prices"]), 0)
        avg_yoy = round(sum(b["yoys"]) / len(b["yoys"]), 2) if b["yoys"] else None
        result.append({"sub_district_name": sub_name, "price": avg_price, "yoy": avg_yoy})
    return result


def export_city(scraper, city_key, start_year, end_year):
    city = CITIES[city_key]
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
    }

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

    print(f"  获取区域列表...")
    dist_list = scraper.get_district_list(city_key)
    if not dist_list.empty:
        result["district_list"] = [
            {
                "district": row["district"],
                "price": row.get("price"),
                "yoy": row.get("yoy"),
            }
            for _, row in dist_list.iterrows()
        ]

    for dk, dinfo in city["districts"].items():
        dname = dinfo["name"]
        print(f"  获取 {dname} 数据...")
        district_data = {"name": dname, "history": [], "communities": [], "sub_districts": {}}

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

        comm_df = scraper.get_community_prices(city_key, dk)
        if not comm_df.empty:
            district_data["communities"] = [
                {
                    "community": row["community"],
                    "price": row.get("price"),
                    "mom_pct": row.get("mom_pct"),
                }
                for _, row in comm_df.iterrows()
                if row.get("price") is not None
            ]

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
            if not name or name not in name_to_key:
                continue
            sk = name_to_key[name]
            if sk in district_data["sub_districts"]:
                if item.get("price") is not None:
                    district_data["sub_districts"][sk]["price"] = item["price"]
                if item.get("yoy") is not None:
                    district_data["sub_districts"][sk]["yoy"] = item["yoy"]

        # 可选：用贝壳等数据源覆盖/补充板块均价
        try:
            from scrapers import beike
            beike_list = beike.get_sub_district_prices(city_key, dk)
            for item in beike_list:
                name = item.get("sub_district_name")
                if not name or name not in name_to_key:
                    continue
                sk = name_to_key[name]
                if sk in district_data["sub_districts"]:
                    if item.get("price") is not None:
                        district_data["sub_districts"][sk]["price"] = item["price"]
                    if item.get("yoy") is not None:
                        district_data["sub_districts"][sk]["yoy"] = item["yoy"]
        except Exception as e:
            pass  # 贝壳未实现或请求失败时忽略

        result["districts"][dk] = district_data

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
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    scraper = GoToHuiScraper()

    for ck in args.cities:
        if ck not in CITIES:
            print(f"Unknown city: {ck}, skipping")
            continue
        data = export_city(scraper, ck, args.start_year, args.end_year)
        data = clean_nan(data)
        out_path = os.path.join(args.output, f"{ck}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Exported: {out_path}")

    print("Done!")


if __name__ == "__main__":
    main()
