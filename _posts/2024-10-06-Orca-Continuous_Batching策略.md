---
layout: post
title: Orca-Continuous Batching策略
date: 2024-10-06 19:25:50.000000000 +09:00
categories: [算法篇]
tags: [LLMs]
mathjax: true
---

#### Orca-Continuous Batching策略

**Paper**

[Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/system/files/osdi22-yu.pdf)

 LLM推理主要氛围Prefill/Decode阶段，其中Prefill阶段为Compute Bound，Decode阶段为Memory-IO Bound，意味着需要充分利用显存的数据带宽。但是由于显存的限制，如A100-40GB而言，以13B模型为例，权重为26GB，其消耗单个Token的显存约为1MB（激活值/Cache等），则当Seq长度为2048时，仅能支持7 batch的推理，此时算力利用率很低。为了提高算力利用率，一方面可以通过量化手段减小显存，也可以通过优化FlashAttention等算子实现减少Memory-IO，另一方面也可以从Schedule层面通过Continuous Batching手段来提高Batching效率。

**Motivation**

传统的 `static batching` 如下： ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-10-06-Orca-Continuous_Batching%25E7%25AD%2596%25E7%2595%25A5/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_010738.png)

显然，由于不同batch的out_token数目不一致，1，3，4batch存在empty slots，意味着一段时间内，只有batch 2单batch在计算。`Continuous batching`采用来`iteration-level`的调度策略： 

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-10-06-Orca-Continuous_Batching%25E7%25AD%2596%25E7%2595%25A5/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_011245.png)

**KeyPoints**

`ORCA`的核心思路在于`iteration-level scheduling`和`selective batching`。

+ `iteration-level scheduling`：通过在每一次iteration中，动态调整任务执行顺序。可以通过任务优先级情况、微批次流水来提高硬件利用率。

  ![image-20241222210524196](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-10-06-Orca-Continuous_Batching%25E7%25AD%2596%25E7%2595%25A5/image-20241222210524196.png){: .img-small }

+ `selective batching`: 模型输入的shape为$[B,L,H]$，`non-Attention`算子，如矩阵乘、`LayerNorm`等算子支持$B \times H$合并，但是`Attention`算子需要分离$B，L$两维。`selective batching`通过`Attention`前后`Split/Merge`的方式来进行维度处理，从而支持ORCA的动态Batching。

  ![image-20241222205732164](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-10-06-Orca-Continuous_Batching%25E7%25AD%2596%25E7%2595%25A5/image-20241222205732164.png){: .img-small }

**Statistics**

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-10-06-Orca-Continuous_Batching%25E7%25AD%2596%25E7%2595%25A5/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_011550.png)

