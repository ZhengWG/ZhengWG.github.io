# 跨平台文章默认规则

适用平台：知乎、CSDN、稀土掘金。

每篇同步文章默认在正文最前面、标题之后放置博客首页、全部文章索引和对应原文链接：

```markdown
博客：[Johney Zheng 的博客](https://johneyzheng.top/) · [全部文章索引](https://johneyzheng.top/archives/) · [本文原文](对应文章的公开博客网址)

---
```

小红书使用独立摘要图文，在描述最前面保留对应的公开原文网址。禁止加入私密笔记、原始笔记仓库及其提交链接。

对外分发的博客链接统一添加 `utm_source`（`zhihu` / `csdn` / `juejin` / `xiaohongshu`）、
`utm_medium=referral`、`utm_campaign=technical_notes`，以及标识对应文章的 `utm_content`（稳定的文章 slug）。
同一文章的首页、索引和原文链接使用相同参数；保留原链接其他参数及锚点，站内导航不加 UTM。
知乎示例：`https://johneyzheng.top/posts/推理INFRA方法论-00-roofline/?utm_source=zhihu&utm_medium=referral&utm_campaign=technical_notes&utm_content=infra-00-roofline`。

发布或修改已有文章前先检查平台记录，按已有文章 ID 更新，避免重复创建。草稿、已提交审核、已发布和平台限额待发布必须分别记录；不能把保存草稿视为正式发布。

用户已明确要求：本次 8 篇推理 INFRA 系列同步四个平台，并向稀土掘金、小红书补发博客历史文章。知乎、CSDN 历史文章先核对已有记录，避免重复提交。

本系列的实验结果直接使用「实测」表述，不写设备型号代称；需要区分配置时使用容量、带宽等技术条件。公开文档中的设备型号、规格与开源拓扑可以保留，并链接实际采用的公开来源；不将这些型号与工作实验环境关联。不使用指向具体工作环境的措辞。删除型号和环境称谓不代表实验数据已完成保密审查。


## Medium 英文版

Medium 使用完整英文稿，正文开头保留对应博客英文原文链接和文章索引；外链采用 `utm_source=medium` 和上述一致的归因参数，canonical 使用对应博客文章的规范地址。中文图解使用审核后的英文版，封面可复用博客已有英文封面。数据表需要适配 Medium 排版，避免普通 Markdown 表格粘贴后错位。按文章 ID 更新，发布成功、草稿和平台额度阻塞分别记录；见 [Medium 发布记录](inference-infra-medium.md)。
