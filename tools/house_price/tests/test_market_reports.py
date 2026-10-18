import json
import os
import sys
import unittest
from copy import deepcopy
from datetime import date
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scrapers.market_reports import MarketReportScraper, merge_reports


CREPRICE = '''<h1>杭州房地产数据报告 <span>(2026年9月)</span></h1>
<p>房价：平均房价为3.45万元/㎡，环比上涨3.81%</p>
<p>房租：平均房租为55.2元/月/㎡，环比上涨2.47%</p>
<p>2026年9月，杭州房价为34,529元/㎡，环比上涨3.81%</p>
<p>2026年9月，杭州房租为55.16元/月/㎡，单价区间11.41~241.18元/月/㎡</p>
<table><tr><th>排名</th><th>区市县</th><th>平均单价（元/㎡）</th><th>环比</th></tr>
<tr><td>1</td><td>钱塘区</td><td>2.26万</td><td>-1.36%</td></tr></table>
<table><tr><th>排名</th><th>区市县</th><th>平均单价（元/月/㎡）</th><th>环比</th></tr>
<tr><td>1</td><td>西湖区</td><td>54.93</td><td>-0.97%</td></tr></table>'''
CIH = '''<title>2026年9月十大城市二手房房价地图</title>
<p>上海：二手住宅成交23581套，价格方面，二手住宅价格环比上涨0.11%，同比下跌4.47%。</p>
<p>杭州：9月二手住宅成交5077套，同比增长5.4%</p><p>数据来源：中指数据CREIS</p>
<p>成交方面，2026年9月，杭州二手住宅成交5077套，同比增长5.4%。1-9月累计同比下降6.8%。价格方面，9月，二手住宅价格环比下跌0.73%，同比下跌6.84%。</p>
<p>成都：成交18030套，二手住宅价格环比下跌0.65%。</p>'''
CIH_URL = 'https://www.cih-index.com/news/2026-10-15/55166389.html'


class MarketReportTests(unittest.TestCase):
    def test_units_precision_and_partial_district_rankings(self):
        r = MarketReportScraper.parse_creprice(CREPRICE, '杭州', 'https://www.creprice.cn/report/hz/2026-09.html')
        self.assertEqual(r['city_metrics']['sale_price'], 34529)
        self.assertEqual(r['city_metrics']['rent_price'], 55.16)
        self.assertEqual(r['city_metrics']['rent_mom_pct'], 2.47)
        self.assertEqual(r['districts']['钱塘区']['sale_price'], 22600)
        self.assertNotIn('sale_price', r['districts']['西湖区'])
        self.assertNotIn('rent_price', r['districts']['钱塘区'])

    def test_cih_city_and_price_yoy_are_not_confused_with_other_cities_or_volume(self):
        r = MarketReportScraper.parse_cih(CIH, '杭州', CIH_URL)
        self.assertEqual(r['city_metrics'], {'transactions': 5077, 'sale_mom_pct': -0.73, 'sale_yoy_pct': -6.84})

    def test_empty_wrong_city_and_incomplete_reports_are_rejected(self):
        self.assertIsNone(MarketReportScraper.parse_creprice(CREPRICE, '北京', ''))
        self.assertIsNone(MarketReportScraper.parse_creprice('<h1>访问验证</h1>', '杭州', ''))
        self.assertIsNone(MarketReportScraper.parse_cih(CIH.replace('价格方面，', ''), '杭州', ''))

    def test_discovery_reads_public_embedded_json_and_rejects_foreign_links(self):
        state = {'articles': [{'title': '2026年9月十大城市二手房房价地图', 'url': CIH_URL},
                              {'title': '2026年10月十大城市二手房房价地图', 'url': 'https://example.com/news.html'}]}
        html = '<script>window.__INITIAL_STATE__= ' + json.dumps(state) + '; otherCode()</script>'
        self.assertEqual(MarketReportScraper.discover_cih(html), {'2026-09': CIH_URL})

    def test_report_merge_preserves_older_months_missing_districts_and_revisions(self):
        old = MarketReportScraper.parse_creprice(CREPRICE, '杭州', '')
        new = deepcopy(old); new['districts'] = {}; new['city_metrics']['sale_price'] = 34600
        result = merge_reports([old], [new])
        self.assertEqual(result[0]['districts'], old['districts'])
        self.assertEqual(result[0]['revisions'][0]['city_metrics']['sale_price'], 34529)
        self.assertEqual(merge_reports(result, [new]), result)
        next_month = deepcopy(new); next_month['date'] = '2026-10'
        self.assertEqual(len(merge_reports(result, [next_month])), 2)

    def test_fetch_rejects_wrong_month_and_reports_failed_discovery(self):
        source = MarketReportScraper()
        with patch.object(source, 'fetch', return_value=CREPRICE):
            rows = source.get_reports('hz', '杭州', today=date(2026, 10, 18))
        self.assertEqual([r['date'] for r in rows], ['2026-09'])
        self.assertFalse(source.status['cih']['latest_discovery'])
        with patch.object(source, 'fetch', return_value=None):
            self.assertEqual(source.get_reports('hz', '杭州'), [])
        self.assertEqual(source.status['creprice']['status'], 'unavailable')


if __name__ == '__main__':
    unittest.main()
