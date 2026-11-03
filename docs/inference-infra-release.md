# 推理 INFRA 方法论：博客发布记录

全系列共 8 篇，编号 0–7。编排区间为 2026-01-01 至 2026-11-01，相邻间隔 43 或 44 天。全部日期均已到达，无需开启 Jekyll future 或等待后续定时构建。文章时间沿用站点 Asia/Shanghai 时区。

日期用于历史系列编排，不表示模型或实验资料在该日已经公开；每篇均注明实际整理日期 2026-11-01。推导、表格及实测条件保留，补充导读、收束段和系列导航；移除写作 TODO，不补造缺失实验。硬件规格、框架兼容性和测量值保留整理时口径，本次未做独立性能复测。

| 系列编号 | 编排日期 | 博客源文件 |
| --- | --- | --- |
| 第 0 章 | 2026-01-01 | [Roofline：用算力与带宽建立性能预算](../_posts/2026-01-01-推理INFRA方法论-00-roofline.md) |
| 第 1 章 | 2026-02-13 | [通信模型：从集合原语到跨机拓扑](../_posts/2026-02-13-推理INFRA方法论-01-communication.md) |
| 第 2 章 | 2026-03-29 | [分布式推理：TP、DP、EP、CP 与 PP 的取舍](../_posts/2026-03-29-推理INFRA方法论-02-parallelism.md) |
| 第 3 章 | 2026-05-11 | [推理硬件：GPU、NPU 与存储层级](../_posts/2026-05-11-推理INFRA方法论-03-hardware.md) |
| 第 4 章 | 2026-06-24 | [Attention 演变：从 GQA、MLA 到混合状态](../_posts/2026-06-24-推理INFRA方法论-04-attention.md) |
| 第 5 章 | 2026-08-06 | [MoE 推理：Batch、DeepEP、DeepGEMM 与负载均衡](../_posts/2026-08-06-推理INFRA方法论-05-moe.md) |
| 第 6 章 | 2026-09-19 | [PD 与 EPD：阶段分离、状态传输与资源配比](../_posts/2026-09-19-推理INFRA方法论-06-pd-epd.md) |
| 第 7 章 | 2026-11-01 | [核心优化：CUDA Graph、投机推理、Overlap 与量化](../_posts/2026-11-01-推理INFRA方法论-07-optimization.md) |

17 张配图已保存至 `assets/img/inference-infra/`；正文图片采用站内路径，跨篇链接采用 `post_url`。通信篇开启现有 Mermaid 渲染支持，所有文章开启公式支持。

浏览器验收时将拓扑图改为站点 Mermaid 8 兼容语法。图片采用浏览器原生懒加载，绕过旧主题未命中的加载选择器；SVG 中移除了附带的脚本，保留图形内容。

2026-11-03 为 8 篇文章补充统一图解封面，保存在 `assets/img/inference-infra/covers/`，通过文章 `image.src` 与 `image.alt` 接入现有主题。封面使用英文技术标签，图形为概念示意；正文与原 URL 保留。网页使用 WebP，原始 PNG 保留在本地生成目录。封面使用内置图像工具制作，[完整提示词](inference-infra-cover-prompts.json)用于后续延续风格。

同次提交保存 `.preview/lab/` 中已评审的双语 UI 预览源码；它尚未替换 Jekyll 正式页面。安装 `.preview/requirements.txt` 后运行 `python3 .preview/build-content.py`，再运行 `python3 -m http.server 4173 --bind 127.0.0.1 --directory .preview/lab` 即可查看。生成的文章数据、虚拟环境及截图不入库。预览与 8 篇文章的封面路径已验证；本机缺少 Jekyll gem，完整 Jekyll 构建尚未通过。
