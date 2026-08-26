"""Tests for the local JSON overlay used by WeChat/manual supplements."""

import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.local_json import (  # noqa: E402
    LocalJsonSource,
    merge_history_rows,
    merge_named_rows,
)


SAMPLE = {
    "source_name": "小鸡选房（人工摘录）",
    "source_role": "网签月报补录",
    "notes": "摘自公众号，仅作对照。",
    "city_history": [
        {"date": "2026-07", "second_hand_price": 30100, "new_house_price": 27000},
        {"date": "2026-08", "second_hand_price": 29900},
    ],
    "district_list": [
        {"district": "西湖区", "price": 41000, "yoy": -1.1},
    ],
    "districts": {
        "xihu": {
            "history": [
                {"date": "2026-07", "second_hand_price": 42000},
            ],
            "communities": [
                {"community": "西溪路24号", "price": 54000, "mom_pct": 1.2, "source": "xiaoji_manual"},
            ],
        }
    },
}


class TestMergeHelpers(unittest.TestCase):
    def test_history_overlay_wins_and_appends(self):
        base = [
            {"date": "2026-06", "second_hand_price": 30916.0, "new_house_price": 27203.0},
            {"date": "2026-07", "second_hand_price": 30202.0, "new_house_price": 27448.0},
        ]
        overlay = [
            {"date": "2026-07", "second_hand_price": 30100},
            {"date": "2026-08", "second_hand_price": 29900, "new_house_price": None},
        ]
        merged = merge_history_rows(base, overlay)
        self.assertEqual([r["date"] for r in merged], ["2026-06", "2026-07", "2026-08"])
        july = merged[1]
        self.assertEqual(july["second_hand_price"], 30100)
        self.assertEqual(july["new_house_price"], 27448.0)

    def test_named_rows_overlay(self):
        base = [{"district": "西湖区", "price": 41945, "yoy": -0.7}]
        overlay = [{"district": "西湖区", "price": 41000}, {"district": "滨江区", "price": 39000}]
        merged = merge_named_rows(base, overlay, "district")
        by_name = {r["district"]: r for r in merged}
        self.assertEqual(by_name["西湖区"]["price"], 41000)
        self.assertEqual(by_name["西湖区"]["yoy"], -0.7)
        self.assertEqual(by_name["滨江区"]["price"], 39000)


class TestLocalJsonSource(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        path = os.path.join(self.tmp.name, "hz.json")
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(SAMPLE, handle)
        self.path_patch = patch.object(LocalJsonSource, "_path", return_value=path)
        self.path_patch.start()
        self.addCleanup(self.path_patch.stop)

    def test_meta_and_notes(self):
        meta = LocalJsonSource.source_meta("hz")
        self.assertEqual(meta["name"], "小鸡选房（人工摘录）")
        self.assertEqual(meta["status"], "active")
        self.assertIn("对照", LocalJsonSource.notes("hz"))

    def test_city_and_district_payloads(self):
        city = LocalJsonSource.get_city_history("hz")
        self.assertEqual(city[0]["date"], "2026-07")
        self.assertEqual(city[1]["second_hand_price"], 29900)
        self.assertIsNone(city[1].get("new_house_price"))

        hist = LocalJsonSource.get_district_history("hz", "xihu")
        self.assertEqual(hist[0]["second_hand_price"], 42000)

        comms = LocalJsonSource.get_communities("hz", "xihu")
        self.assertEqual(comms[0]["community"], "西溪路24号")
        self.assertEqual(comms[0]["source"], "xiaoji_manual")

        districts = LocalJsonSource.get_district_list("hz")
        self.assertEqual(districts[0]["district"], "西湖区")

    def test_missing_file(self):
        with patch.object(LocalJsonSource, "_path", return_value=os.path.join(self.tmp.name, "missing.json")):
            self.assertFalse(LocalJsonSource.exists("hz"))
            self.assertEqual(LocalJsonSource.get_city_history("hz"), [])
            self.assertIsNone(LocalJsonSource.source_meta("hz"))


if __name__ == "__main__":
    unittest.main()
