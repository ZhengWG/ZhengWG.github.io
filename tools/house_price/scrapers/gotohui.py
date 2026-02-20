"""聚汇数据爬虫：获取城市/区域历史月度房价走势 + 小区列表。

数据源: fangjia.gotohui.com
- 城市总览页:  /fjdata-{city_id}     → 最近 12 个月 + 各区列表
- 区级页:      /fjdata-{district_id} → 该区 12 个月 + 小区列表（无板块层级）
- 年度详情页:  /years/{id}/{year}/   → 某年 12 个月二手房/新房均价

说明：聚汇区级页没有「板块」表，板块数据需用其他数据源（见 DATA_SOURCES.md）。
"""

import re
from typing import Optional

import pandas as pd
from bs4 import BeautifulSoup

from config import CITIES, CURRENT_YEAR, HISTORY_START_YEAR
from scrapers.base import BaseScraper

BASE_URL = "https://fangjia.gotohui.com"


class GoToHuiScraper(BaseScraper):
    def __init__(self):
        super().__init__(cache_subdir="gotohui")

    def get_city_monthly(self, city_key: str) -> pd.DataFrame:
        city = CITIES[city_key]
        url = f"{BASE_URL}/fjdata-{city['gotohui_id']}"
        html = self.fetch(url)
        if html is None:
            return pd.DataFrame()
        return self._parse_overview_monthly(html)

    def _fetch_yearly_data(self, gotohui_id: int,
                           start_year: int, end_year: int) -> pd.DataFrame:
        frames = []
        safe_end = min(end_year, CURRENT_YEAR - 1)
        for year in range(start_year, safe_end + 1):
            url = f"{BASE_URL}/years/{gotohui_id}/{year}/"
            html = self.fetch(url)
            if html is None:
                continue
            df = self._parse_yearly_page(html, year)
            if not df.empty:
                frames.append(df)

        overview_url = f"{BASE_URL}/fjdata-{gotohui_id}"
        overview_html = self.fetch(overview_url)
        if overview_html:
            df_overview = self._parse_overview_monthly(overview_html)
            if not df_overview.empty:
                frames.append(df_overview)

        if not frames:
            return pd.DataFrame()
        result = pd.concat(frames, ignore_index=True)
        result.drop_duplicates(subset=["date"], keep="last", inplace=True)
        result.sort_values("date", inplace=True)
        result.reset_index(drop=True, inplace=True)
        return result

    def get_district_history(self, city_key: str, district_key: str,
                             start_year: int = HISTORY_START_YEAR,
                             end_year: int = CURRENT_YEAR) -> pd.DataFrame:
        district = CITIES[city_key]["districts"][district_key]
        return self._fetch_yearly_data(district["gotohui_id"], start_year, end_year)

    def get_city_history(self, city_key: str,
                         start_year: int = HISTORY_START_YEAR,
                         end_year: int = CURRENT_YEAR) -> pd.DataFrame:
        city = CITIES[city_key]
        return self._fetch_yearly_data(city["gotohui_id"], start_year, end_year)

    def get_district_list(self, city_key: str) -> pd.DataFrame:
        city = CITIES[city_key]
        url = f"{BASE_URL}/fjdata-{city['gotohui_id']}"
        html = self.fetch(url)
        if html is None:
            return pd.DataFrame()
        return self._parse_district_list(html)

    def get_community_prices(self, city_key: str, district_key: str) -> pd.DataFrame:
        """优先从 house-{id} 分页拉取更多小区，失败则用区级页 fjdata 侧栏。"""
        district = CITIES[city_key]["districts"][district_key]
        gid = district["gotohui_id"]
        df = self._get_community_prices_from_house(gid)
        if not df.empty:
            return df
        url = f"{BASE_URL}/fjdata-{gid}"
        html = self.fetch(url)
        if html is None:
            return pd.DataFrame()
        return self._parse_community_list(html)

    def _get_community_prices_from_house(self, gid: int, max_pages: int = 30) -> pd.DataFrame:
        """从 house-{gid}、house-{gid}/2.html ... 分页拉取小区列表（每页约 20 条）。"""
        import time as _time
        all_rows = []
        for page in range(1, max_pages + 1):
            if page == 1:
                url = f"{BASE_URL}/house-{gid}"
            else:
                url = f"{BASE_URL}/house-{gid}/{page}.html"
            html = self.fetch(url)
            if html is None:
                break
            rows = self._parse_house_community_table(html)
            if not rows:
                break
            all_rows.extend(rows)
            if len(rows) < 20:
                break
            _time.sleep(0.5)
        if not all_rows:
            return pd.DataFrame()
        return pd.DataFrame(all_rows).drop_duplicates(subset=["community"], keep="first")

    def get_sub_district_list(self, city_key: str, district_key: str) -> pd.DataFrame:
        """从区级页面解析板块列表（之江/三墩/转塘等），含 gotohui_id 用于拉取板块历史。"""
        district = CITIES[city_key]["districts"][district_key]
        url = f"{BASE_URL}/fjdata-{district['gotohui_id']}"
        html = self.fetch(url)
        if html is None:
            return pd.DataFrame()
        return self._parse_sub_district_list(html)

    def get_sub_district_history(self, gotohui_id: int,
                                 start_year: int = HISTORY_START_YEAR,
                                 end_year: int = CURRENT_YEAR) -> pd.DataFrame:
        """按板块的 gotohui_id 拉取该板块历史月度房价。"""
        return self._fetch_yearly_data(gotohui_id, start_year, end_year)

    # ------------------------------------------------------------------

    @staticmethod
    def _parse_price(text: str) -> Optional[float]:
        if not text:
            return None
        nums = re.findall(r"[\d,]+", text.replace(",", ""))
        if nums:
            try:
                return float(nums[0])
            except ValueError:
                return None
        return None

    def _parse_yearly_page(self, html: str, year: int) -> pd.DataFrame:
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            header_text = table.get_text()
            if "月份" in header_text and "二手房" in header_text:
                for tr in table.find_all("tr")[1:]:
                    tds = tr.find_all("td")
                    if len(tds) < 2:
                        continue
                    month_text = tds[0].get_text(strip=True)
                    month_match = re.search(r"(\d+)", month_text)
                    if not month_match:
                        continue
                    month = int(month_match.group(1))
                    second_hand = self._parse_price(tds[1].get_text(strip=True))
                    new_house = self._parse_price(tds[2].get_text(strip=True)) if len(tds) > 2 else None
                    rows.append({
                        "date": pd.Timestamp(year=year, month=month, day=1),
                        "second_hand_price": second_hand,
                        "new_house_price": new_house,
                    })
                break
        return pd.DataFrame(rows)

    def _parse_overview_monthly(self, html: str) -> pd.DataFrame:
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            header = table.get_text()
            if "日期" in header and "二手房" in header:
                for tr in table.find_all("tr")[1:]:
                    tds = tr.find_all("td")
                    if len(tds) < 3:
                        continue
                    date_text = tds[1].get_text(strip=True)
                    date_match = re.match(r"(\d{4})-(\d{1,2})", date_text)
                    if not date_match:
                        continue
                    y, m = int(date_match.group(1)), int(date_match.group(2))
                    second_hand = self._parse_price(tds[2].get_text(strip=True))
                    new_house = self._parse_price(tds[3].get_text(strip=True)) if len(tds) > 3 else None
                    rows.append({
                        "date": pd.Timestamp(year=y, month=m, day=1),
                        "second_hand_price": second_hand,
                        "new_house_price": new_house,
                    })
                break
        df = pd.DataFrame(rows)
        if not df.empty:
            df.sort_values("date", inplace=True)
            df.reset_index(drop=True, inplace=True)
        return df

    def _parse_district_list(self, html: str) -> pd.DataFrame:
        return self._parse_region_table(html, "district")

    def _parse_sub_district_list(self, html: str) -> pd.DataFrame:
        """解析区级页面中的板块表格（区域/板块 + 单价 + 同比 + fjdata-xxx 链接）。"""
        return self._parse_region_table(html, "sub_district")

    def _parse_region_table(self, html: str, name_key: str = "district") -> pd.DataFrame:
        """解析「区域/板块 + 单价 + 同比」表格及 fjdata-xxx 链接，城市页用于区列表、区页用于板块列表。"""
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            header = table.get_text()
            if ("区域" in header or "板块" in header) and "单价" in header and "同比" in header:
                for tr in table.find_all("tr")[1:]:
                    tds = tr.find_all("td")
                    if len(tds) < 3:
                        continue
                    name = tds[0].get_text(strip=True)
                    price = self._parse_price(tds[1].get_text(strip=True))
                    yoy_text = tds[2].get_text(strip=True)
                    yoy = self._parse_yoy(yoy_text)
                    link = tds[0].find("a")
                    gotohui_id = None
                    if link and link.get("href"):
                        id_match = re.search(r"fjdata-(\d+)", link["href"])
                        if id_match:
                            gotohui_id = int(id_match.group(1))
                    rows.append({
                        name_key: name,
                        "price": price,
                        "yoy": yoy,
                        "gotohui_id": gotohui_id,
                    })
                break
        return pd.DataFrame(rows)

    def _parse_house_community_table(self, html: str) -> list:
        """解析 house-{id} 页的表格：选择|区域|小区|单价|环比。"""
        soup = BeautifulSoup(html, "lxml")
        for table in soup.find_all("table"):
            header = table.get_text()
            if "小区" in header and "单价" in header and "环比" in header:
                rows = []
                for tr in table.find_all("tr")[1:]:
                    tds = tr.find_all("td")
                    if len(tds) < 4:
                        continue
                    # 表格列可能是：选择、区域、小区、单价、环比
                    name_cell = tds[2] if len(tds) >= 5 else tds[0]
                    price_cell = tds[3] if len(tds) >= 5 else tds[1]
                    mom_cell = tds[4] if len(tds) >= 5 else tds[2]
                    name = name_cell.get_text(strip=True)
                    if not name:
                        continue
                    price = self._parse_price(price_cell.get_text(strip=True))
                    mom = self._parse_yoy(mom_cell.get_text(strip=True))
                    rows.append({"community": name, "price": price, "mom_pct": mom})
                return rows
        return []

    def _parse_community_list(self, html: str) -> pd.DataFrame:
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            header = table.get_text()
            if "小区" in header and "单价" in header and "环比" in header:
                for tr in table.find_all("tr")[1:]:
                    tds = tr.find_all("td")
                    if len(tds) < 3:
                        continue
                    name = tds[0].get_text(strip=True)
                    price = self._parse_price(tds[1].get_text(strip=True))
                    mom_text = tds[2].get_text(strip=True)
                    mom = self._parse_yoy(mom_text)
                    rows.append({
                        "community": name,
                        "price": price,
                        "mom_pct": mom,
                    })
                break
        return pd.DataFrame(rows)

    @staticmethod
    def _parse_yoy(text: str) -> Optional[float]:
        match = re.search(r"([+-]?[\d.]+)%", text)
        if match:
            return float(match.group(1))
        return None
