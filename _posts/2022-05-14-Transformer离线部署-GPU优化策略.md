---
layout: post
title: Transformer离线部署-GPU优化策略
date: 2022-05-14 17:27:50.000000000 +09:00
categories: [算法部署]
tags: [NLP，模型部署]
---

- [前言](#sec-1)
- [模型结构分析](#sec-2)
- [具体优化措施](#sec-3)
- [参考资料](#sec-4)

# 前言<a id="sec-1"></a>

本文主要介绍Transformer类网络在GPU设备上部署上的优化要点。 主要围绕Nvidia开源的[FasterTransformer](https://github.com/NVIDIA/FasterTransformer)展开。

# 模型结构分析<a id="sec-2"></a>

标准的Transformer结构主要包括 `Encoder` 和 `Decoder` 两部分结构，具体结构分析可参考[Transformer在CV领域的应用与部署](https://johneyzheng.top//posts/Transformer%E5%9C%A8CV%E9%A2%86%E5%9F%9F%E7%9A%84%E5%BA%94%E7%94%A8%E4%B8%8E%E9%83%A8%E7%BD%B2/)：

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_161102.png)

Encoder对应算子结构为：

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_170052.png)

Decoder对应算子结构为：

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_170202.png)

可以发现：

Encoder/Decoder的基本结构还是一致的。其中主要算子（算力大头）为GEMM/Softmax算子；另外存在大量add bias/normalization操作（包含大量小算子）。从 `Encoder` 模型下面流水图中可以发现：大量的小算子会导致CPU侧的算子"Launch"时间变长，呈现“Launch Bound”的现象，无法完全发挥GPU的算力。 

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_171241.png)

# 具体优化措施<a id="sec-3"></a>

基于Transformer类网络的基本结构，当前NVIDIA做了一系列的优化。首先是算子融合层面，可以进行一系列的小算子融合：

1.  LayerNorm小算子融合：add bias + layernorm
2.  激活函数小算子融合：add bias + relu/gelu
3.  Softmax小算子融合：add bias + Softmax

另外核心算子层面：

1.  GEMM为主要耗时算子，cuBLAS着力进行了性能优化：QKV GEMM融合等/GEMM配置自动选择等
2.  采用了优化的Softmax算子：FP32/FP16实现不同

其他优化点：

1.  采用了half2数据类型，能够减少数据拷贝的空间
2.  指令层面：
    1.  \_expf替换expf运算：精度更低，但是性能更好（主要提速softmax？）
    2.  采用 `__shfl_xor_sync` 对 `reduce` 操作进行加速（Layernorm）

优化后的 `Encoder` 结构流水图如下，可见各算子之间基本不存在空隙，提高了GPU的利用率；同时对核心算子的优化也大大提升了模型性能。

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_171254.png)

# 参考资料<a id="sec-4"></a>

[FasterTransformer Presentation-YouTube](https://www.youtube.com/watch?v=MDqNwSTLimU)
