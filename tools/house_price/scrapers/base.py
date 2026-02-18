"""基础爬虫：封装请求、反爬、重试、缓存逻辑。"""

import hashlib
import json
import os
import random
import time
from datetime import datetime, timedelta
from typing import Optional

import requests

from config import CACHE_EXPIRE_HOURS, DATA_DIR

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


class BaseScraper:
    """所有爬虫的基类，提供缓存、重试、随机延时。"""

    def __init__(self, cache_subdir: str = "cache"):
        self.session = requests.Session()
        self.cache_dir = os.path.join(DATA_DIR, cache_subdir)
        os.makedirs(self.cache_dir, exist_ok=True)

    def _random_headers(self) -> dict:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
        }

    # -- 缓存 ---------------------------------------------------------------

    @staticmethod
    def _cache_key(url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    def _cache_path(self, url: str) -> str:
        return os.path.join(self.cache_dir, f"{self._cache_key(url)}.json")

    def _read_cache(self, url: str, expire_hours: int = CACHE_EXPIRE_HOURS) -> Optional[str]:
        path = self._cache_path(url)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                entry = json.load(f)
            cached_time = datetime.fromisoformat(entry["time"])
            if datetime.now() - cached_time > timedelta(hours=expire_hours):
                return None
            return entry["html"]
        except (json.JSONDecodeError, KeyError):
            return None

    def _write_cache(self, url: str, html: str) -> None:
        path = self._cache_path(url)
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"time": datetime.now().isoformat(), "url": url, "html": html}, f, ensure_ascii=False)

    # -- 请求 ---------------------------------------------------------------

    def _read_negative_cache(self, url: str) -> bool:
        path = self._cache_path(url) + ".404"
        if not os.path.exists(path):
            return False
        try:
            mtime = datetime.fromtimestamp(os.path.getmtime(path))
            return (datetime.now() - mtime) < timedelta(hours=CACHE_EXPIRE_HOURS)
        except OSError:
            return False

    def _write_negative_cache(self, url: str) -> None:
        path = self._cache_path(url) + ".404"
        with open(path, "w") as f:
            f.write(url)

    def fetch(self, url: str, max_retries: int = 3, expire_hours: int = CACHE_EXPIRE_HOURS) -> Optional[str]:
        """获取 URL 内容，优先读缓存，失败则重试。"""
        cached = self._read_cache(url, expire_hours=expire_hours)
        if cached is not None:
            return cached

        if self._read_negative_cache(url):
            return None

        for attempt in range(1, max_retries + 1):
            try:
                time.sleep(random.uniform(0.3, 1.0))
                resp = self.session.get(url, headers=self._random_headers(), timeout=15)
                if resp.status_code == 404:
                    self._write_negative_cache(url)
                    return None
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding
                html = resp.text
                self._write_cache(url, html)
                return html
            except requests.RequestException as exc:
                if attempt == max_retries:
                    print(f"[WARN] 请求失败 ({url}): {exc}")
                    return None
                time.sleep(1)
        return None
