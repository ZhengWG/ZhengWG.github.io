# 远程接口返回数据样例

当前项目只请求 **聚汇 (fangjia.gotohui.com)**，返回的是 **HTML 页面**，没有 JSON API。爬虫从 HTML 里解析表格得到结构化数据。下面按「请求 → 原始片段 → 解析后结构」整理。

---

## 1. 聚汇：区级页 / 城市页（HTML）

- **请求**：`GET https://fangjia.gotohui.com/fjdata-{id}`  
  例如杭州 `37`、西湖区 `3321`、临安区 `3328`。
- **返回**：整页 HTML（我们缓存在 `data/gotohui/<md5>.json` 的 `html` 字段里）。

### 1.1 区级页侧栏「小区」表（fjdata-3328 等）

HTML 中类似（临安区侧栏）：

```html
<table class="table table-striped ablue">
  <thead><tr>
    <th>小区</th><th>单价(元/㎡)</th><th>环比</th>
  </tr></thead>
  <tbody>
    <tr>
      <td><a href="...">石镜街555号</a></td>
      <td>9877.00</td>
      <td class="tcenter red">+0.51%</td>
    </tr>
    <tr>
      <td><a href="...">状元府</a></td>
      <td>25162.00</td>
      <td class="tcenter red">+1.93%</td>
    </tr>
    <!-- 约 10 条 -->
  </tbody>
</table>
```

**解析后（供程序使用）**：

```json
[
  { "community": "石镜街555号", "price": 9877.0, "mom_pct": 0.51 },
  { "community": "状元府", "price": 25162.0, "mom_pct": 1.93 }
]
```

---

### 1.2 小区列表页（house-{id}）分页表格

- **请求**：`GET https://fangjia.gotohui.com/house-3321`、`/house-3321/2.html` …
- **返回**：HTML，正文里有一张「选择 | 区域 | 小区 | 单价(元/㎡) | 环比」表，每页约 20 条。

HTML 片段示例（西湖区 house-3321）：

```html
<table>
  <tr><th>选择</th><th>区域</th><th>小区</th><th>单价(元/㎡)</th><th>环比</th></tr>
  <tr><td>...</td><td>西湖区</td><td><a href="...">西溪路24号</a></td><td>54796.00</td><td>+2.62%</td></tr>
  <tr><td>...</td><td>西湖区</td><td><a href="...">丹金桂花园</a></td><td>42409.00</td><td>-1.83%</td></tr>
  <!-- 每页约 20 条，分页 2.html, 3.html ... -->
</table>
```

**解析后（与上面格式一致）**：

```json
[
  { "community": "西溪路24号", "price": 54796.0, "mom_pct": 2.62 },
  { "community": "丹金桂花园", "price": 42409.0, "mom_pct": -1.83 }
]
```

多页合并、去重后得到该区「小区列表 + 单价 + 环比」，用于导出和板块聚合。

**位置信息说明**：聚汇列表表只有「区域（区名）+ 小区名 + 单价 + 环比」，**没有街道、板块等更细位置字段**。小区详情页（info-xxx.html）可能含地址/街道，但需逐条请求，成本高。若要用「区域/街道」辅助定位板块，建议：
- 使用本项目支持的 **小区 → 板块 映射文件**（见下）做精确归属；
- 或从贝壳等带「板块」维度的数据源整理出映射后写入该文件。

---

### 1.3 城市页侧栏「区域」表（fjdata-37 杭州）

HTML 片段：

```html
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
```

**解析后**：

```json
[
  { "district": "西湖区", "price": 42916, "yoy": -0.18, "gotohui_id": 3321 },
  { "district": "滨江区", "price": 40722, "yoy": -9.36, "gotohui_id": 3327 }
]
```

---

### 1.4 区级/年度「历史均价」表（fjdata-{id} 或 years/{id}/{year}/）

HTML 片段（月度走势表）：

```html
<table class="ntable">
  <tr><th>序号</th><th>日期</th><th>二手房(元/㎡)</th><th>新房(元/㎡)</th></tr>
  <tr><td>1</td><td>2025-12</td><td>12759</td><td>18532</td></tr>
  <tr><td>2</td><td>2025-11</td><td>13153</td><td>19536</td></tr>
</table>
```

**解析后**：

```json
[
  { "date": "2025-12", "second_hand_price": 12759.0, "new_house_price": 18532.0 },
  { "date": "2025-11", "second_hand_price": 13153.0, "new_house_price": 19536.0 }
]
```

---

## 2. 本地缓存文件结构（聚汇）

`data/gotohui/<md5>.json` 存的是请求结果，不是接口「原始响应体」，格式为：

```json
{
  "time": "2026-02-20T16:03:20.711069",
  "url": "https://fangjia.gotohui.com/fjdata-3328",
  "html": "<!DOCTYPE html>..."
}
```

即：**远程返回 = 一整段 HTML**，上面 1.1～1.4 的 JSON 都是我们在代码里从这段 HTML 中解析出来的。

---

## 3. 导出后的最终数据（hz.json 片段）

导出脚本把解析结果 + 板块聚合写进 `assets/data/house_price/hz.json`，结构示例：

```json
{
  "city": "杭州",
  "city_key": "hz",
  "updated_at": "2026-02-20",
  "city_history": [
    { "date": "2018-01", "second_hand_price": 29198.0, "new_house_price": null }
  ],
  "district_list": [
    { "district": "西湖区", "price": 42916, "yoy": -0.18 }
  ],
  "districts": {
    "xihu": {
      "name": "西湖区",
      "history": [
        { "date": "2018-06", "second_hand_price": 42663.0, "new_house_price": 1.0 }
      ],
      "communities": [
        { "community": "西溪路24号", "price": 54796.0, "mom_pct": 2.62 }
      ],
      "sub_districts": {
        "xixi": { "name": "西溪", "history": [], "price": 67038, "yoy": 1.44 }
      }
    }
  }
}
```

---

## 3.1 本地配置：小区 → 板块映射（可选）

若需用「区域/街道」辅助定位板块，聚汇列表无该字段，可维护 `data/community_to_sub_district.json`，格式：

```json
{
  "hz": {
    "xihu": {
      "西溪路24号": "西溪",
      "丹金桂花园": "黄龙"
    }
  }
}
```

键为 config 中的 `city_key`、`district_key`，内层为「小区名 → 板块名」。导出时优先用此表归属板块，未列出的再用 `sub_district_keywords.json` 关键词匹配。

---

## 4. 贝壳 / 其他（当前未用）

- **贝壳开放平台**：若接入，一般为 **JSON API**（需 token），返回格式以官方文档为准。
- **云房数据**：JSON，小区接口返回示例见其文档，例如含 `unitPrice`、`ratioByLastYearForPrice` 等。

当前项目**没有**保存贝壳/云房等远程接口的返回样例，因为尚未真正调用。聚汇的「原始返回」就是上述 HTML；你看到的「数据样例」= 从这些 HTML 解析出的表格数据 + 导出脚本产出的 `hz.json`。
