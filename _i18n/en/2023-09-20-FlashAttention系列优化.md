---
title: "The FlashAttention Family of Optimizations"
description: "Introduces FlashAttention V1, V2, and V3 and PagedAttention as optimizations for attention score computation, covering online softmax, tiling, parallelism, FP8, and paged KV cache memory management."
---

# Preface<a id="sec-1"></a>

A brief introduction to the various optimization algorithms for attention score computation.

# FlashAttentionV1<a id="sec-2"></a>

[FlashAttention](https://arxiv.org/pdf/2205.14135.pdf) was developed in June 2022 by researchers at Stanford University and the State University of New York. Its core idea is to restructure the attention computation so that the input can be split into blocks and the softmax reduction is performed incrementally. This avoids computing over the whole input at once, so there are fewer memory accesses (HBM), and intermediate results do not need to be written out to HBM. 

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_220026.png)

## Background<a id="sec-2-1"></a>

Because of the multi-level cache design of computers, SRAM, HBM, and DRAM have progressively lower bandwidth and larger capacity. The I/O complexity of the original attention score computation is $Ω(N \times d+N^2)$ HBM accesses, where $d$ is the head dimension and N is related to the batch.

## Algorithm Design<a id="sec-2-2"></a>

The core of FlashAttention is `Online-Softmax` plus tiled computation. By reordering the attention computation and using two extra statistics to compute block by block, it avoids materializing the full $N \times N$ attention matrices $P,S$, which reduces the number of HBM accesses.

`Online-Softmax` improves on `Safe-Softmax`. The formula for `Safe-Softmax` is:

$$y_i=\frac {e^{x_{i}-\mathop{\text {max}} \limits_ {k=1} ^{V} x_k}} {\sum \limits_ {j=1}^{V}e^{x_j-\mathop{\text {max}} \limits_ {k=1} ^{V} x_k}}$$

`Online-Softmax` updates $y_i$ iteratively:

$$d_S=d_{S-1} \times e^{m_{S-1}-m_S}+e^{x_S-m_S}$$

Here $d_j$ and $m_j$ must be stored as intermediate variables, and the final pseudocode is as follows:

```text
1: m_0 <- -inf
2: d_0 <- 0
3: for j <- 1..V do
4:     m_j <- max(m_{j-1}, x_j)
5:     d_j <- d_{j-1} * exp(m_{j-1} - m_j) + exp(x_j - m_j)
6: end for
7: for i <- 1..V do
8:     y_i <- exp(x_i - m_V) / d_V
9: end for
```

The FlashAttention algorithm flow is as follows:

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_220113.png)

FlashAttention needs only $O\left(\frac {N^2 \times d^2} {M}\right)$ HBM accesses, where M is the SRAM size (which determines the block size).

# FlashAttentionV2<a id="sec-3"></a>

[FlashAttentionV2](https://arxiv.org/pdf/2307.08691.pdf) was proposed in July 2023. Its core contributions are:

-   Fewer non-matmul FLOPs: The original softmax computation subtracts the maximum value, but this increases the number of passes over x. V2 removes this step, compensates for it within the local blocks instead, and eliminates the rescale computation. For intermediate variables, it moves from storing $d_j$ and $m_j$ in V1 to storing $l_j$.

- Parallelism along the sequence length, so that good parallelism is achieved even for a single head with a long sequence: The FlashAttention algorithm has two loops, with K and V in the outer loop j and Q and O in the inner loop i.

  FlashAttention-2 moves Q to the outer loop i and K and V to the inner loop j. Because the improved algorithm no longer requires warps to communicate with each other to process Q_i, the outer loop can be placed on different thread blocks.

-   GPU optimization: Within one attention computation block, the work is divided among different warps of a single thread block, which reduces communication and shared memory accesses.

The difference between V1 and V2 shows up in the computation of local attention:

$$\text {FlashAttentionV1:}\  O^{(1)}=P(1)V^{(1)}=diag(l^{(1)})^{-1}e^{S^{(1)}-m^{(1)}}V^{(1)} $$

$$\text {FlashAttentionV2:}\  O^{(1)}=e^{S^{(1)}-m^{(1)}}V^{(1)}$$

$\text {FlashAttentionV2}$ does not rescale by $diag(l^{(i)})^{-1}$. It has to compensate for the max value, and the final output $O^{(last)}$ needs one more rescale:

$$O^{(2)}=diag(e^{m^{(1)}-m^{(2)}})O^{(1)}+e^{S^{(2)}-m^{(2)}}V^{(2)}=e^{s^{(1)}-m}V^{(1)}+e^{e^{(2)}-m}V^{(2)}$$

$$O=diag(l^{(2)})^{-1}O^{(2)}$$

The forward pass pseudocode is as follows: 

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2023-09-20-FlashAttention%25E7%25B3%25BB%25E5%2588%2597%25E4%25BC%2598%25E5%258C%2596/FlashAttention%E4%BC%98%E5%8C%96_20231029_222337.png)

