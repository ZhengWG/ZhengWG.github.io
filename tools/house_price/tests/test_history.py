import os
import sys
import unittest
import io
import json
import tempfile
from contextlib import redirect_stdout
from pathlib import Path
from copy import deepcopy
from unittest.mock import Mock, patch
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from history import reconcile_history, history_integrity_errors
from export_data import export_city, main, _load_prev_export


class HistoryTests(unittest.TestCase):
    def setUp(self):
        self.previous = {"history": [
            {"date": "2026-07", "second_hand_price": 32000, "new_house_price": 40000},
            {"date": "2026-08", "second_hand_price": 31000, "new_house_price": 39000},
        ]}

    def test_missing_months_and_null_fields_are_preserved(self):
        result = reconcile_history(self.previous, {"gotohui": [
            {"date": "2026-08", "second_hand_price": 31000, "new_house_price": None},
            {"date": "2026-09", "second_hand_price": 30000},
        ]})
        self.assertEqual(result["history"][:2], self.previous["history"])
        self.assertEqual(result["history_status"]["carried_fields"], 3)
        self.assertEqual(result["history_sources"]["legacy"], self.previous["history"])
        self.assertNotIn("history_sources", self.previous)

    def test_invalid_values_cannot_erase_history(self):
        for bad in [None, 0, -1, float('nan'), float('inf'), True, '31000']:
            result = reconcile_history(self.previous, {"gotohui": [{"date": "2026-08", "second_hand_price": bad}]})
            self.assertEqual(result["history"], self.previous["history"])

    def test_invalid_months_are_ignored_and_reported(self):
        result = reconcile_history(self.previous, {"gotohui": [{"date": "2026-13", "second_hand_price": 30000}]})
        self.assertEqual(result["history"], self.previous["history"])
        self.assertEqual(result["history_status"]["invalid_fields"], 1)

    def test_sources_are_separate_and_revisions_are_audited(self):
        fresh = {"gotohui": [{"date": "2026-08", "second_hand_price": 31500}],
                 "local_json": [{"date": "2026-08", "second_hand_price": 31800}]}
        result = reconcile_history(self.previous, fresh)
        self.assertEqual(result["history_sources"]["gotohui"][0]["second_hand_price"], 31500)
        self.assertEqual(result["history_sources"]["local_json"][0]["second_hand_price"], 31800)
        self.assertEqual(result["history"][-1]["second_hand_price"], 31800)
        self.assertEqual(result["history_status"]["revision_count"], 1)
        repeated = reconcile_history(result, fresh)
        self.assertEqual(repeated["history_revisions"], result["history_revisions"])
        old = {"city_key": "hz", "districts": {"xihu": self.previous}}
        new = {"city_key": "hz", "districts": {"xihu": result}}
        self.assertEqual(history_integrity_errors(new, old), [])
        result["history_revisions"] = []
        self.assertTrue(history_integrity_errors(new, old))

    def test_one_lost_month_or_value_fails_even_when_counts_are_similar(self):
        old = {"city_key": "hz", "city_history": self.previous["history"]}
        new = deepcopy(old); new["city_history"].pop()
        self.assertTrue(history_integrity_errors(new, old))
        new = deepcopy(old); new["city_history"][0]["new_house_price"] = None
        self.assertTrue(history_integrity_errors(new, old))

    def test_removing_source_archive_or_revision_log_is_rejected(self):
        old = {"city_key": "hz", **reconcile_history({}, {"gotohui": self.previous["history"]}, field="city_history")}
        old = {"city_key": "hz", **reconcile_history(old, {"gotohui": [{"date": "2026-08", "second_hand_price": 32000}]}, field="city_history")}
        new = deepcopy(old); new["history_sources"] = {}
        self.assertTrue(history_integrity_errors(new, old))
        new = deepcopy(old); new["history_revisions"] = []
        self.assertTrue(history_integrity_errors(new, old))

    def test_export_survives_total_history_fetch_failure(self):
        previous = {"city_key": "hz", "city_history": self.previous["history"],
                    "districts": {"xihu": {"name": "西湖区", **self.previous}}}
        scraper = Mock(community_status={})
        for method in ['get_city_history', 'get_district_history', 'get_community_prices', 'get_district_list']:
            getattr(scraper, method).return_value = pd.DataFrame()
        with patch('export_data.LocalJsonSource.load', return_value={}), redirect_stdout(io.StringIO()):
            result = export_city(scraper, 'hz', 2026, 2026, prev_data=previous)
        self.assertEqual(result['city_history'], previous['city_history'])
        self.assertEqual(result['districts']['xihu']['history'], self.previous['history'])
        self.assertEqual(history_integrity_errors(result, previous), [])
        with self.assertRaises(ValueError):
            export_city(scraper, 'hz', 2026, 2026, prev_data={"city_key": "bj"})

    def test_existing_output_is_automatically_used_as_previous_history(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'hz.json'
            old = {'city_key': 'hz', 'city_history': self.previous['history']}
            path.write_text(json.dumps(old))
            with patch.object(sys, 'argv', ['export_data.py', '-o', folder, '-c', 'hz']), \
                    patch('export_data.export_city', return_value=old) as export, redirect_stdout(io.StringIO()):
                main()
            self.assertEqual(export.call_args.kwargs['prev_data'], old)
            self.assertEqual(json.loads(path.read_text()), old)

    def test_serialization_failure_does_not_truncate_original_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'hz.json'
            old = {'city_key': 'hz', 'city_history': self.previous['history']}
            original = json.dumps(old); path.write_text(original)
            with patch.object(sys, 'argv', ['export_data.py', '-o', folder, '-c', 'hz']), \
                    patch('export_data.export_city', return_value={**old, 'bad': object()}), redirect_stdout(io.StringIO()):
                with self.assertRaises(TypeError):
                    main()
            self.assertEqual(path.read_text(), original)
            self.assertEqual([p.name for p in Path(folder).iterdir()], ['hz.json'])

    def test_broken_previous_file_stops_instead_of_skipping_history(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'hz.json'; path.write_text('{broken')
            with self.assertRaises(ValueError):
                _load_prev_export(str(path))


if __name__ == '__main__':
    unittest.main()
