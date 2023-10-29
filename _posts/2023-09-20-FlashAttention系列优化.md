---
layout: post
title: FlashAttention系列优化
date: 2023-09-20 22:30:50.000000000 +09:00
categories: [算法部署]
tags: [模型部署]
---

- [前言](#sec-1)
- [FlashAttentionV1](#sec-2)
  - [前置背景](#sec-2-1)
  - [算法设计](#sec-2-2)
- [FlashAttentionV2](#sec-3)
- [PagedAttention](#sec-4)
- [参考材料](#sec-5)

# 前言<a id="sec-1"></a>

简单介绍各类AttentionScore优化算法（待完整梳理）。

# FlashAttentionV1<a id="sec-2"></a>

[FlashAttention](https://arxiv.org/pdf/2205.14135.pdf)于2022年6月由斯坦福大学、纽约州立大学研究者完成。 FlashAttention的核心思路是：通过重组Attention计算，能够对输入块进行分块，逐步执行softmax的reduction，避免了整个输入块的计算，从而减少了更少的内存访问（HBM），同时中间结果不需要输出都HBM。 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_220026.png)

## 前置背景<a id="sec-2-1"></a>

由于计算机多级缓存的设计：SRAM，HBM，DRAM的带宽逐渐变小，容量逐渐变大。 原始AttentionScore的IO复杂度为ΩN\*d+N^2)HBM访问，其中d为head维度，N和batch相关。

## 算法设计<a id="sec-2-2"></a>

FlashAttention的算法流程如下： ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_220113.png)

FlashAttention仅需要O(N^2d^2^M-1)HBM访问，其中M为SRAM大小（决定分块大小）。

# FlashAttentionV2<a id="sec-3"></a>

[FlashAttentionV2](https://arxiv.org/pdf/2307.08691.pdf)于2023年7月提出，其核心贡献点在于：

-   减少non-matmul FLOPS操作：原始softmax计算需要减去最大值，但是会增加x的遍历次数，v2去除了这部分操作，而是在局部块中进行弥补计算，且消除了rescale计算： ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_221922.png)

-   实现了序列长度上的并行，即对于单head长seq下也能实现良好的并行：FlashAttention算法有两个循环，K，V在外循环j，Q，O在内循环i。FlashAttention-2将Q移到了外循环i，K，V移到了内循环j，由于改进了算法使得warps之间不再需要相互通信去处理Q_i，所以外循环可以放在不同的thread block上。
-   GPU优化：同一个attention计算块内，将工作分配在单个thread block的不同warp上，能够坚守通信和共享内存。

Formad pass伪代码如下： ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_222337.png)

# PagedAttention<a id="sec-4"></a>

[PagedAttention](https://arxiv.org/abs/2309.06180)由vLLM提出，其核心在于它允许在非连续空间内存储连续的KV张量，具体来说：PagedAttention能够把每个序列的KV缓存进行分块，每个块包含固定长度的token，且在计算attention时可以高效地找到并获取对应内存块。

设计上，参考虚拟内存和分页的思想：每个固定长度的块可以看成虚拟内存中的页，token可以看成字节，序列可以看成进程。那么通过一个块表就可以将连续的逻辑块映射到非连续的物理块，而物理块可以根据新生成的token按需分配。

PagedAttention能够进行高效的内存共享：在并行采样的时候，一个prompt需要生成多个输出序列。这种情况下，对于这个prompt的计算和内存可以在输出序列之间共享。

通过块表可以自然地实现内存共享。类似进程之间共享物理页，在PagedAttention中的不同序列通过将逻辑块映射到一样的物理块上可以实现共享块。为了确保安全共享，PagedAttention跟踪物理块的引用计数，并实现了Copy-on-Write机制。 内存共享减少了55%内存使用量，大大降低了采样算法的内存开销，同时提升了高达2.2倍的吞吐量。

# 参考材料<a id="sec-5"></a>

[FlashAttention:加速计算,节省显存, IO感知的精确注意力](https://zhuanlan.zhihu.com/p/639228219)

[FlashAttention2详解（性能比FlashAttention提升200%）](https://zhuanlan.zhihu.com/p/645376942)

[vLLM框架原理——PagedAttention](https://zhuanlan.zhihu.com/p/649537608)
