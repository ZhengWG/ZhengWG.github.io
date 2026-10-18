# johneyzheng.top

Source for [johneyzheng.top](https://johneyzheng.top) — Johney Zheng 的个人博客。

基于 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) v4.0.2 主题，在其之上增加了一个
交互式数据分析页面（`/agents/`）和配套的 Python 数据管线。

## 结构

```
_posts/                    文章（Markdown）
_tabs/                     侧边栏页面：about / archives / categories / tags / agents
_layouts/  _includes/  _sass/    Chirpy 主题模板与样式
_javascript/               主题 JS 源码 → gulp → assets/js/dist/*.min.js
_plugins/                  posts-lastmod-hook.rb（用 git 历史生成 lastmod）

assets/js/agents.js        /agents/ 页面：house_price_analyzer
assets/js/house-chat.js    多轮对话、流式响应和本地数据查询工具
assets/js/aiinfra.js       /agents/ 页面：ai_tracker
assets/data/house_price/   数据产物（由 CI 每日刷新）

tools/house_price/         房价数据抓取 → JSON 导出
tools/scripts/             图片压缩 / 上传辅助脚本
tools/build.sh             _drafts → _posts 的发布脚本（含图床链接替换）
tools/test.sh              html-proofer 检查
tools/deploy.sh            推送 _site 到 gh-pages（仅在 CI 中运行）
```

## 本地开发

macOS 自带的 Ruby 2.6 跑不了 Jekyll 4，需要单独装一个（3.1 与 `Gemfile.lock`
里锁定的 gem 版本兼容性最好），并加入 PATH：

```bash
brew install ruby@3.1
export PATH="/opt/homebrew/opt/ruby@3.1/bin:$PATH"   # 建议写进 ~/.zshrc
```

```bash
bundle config set --local path vendor/bundle
bundle install
bash tools/run.sh          # jekyll serve, http://localhost:4000
bash tools/test.sh --build # 构建 + html-proofer
```

主题 JS 改动后需要重新构建产物：

```bash
npm install
npx gulp build             # _javascript/ → assets/js/dist/
```

> `assets/js/agents.js`、`house-chat.js` 和 `aiinfra.js` 目前**不经过** gulp，直接以源码形式引用。

## 数据管线

`tools/house_price/` 抓取城市房价（当前仅杭州 `hz`），导出为
`assets/data/house_price/<city>.json`，供 `/agents/` 页面在浏览器端读取。

```bash
cd tools/house_price
pip install -r requirements.txt
python export_data.py -o ../../assets/data/house_price -c hz
python validate_export.py --new ../../assets/data/house_price/hz.json \
                          --prev <上一版 json>
```

数据源与字段说明见 `tools/house_price/docs/DATA_SOURCES.md`。聚汇小区入口失效时会保留旧值并标注采集降级；房天下是限页抽样，验证码导致的失败不会算成功。统计局住宅价格指数单独保存，不与均价混用。

房价对话支持自由提问、连续追问、停止生成和新会话。浏览器按模型的工具请求查询当前 JSON（区域历史、小区筛选、来源状态），并传回带来源和日期的结果。完整旧轮次会按上下文预算裁剪，界面会提示。会话仅保留在当前页面，API Key 延续原有的浏览器本地配置。

默认模型为 `deepseek-flash`，显式关闭思考模式以缩短交互等待。旧配置 `deepseek-chat` / `deepseek-reasoner` 自动映射到默认模型，其他模型配置保留。旧模型名已于 2026-07-24 停用，参见 [DeepSeek 官方公告](https://api-docs.deepseek.com/news/news260424/)；参数依据[思考模式文档](https://api-docs.deepseek.com/zh-cn/guides/thinking_mode/)。

```bash
npm test                     # 对话、流式解析、查询工具
npm run test:house-data       # 来源解析、旧值保留、多源与新鲜度
```

### 校验

`validate_export.py` 有两道闸：

1. **绝对下限** — 区县数、城市历史行数、小区数不能为空或过少，拦截完全失败的抓取。
2. **相对回归** — 任一指标相比已提交的版本下跌超过 10% 即判失败，拦截**部分**抓取失败。
   第二道闸是因为 2026-08-02 曾发生小区数从 5951 掉到 4112（-31%）却仍被发布的事故。

## CI

| Workflow | 触发 | 作用 |
|---|---|---|
| `refresh-data.yml` | 每日 00:00 UTC / 手动 | 抓数 → 校验 → **仅在内容真正变化时**提交 |
| `pages-deploy.yml` | push to master / 上游 workflow 成功 | Jekyll 构建 → html-proofer → 部署 gh-pages |

`refresh-data.yml` 会忽略 `updated_at` 字段做比对：多数情况下抓取结果与前一天完全一致，
此时跳过数据提交。采集状态变化或成功采集日期变化仍会发布；采集降级会写入 Actions Summary。

## 发布一篇文章

在 `_drafts/` 下写作，然后：

```bash
bash tools/build.sh        # 转换并移动到 _posts/，替换图片为图床链接
bash tools/build.sh -m     # 含公式的文章（需在 front matter 设置 mathjax: true）
```

Front matter 中 `mathjax: true` 会加载 MathJax 3，行内公式分隔符为 `$...$`。

## License

[MIT](LICENSE)（主题部分版权归 [Cotes Chung](https://github.com/cotes2020) 所有）。
