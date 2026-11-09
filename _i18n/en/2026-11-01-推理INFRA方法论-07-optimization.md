---
title: "Inference Infrastructure (7): Execution: CUDA Graph, Speculative Decoding, Overlap, and Quantization"
description: "Turn the earlier bottleneck diagnosis into execution mechanisms, and state where CUDA Graph capture, speculative verification, multi-stream dependencies, operator fusion, and low-precision kernels apply."
card_title: "CUDA Graph, speculative decoding, overlap, and quantization"
---

Turn the earlier bottleneck diagnosis into execution mechanisms, and state where CUDA Graph capture, speculative verification, multi-stream dependencies, operator fusion, and low-precision kernels apply.

## CUDA Graph

Core mechanism: the capture phase records the sequence of kernel launches on a stream into a graph (nodes = kernels, edges = dependencies); after instantiate, replay submits the whole graph with a single API call — the CPU launch cost goes from N × the per-launch cost (raw `cudaLaunchKernel` ~2μs, PyTorch eager 5-12μs/op) to a single ~3μs. In this test, GPU-side replay of 1260 tiny nodes took about 0.96ms, about 0.76μs per node (including node execution); this cannot be used as a fixed per-node tax for an arbitrary graph. Without it you are host-bound; this is a usability problem, not an optimization. Measured on Qwen3.5-397B-FP8 (TP8): ~1770 kernels per decode step; with Graph enabled, TPOT at B=1 is 5.6ms, while under eager it is 141-146ms regardless of B (25× slower) — under TP8, the submission of the slowest rank holds up the AllReduce. Dividing the eager per-step time by the kernel count gives about 90μs per kernel, but that includes waiting and execution and cannot be called a measured per-launch Python dispatch cost.

Basic principle: capture freezes three things (these are the criteria for whether something can go into a graph):

```
① Memory addresses (pointers are baked into the graph)
② Scalar arguments passed by value (pass seq_len as an int → it is forever the value at capture time)
③ Grid configuration and kernel selection (a CPU-side if-else records only the branch taken at the time)
⟹ Iron rule: any quantity that changes from step to step must exist as [the contents of a fixed-address GPU tensor]
   (slot_mapping / masked_m / block_table all follow this pattern: copy_ updates the contents before replay)
```

Supporting practice: capture per batch bucket (1,2,4...256, padding to the nearest bucket); dynamic shapes go piecewise (attention stays outside the graph, in eager).

How to debug graph problems (a four-step method):

```
① Compare with the graph disabled: if results are correct with --enforce-eager → you must have "baked in some quantity that changes every step"
② Errors during capture (operation not permitted): a sync/malloc/nested capture happened during capture
   → narrow it down to the submodule (a codec grabbing the capture is this kind of case), and explicitly disable its graph
③ Silent errors (no crash, but the output gets worse): dump the input tensors before and after replay one by one,
   and find "which quantity should change every step but didn't" — slot_mapping writing to the wrong KV slot is the classic case
④ Use nsys to check that replay actually takes effect: a graph launch should be one big node; if you still see fragmented launches,
   the bucket was missed (the shape fell outside the capture sizes) and the fallback path is running
```

In a measurement launching 1260 kernels back to back, host submission time is 2.4ms in raw C++ and about 2.9μs with CUDA Graph. In another PyTorch eager/graph comparison, the end-to-end times are 12.1/4.9ms, of which GPU work is about 4.87ms. Host submission time and end-to-end time must be measured separately; when CPU-side launching can be hidden behind GPU work, the end-to-end gain from lower submission overhead shrinks.

## Speculative decoding: EAGLE / MTP / DFlash / DSpark

Common principle: the draft quickly produces τ candidates → the target verifies them in parallel in one forward pass → acceptance sampling guarantees that the output distribution exactly matches the original model (lossless). The gain = merging τ serial "read the weights once" passes into one.

