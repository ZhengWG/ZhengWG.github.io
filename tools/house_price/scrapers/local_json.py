"""可插拔的本地房价补充源。

文件路径：tools/house_price/data/providers/{city_key}.json
格式：{"districts": {"xihu": {"communities": [{"community": "...", "price": 1, "mom_pct": 0}]}}}
适合导入已获授权的开放数据、API 导出或人工校验数据，不依赖网页抓取。
"""

import json
import os


class LocalJsonSource:
    BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "providers")

    @classmethod
    def _path(cls, city_key):
        return os.path.abspath(os.path.join(cls.BASE_DIR, f"{city_key}.json"))

    @classmethod
    def exists(cls, city_key):
        return os.path.isfile(cls._path(city_key))

    @classmethod
    def get_communities(cls, city_key, district_key):
        if not cls.exists(city_key):
            return []
        try:
            with open(cls._path(city_key), "r", encoding="utf-8") as handle:
                data = json.load(handle)
        except (OSError, ValueError):
            return []
        rows = (((data.get("districts") or {}).get(district_key) or {}).get("communities") or [])
        clean = []
        for row in rows:
            name = str(row.get("community") or "").strip()
            price = row.get("price")
            if not name or not isinstance(price, (int, float)) or price <= 0:
                continue
            clean.append({
                "community": name,
                "price": price,
                "mom_pct": row.get("mom_pct"),
                "source": row.get("source") or "local_json",
            })
        return clean
