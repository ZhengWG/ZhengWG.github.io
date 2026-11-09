---
title: "Prefill-Decode Disaggregation"
description: "Explains why prefill and decode are deployed separately, how to assess the KV cache transfer cost, and the scheduler, distributed deployment, and KV cache transfer designs in Splitwise and Mooncake."
---

## Prefill-Decode Disaggregation

### Background

The computation patterns of the `Prefill` and `Decode` phases are completely different: prefill is a compute-intensive task, and decode is an I/O-intensive task.

When prefill and decode run together, prefill interrupts decode inference, which prevents better batching and lowers the upper limit on the decode batch size. Several strategies for mixed execution are listed below, and each has problems:

1. Request-level: The queuing time between requests is very long.
2. Continuous: Prefill delays the start of decode inference, which makes TTFT too long.
3. Mixed: Running them together lengthens the latency of some decode phases.

![image-20241222221346715](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-25-Prefill_Decode%25E5%2588%2586%25E7%25A6%25BB%25E9%2583%25A8%25E7%25BD%25B2/image-20241222221346715.png)

### Motivation

The purpose of prefill-decode disaggregation is to deploy the prefill and decode tasks on different machines or clusters, with the $KV\_Cache$ they depend on passed between them through $KV\_Transfer$.

![image-20241222222435633](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-25-Prefill_Decode%25E5%2588%2586%25E7%25A6%25BB%25E9%2583%25A8%25E7%25BD%25B2/image-20241222222435633.png)

Assessing the benefits of prefill-decode disaggregation:

- Benefit assessment: $Bandwidth = \frac {QPS \times KVCache} {TTFT}$,

  Taking RoCE bandwidth of 25GB/s as a reference, a 1.9 G KV cache takes 40ms, so the bandwidth requirement is manageable.

Engineering benefits:

-   Prefill and decode can be optimized separately in both business and engineering terms. On the prefill side, prefix caching, PP partitioning, and so on can be applied; decode can focus on large-batch-size inference and on optimizing the KV cache, the inference pipeline, and scheduling.

-   Hardware cost: It makes heterogeneous cluster deployment easy and lets the hardware's compute throughput be fully used.

### Framework Design

Several key points in the design of a prefill-decode disaggregation framework:

1. Scheduler

   [Splitwise](https://arxiv.org/pdf/2311.18677) designs `CLS (Cluster-level scheduling)` and `MLS (Machine-level scheduling)`. `CLS` dynamically adjusts the prefill/decode machines based on request load and token distribution, and assigns prompt and decode machines through `Request routing`. `MLS` schedules requests on a single machine using `FCFS (first-come-first-serve)`.

   [Mooncake](https://arxiv.org/pdf/2407.00079) designs a `KVCache-centric Conductor` to build a `KVCache`-centric scheduler, which mainly addresses the following problems:

   + Prefill Global Scheduling

     The choice of prefill instance considers several factors: the load and hit length of the prefix cache, and the reusable `KVCache blocks`. Following a `Cache-aware` approach, prefill instances are assigned by combining this with the prefill time under prefix caching.

   + Cache Load Balancing

     The core is to raise the `KVCache` hit rate as much as possible while reducing the time to load and transfer the cache, which requires choosing the best strategy among recomputation, remote cache, and local cache.

   ![image-20241222220722327](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-25-Prefill_Decode%25E5%2588%2586%25E7%25A6%25BB%25E9%2583%25A8%25E7%25BD%25B2/image-20241222220722327.png){: .img-mid }

2. Distributed deployment

   One advantage of prefill-decode disaggregation is that prefill and decode can use different deployment methods. In particular, prefill deployment can be more flexible. For example, when the QPS requirement is low and the latency requirement is high, TP can be used; when the QPS requirement is high, chunked prefill plus PP can be used.

3. KV cache transfer

   The core challenge of disaggregated KVCache deployment is resolving the conflict between a high cache hit rate and hiding cache transfer behind a pipeline. The design needs to consider:

   1.  Distributed KVCache cluster design: multi-level storage, HBM/DRAM/SSD.
   2.  Scheduling design: Prefill/decode nodes are assigned based on cache matching, and `KVCache Block`s are managed in pages so they can be reused flexibly.
   3.  KVCache transfer: prefill->decode, asynchronous transfer per layer.

​	![image-20241222220840813](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-25-Prefill_Decode%25E5%2588%2586%25E7%25A6%25BB%25E9%2583%25A8%25E7%25BD%25B2/image-20241222220840813.png){: .img-mid }

### Reference

<https://zhuanlan.zhihu.com/p/8056351077> 

[Zhihu: Mooncake reading notes](https://zhuanlan.zhihu.com/p/706097807)

[Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving](https://arxiv.org/pdf/2407.00079)

[Splitwise: Efficient Generative LLM Inference Using Phase Splitting](https://arxiv.org/pdf/2311.18677)