| Method | Draft form | Core mechanism | Ceiling / measured |
| --- | --- | --- | --- |
| EAGLE-3 | Small AR head on the target model's features | Feature-level autoregression + tree attention for multi-path verification | Serial drafting caps out at 2-3× |
| MTP | The model's own multi-token heads (native in DS/Qwen) | Learned during training; 1 step τ≈1.8-2; measured on Qwen3.5, 3 steps give an acceptance length of 3.1 | TPOT at concurrency 1/8/32: 2.45/5.1/7.6 ms (without it: 5.6/8.9/16.4) |
| DFlash | Small block-diffusion model | One forward pass produces a whole draft block (in parallel!) + injecting target-model features/KV to raise the acceptance rate | 6× lossless, up to 2.5× higher than EAGLE-3; gpt-oss-120b reaches 15× on Blackwell |
| DSpark (DeepSpec) | Built on DFlash | ① Semi-autoregressive generation: recovers the dependencies between tokens within a block (lost in pure diffusion) ② Confidence-scheduled verification: speculate only when confident | In use in DS-V4 production serving |

The corresponding system optimizations:

```
① Draft parallelization is the new main line: EAGLE's bottleneck is that the draft itself is serial → DFlash uses diffusion to produce a block in one pass
② The economics of speculation at high concurrency (the problem DSpark solves): verify batch = B×τ; at high concurrency, compute gets
   eaten up by verify inflation → confidence scheduling = fall back to normal decode when the expected acceptance rate is low, and don't pay verification cost for low-quality drafts
③ Working with CUDA Graph: separate bucketed graphs for draft and verify; the tree attention mask uses a fixed buffer
④ Interaction with MoE: the B×τ tokens in verify actually raise M_e — speculation has a hidden positive externality on MoE
⑤ Interaction with MLA: in these measurements, MLA decode with 128 heads per GPU is mainly compute-bound, and with verify at q_len=2 attention time rises to 2.0–2.2×. Speculative verification adds attention work, and whether it pays off end to end also depends on the acceptance length. After TP splits the heads, re-evaluate the bottleneck based on heads per GPU.
```

## Multi-Stream Overlap

The prerequisite for overlap: the work occupies different hardware resources. Two kernels competing for the SMs do not truly run in parallel (they just time-share). Resource list:

```
SM (compute) / Copy Engine (D2H/H2D, independent DMA) / NIC (RDMA in flight on the NIC) / CPU (launch / preprocessing)
```

A three-step methodology:

```
① Find pairs: the idle resource of one stream = the bottleneck resource of another
   e.g. layer-wise KV transfer (Copy/NIC) ∥ next layer's compute (SM)
      DeepEP hook (NIC) ∥ shared expert (SM)
      TBO (micro-batch A's all2all ∥ micro-batch B's GEMM)
② Build dependencies: cudaStreamWaitEvent lets the GPU do the ordering itself (the CPU does not block)
   ★ Double buffering must be paired with a [reverse event]: before the producer reuses a buffer, confirm the consumer has finished reading it
     — missing it = a silent data-race bug (no crash, the values slowly go bad)
③ Acceptance criterion: the hidden time < the main-stream time, and the exposed segment = max rather than sum
   Quantified: overlap efficiency = 1 − (measured step time − max(A,B)) / min(A,B)
```

## Operator fusion

Why fuse (three benefits, in order of importance):

```
① Eliminate the HBM round trips of intermediate results (the main benefit): with three kernels A→B→C, B's input and output each go through HBM once;
   after fusion the intermediates live in registers/SRAM → I rises directly (the essence of FlashAttention; see [Chapter 0]({% post_url 2026-01-01-推理INFRA方法论-00-roofline %}))
② Eliminate the launch tax: N launches → 1 (5-12μs each under eager, the dominant term with ~1770 kernels per decode step; under CUDA Graph it still saves ~0.76μs per node plus the kernel's own ~2μs minimum execution time)
③ Specific to the 910B: fragmented operators land on the weak Vector/Scalar cores, and fusion moves the load back to the Cube → a double benefit
```

A simple demo (RMSNorm + QKV projection):

```
Unfused: read x → RMSNorm → write x' → read x' → GEMM → write qkv     (x' makes 2 trips through HBM)
Fused:   read x → norm in registers → straight into the GEMM epilogue → write qkv    (saves 2·B·d·bpp of traffic)
B=256, d=7168: about 7.3MB less HBM traffic per layer; at the measured effective bandwidth this is about 2μs of transfer time, plus one fewer kernel launch.
The standalone RMSNorm kernel measures 3.3μs (sgl_kernel) / 6.9μs (torch).
Under CUDA Graph, 61 layers add up to ~0.25ms (only under eager accounting does it reach ~0.5ms)
```

