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

> `assets/js/agents.js` 和 `aiinfra.js` 目前**不经过** gulp，直接以源码形式引用。

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

数据源与字段说明见 `tools/house_price/docs/`。

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
此时跳过提交，避免触发一次无意义的全站重建与 `gh-pages` 强推。

## 发布一篇文章

在 `_drafts/` 下写作，然后：

```bash
bash tools/build.sh        # 转换并移动到 _posts/，替换图片为图床链接
bash tools/build.sh -m     # 含公式的文章（需在 front matter 设置 mathjax: true）
```

Front matter 中 `mathjax: true` 会加载 MathJax 3，行内公式分隔符为 `$...$`。

## License

[MIT](LICENSE)（主题部分版权归 [Cotes Chung](https://github.com/cotes2020) 所有）。
