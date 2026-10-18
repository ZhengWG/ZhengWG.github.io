"""Public Fang community lists. Bounded, sequential sampling; no login bypass.

These are reference listing prices, not transactions. The list doesn't give a
price observation month or a change period, so neither is inferred from today.
"""
import re
import time
import requests
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from scrapers.base import BaseScraper

BASE_URL = "https://hz.esf.fang.com"


class FangScraper(BaseScraper):
    def __init__(self, max_pages=5):
        super().__init__(cache_subdir="fang")
        self.max_pages = max_pages
        self.district_urls = None

    def _random_headers(self):
        return {"User-Agent": requests.utils.default_user_agent(), "Accept": "text/html"}

    def _read_cache(self, url, expire_hours=24):
        html = super()._read_cache(url, expire_hours)
        return html if html and 'plotTit' in html else None

    def _write_cache(self, url, html):
        if 'plotTit' in html:
            super()._write_cache(url, html)

    @staticmethod
    def parse(html, page_url):
        soup = BeautifulSoup(html, "lxml")
        rows = []
        for card in soup.select("div.list:has(a.plotTit)"):
            title = card.select_one("a.plotTit")
            price_el = card.select_one(".priceAverage span")
            price_text = price_el.get_text(strip=True).replace(",", "") if price_el else ""
            if not price_text.isdigit() or int(price_text) < 1000:
                continue
            location = card.select_one("dl dd > p:nth-of-type(2)")
            links = location.select("a") if location else []
            if len(links) < 2:
                continue
            sub_id = re.search(r"-b0?(\d+)", links[1].get("href", ""))
            building = re.search(r"(19\d{2}|20\d{2})年建成", card.get_text())
            listing = card.select_one('a[href$="/chushou/"]')
            source_id = re.search(r"/(\d+)\.htm", title.get("href", ""))
            if not source_id:
                continue
            rows.append({
                "community": title.get_text(strip=True), "price": float(price_text),
                "source": "fang", "source_id": source_id[1],
                "source_url": urljoin(page_url, title["href"]),
                "price_kind": "reference_listing", "observed_month": None, "mom_pct": None,
                "district_name": links[0].get_text(strip=True),
                "sub_district": links[1].get_text(strip=True),
                "sub_district_key": "fang-" + sub_id[1] if sub_id else None,
                "address": " ".join(t.strip() for t in location.find_all(string=True, recursive=False) if t.strip() and t.strip() != "-"),
                "built_year": int(building[1]) if building else None,
                "listing_count": int(listing.get_text(strip=True)) if listing and listing.get_text(strip=True).isdigit() else None,
                "property_type": card.select_one(".plotFangType").get_text(strip=True) if card.select_one(".plotFangType") else None,
            })
        next_link = next((a for a in soup.select("a[href]") if a.get_text(strip=True) == "下一页"), None)
        next_url = urljoin(page_url, next_link["href"]) if next_link else None
        if next_url and (urlparse(next_url).netloc != urlparse(BASE_URL).netloc or not urlparse(next_url).path.startswith("/housing/")):
            next_url = None
        return rows, next_url

    def get_communities(self, city_key, district_name):
        if city_key != "hz":
            return [], {"complete": False, "reason": "unsupported_city"}
        if self.district_urls is None:
            html = self.fetch(BASE_URL + "/housing/", max_retries=1)
            self.district_urls = {}
            if html:
                for a in BeautifulSoup(html, "lxml").select("a[href]"):
                    if re.fullmatch(r"/housing/\d+__0_3_0_0_1_0_0_0/", a["href"]):
                        self.district_urls[a.get_text(strip=True)] = urljoin(BASE_URL, a["href"])
        district_short = re.sub(r"[区县市]$", "", district_name)
        url = self.district_urls.get(district_short)
        if not url:
            return [], {"complete": False, "reason": "root_unavailable" if not self.district_urls else "district_not_found"}
        rows, seen = [], set()
        status = {"complete": False, "reason": "page_limit", "pages": 0}
        for page in range(self.max_pages):
            html = self.fetch(url, max_retries=1)
            if not html:
                status["reason"] = "request_failed"
                break
            batch, next_url = self.parse(html, url)
            batch = [r for r in batch if r["district_name"] == district_short]
            status["pages"] = page + 1
            if not batch:
                status["reason"] = "empty_or_blocked_page"
                break
            fresh = [r for r in batch if r["source_id"] not in seen]
            if not fresh:
                status["reason"] = "repeated_page"
                break
            rows.extend(fresh)
            seen.update(r["source_id"] for r in fresh)
            if not next_url:
                status.update(complete=True, reason="last_page")
                break
            url = next_url
            time.sleep(1)
        return rows, status