Criteria (what can be fused and what cannot):

```
Fusible: elementwise chains (add/mul/act/norm) + GEMM prologue/epilogue → torch.compile / handwritten
Not fusible: across independent GEMMs, library calls (cuDNN/cuBLAS black boxes), sequences broken by complex reshapes
   → their launch tax can only be absorbed by CUDA Graph (enumerable shapes) or algorithm-level batching (dynamic shapes)
```

## Quantization

| Hardware                      | Native MMA support | Recommended route     | Nature of the dequantization overhead                                                                                                                              | Applicable scenarios      |
|-------------------------------|---------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| Hopper (SM90)                 | FP8           | FP8 on both sides (DeepGEMM) | No dequantization: weights and activations are both FP8 and go straight into WGMMA. The overhead turns into promotion — every 128 K elements, the CUDA cores multiply the Tensor Core partial sums by the scale and promote them to FP32. Because CUDA cores and Tensor Cores are physically independent, this step can overlap with the next batch of matrix multiplications (MMA) | General purpose           |
| Blackwell (SM100+)            | FP4           | FP4 (the DS-V4 route)     | Same as above, with finer granularity (weight bytes halved again)                                                                                                  | General purpose           |
| Ampere / Turing / NPU         | INT8          | W8A8 on both sides        | None (INT8 goes straight into MMA)                                                                                                                                 | High concurrency          |
| Ampere / older GPUs / NPU     | No FP8/FP4    | INT4 weight-only (Marlin) | Real dequantization: INT4 weights must first be unpacked + multiplied by the scale to restore FP16 before they can enter MMA. These instructions run on CUDA cores and can only be squeezed into the gaps between MMAs through instruction-level parallelism (ILP); if they don't fit, it is a net loss | Small-batch decode / saving GPU memory |


An introduction to several quantization libraries:

| Feature    | Marlin (ISTA)          | DeepGEMM (DeepSeek)       | Humming (Ant Group)                    |
|------------|------------------------|---------------------------|----------------------------------------|
| Scenario   | W4A16 dense, B≤32      | FP8 MoE grouped           | Both                                   |
| Weights/activations | INT4 / FP16   | FP8 / FP8                 | INT1-8 + any ≤8bit float / six activation types |
| scale      | per-group g128         | 1×128 for activations, 128×128 for weights | Includes UE8M0 (the format DS adopted to align with Chinese domestic chips) |
| Hardware   | Ampere                 | Hopper                    | Full coverage from SM75+               |
| Size       | Medium                 | ~300 lines of core code   | 100+KB for the whole library, JIT      |

- **Marlin optimizations:**
  1. **Asynchronous global loads + a circular shared-memory queue**
     Moving weights from GPU memory into shared memory is issued with asynchronous copy instructions, so it does not block compute; shared memory holds a circular queue for multi-stage buffering, so that "loading block N+2" and "computing block N" happen at the same time. The number of buffer stages (pipeline depth) needs tuning — with too few stages, dequantization waits for data to arrive; with too many, shared memory cannot hold them, which in turn reduces the number of thread blocks that can be resident at the same time.
  2. **Cache eviction hints to avoid polluting the L2 cache**
     Weights are accessed in a streaming fashion: each block is read once and never used again, whereas activations are reused repeatedly. If the weights are allowed to fill the L2 cache, they push out the activations that should stay. Marlin attaches an "evict after reading" hint to weight loads, leaving the L2 cache for data that actually needs to be reused.
  3. **XOR swizzling in shared memory to eliminate bank conflicts**
     Shared memory is divided into multiple banks, and multiple threads accessing the same bank at the same time are serialized. After 4-bit weights are packed, the address spacing between adjacent data changes, and access patterns that were conflict-free start colliding heavily. Marlin applies an XOR transform to the addresses to rescatter the mapping and restore conflict-free access.
  4. **Task scheduling and synchronization**
     The matrix multiplication is divided into tasks by output tile and distributed evenly across all streaming multiprocessors, avoiding a final batch of tasks that occupies only a few compute units (the "wave quantization" loss of compute resources).

