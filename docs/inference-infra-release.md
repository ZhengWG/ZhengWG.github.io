# 推理 INFRA 方法论：博客发布记录

来源：[原始笔记固定版本](https://github.com/ZhengWG/notes/blob/b260dc65116a5453b70cac88eee0a5f2b56db12c/job_note/interview/2026/background/推理INFRA方法论-refactor.md)。源仓库 commit：`b260dc65116a5453b70cac88eee0a5f2b56db12c`；源文件 blob：`ffaefe5ee1944b6582df08ea40f81250677b8a12`。

按原文第 0–7 章拆为 8 篇。编排区间为 2026-01-01 至 2026-11-01，相邻间隔 43 或 44 天。全部日期均已到达，无需开启 Jekyll future 或等待后续定时构建。文章时间沿用站点 Asia/Shanghai 时区。

日期用于历史系列编排，不表示模型或实验资料在该日已经公开；每篇均注明实际整理日期 2026-11-01。原文推导、表格及实测条件保留，补充导读、收束段和系列导航；移除两处写作 TODO，不补造缺失实验。硬件规格、框架兼容性和测量值沿用原文口径，本次未做独立性能复测。

| 原文章节 | 编排日期 | 博客源文件 |
| --- | --- | --- |
| 第 0 章 | 2026-01-01 | [Roofline：用算力与带宽建立性能预算](../_posts/2026-01-01-推理INFRA方法论-00-roofline.md) |
| 第 1 章 | 2026-02-13 | [通信模型：从集合原语到跨机拓扑](../_posts/2026-02-13-推理INFRA方法论-01-communication.md) |
| 第 2 章 | 2026-03-29 | [分布式推理：TP、DP、EP、CP 与 PP 的取舍](../_posts/2026-03-29-推理INFRA方法论-02-parallelism.md) |
| 第 3 章 | 2026-05-11 | [推理硬件：GPU、NPU 与存储层级](../_posts/2026-05-11-推理INFRA方法论-03-hardware.md) |
| 第 4 章 | 2026-06-24 | [Attention 演变：从 GQA、MLA 到混合状态](../_posts/2026-06-24-推理INFRA方法论-04-attention.md) |
| 第 5 章 | 2026-08-06 | [MoE 推理：Batch、DeepEP、DeepGEMM 与负载均衡](../_posts/2026-08-06-推理INFRA方法论-05-moe.md) |
| 第 6 章 | 2026-09-19 | [PD 与 EPD：阶段分离、状态传输与资源配比](../_posts/2026-09-19-推理INFRA方法论-06-pd-epd.md) |
| 第 7 章 | 2026-11-01 | [核心优化：CUDA Graph、投机推理、Overlap 与量化](../_posts/2026-11-01-推理INFRA方法论-07-optimization.md) |

17 张原始图片已从相同 commit 迁入 `assets/img/inference-infra/`；正文图片采用站内路径，跨篇链接采用 `post_url`。通信篇开启现有 Mermaid 渲染支持，所有文章开启公式支持。

浏览器验收时将拓扑图改为站点 Mermaid 8 兼容语法。图片采用浏览器原生懒加载，绕过旧主题未命中的加载选择器；SVG 中移除了原文件附带的脚本，保留图形内容。
