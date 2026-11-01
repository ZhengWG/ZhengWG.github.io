# 推理 INFRA 系列：多平台同步方案

调研日期：2026-11-01。本文仅记录可行路径，尚未安装同步工具或登录账号执行平台发布。

## 推荐内容形态

| 渠道 | 建议发布内容 | 需要适配 |
| --- | --- | --- |
| 个人博客 | 8 篇完整正文，作为统一维护的来源 | 保留 Jekyll、系列导航与站内图片 |
| 知乎 | 每章一篇完整技术文章，开头明确要解决的问题 | 转换富文本，核对公式、代码、表格和图片 |
| CSDN | 每章一篇完整技术文章，突出推导和工程案例 | 导出普通 Markdown，核对图片、公式与代码块 |
| 小红书 | 每章提炼一个问题，制作摘要与图解；也可试验长文 | 将宽表拆成卡片，公式与图示优先转为清晰图片 |

后面三列是针对本系列的编辑建议，不代表平台的固定限制或实测兼容性结论。

## 同步工具候选：Wechatsync

[项目 README](https://github.com/wechatsync/Wechatsync) 列出知乎、CSDN 和小红书适配器，提供 Chrome 扩展、CLI 与 MCP。项目说明其使用本机浏览器已有登录态，图片可自动转存，默认同步到草稿。它属于第三方工具，使用网页编辑器接口；不能据此视为三家平台向个人开放了稳定的公共发布 API。

[CLI 文档](https://github.com/wechatsync/Wechatsync/blob/v2/packages/cli/README.md) 给出的起步方式如下。以下仅为操作示例，本次未执行安装或同步。

```bash
npm install -g @wechatsync/cli
wechatsync platforms --auth
wechatsync sync article.md --dry-run
wechatsync sync article.md -p zhihu,csdn
```

使用前需安装其 Chrome 扩展，并在浏览器中登录目标平台。先以一篇含图片、表格和代码的文章做草稿试验，读取返回的草稿链接后检查实际效果，再处理剩余文章。小红书的长文路径与账号可用功能要单独验证；不要把“支持平台”理解成所有 Markdown 元素均可无损转换。

## 从当前博客导出时的转换

1. 解析 front matter，将 title 用作平台标题，正文去掉 YAML。
2. 把 Liquid `post_url` 转成博客的绝对 URL，删除当前站点专用模板语法。
3. 本地图片随导出包提供，或转为已上线博客的绝对 URL；实际提交时核对平台转存结果。
4. SVG 和 Mermaid 预先渲染为 PNG，避免依赖目标平台执行脚本或支持 SVG。
5. 保留来源与实验条件；检查宽表、长代码和数学表达，必要时拆表或转图。
6. 每篇记录源文件、内容哈希、目标平台、草稿/文章 ID、URL、状态与同步时间；后续更新优先按既有 ID 处理，避免生成重复文章。能否原位更新要逐平台验证。

历史编排日期只用于自有博客。跨平台文章使用实际提交日期，保留系列编号和整理日期，不预设平台允许倒填发布日期。

## 备选路径

知乎可单独评估 [zhihu-article-publisher-skill](https://github.com/Linwei-Chen/zhihu-article-publisher-skill)，其作者说明支持 Markdown、本地图片上传和 LaTeX 转换。小红书可通过[创作服务平台](https://creator.xiaohongshu.com/)手动或浏览器辅助发布；是否有“写长文”入口、格式和长度限制，以当前账号界面为准。

建议先打通知乎和 CSDN 的完整文章草稿，再建立小红书摘要和卡片的独立稿件。外部平台发布还未执行。
