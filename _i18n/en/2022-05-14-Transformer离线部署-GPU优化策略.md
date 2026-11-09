---
title: "Offline Transformer Deployment: GPU Optimization Strategies"
description: "The key points for optimizing the deployment of Transformer-style networks on GPU devices, based on NVIDIA's open-source FasterTransformer, covering kernel fusion, GEMM and Softmax kernel optimization, and instruction-level tweaks."
---

- [Preface](#sec-1)
- [Model Structure Analysis](#sec-2)
- [Specific Optimization Measures](#sec-3)
- [References](#sec-4)

# Preface<a id="sec-1"></a>

This article introduces the key points for optimizing the deployment of Transformer-style networks on GPU devices. It focuses mainly on NVIDIA's open-source [FasterTransformer](https://github.com/NVIDIA/FasterTransformer).

# Model Structure Analysis<a id="sec-2"></a>

The standard Transformer structure consists mainly of an `Encoder` and a `Decoder`. For a detailed analysis of the structure, see [Applications and Deployment of Transformer in CV](https://johneyzheng.top//posts/Transformer%E5%9C%A8CV%E9%A2%86%E5%9F%9F%E7%9A%84%E5%BA%94%E7%94%A8%E4%B8%8E%E9%83%A8%E7%BD%B2/):

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_161102.png)

The kernel structure of the Encoder is:

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_170052.png)

The kernel structure of the Decoder is:

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_170202.png)

We can see that:

The basic structures of the Encoder and Decoder are consistent. The main kernels (the bulk of the compute throughput) are the GEMM/Softmax kernels; in addition, there are many add bias/normalization operations (consisting of many small kernels). From the pipeline diagram of the `Encoder` model below, we can see that the large number of small kernels lengthens the kernel "Launch" time on the CPU side, producing a "Launch Bound" phenomenon, so the GPU's compute throughput cannot be fully exploited. 

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2022-05-14-Transformer%25E7%25A6%25BB%25E7%25BA%25BF%25E9%2583%25A8%25E7%25BD%25B2-GPU%25E4%25BC%2598%25E5%258C%2596%25E7%25AD%2596%25E7%2595%25A5/transformer%E7%A6%BB%E7%BA%BF%E9%83%A8%E7%BD%B2-GPU%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5_20220514_171241.png)

# Specific Optimization Measures<a id="sec-3"></a>

Based on the basic structure of Transformer-style networks, NVIDIA has made a series of optimizations. The first is at the kernel fusion level, where a series of small kernels can be fused:

1.  LayerNorm small-kernel fusion: add bias + layernorm
2.  Activation function small-kernel fusion: add bias + relu/gelu
3.  Softmax small-kernel fusion: add bias + Softmax

At the core kernel level:

1.  GEMM is the main time-consuming kernel, and cuBLAS has focused on optimizing its performance: QKV GEMM fusion, automatic selection of the GEMM configuration, etc.
2.  An optimized Softmax kernel is used, with different FP32/FP16 implementations

Other optimization points:

1.  The half2 data type is used, which reduces the space needed for data copies
2.  At the instruction level:
    1.  Replace the expf operation with \_expf: lower precision, but better performance (mainly to speed up softmax?)
    2.  Use `__shfl_xor_sync` to accelerate the `reduce` operation (Layernorm)

The pipeline diagram of the optimized `Encoder` structure is shown below. There are basically no gaps between kernels, which improves GPU utilization; at the same time, the optimization of the core kernels also greatly improves model performance.

![img](/assets/img/recovered/62cfde93bed8981f.png)

# References<a id="sec-4"></a>

[FasterTransformer Presentation-YouTube](https://www.youtube.com/watch?v=MDqNwSTLimU)
