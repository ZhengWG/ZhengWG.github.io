"""NBS city price indices, kept separate from yuan/m² reference prices."""
import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from scrapers.base import BaseScraper

INDEX_URL = "https://www.stats.gov.cn/sj/zxfb/"


class NBSScraper(BaseScraper):
    def __init__(self):
        super().__init__(cache_subdir="nbs")

    @staticmethod
    def parse(html, city_name, url):
        soup = BeautifulSoup(html, "lxml")
        title = soup.title.get_text() if soup.title else ""
        period = re.search(r"(\d{4})年(\d{1,2})月份70个大中城市商品住宅销售价格变动情况", title)
        if not period:
            return None
        tables = [t for t in soup.select("table") if all(word in t.get_text() for word in ("城市", "环比", "同比", "上月"))]
        if len(tables) < 2:
            return None
        result = {"date": f"{period[1]}-{int(period[2]):02d}", "source": "nbs", "source_url": url,
                  "unit": "index", "mom_base": "上月=100", "yoy_base": "上年同月=100"}
        for kind, table in zip(("new_house", "second_hand"), tables[:2]):
            for tr in table.select("tr"):
                cells = [re.sub(r"\s+", "", c.get_text()) for c in tr.find_all(["td", "th"], recursive=False)]
                if city_name not in cells:
                    continue
                pos = cells.index(city_name)
                if len(cells) < pos + 3:
                    return None
                try:
                    mom, yoy = float(cells[pos + 1]), float(cells[pos + 2])
                except ValueError:
                    return None
                if not 50 < mom < 150 or not 50 < yoy < 150:
                    return None
                result[kind + "_mom_index"], result[kind + "_yoy_index"] = mom, yoy
                break
        return result if "second_hand_mom_index" in result and "new_house_mom_index" in result else None

    def get_latest(self, city_name):
        html = self.fetch(INDEX_URL, max_retries=1)
        if not html:
            return None
        links = {}
        for a in BeautifulSoup(html, "lxml").select("a[href]"):
            match = re.search(r"(\d{4})年(\d{1,2})月份70个大中城市商品住宅销售价格变动情况", a.get_text())
            if match:
                url = urljoin(INDEX_URL, a["href"])
                if urlparse(url).hostname == "www.stats.gov.cn":
                    links[(int(match[1]), int(match[2]))] = url
        if not links:
            return None
        url = links[max(links)]
        article = self.fetch(url, max_retries=1)
        return self.parse(article, city_name, url) if article else None
