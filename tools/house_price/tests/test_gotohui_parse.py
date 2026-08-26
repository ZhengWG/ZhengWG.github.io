"""Parser tests for gotohui HTML tables (old + 2026-08 redesigned layouts)."""

import os
import sys
import unittest
from unittest.mock import patch

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.gotohui import GoToHuiScraper  # noqa: E402


NEW_YEARLY = """
<html><body>
<table class="data-table data-table-macro data-table-fixed-header">
  <thead>
    <tr>
      <th>时间</th>
      <th>二手房均价<div class="unit-label">(元/㎡)</div></th>
      <th>二手房总价<div class="unit-label">(万元)</div></th>
      <th>新房均价<div class="unit-label">(元/㎡)</div></th>
      <th>二手房同比(%)</th>
      <th>二手房环比(%)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>2026-01</td><td>32,980</td><td>394.0</td><td>27,735</td><td>--</td><td>--</td></tr>
    <tr><td>2026-06</td><td>30,916</td><td>362.0</td><td>27,203</td><td>--</td><td>--</td></tr>
    <tr><td>2026-07</td><td>30,202</td><td>335.2</td><td>27,448</td><td>-13.2%</td><td>-2.3%</td></tr>
  </tbody>
</table>
</body></html>
"""

NEW_OVERVIEW = """
<html><body>
<table class="data-table" id="region-data-table">
  <thead>
    <tr>
      <th>时间</th>
      <th>二手房均价<div>(元/㎡)</div></th>
      <th>二手房总价<div>(万元)</div></th>
      <th>新房均价<div>(元/㎡)</div></th>
    </tr>
  </thead>
  <tbody>
    <tr><td>2026-07</td><td>30,202</td><td>335.2</td><td>27,448</td></tr>
    <tr><td>2026-06</td><td>30,916</td><td>362.0</td><td>27,203</td></tr>
    <tr><td>2025-08</td><td>34,967</td><td>442.0</td><td>26,231</td></tr>
  </tbody>
</table>
<table class="ntable">
  <tr><th>选择</th><th>数据名称</th><th>时间范围</th><th>单位</th></tr>
  <tr><td></td><td>杭州市商品房销售面积</td><td>2000 - 2025</td><td>万平方米</td></tr>
</table>
</body></html>
"""

NEW_RANKING = """
<html><body>
<table class="w-100">
  <thead>
    <tr>
      <th>排名</th><th>区域</th><th>均价</th><th>环比</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><a href="https://fangjia.gotohui.com/fjdata-3321">西湖区</a></td>
      <td>41,945</td>
      <td>-0.7%</td>
    </tr>
    <tr>
      <td>2</td>
      <td><a href="https://fangjia.gotohui.com/fjdata-3327">滨江区</a></td>
      <td>39,745</td>
      <td>-1.4%</td>
    </tr>
    <tr>
      <td>14</td>
      <td>市区</td>
      <td>30,512</td>
      <td>-0.6%</td>
    </tr>
  </tbody>
</table>
</body></html>
"""

OLD_YEARLY = """
<html><body>
<table>
  <tr><th>月份</th><th>二手房(元/㎡)</th><th>新房(元/㎡)</th></tr>
  <tr><td>1月</td><td>35201</td><td>26763</td></tr>
  <tr><td>12月</td><td>31908</td><td>27483</td></tr>
</table>
</body></html>
"""

OLD_OVERVIEW = """
<html><body>
<table class="ntable">
  <tr><th>序号</th><th>日期</th><th>二手房(元/㎡)</th><th>新房(元/㎡)</th></tr>
  <tr><td>1</td><td>2025-12</td><td>12759</td><td>18532</td></tr>
  <tr><td>2</td><td>2025-11</td><td>13153</td><td>19536</td></tr>
</table>
</body></html>
"""

