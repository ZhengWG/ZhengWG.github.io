# 推理 INFRA 英文系列：Medium 发布记录

更新日期：2026-11-12（美国东部时间）。Medium 账号：[@zwg0606](https://medium.com/@zwg0606)。

采用仓库 `_i18n/en/` 中的 8 篇最新完整英文稿，正文开头放置对应博客英文原文地址和文章索引，并设置博客规范地址为 Medium canonical。博客外链带有 `utm_source=medium`。

18 张正文示意图已完成英文版（SVG + PNG），8 张封面原本全英文。为适配 Medium，宽表使用英文 PNG、较宽的比较表分面呈现。所有图片均经 Medium 本地上传，正文使用 Medium 托管图片，避免外链抓取失败。没有加入私密原始笔记链接。

## 当前状态

Medium 已正式发布 6 篇。最后 2 篇的全文、英文图片、原文地址和 canonical 均已保存，但平台拦截第 7 篇发布，提示作者过去 24 小时内的发文或定时发布数量已达上限；需要额度恢复后补发。草稿不计作已发布。

| 章节 | 文章 | 状态 | 链接 |
| --- | --- | --- | --- |
| 0 | Inference Infrastructure (0): Roofline: Performance Budgets from Compute and Bandwidth | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-0-roofline-performance-budgets-from-compute-and-bandwidth-e813896af05b) |
| 1 | Inference Infrastructure (1): Communication: From Collective Primitives to Cross-Node Topology | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-1-communication-from-collective-primitives-to-cross-node-topology-368552b77aad) |
| 2 | Inference Infrastructure (2): Distributed Inference: Choosing TP, DP, EP, CP, and PP | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-2-distributed-inference-choosing-tp-dp-ep-cp-and-pp-4b625e18af8f) |
| 3 | Inference Infrastructure (3): Inference Hardware: GPUs, NPUs, and the Memory Hierarchy | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-3-inference-hardware-gpus-npus-and-the-memory-hierarchy-fd98a0207cc5) |
| 4 | Inference Infrastructure (4): Attention: From GQA and MLA to Hybrid State | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-4-attention-from-gqa-and-mla-to-hybrid-state-96f474fec333) |
| 5 | Inference Infrastructure (5): MoE Inference: Batching, DeepEP, DeepGEMM, and Load Balancing | 已发布 | [查看](https://medium.com/@zwg0606/inference-infrastructure-5-moe-inference-batching-deepep-deepgemm-and-load-balancing-3477f446388f) |
| 6 | Inference Infrastructure (6): PD and EPD: Disaggregation, State Transfer, and Resource Allocation | 额度阻塞，完整待发稿 | [查看](https://medium.com/p/0f1124131a2a/edit) |
| 7 | Inference Infrastructure (7): Execution: CUDA Graph, Speculative Decoding, Overlap, and Quantization | 额度阻塞，完整待发稿 | [查看](https://medium.com/p/e1b9c0e31925/edit) |

## 后续更新

按已有文章 ID 更新，避免重复创建。已发布的 6 篇均已在公开页面核对：完整正文、图片数量、顶部原文链接、canonical 和系列导航存在。最后 2 篇已重新打开草稿，核对正文和 12 张图片完整保存。

本机忽略目录 `.local/syndication/medium-infra/` 保存导出 HTML、图片映射、发布元数据、Medium 图片托管地址和核验记录。后续补发优先打开上述草稿 ID，检查原文和封面后再正式发布，不要重新导入创建副本。
