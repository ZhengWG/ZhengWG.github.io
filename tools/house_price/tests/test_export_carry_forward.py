"""Carry-forward keeps last communities when a scrape returns none."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from export_data import _carry_forward_communities  # noqa: E402


class TestCarryForwardCommunities(unittest.TestCase):
    def test_fills_empty_from_prev(self):
        district = {"communities": []}
        prev = {"districts": {"xihu": {"communities": [{"community": "西溪路24号", "price": 54796}]}}}
        _carry_forward_communities(district, prev, "xihu")
        self.assertEqual(district["communities"][0]["community"], "西溪路24号")

    def test_does_not_replace_fresh_rows(self):
        district = {"communities": [{"community": "新抓到的", "price": 1}]}
        prev = {"districts": {"xihu": {"communities": [{"community": "旧的", "price": 2}]}}}
        _carry_forward_communities(district, prev, "xihu")
        self.assertEqual(district["communities"][0]["community"], "新抓到的")

    def test_noop_without_prev(self):
        district = {"communities": []}
        _carry_forward_communities(district, None, "xihu")
        self.assertEqual(district["communities"], [])


if __name__ == "__main__":
    unittest.main()
