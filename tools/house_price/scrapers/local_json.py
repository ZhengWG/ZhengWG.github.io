"""可插拔的本地房价补充源。

优先读未提交的本地覆盖：tools/house_price/data/providers/{city_key}.json
否则读可提交的补充文件：tools/house_price/providers/{city_key}.json

适合导入已获授权的开放数据、API 导出，或从公众号月报（如小鸡选房）**人工摘录**
的城市/区域月度均价。不要在 CI 里抓微信公众号或小程序。
"""

import json
import os


_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_THIS_DIR)
COMMITTED_DIR = os.path.join(_ROOT, "providers")
LOCAL_DIR = os.path.join(_ROOT, "data", "providers")

_HISTORY_KEYS = ("second_hand_price", "new_house_price")


class LocalJsonSource:
    @classmethod
    def _path(cls, city_key):
        local = os.path.abspath(os.path.join(LOCAL_DIR, f"{city_key}.json"))
        if os.path.isfile(local):
            return local
        return os.path.abspath(os.path.join(COMMITTED_DIR, f"{city_key}.json"))

    @classmethod
    def exists(cls, city_key):
        return os.path.isfile(cls._path(city_key))

    @classmethod
    def load(cls, city_key):
        if not cls.exists(city_key):
            return {}
        try:
            with open(cls._path(city_key), "r", encoding="utf-8") as handle:
                data = json.load(handle)
        except (OSError, ValueError):
            return {}
        return data if isinstance(data, dict) else {}

    @classmethod
    def source_meta(cls, city_key):
        data = cls.load(city_key)
        if not data:
            return None
        return {
            "name": data.get("source_name") or "本地 JSON",
            "role": data.get("source_role") or "第三方数据补充",
            "status": "active",
        }

    @classmethod
    def notes(cls, city_key):
        notes = cls.load(city_key).get("notes")
        return notes.strip() if isinstance(notes, str) and notes.strip() else None

    @classmethod
    def get_city_history(cls, city_key):
        return _clean_history(cls.load(city_key).get("city_history"))

    @classmethod
    def get_district_list(cls, city_key):
        rows = []
        for row in cls.load(city_key).get("district_list") or []:
            name = str(row.get("district") or "").strip()
            if not name:
                continue
            item = {"district": name, "price": _positive_number(row.get("price")), "yoy": row.get("yoy")}
            rows.append(item)
        return rows

    @classmethod
    def get_district_history(cls, city_key, district_key):
        districts = cls.load(city_key).get("districts") or {}
        block = districts.get(district_key) or {}
        return _clean_history(block.get("history"))

    @classmethod
    def get_communities(cls, city_key, district_key):
        districts = cls.load(city_key).get("districts") or {}
        rows = ((districts.get(district_key) or {}).get("communities") or [])
        clean = []
        for row in rows:
            name = str(row.get("community") or "").strip()
            price = _positive_number(row.get("price"))
            if not name or price is None:
                continue
            clean.append({
                "community": name,
                "price": price,
                "mom_pct": row.get("mom_pct"),
                "source": row.get("source") or "local_json",
            })
        return clean


def merge_history_rows(base, overlay):
    """Merge monthly rows by date. Overlay non-null fields win."""
    by_date = {}
    for row in base or []:
        date = row.get("date")
        if date:
            by_date[date] = dict(row)
    for row in overlay or []:
        date = row.get("date")
        if not date:
            continue
        existing = by_date.get(date, {"date": date})
        for key in _HISTORY_KEYS:
            val = row.get(key)
            if val is not None:
                existing[key] = val
        by_date[date] = existing
    return sorted(by_date.values(), key=lambda item: item["date"])


def merge_named_rows(base, overlay, name_key):
    """Merge latest-price rows by name. Overlay non-null fields win."""
    by_name = {}
    for row in base or []:
        name = row.get(name_key)
        if name:
            by_name[name] = dict(row)
    for row in overlay or []:
        name = row.get(name_key)
        if not name:
            continue
        existing = by_name.get(name, {name_key: name})
        for key, val in row.items():
            if val is not None:
                existing[key] = val
        by_name[name] = existing
    return list(by_name.values())


def _positive_number(value):
    if isinstance(value, (int, float)) and value > 0:
        return value
    return None


def _clean_history(rows):
    clean = []
    for row in rows or []:
        date = str(row.get("date") or "").strip()
        if not date:
            continue
        item = {"date": date}
        for key in _HISTORY_KEYS:
            val = row.get(key)
            item[key] = val if isinstance(val, (int, float)) else None
        if item["second_hand_price"] is None and item["new_house_price"] is None:
            continue
        clean.append(item)
    return clean
