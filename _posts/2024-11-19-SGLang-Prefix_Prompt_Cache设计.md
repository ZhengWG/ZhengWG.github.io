---
layout: post
title: SGLang-Prefix_Prompt_Cache设计
date: 2024-11-19 19:26:50.000000000 +09:00
categories: [算法篇]
tags: [LLMs]
mathjax: true
---

## SGLang-Prefix Prompt Cache设计

**Paper**

[SGLang: Efficient Execution of Structured Language Model Prpgrams](https://arxiv.org/pdf/2312.07104)

**Motivation**

多轮对话中，由于Prompts存在大量相同前缀，因此 `Prefix prompt cache` 的复用就显得很重要：需要考虑：`efficient prefix search`,`reuse`,`insertion`,`eviction`已经对应的`cache aware scheduing`。

**Key Points**

SGLang采用了 `prefix tree` 的数据结构来进行Cache的数据存储，基础特点：

1. 前缀压缩：相同前缀的多个键只存储一次，减少重复存储。
2. 动态扩展：支持增删查操作，适应符号集合或规则的动态变化。
3. 快速查询：查找复杂度接近  O(k) ，其中  k  是键的平均长度。
4. 稀疏存储：仅存储有效路径，优化内存占用。

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_013249.png)

另外，Scheduling策略上，以匹配的prefix-length作为最高优先级。

VLLM结合PA和Prefix Cache，通过 `hash(prefix tokens + block tokens)` 来定义对应的KV Block，通过hash-mapping的方式来实现prefix-cache和physical block的mapping：

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_013854.png)

**Statistics**

`multi-call` 下的性能收益： ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_014206.png)
