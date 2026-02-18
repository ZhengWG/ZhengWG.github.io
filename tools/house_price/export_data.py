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

from config import CITIES, HISTORY_START_YEAR, CURRENT_YEAR
from scrapers.gotohui import GoToHuiScraper


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
        district_data = {"name": dname, "history": [], "communities": []}

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
