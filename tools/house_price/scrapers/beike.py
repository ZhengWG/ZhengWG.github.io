"""贝壳找房：板块级均价（可选数据源）。

聚汇无板块层级，可用贝壳的「区 → 板块(bizcircle) → 小区」数据按板块聚合得到均价。
凭证从环境变量读取：BEIKE_APPKEY、BEIKE_APPSECRET（建议放在 tools/house_price/.env，勿提交）。

返回格式：list of {"sub_district_name": "之江", "price": 45000, "yoy": -1.2}
与 config 中 sub_districts 的 name 对齐后写入 export 的 sub_districts[].price / yoy。
"""

import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

from config import CITIES

# 杭州贝壳域名（网页）
BEIKE_BASE = "https://hz.ke.com"
# Token 接口（以开放平台技术文档为准，可设环境变量 BEIKE_TOKEN_URL 覆盖）
BEIKE_TOKEN_URL = os.environ.get(
    "BEIKE_TOKEN_URL",
    "https://open.ke.com/api/oauth/access_token",
)


def _get_credentials() -> Tuple[str, str]:
    """从环境变量读取 Appkey / AppSecret。"""
    key = (os.environ.get("BEIKE_APPKEY") or "").strip()
    secret = (os.environ.get("BEIKE_APPSECRET") or "").strip()
    return key, secret


def _get_access_token() -> Optional[str]:
    """用 Appkey + AppSecret 换取 access_token。"""
    appkey, appsecret = _get_credentials()
    if not appkey or not appsecret:
        return None
    url = os.environ.get("BEIKE_TOKEN_URL") or BEIKE_TOKEN_URL
    try:
        # 常见形式：POST，body 为 appkey/app_secret 或 app_key/app_secret
        resp = requests.post(
            url,
            json={"appkey": appkey, "app_secret": appsecret},
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        if resp.status_code != 200:
            resp = requests.post(
                url,
                data={"app_key": appkey, "app_secret": appsecret},
                timeout=10,
            )
        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        token = data.get("access_token") or data.get("data", {}).get("access_token") or data.get("token")
        return token
    except Exception:
        return None


def get_sub_district_prices(
    city_key: str,
    district_key: str,
) -> List[Dict[str, Any]]:
    """获取该区下各板块的当前均价（及同比可选）。

    返回列表，每项至少含 sub_district_name（与 config 中 name 一致）、price；
    yoy 可选。若未配置凭证或请求失败，返回 []。
    """
    if city_key not in CITIES:
        return []
    city = CITIES[city_key]
    districts = city.get("districts") or {}
    if district_key not in districts:
        return []
    district = districts[district_key]
    district_name = district.get("name", "")
    beike_domain = city.get("beike_domain") or "hz"

    out = _fetch_beike_bizcircle_prices(beike_domain, district_name, district_key)
    return out


def _fetch_beike_bizcircle_prices(
    domain: str,
    district_name: str,
    district_key: str,
) -> List[Dict[str, Any]]:
    """从贝壳获取该区各板块均价。

    若已配置 BEIKE_APPKEY / BEIKE_APPSECRET，先取 token，再调用开放平台小区/列表类接口
    （具体接口以开放平台技术文档为准），按板块聚合得到均价。
    未配置或接口未实现时返回 []。
    """
    token = _get_access_token()
    if not token:
        return []

    # TODO: 调用贝壳开放平台「小区列表」或「板块/区域」相关接口，按 district_name 或
    # district_key 筛选，解析每板块(bizcircle)下小区均价后求平均，填充 sub_district_name / price / yoy。
    # 请求时在 header 中加：access_token: <token>
    # 请求间隔建议 >= 3 秒，避免限流。
    time.sleep(3)
    return []