For a basic implementation, see:

```python
import torch

torch.manual_seed(456)

N, d = 16, 8
Q_mat = torch.rand((N, d))
K_mat = torch.rand((N, d))
V_mat = torch.rand((N, d))

expected_softmax = torch.softmax(Q_mat @ K_mat.T, dim=1)
expected_attention = expected_softmax @ V_mat

# 分块（tiling）尺寸，以SRAM的大小计算得到
Br = 4
Bc = d

O = torch.zeros((N, d))

# 算法流程第3步，执行外循环
for block_start_Br in range(0, N, Br):
    block_end_Br = block_start_Br + Br
    # 算法流程第4步，从HBM中load Qi 的一个block到SRAM
     Qi = Q_mat[block_start_Br:block_end_Br, :]
    # 算法流程第5步，初始化每个block的值
     Oi = torch.zeros((Br, d))  # shape Br x d
     li = torch.zeros((Br, 1))  # shape Br x 1
     mi = torch.full((Br, 1), -torch.inf)  # shape Br x 1

# 算法流程第6步，执行内循环
for block_start_Bc in range(0, N, Bc):
    block_end_Bc = block_start_Bc + Bc

    # 算法流程第7步，load Kj, Vj到SRAM
    Kj = K_mat[block_start_Bc:block_end_Bc, :]
    Vj = V_mat[block_start_Bc:block_end_Bc, :]

    # 算法流程第8步
    Sij = Qi @ Kj.T
    # 算法流程第9步
    mi_new = torch.max(torch.column_stack([mi, torch.max(Sij, dim=1).values[:, None]]), dim=1).values[:, None]
    Pij_hat = torch.exp(Sij - mi_new)
    li = torch.exp(mi - mi_new) * li + torch.sum(Pij_hat, dim=1)[:, None]
    # 算法流程第10步
    Oi = Oi * torch.exp(mi - mi_new) + Pij_hat @ Vj

    mi = mi_new

# 第12步
Oi = Oi / li

# 第14步
O[block_start_Br:block_end_Br, :] = Oi
```

# FlashAttentionV3

The core optimizations of `FlashAttentionV3` target the `Hopper` architecture and have two parts: hardware asynchrony and FP8 low precision.

1. Hardware asynchrony

   Hopper introduces a new hardware module, the `Tensor Memory Accelerator (TMA)`. The TMA allows efficient asynchronous data transfer between global memory and shared memory and reduces the dependence on registers. When data is copied asynchronously between global memory and shared memory through the TMA, the GPU can spend the saved instruction cycles on issuing computation.

   The authors call this optimization warp specialization: some warps produce and some warps consume, each with its own role. Using the warp-group approach, GEMM and softmax computation are overlapped through ping-pong scheduling.

2. FP8 low precision

   To improve FP8 accuracy and reduce outliers, two main techniques are used:

   + Block quantization: Q, K, and V are split into blocks, with one scaling factor per block.
   + [Incoherent Processing](https://arxiv.org/abs/2307.13304): Q and K are each multiplied by a random orthogonal matrix, which reduces the outliers in every Q and K without affecting the final result.

# PagedAttention<a id="sec-4"></a>

[PagedAttention](https://arxiv.org/abs/2309.06180) was proposed by vLLM. Its core is that it allows contiguous KV tensors to be stored in non-contiguous memory. Specifically, PagedAttention splits each sequence's KV cache into blocks, each block holding a fixed number of tokens, and when computing attention it can efficiently locate and fetch the corresponding memory blocks.

The design borrows the ideas of virtual memory and paging: each fixed-length block can be viewed as a page in virtual memory, tokens as bytes, and sequences as processes. A block table then maps contiguous logical blocks to non-contiguous physical blocks, and physical blocks can be allocated on demand as new tokens are generated.

PagedAttention enables efficient memory sharing: in parallel sampling, one prompt needs to generate multiple output sequences. In this case, the computation and memory for that prompt can be shared among the output sequences.

The block table makes memory sharing natural. Just as processes share physical pages, different sequences in PagedAttention can share blocks by mapping their logical blocks to the same physical blocks. To make sharing safe, PagedAttention tracks reference counts for physical blocks and implements a Copy-on-Write mechanism. Memory sharing reduces memory usage by 55%, which greatly lowers the memory overhead of sampling algorithms, and improves throughput by up to 2.2x.

# References<a id="sec-5"></a>

[FlashAttention: faster computation, less GPU memory, I/O-aware exact attention](https://zhuanlan.zhihu.com/p/639228219)

[FlashAttention2 explained (200% faster than FlashAttention)](https://zhuanlan.zhihu.com/p/645376942)

[How the vLLM framework works: PagedAttention](https://zhuanlan.zhihu.com/p/649537608)

[Zhihu: FA3](https://www.zhihu.com/question/661395457/answer/3559517523)