- **DeepGEMM optimizations:**
  1. **Two-level accumulation**
     The accumulator inside FP8 Tensor Cores has limited precision. Accumulating all the way along the depth dimension (K is usually above seven thousand) makes the partial sum grow larger and larger, and newly added small values get truncated and lost in the low-order bits. The fix is to let the Tensor Core accumulate only four consecutive matrix-multiply instructions (equivalent to 128 K elements), then hand off to the CUDA cores, which multiply by the scaling factor and promote the result into FP32 registers for continued accumulation. Measured: with all-positive data and K=16K, accumulating entirely in low precision gives a relative error of about 25% (only 0.3% for normally distributed data), while two-level accumulation gives about 0.17%, the same as BF16 output rounding.
  2. **Masked layout**
     Under expert parallelism, the number of rows each expert receives changes every step, while CUDA Graph requires fixed shapes. The fix is to fix the shape of the input buffer at the "maximum row count" and use a separate count tensor stored in GPU memory to record each expert's actual number of rows — the address is fixed (satisfying graph capture) while the contents can change every step (satisfying the dynamic load). At run time the kernel reads this count, skips blocks that have no data at all, and issues compute only for valid rows. Combined with a small row tile size, this cuts the per-tile padding waste down from the tenfold level (about 1.4× at BM=16, M_e≈11); while the tile is still memory-bound, this waste costs no time.

- **Humming optimizations:**
  - Its premise is that the optimization techniques for low-bit matrix multiplication are orthogonal to each other — asynchronous loading and buffer pipelining are independent of the weight bit width; the shared-memory swizzle scheme varies only with the packing format; the level at which dequantization is inserted varies only with the data format; and the tile size varies only with the matrix shape. Handwritten kernels weld these choices into one fixed combination (which is why Marlin only does 4-bit weights with FP16 activations, and DeepGEMM only does FP8 expert-parallel matrix multiplication), whereas JIT compilation can assemble the matching specialized kernel on the spot at run time for the specific combination of "weight type × activation type × quantization strategy × hardware generation".
  - This explains its two characteristics:
    1. **Very broad support** (any weight type below 8 bits, six activation types, every NVIDIA GPU from the Turing architecture on, and both dense and expert-parallel matrix multiplication)
    2. **Small library size** (the whole library is just over a hundred KB and depends only on PyTorch and a compiler. The project's acknowledgments directly list four projects: DeepGEMM, Marlin, LMDeploy, and CUTLASS.)

## Series navigation

| Chapter | Article | Scheduled date |
| --- | --- | --- |
| 0 | [Roofline: Performance Budgets from Compute and Bandwidth]({% post_url 2026-01-01-推理INFRA方法论-00-roofline %}) | 2026-01-01 |
| 1 | [Communication: From Collective Primitives to Cross-Node Topology]({% post_url 2026-02-13-推理INFRA方法论-01-communication %}) | 2026-02-13 |
| 2 | [Distributed Inference: Choosing TP, DP, EP, CP, and PP]({% post_url 2026-03-29-推理INFRA方法论-02-parallelism %}) | 2026-03-29 |
| 3 | [Inference Hardware: GPUs, NPUs, and the Memory Hierarchy]({% post_url 2026-05-11-推理INFRA方法论-03-hardware %}) | 2026-05-11 |
| 4 | [Attention: From GQA and MLA to Hybrid State]({% post_url 2026-06-24-推理INFRA方法论-04-attention %}) | 2026-06-24 |
| 5 | [MoE Inference: Batching, DeepEP, DeepGEMM, and Load Balancing]({% post_url 2026-08-06-推理INFRA方法论-05-moe %}) | 2026-08-06 |
| 6 | [PD and EPD: Disaggregation, State Transfer, and Resource Allocation]({% post_url 2026-09-19-推理INFRA方法论-06-pd-epd %}) | 2026-09-19 |
| 7 | **Execution: CUDA Graph, Speculative Decoding, Overlap, and Quantization (this post)** | 2026-11-01 |

Previous: [PD and EPD: Disaggregation, State Transfer, and Resource Allocation]({% post_url 2026-09-19-推理INFRA方法论-06-pd-epd %})
