# 房价数据源与采集状态

## 已接入的来源

| 来源 | 数据 | 限制 |
| --- | --- | --- |
| 聚汇 | 城市/区县月度均价、小区历史快照 | 2026-10-18 检查时 `house-{id}` 小区入口失效。沿用旧记录并标记 `stale`，不代表重新抓取成功。 |
| 房天下公开小区列表 | 参考挂牌价、板块、地址、建成年份、平台在售数量 | 默认每区最多 5 页，属于按网站排序的样本。页面可能返回验证码，此时停止并记录失败，不绕过验证。页面未给统计月份，`observed_month` 保持空值。 |
| 国家统计局 | 70 城新房/二手住宅环比、同比价格指数 | 从官方数据发布列表发现最新月报，单独写入 `price_indices`。指数不是元/㎡均价，不拼接到聚汇价格序列。 |
| 本地 JSON | 有来源的人工/公开页面快照、授权数据导入 | 不证明自动采集成功；应携带统计月份、来源链接与采集日期。 |

贝壳适配器尚未实现，不会因为设置了 Appkey 就显示“已接入”，导出过程也不调用其占位接口。后续使用云房/贝壳服务，需要先确认实际产品权限、杭州样本覆盖、统计口径及额度，再实现对应适配器。

参考文档：

- 房天下公开列表：https://hz.esf.fang.com/housing/
- 国家统计局发布列表：https://www.stats.gov.cn/sj/zxfb/
- 云房基础信息：https://www.yunfangdata.com/dataapi/api_031.html
- 贝壳接入教程：https://open.ke.com/serviceSupport/tutorialApi/

## 抓取与验证

```bash
python tools/house_price/export_data.py -c hz \
  --prev assets/data/house_price/hz.json \
  -o /tmp/house-price-preview --fang-pages 5
python tools/house_price/validate_export.py \
  --new /tmp/house-price-preview/hz.json --prev assets/data/house_price/hz.json
```

`--fang-pages 0` 关闭本次房天下采集。适配器顺序请求、限制页数，并检测重复页和空/验证页面。不要为了追求数量忽略这些失败信号。

CI 在发布前运行解析及数据质量测试。绝对数量/相对回归校验仍可阻止坏数据发布；来源采集失败则生成 warning 和按区、按来源的状态表，允许已取得的历史数据或其他来源继续发布。数量校验成功并不代表来源完整或新鲜。

## Schema 3：把价格时间和采集时间分开

小区报价按 `(source, source_id)` 标识；没有来源 ID 时使用 `(source, community)`。不同来源的同名小区分别保存，避免把不同口径覆盖成一个数字。界面以“报价条数”计数，不将跨来源同名记录当作不同房源。

小区字段：

- `source` / `source_id` / `source_url`：来源和来源内标识。
- `price_kind`：例如 `reference_listing`，不表示成交价。
- `observed_month`：数据所属月份；未知时为 null，不能用当天日期补齐。
- `fetched_at`：实际取得该报价的日期；旧格式记录未知时保持缺失。
- `stale`：本次未重新取得或补充记录未核验，不改变原始采集日期。
- `sub_district` / `built_year` / `listing_count`：来源提供的附加字段；平台在售数不代表全市场供给。
- `observations`：仅当来源明确提供数据月份时积累该来源月度观测；重复抓取同一月份不制造新的价格历史。

`districts.*.community_sources` 分别记录每个自动来源的 `status`、`complete`、`fetched_count`、`carried_count`、`last_attempt_at`、`last_success_at`、`reason`。全区和全市汇总分别位于 `community_status`、`meta.quality`。部分成功时保留缺页对应的旧记录，不把合并后的总数当作本次抓取数。

`updated_at` 表示数据文件发布日期。仅发布日期和检查时间变化时不提交；来源状态变化、成功采集日期变化或实际内容变化会发布。

## 板块映射与估算

公开映射放在可提交的 `mappings/`，不能放在被忽略的缓存目录 `data/`：

- `mappings/community_to_sub_district.json`：可选的精确映射，按城市、区、小区名组织。
- `mappings/sub_district_keywords.json`：保守的名称关键词推断；未命中不强行归类。

有房天下明确板块字段的区，优先使用其样本，并保留来源板块；否则使用聚汇快照与映射。一个板块估算不混合不同来源的均价。结果标记 `estimated`、`sample_count`、`source`、`stale`。样本均值不是全量板块均价，名称匹配也不是地理校验。

环比与同比使用不同字段。不同统计期的小区环比不再求平均后写入同比；板块没有可比历史时不输出涨跌。

## 导入补充数据

可提交的文件：`providers/{city_key}.json`；仅本机使用的覆盖：`data/providers/{city_key}.json`。后者优先且已被忽略。参考 `provider.example.json`。

本次 `providers/hz.json` 保存了 2026-10-18 实际读取的房天下公开首页 19 条有价格记录；它是静态样本，不是完整杭州小区库，也不作为自动采集成功的证据。后续存在更新的同来源记录时，旧快照不会覆盖它。

城市/区域月度补充仍按日期合并非空字段；这类手工补充必须保持价格口径一致。小区补充保留来源分别展示。微信公众号或小程序月报可以人工摘录后补入，当前不实现登录态采集。
