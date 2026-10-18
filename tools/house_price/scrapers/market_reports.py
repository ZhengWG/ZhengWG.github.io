"""Public monthly reports; their provider definitions stay separate from prices."""
from copy import deepcopy
from datetime import date
import json
import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper


def number(text):
    match = re.fullmatch(r"([+-]?[\d,]+(?:\.\d+)?)(万)?%?", text.strip())
    return round(float(match[1].replace(',', '')) * (10000 if match[2] else 1), 8) if match else None


def percent(direction, value):
    return -float(value) if direction in ('下跌', '下降') else float(value)


class MarketReportScraper(BaseScraper):
    CIH_LIST = "https://www.cih-index.com/industrydata/industrynews/market.html"

    def __init__(self):
        super().__init__(cache_subdir="market_reports")
        self.status = {}

    def _random_headers(self):
        return {"User-Agent": requests.utils.default_user_agent(), "Accept": "text/html"}

    @staticmethod
    def parse_creprice(html, city_name, url):
        soup = BeautifulSoup(html, 'lxml')
        heading = soup.find('h1')
        title = heading.get_text(' ', strip=True) if heading else ''
        period = re.search(re.escape(city_name) + r"房地产数据报告\s*[（(](\d{4})年(\d{1,2})月", title)
        if not period or not 1 <= int(period[2]) <= 12:
            return None
        text = re.sub(r'\s+', '', soup.get_text(' ', strip=True))
        values = {}
        for kind, label, unit in [('sale', '房价', '元/㎡'), ('rent', '房租', '元/月/㎡')]:
            match = re.search(re.escape(city_name + label) + r"为([\d,]+(?:\.\d+)?)" + re.escape(unit), text)
            if match:
                values[kind + '_price'] = number(match[1])
                change = re.search(re.escape(label + '：平均' + label) + r'为[^，]+，环比(上涨|下跌|下降)([\d.]+)%', text)
                values[kind + '_mom_pct'] = percent(change[1], change[2]) if change else None
        if not values.get('sale_price') or not values.get('rent_price'):
            return None
        districts = {}
        for table in soup.select('table'):
            headers = table.find('tr')
            header = headers.get_text(' ', strip=True) if headers else ''
            if '区市县' not in header or '环比' not in header:
                continue
            kind = 'rent' if '元/月/㎡' in header else 'sale' if '元/㎡' in header else None
            if not kind:
                continue
            for tr in table.select('tr')[1:]:
                cells = [c.get_text(strip=True) for c in tr.find_all(['td', 'th'])]
                if len(cells) != 4 or not re.fullmatch(r'[\u4e00-\u9fff]+[区县市]', cells[1]):
                    continue
                price, change = number(cells[2]), number(cells[3])
                if price is not None and price > 0:
                    districts.setdefault(cells[1], {}).update({kind + '_price': price, kind + '_mom_pct': change})
        return {"source": "creprice", "source_name": "禧泰 / 全国房价行情", "source_url": url,
                "date": f"{period[1]}-{int(period[2]):02d}", "city": city_name,
                "price_kind": "residential_report_average", "city_metrics": values, "districts": districts,
                "units": {"sale_price": "元/㎡", "rent_price": "元/月/㎡", "mom_pct": "%"},
                "note": "住宅月报口径，区县表仅为公开排名样本；万元展示值经换算但精度不增加。不可拼接为聚汇均价或国家统计局指数。"}

    @staticmethod
    def parse_cih(html, city_name, url):
        soup = BeautifulSoup(html, 'lxml')
        title = soup.title.get_text() if soup.title else ''
        period = re.search(r'(\d{4})年(\d{1,2})月十大城市二手房房价地图', title)
        if not period or not 1 <= int(period[2]) <= 12:
            return None
        text = re.sub(r'\s+', '', soup.get_text(' ', strip=True))
        # Scope the regex to this city's section so another city's prices cannot leak in.
        section = re.search(re.escape(city_name) + r'：(.+?)(?=(?:北京|上海|广州|深圳|杭州|成都|南京|武汉|重庆|天津)(?:（主城区）)?：|展望|$)', text)
        if not section:
            return None
        block = section[1]
        sales = re.search(re.escape(city_name) + r'二手住宅成交([\d,]+)套', block)
        price_text = block.split('价格方面，', 1)[1] if '价格方面，' in block else ''
        mom = re.search(r'二手住宅(?:挂牌均价|价格)环比(上涨|下跌|下降)([\d.]+)%', price_text)
        yoy = re.search(r'同比(上涨|下跌|下降)([\d.]+)%', price_text)
        if not sales or not mom:
            return None
        metrics = {"transactions": int(sales[1].replace(',', '')), "sale_mom_pct": percent(mom[1], mom[2])}
        if yoy:
            metrics['sale_yoy_pct'] = percent(yoy[1], yoy[2])
        return {"source": "cih", "source_name": "中指研究院", "source_url": url,
                "date": f"{period[1]}-{int(period[2]):02d}", "city": city_name,
                "price_kind": "second_hand_listing_report", "city_metrics": metrics, "districts": {},
                "units": {"transactions": "套", "mom_pct": "%", "yoy_pct": "%"},
                "note": "二手住宅月报；成交套数与挂牌价格变化为不同指标，不提供逐套成交价。"}

    @classmethod
    def discover_cih(cls, html):
        soup = BeautifulSoup(html, 'lxml')
        candidates = [(a.get_text(' ', strip=True), a['href']) for a in soup.select('a[href]')]
        # The public listing embeds its article list as JSON for hydration.
        # Decode that data without evaluating any page JavaScript.
        def visit(value):
            if isinstance(value, dict):
                if isinstance(value.get('title'), str) and isinstance(value.get('url'), str):
                    candidates.append((value['title'], value['url']))
                for child in value.values():
                    visit(child)
            elif isinstance(value, list):
                for child in value:
                    visit(child)
        for script in soup.select('script'):
            text = script.string or ''
            if 'window.__INITIAL_STATE__=' not in text:
                continue
            try:
                state, _ = json.JSONDecoder().raw_decode(text.split('window.__INITIAL_STATE__=', 1)[1].lstrip())
                visit(state)
            except (ValueError, RecursionError):
                continue
        links = {}
        for title, href in candidates:
            period = re.search(r'(\d{4})年(\d{1,2})月十大城市二手房房价地图', title)
            url = urljoin(cls.CIH_LIST, href)
            parsed = urlparse(url)
            if period and 1 <= int(period[2]) <= 12 and parsed.scheme == 'https' and parsed.hostname in ('www.cih-index.com', 'm.cih-index.com'):
                if re.fullmatch(r'/news/\d{4}-\d{2}-\d{2}/\d+\.html', parsed.path):
                    links[f"{period[1]}-{int(period[2]):02d}"] = url
        return links

    def get_reports(self, city_key, city_name, previous=(), today=None):
        today = today or date.today()
        reports = []
        # Probe only the last three completed months, never a future/current month.
        for offset in range(1, 4):
            absolute = today.year * 12 + today.month - 1 - offset
            period = f"{absolute // 12}-{absolute % 12 + 1:02d}"
            url = f"https://www.creprice.cn/report/{city_key}/{period}.html"
            html = self.fetch(url, max_retries=1)
            report = self.parse_creprice(html, city_name, url) if html else None
            if report and report['date'] == period:
                reports.append(report)
        self.status['creprice'] = {"status": "active" if reports else "unavailable", "fetched_reports": len(reports)}
        html = self.fetch(self.CIH_LIST, max_retries=1)
        links = self.discover_cih(html) if html else {}
        discovered = bool(links)
        if not links:
            # Re-check a previously saved report, but do not claim discovery of the latest issue.
            links = {r['date']: r['source_url'] for r in previous if r['source'] == 'cih'
                     and urlparse(r['source_url']).hostname in ('www.cih-index.com', 'm.cih-index.com')}
        count = 0
        for period, url in sorted(links.items(), reverse=True)[:2]:
            html = self.fetch(url, max_retries=1)
            report = self.parse_cih(html, city_name, url) if html else None
            if report and report['date'] == period and period < today.strftime('%Y-%m'):
                reports.append(report); count += 1
        self.status['cih'] = {"status": "active" if count and discovered else "snapshot" if count else "unavailable",
                              "fetched_reports": count, "latest_discovery": discovered}
        for report in reports:
            report['fetched_at'] = today.isoformat()
        return reports


def merge_reports(previous, fresh):
    """Keep all periods/providers and archive a prior edition before a correction."""
    by_key = {(r['source'], r['date']): deepcopy(r) for r in previous}
    for report in fresh:
        key = (report['source'], report['date'])
        old = by_key.get(key, {})
        current = deepcopy(old)
        current.update({k: v for k, v in report.items() if k not in ('city_metrics', 'districts')})
        for group in ('city_metrics', 'districts'):
            current.setdefault(group, {})
            for name, value in report.get(group, {}).items():
                if isinstance(value, dict):
                    current[group].setdefault(name, {}).update({k: v for k, v in value.items() if v is not None})
                elif value is not None:
                    current[group][name] = value
        if old and any(current.get(k) != old.get(k) for k in ('city_metrics', 'districts', 'price_kind', 'units')):
            current.setdefault('revisions', []).append({k: deepcopy(v) for k, v in old.items() if k != 'revisions'})
        by_key[key] = current
    return [by_key[k] for k in sorted(by_key, key=lambda k: (k[1], k[0]))]