OLD_RANKING = """
<html><body>
<table class="table table-striped ablue">
  <tr><th>区域</th><th>单价(元/㎡)</th><th>同比</th></tr>
  <tr>
    <td><a href="https://fangjia.gotohui.com/fjdata-3321">西湖区</a></td>
    <td>42916</td>
    <td class="green">-0.18%</td>
  </tr>
  <tr>
    <td><a href="https://fangjia.gotohui.com/fjdata-3327">滨江区</a></td>
    <td>40722</td>
    <td class="green">-9.36%</td>
  </tr>
</table>
</body></html>
"""


class TestGoToHuiParse(unittest.TestCase):
    def setUp(self):
        self.scraper = GoToHuiScraper()

    def test_new_yearly_page(self):
        df = self.scraper._parse_yearly_page(NEW_YEARLY, 2026)
        self.assertEqual(len(df), 3)
        self.assertEqual(df.iloc[0]["date"], pd.Timestamp(2026, 1, 1))
        self.assertEqual(df.iloc[0]["second_hand_price"], 32980.0)
        self.assertEqual(df.iloc[0]["new_house_price"], 27735.0)
        last = df.iloc[-1]
        self.assertEqual(last["date"], pd.Timestamp(2026, 7, 1))
        self.assertEqual(last["second_hand_price"], 30202.0)
        self.assertEqual(last["new_house_price"], 27448.0)

    def test_new_overview_ignores_unrelated_tables(self):
        df = self.scraper._parse_overview_monthly(NEW_OVERVIEW)
        self.assertEqual(len(df), 3)
        self.assertEqual(df.iloc[0]["date"], pd.Timestamp(2025, 8, 1))
        self.assertEqual(df.iloc[-1]["date"], pd.Timestamp(2026, 7, 1))
        self.assertEqual(df.iloc[-1]["second_hand_price"], 30202.0)
        # Must pick 二手房均价, not 二手房总价 (335.2).
        self.assertGreater(df.iloc[-1]["second_hand_price"], 1000)

    def test_new_ranking_skips_citywide_row(self):
        df = self.scraper._parse_district_list(NEW_RANKING)
        self.assertEqual(list(df["district"]), ["西湖区", "滨江区"])
        self.assertEqual(df.iloc[0]["price"], 41945.0)
        self.assertEqual(df.iloc[0]["yoy"], -0.7)
        self.assertEqual(df.iloc[0]["gotohui_id"], 3321)
        self.assertEqual(df.iloc[1]["gotohui_id"], 3327)

    def test_old_yearly_page(self):
        df = self.scraper._parse_yearly_page(OLD_YEARLY, 2025)
        self.assertEqual(len(df), 2)
        self.assertEqual(df.iloc[0]["date"], pd.Timestamp(2025, 1, 1))
        self.assertEqual(df.iloc[0]["second_hand_price"], 35201.0)
        self.assertEqual(df.iloc[-1]["date"], pd.Timestamp(2025, 12, 1))
        self.assertEqual(df.iloc[-1]["new_house_price"], 27483.0)

    def test_old_overview_page(self):
        df = self.scraper._parse_overview_monthly(OLD_OVERVIEW)
        self.assertEqual(len(df), 2)
        self.assertEqual(df.iloc[0]["date"], pd.Timestamp(2025, 11, 1))
        self.assertEqual(df.iloc[0]["second_hand_price"], 13153.0)
        self.assertEqual(df.iloc[-1]["date"], pd.Timestamp(2025, 12, 1))
        self.assertEqual(df.iloc[-1]["new_house_price"], 18532.0)

    def test_old_ranking(self):
        df = self.scraper._parse_district_list(OLD_RANKING)
        self.assertEqual(list(df["district"]), ["西湖区", "滨江区"])
        self.assertEqual(df.iloc[0]["price"], 42916.0)
        self.assertEqual(df.iloc[0]["yoy"], -0.18)
        self.assertEqual(df.iloc[0]["gotohui_id"], 3321)

    def test_empty_html(self):
        self.assertTrue(self.scraper._parse_overview_monthly("<html></html>").empty)
        self.assertTrue(self.scraper._parse_yearly_page("<html></html>", 2026).empty)
        self.assertTrue(self.scraper._parse_district_list("<html></html>").empty)

    def test_parse_year_month_variants(self):
        parse = self.scraper._parse_year_month
        self.assertEqual(parse("2026-07"), pd.Timestamp(2026, 7, 1))
        self.assertEqual(parse("2026年7月"), pd.Timestamp(2026, 7, 1))
        self.assertEqual(parse("7月", fallback_year=2025), pd.Timestamp(2025, 7, 1))
        self.assertEqual(parse("7", fallback_year=2025), pd.Timestamp(2025, 7, 1))
        self.assertIsNone(parse("时间"))
        self.assertIsNone(parse("7月"))  # no year to fall back to

    def test_fetch_includes_current_year_page(self):
        fetched = []

        def fake_fetch(url, **_kwargs):
            fetched.append(url)
            if "/years/" in url:
                year = int(url.rstrip("/").split("/")[-1])
                return (
                    "<table><tr><th>时间</th><th>二手房均价</th><th>新房均价</th></tr>"
                    f"<tr><td>{year}-01</td><td>10000</td><td>20000</td></tr></table>"
                )
            if "/fjdata-" in url:
                return (
                    "<table><tr><th>时间</th><th>二手房均价</th><th>新房均价</th></tr>"
                    "<tr><td>2026-07</td><td>30202</td><td>27448</td></tr></table>"
                )
            return None

        with patch.object(self.scraper, "fetch", side_effect=fake_fetch):
            df = self.scraper._fetch_yearly_data(37, 2025, 2026)

        year_urls = [u for u in fetched if "/years/" in u]
        self.assertTrue(any(u.endswith("/2025/") for u in year_urls))
        self.assertTrue(any(u.endswith("/2026/") for u in year_urls))
        dates = set(df["date"])
        self.assertIn(pd.Timestamp(2025, 1, 1), dates)
        self.assertIn(pd.Timestamp(2026, 1, 1), dates)
        self.assertIn(pd.Timestamp(2026, 7, 1), dates)

    def test_new_house_community_table(self):
        html = """
        <table class="data-table">
          <thead>
            <tr><th>区域</th><th>小区</th><th>单价(元/㎡)</th><th>环比</th><th>数据月份</th></tr>
          </thead>
          <tbody>
            <tr><td>西湖区</td><td>西溪路24号</td><td>54796</td><td>+2.62%</td><td>2024年12月</td></tr>
            <tr><td>西湖区</td><td>丹金桂花园</td><td>42409</td><td>-1.83%</td><td>2024年12月</td></tr>
          </tbody>
        </table>
        """
        rows = self.scraper._parse_house_community_table(html)
        self.assertEqual([r["community"] for r in rows], ["西溪路24号", "丹金桂花园"])
        self.assertEqual(rows[0]["price"], 54796.0)
        self.assertEqual(rows[0]["mom_pct"], 2.62)
        self.assertEqual(rows[1]["mom_pct"], -1.83)

    def test_old_house_community_table(self):
        html = """
        <table>
          <tr><th>选择</th><th>区域</th><th>小区</th><th>单价(元/㎡)</th><th>环比</th></tr>
          <tr><td></td><td>西湖区</td><td>西溪路24号</td><td>54796.00</td><td>+2.62%</td></tr>
        </table>
        """
        rows = self.scraper._parse_house_community_table(html)
        self.assertEqual(rows[0]["community"], "西溪路24号")
        self.assertEqual(rows[0]["price"], 54796.0)
        self.assertEqual(rows[0]["mom_pct"], 2.62)

    def test_sidebar_community_table(self):
        html = """
        <table>
          <tr><th>小区</th><th>单价(元/㎡)</th><th>环比</th></tr>
          <tr><td>石镜街555号</td><td>9877.00</td><td class="red">+0.51%</td></tr>
        </table>
        """
        df = self.scraper._parse_community_list(html)
        self.assertEqual(df.iloc[0]["community"], "石镜街555号")
        self.assertEqual(df.iloc[0]["price"], 9877.0)
        self.assertEqual(df.iloc[0]["mom_pct"], 0.51)


if __name__ == "__main__":
    unittest.main()

