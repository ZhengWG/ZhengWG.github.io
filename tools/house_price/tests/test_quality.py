import os
import sys
import unittest
from copy import deepcopy
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from quality import reconcile_communities, combine_status
from validate_export import content_changed


class QualityTests(unittest.TestCase):
    def test_failed_scrape_keeps_unknown_original_date_unknown(self):
        previous = {"communities": [{"community": "旧小区", "price": 30000}]}
        rows, status = reconcile_communities([], previous, {"complete": False, "reason": "request_failed"}, today="2026-10-18")
        self.assertTrue(rows[0]["stale"])
        self.assertNotIn("observed_month", rows[0])
        self.assertIsNone(status["last_success_at"])
        self.assertEqual(status["fetched_count"], 0)
        self.assertNotIn("stale", previous["communities"][0])

    def test_partial_and_multiple_sources_do_not_destroy_other_observations(self):
        previous = {"communities": [{"community": "同名小区", "price": 30000}, {"community": "缺页小区", "price": 20000}]}
        rows, status = reconcile_communities([{"community": "同名小区", "source": "gotohui", "price": 31000}], previous, {"complete": False})
        self.assertEqual(len(rows), 2)
        self.assertEqual(status["status"], "partial")
        rows, fang = reconcile_communities([{"community": "同名小区", "source": "fang", "source_id": "123", "price": 32000}], {"communities": rows}, {"complete": False}, source="fang")
        self.assertEqual(len(rows), 3)
        self.assertEqual(combine_status({"gotohui": status, "fang": fang})["fetched_count"], 2)

    def test_partial_local_supplement_does_not_hide_failed_main_source(self):
        rows, status = reconcile_communities([], {"communities": [{"community": "旧小区", "price": 30000}]}, {},
                                             local=[{"community": "补充", "source": "local_json", "price": 20000}])
        self.assertEqual(len(rows), 2)
        self.assertEqual(status["fetched_count"], 0)
        self.assertEqual(status["status"], "carried_forward")

    def test_history_uses_observation_month_not_fetch_date(self):
        row = {"community": "小区", "source": "gotohui", "price": 30000, "observed_month": "2026-09"}
        rows, _ = reconcile_communities([row], {}, {"complete": True}, today="2026-10-18")
        self.assertEqual(rows[0]["observations"][0]["observed_month"], "2026-09")
        rows2, _ = reconcile_communities([row], {"communities": rows}, {"complete": True}, today="2026-10-19")
        self.assertEqual(len(rows2[0]["observations"]), 1)

    def test_dated_manual_quote_is_not_a_successful_live_fetch(self):
        snapshot = {"community": "小区", "source": "gotohui", "price": 30000,
                    "observed_month": "2026-09", "fetched_at": "2026-10-18"}
        rows, status = reconcile_communities([], {}, {"complete": False}, local=[snapshot], today="2026-10-18")
        self.assertTrue(rows[0]["stale"])
        self.assertEqual(status["fetched_count"], 0)
        self.assertEqual(status["carried_count"], 1)

    def test_same_day_snapshot_does_not_overwrite_a_live_fetch(self):
        live = {"community": "小区", "source": "gotohui", "price": 32000}
        snapshot = {**live, "price": 30000, "fetched_at": "2026-10-18"}
        rows, status = reconcile_communities([live], {}, {"complete": True}, local=[snapshot], today="2026-10-18")
        self.assertEqual(rows[0]["price"], 32000)
        self.assertFalse(rows[0]["stale"])
        self.assertEqual(status["fetched_count"], 1)

    def test_old_snapshot_cannot_replace_newer_provider_quote(self):
        live = {"community": "小区", "source": "fang", "source_id": "123", "price": 32000, "fetched_at": "2026-10-19"}
        snapshot = {**live, "price": 30000, "fetched_at": "2026-10-18"}
        rows, _ = reconcile_communities([], {"communities": [live]}, {}, local=[snapshot])
        self.assertEqual(rows[0]['price'], 32000)
        self.assertEqual(rows[0]['fetched_at'], '2026-10-19')

    def test_attempt_heartbeat_is_noop_but_freshness_and_failure_are_published(self):
        old = {"updated_at": "2026-10-17", "status": {"last_attempt_at": "2026-10-17", "status": "fresh"}}
        new = deepcopy(old); new['updated_at'] = '2026-10-18'; new['status']['last_attempt_at'] = '2026-10-18'
        self.assertFalse(content_changed(new, old))
        new['status']['status'] = 'carried_forward'
        self.assertTrue(content_changed(new, old))

if __name__ == '__main__':
    unittest.main()
