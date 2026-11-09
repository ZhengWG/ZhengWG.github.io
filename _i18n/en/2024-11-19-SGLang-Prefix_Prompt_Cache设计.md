---
title: "SGLang: Prefix Caching Design"
description: "Explains how SGLang reuses prompt prefixes across requests with a prefix tree and cache-aware scheduling, and how vLLM combines PagedAttention with hash-based prefix caching, with multi-call performance results."
---

## SGLang: Prefix Caching Design

**Paper**

[SGLang: Efficient Execution of Structured Language Model Prpgrams](https://arxiv.org/pdf/2312.07104)

**Motivation**

In multi-turn conversations, prompts share a large number of identical prefixes, so reusing the prefix cache (`Prefix prompt cache`) is very important. The design needs to consider `efficient prefix search`, `reuse`, `insertion`, `eviction`, and the corresponding `cache aware scheduling`.

**Key Points**

SGLang stores the cache in a `prefix tree` data structure, whose basic properties are:

1. Prefix compression: Multiple keys with the same prefix are stored only once, which reduces duplicate storage.
2. Dynamic extension: Insertion, deletion, and lookup are supported, which adapts to dynamic changes in the symbol set or rules.
3. Fast lookup: The lookup complexity is close to O(k), where k is the average key length.
4. Sparse storage: Only valid paths are stored, which optimizes memory use.

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_013249.png)

In addition, for the scheduling strategy, the matched prefix length is given the highest priority.

vLLM combines PagedAttention (PA) and prefix caching. It defines the corresponding KV block through `hash(prefix tokens + block tokens)`, and uses hash mapping to map the prefix cache to physical blocks:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_013854.png)

**Statistics**

Performance gains under `multi-call`: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2024-11-19-SGLang-Prefix_Prompt_Cache%25E8%25AE%25BE%25E8%25AE%25A1/%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%8E%A8%E7%90%86%E6%8A%80%E6%9C%AF%E6%A0%88_20240917_014206.png)
