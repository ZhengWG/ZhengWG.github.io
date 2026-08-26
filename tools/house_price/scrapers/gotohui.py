"""聚汇数据爬虫：获取城市/区域历史月度房价走势 + 小区列表。

数据源: fangjia.gotohui.com
- 城市总览页:  /fjdata-{city_id}     → 最近约 12 个月 + 各区排行
- 区级页:      /fjdata-{district_id} → 该区近 12 个月 + 小区列表（无板块层级）
- 年度详情页:  /years/{id}/{year}/   → 某年各月二手房/新房均价（含当年已发布月份）

2026-08 站点改版后，月度表头从「日期/月份」改为「时间」，并插入「二手房总价」列；
辖区表从「区域/单价/同比」改为「排名/区域/均价/环比」。解析按表头定位列，新旧格式兼容。

说明：聚汇区级页没有「板块」表，板块数据需用其他数据源（见 DATA_SOURCES.md）。
"""

import re
from typing import Optional

import pandas as pd
from bs4 import BeautifulSoup

from config import CITIES, CURRENT_YEAR, HISTORY_START_YEAR
from scrapers.base import BaseScraper

BASE_URL = "https://fangjia.gotohui.com"

# 站点改版后月度表用「时间」，旧版用「日期」或「月份」。
_DATE_HEADERS = ("时间", "日期", "月份")
_SECOND_HAND_HEADERS = ("二手房均价", "二手房")
_NEW_HOUSE_HEADERS = ("新房均价", "新房")
_REGION_NAME_HEADERS = ("区域", "板块")
_REGION_PRICE_HEADERS = ("单价", "均价")
_REGION_CHANGE_HEADERS = ("同比", "环比")


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
        # Include the current year: /years/{id}/{year}/ is published incrementally
        # (e.g. 2026 already has Jan–Jul). Skipping it left 2026-only months to
        # the overview table, which is why exports froze at June.
        safe_end = min(end_year, CURRENT_YEAR)
        for year in range(start_year, safe_end + 1):
            url = f"{BASE_URL}/years/{gotohui_id}/{year}/"
            html = self.fetch(url)
            if html is None:
                continue
            df = self._parse_yearly_page(html, year)
            if df.empty:
                print(f"[WARN] 年度页解析为空: {url}")
                continue
            frames.append(df)

        overview_url = f"{BASE_URL}/fjdata-{gotohui_id}"
        overview_html = self.fetch(overview_url)
        if overview_html:
            df_overview = self._parse_overview_monthly(overview_html)
            if df_overview.empty:
                print(f"[WARN] 总览月度表解析为空: {overview_url}")
            else:
                frames.append(df_overview)
        else:
            print(f"[WARN] 总览页请求失败: {overview_url}")

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
                print(f"[WARN] 小区列表页请求失败: {url}")
                break
            rows = self._parse_house_community_table(html)
            if not rows:
                print(f"[WARN] 小区列表页解析为空: {url}")
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
    def _table_headers(table) -> list:
        first_tr = table.find("tr")
        if first_tr is None:
            return []
        return [c.get_text(strip=True) for c in first_tr.find_all(["th", "td"])]

    @staticmethod
    def _find_header(headers: list, names: tuple) -> Optional[int]:
        """Return the column index of the longest matching header substring."""
        best_idx = None
        best_len = -1
        for i, header in enumerate(headers):
            for name in names:
                if name in header and len(name) > best_len:
                    best_idx = i
                    best_len = len(name)
        return best_idx

    @staticmethod
    def _parse_price(text: str) -> Optional[float]:
        if not text:
            return None
        cleaned = text.replace(",", "").replace(" ", "")
        if cleaned in {"--", "-", "—", "暂无", ""}:
            return None
        match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
        if not match:
            return None
        try:
            return float(match.group(0))
        except ValueError:
            return None

    @staticmethod
    def _parse_year_month(text: str, fallback_year: Optional[int] = None) -> Optional[pd.Timestamp]:
        if not text:
            return None
        match = re.search(r"(\d{4})\s*[-年./]\s*(\d{1,2})", text)
        if match:
            year, month = int(match.group(1)), int(match.group(2))
            if 1 <= month <= 12:
                return pd.Timestamp(year=year, month=month, day=1)
        match = re.search(r"(\d{1,2})\s*月", text)
        if match and fallback_year:
            month = int(match.group(1))
            if 1 <= month <= 12:
                return pd.Timestamp(year=fallback_year, month=month, day=1)
        match = re.fullmatch(r"(\d{1,2})", text.strip())
        if match and fallback_year:
            month = int(match.group(1))
            if 1 <= month <= 12:
                return pd.Timestamp(year=fallback_year, month=month, day=1)
        return None

    def _parse_monthly_table(self, html: str, fallback_year: Optional[int] = None) -> pd.DataFrame:
        """Parse city/district monthly price tables (old 日期/月份 and new 时间 layouts)."""
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            headers = self._table_headers(table)
            if not headers:
                continue
            header_text = "".join(headers)
            if "二手房" not in header_text:
                continue
            date_idx = self._find_header(headers, _DATE_HEADERS)
            second_idx = self._find_header(headers, _SECOND_HAND_HEADERS)
            if date_idx is None or second_idx is None:
                continue
            new_idx = self._find_header(headers, _NEW_HOUSE_HEADERS)
            for tr in table.find_all("tr"):
                cells = tr.find_all(["td", "th"])
                if len(cells) <= max(date_idx, second_idx):
                    continue
                date_val = self._parse_year_month(
                    cells[date_idx].get_text(strip=True), fallback_year
                )
                if date_val is None:
                    continue
                second_hand = self._parse_price(cells[second_idx].get_text(strip=True))
                new_house = None
                if new_idx is not None and len(cells) > new_idx:
                    new_house = self._parse_price(cells[new_idx].get_text(strip=True))
                rows.append({
                    "date": date_val,
                    "second_hand_price": second_hand,
                    "new_house_price": new_house,
                })
            if rows:
                break
        df = pd.DataFrame(rows)
        if not df.empty:
            df.drop_duplicates(subset=["date"], keep="last", inplace=True)
            df.sort_values("date", inplace=True)
            df.reset_index(drop=True, inplace=True)
        return df

    def _parse_yearly_page(self, html: str, year: int) -> pd.DataFrame:
        return self._parse_monthly_table(html, fallback_year=year)

    def _parse_overview_monthly(self, html: str) -> pd.DataFrame:
        return self._parse_monthly_table(html)

    def _parse_district_list(self, html: str) -> pd.DataFrame:
        return self._parse_region_table(html, "district")

    def _parse_sub_district_list(self, html: str) -> pd.DataFrame:
        """解析区级页面中的板块表格（之江/三墩/转塘等），含 gotohui_id 用于拉取板块历史。"""
        return self._parse_region_table(html, "sub_district")

    def _parse_region_table(self, html: str, name_key: str = "district") -> pd.DataFrame:
        """解析辖区/板块表及 fjdata-xxx 链接。兼容旧「区域/单价/同比」和新「排名/区域/均价/环比」。"""
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for table in soup.find_all("table"):
            headers = self._table_headers(table)
            if not headers:
                continue
            header_text = "".join(headers)
            if "区域" not in header_text and "板块" not in header_text:
                continue
            name_idx = self._find_header(headers, _REGION_NAME_HEADERS)
            price_idx = self._find_header(headers, _REGION_PRICE_HEADERS)
            change_idx = self._find_header(headers, _REGION_CHANGE_HEADERS)
            if name_idx is None or price_idx is None:
                continue
            for tr in table.find_all("tr"):
                tds = tr.find_all("td")
                if len(tds) <= max(name_idx, price_idx):
                    continue
                name = tds[name_idx].get_text(strip=True)
                if not name or name in {"市区", "区域", "板块"}:
                    continue
                price = self._parse_price(tds[price_idx].get_text(strip=True))
                yoy = None
                if change_idx is not None and len(tds) > change_idx:
                    yoy = self._parse_yoy(tds[change_idx].get_text(strip=True))
                link = tds[name_idx].find("a")
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
            if rows:
                break
        return pd.DataFrame(rows)

    def _parse_community_rows(self, html: str) -> list:
        """Parse community tables by header name.

        Current house-{id} layout: 区域 | 小区 | 单价 | 环比 | 数据月份
        Older layout: 选择 | 区域 | 小区 | 单价 | 环比
        Sidebar fjdata layout: 小区 | 单价 | 环比
        """
        soup = BeautifulSoup(html, "lxml")
        for table in soup.find_all("table"):
            headers = self._table_headers(table)
            header_text = "".join(headers)
            if "小区" not in header_text:
                continue
            name_idx = self._find_header(headers, ("小区",))
            price_idx = self._find_header(headers, ("单价", "均价"))
            if name_idx is None or price_idx is None:
                continue
            mom_idx = self._find_header(headers, ("环比",))
            rows = []
            for tr in table.find_all("tr"):
                tds = tr.find_all("td")
                if len(tds) <= max(name_idx, price_idx):
                    continue
                name = tds[name_idx].get_text(strip=True)
                if not name or name in {"小区", "选择"}:
                    continue
                price = self._parse_price(tds[price_idx].get_text(strip=True))
                mom = None
                if mom_idx is not None and len(tds) > mom_idx:
                    mom = self._parse_yoy(tds[mom_idx].get_text(strip=True))
                rows.append({"community": name, "price": price, "mom_pct": mom})
            if rows:
                return rows
        return []

    def _parse_house_community_table(self, html: str) -> list:
        return self._parse_community_rows(html)

    def _parse_community_list(self, html: str) -> pd.DataFrame:
        rows = self._parse_community_rows(html)
        return pd.DataFrame(rows)

    @staticmethod
    def _parse_yoy(text: str) -> Optional[float]:
        match = re.search(r"([+-]?[\d.]+)%", text)
        if match:
            return float(match.group(1))
        return None
