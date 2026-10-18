import os
import sys
import unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scrapers.fang import FangScraper
from scrapers.nbs import NBSScraper


class SourceTests(unittest.TestCase):
    def test_fang_quote_keeps_identity_board_and_unknown_observation_period(self):
        html = '''<div class="list"><dl><dd><p><a class="plotTit" href="/loupan/123.htm">示例花园</a><span class="plotFangType">住宅</span></p>
        <p><a href="/house-a0151/">西湖</a>-<a href="/house-a0151-b01234/">三墩</a> 示例路1号</p>
        <a href="/loupan/123/chushou/">28</a><p>2010年建成</p></dd></dl>
        <p class="priceAverage"><span>32,000</span>元/㎡</p></div><a href="/housing/151__0_3_0_0_2_0_0_0/">下一页</a>'''
        rows, next_url = FangScraper.parse(html, 'https://hz.esf.fang.com/housing/')
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['price'], 32000)
        self.assertEqual(rows[0]['sub_district'], '三墩')
        self.assertEqual(rows[0]['built_year'], 2010)
        self.assertEqual(rows[0]['listing_count'], 28)
        self.assertIsNone(rows[0]['observed_month'])
        self.assertIsNone(rows[0]['mom_pct'])
        self.assertTrue(next_url.endswith('_2_0_0_0/'))

    def test_captcha_is_not_a_successful_empty_listing(self):
        self.assertEqual(FangScraper.parse('<h1>访问验证</h1>', 'https://hz.esf.fang.com/housing/'), ([], None))

    def test_nbs_indices_are_not_prices_and_support_spaced_city_names(self):
        table = '<table><tr><th>城市</th><th>环比 上月=100</th><th>同比</th></tr><tr><td>杭　　州</td><td>{}</td><td>{}</td></tr></table>'
        html = '<title>2026年8月份70个大中城市商品住宅销售价格变动情况</title>' + table.format('100.2', '102.2') + table.format('99.8', '96.5')
        result = NBSScraper.parse(html, '杭州', 'https://www.stats.gov.cn/example')
        self.assertEqual(result['unit'], 'index')
        self.assertEqual(result['second_hand_mom_index'], 99.8)
        self.assertEqual(result['date'], '2026-08')
        self.assertNotIn('second_hand_price', result)

    def test_nbs_incomplete_article_is_rejected(self):
        self.assertIsNone(NBSScraper.parse('<title>房价解读</title>', '杭州', 'https://www.stats.gov.cn/'))

if __name__ == '__main__':
    unittest.main()
