---
title: "An Overview of Triton Kernels"
description: "Triton is a Python programming language and compiler for GPUs that simplifies writing GPU kernels without low-level CUDA or HIP knowledge."
---

## Contents
1. [Background](#background)
2. [Basic Syntax](#basic-syntax)
3. [Core Concepts](#core-concepts)
4. [Worked Example: Flash Attention](#worked-example-flash-attention)
5. [Advanced Optimization Techniques](#advanced-optimization-techniques)

---

## Background<a id="background"></a>

### What Is Triton
- **Definition**: Triton is a Python programming language and compiler for GPUs
- **Goal**: simplify writing GPU kernels, without low-level CUDA/HIP knowledge
- **Advantages**:
  - Python syntax, easy to write and maintain
  - Automatically optimizes memory access and scheduling
  - Supports autotuning (Autotune)

### Where it applies
- Fused operators
- Custom optimized algorithms (such as Flash Attention)
- Performance-sensitive, compute-intensive tasks

---

## Basic Syntax<a id="basic-syntax"></a>

### 1. Kernel Definition
```python
import triton
import triton.language as tl

@triton.jit
def kernel_name(x_ptr, y_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
    # kernel 代码
    pass
```

**Key points**:
- `@triton.jit`: the decorator that marks a Triton kernel
- `tl.constexpr`: a compile-time constant, and it must be a power of two

### 2. Program ID and Offsets
```python
pid = tl.program_id(axis=0)  # 当前程序块的 ID
block_start = pid * BLOCK_SIZE
offsets = block_start + tl.arange(0, BLOCK_SIZE)  # [0, 1, 2, ..., BLOCK_SIZE-1]
```

### 3. Memory Operations
```python
# 加载
mask = offsets < n_elements
x = tl.load(x_ptr + offsets, mask=mask)

# 存储
tl.store(output_ptr + offsets, result, mask=mask)
```

### 4. Common Operations
```python
# 算术
result = x + y
result = tl.exp(x)
result = tl.sum(x, axis=0)

# 矩阵运算
acc = tl.dot(a, b)  # 矩阵乘法
acc = tl.dot(a, b, acc)  # 累加形式

# 条件
result = tl.where(condition, x, y)
```

### 5. Loops
```python
# 标准循环
for i in range(0, K, BLOCK_SIZE_K):
    # 处理逻辑
    
# 支持自动流水线
for i in tl.range(0, K, BLOCK_SIZE_K, num_stages=3):
    # 编译器自动流水线化
```

---

## Core Concepts<a id="core-concepts"></a>

### The Block
- **Block**: the chunk of data each program instance processes
- **Block Size**: must be a power of two (32, 64, 128, ...)
- **Block Pointer**: a pointer to the data

### Launch Grid
```python
def grid(META):
    return (triton.cdiv(n_elements, META['BLOCK_SIZE']),)

kernel[grid](args)
```

### Data Types
- `tl.float16`, `tl.bfloat16`, `tl.float32`, `tl.int32`, `tl.int64`
- `tl.float8e5`, `tl.float8e4nv` (FP8 formats)
- `tl.constexpr`: a compile-time constant

---

## Worked Example: Flash Attention<a id="worked-example-flash-attention"></a>

Flash Attention is a classic Triton application. It shows how to implement a memory-efficient attention mechanism.

### Core Idea of the Algorithm

Standard attention has to store the full attention matrix (O(N²) memory). Flash Attention uses tiled computation and an online softmax to bring the memory complexity down to O(N).

### Full Implementation

```python
@triton.jit
def _attn_fwd_inner(acc, l_i, m_i, q, desc_k, desc_v, 
                    offset_y, dtype, start_m, qk_scale,
                    BLOCK_M, HEAD_DIM, BLOCK_N, STAGE,
                    offs_m, offs_n, N_CTX, 
                    warp_specialize, IS_HOPPER):
    """核心计算循环：分块处理 K/V，在线更新 softmax"""
    
    # 1. 确定处理范围（因果注意力需要分阶段）
    if STAGE == 1:
        lo, hi = 0, start_m * BLOCK_M  # 非因果或 off-band
    elif STAGE == 2:
        lo, hi = start_m * BLOCK_M, (start_m + 1) * BLOCK_M  # 因果 on-band
    else:
        lo, hi = 0, N_CTX  # 完整范围
    
    offsetk_y = offset_y + lo
    offsetv_y = offset_y + lo
    
    # 2. 循环处理每个 K/V 块
    for start_n in tl.range(lo, hi, BLOCK_N, warp_specialize=warp_specialize):
        # 加载 K 块
        k = desc_k.load([offsetk_y, 0]).T
        qk = tl.dot(q, k)  # 计算 QK^T
        
        # 3. 应用因果掩码（如果需要）
        if STAGE == 2:
            mask = offs_m[:, None] >= (start_n + offs_n[None, :])
            qk = qk * qk_scale + tl.where(mask, 0, -1.0e6)
            m_ij = tl.maximum(m_i, tl.max(qk, 1))
            qk -= m_ij[:, None]
        else:
            # 数值稳定的 softmax：先缩放，再减去最大值
            m_ij = tl.maximum(m_i, tl.max(qk, 1) * qk_scale)
            qk = qk * qk_scale - m_ij[:, None]
        
        # 4. 计算注意力权重
        p = tl.math.exp2(qk)
        
        # 5. 计算修正因子（Flash Attention 的核心）
        alpha = tl.math.exp2(m_i - m_ij)  # 修正旧累加器
        l_ij = tl.sum(p, 1)  # 当前块的 exp sum
        
        # 6. 更新累加器
        if not IS_HOPPER and warp_specialize and BLOCK_M == 128 and HEAD_DIM == 128:
            # 特殊优化：拆分累加器以利用多个 warp
            acc0, acc1 = acc.reshape([BLOCK_M, 2, HEAD_DIM // 2]).permute(0, 2, 1).split()
            acc0 = acc0 * alpha[:, None]
            acc1 = acc1 * alpha[:, None]
            acc = tl.join(acc0, acc1).permute(0, 2, 1).reshape([BLOCK_M, HEAD_DIM])
        else:
            acc = acc * alpha[:, None]  # 应用修正
        
        # 7. 加载 V 并累加输出
        v = desc_v.load([offsetv_y, 0])
        p = p.to(dtype)
        acc = tl.dot(p, v, acc)  # 累加到 accumulator
        
        # 8. 更新归一化因子（在线 softmax 的核心）
        l_i = l_i * alpha + l_ij  # 更新 exp sum
        m_i = m_ij  # 更新最大值
        
        # 移动到下一个块
        offsetk_y += BLOCK_N
        offsetv_y += BLOCK_N
    
    return acc, l_i, m_i


@triton.jit
def _attn_fwd(sm_scale, M, Z, H, desc_q, desc_k, desc_v, desc_o, N_CTX,
              HEAD_DIM, BLOCK_M, BLOCK_N, FP8_OUTPUT, STAGE,
              warp_specialize, IS_HOPPER):
    """主 kernel：初始化并分阶段处理"""
    
    dtype = tl.float8e5 if FP8_OUTPUT else tl.float16
    start_m = tl.program_id(0)  # 沿序列维度的块索引
    off_hz = tl.program_id(1)   # batch × head 索引
    
    # 初始化 Flash Attention 变量
    m_i = tl.zeros([BLOCK_M], dtype=tl.float32) - float("inf")  # 最大值
    l_i = tl.zeros([BLOCK_M], dtype=tl.float32) + 1.0           # 归一化因子
    acc = tl.zeros([BLOCK_M, HEAD_DIM], dtype=tl.float32)       # 输出累加器
    
    # 计算缩放因子
    qk_scale = sm_scale * 1.44269504  # 1/log(2)，用于 exp2
    
    # 加载 Q（在整个计算中保持不变）
    qo_offset_y = off_hz * N_CTX + start_m * BLOCK_M
    q = desc_q.load([qo_offset_y, 0])
    
    # 阶段 1: Off-band（非对角线，无需掩码）
    if STAGE & 1:
        acc, l_i, m_i = _attn_fwd_inner(
            acc, l_i, m_i, q, desc_k, desc_v,
            off_hz * N_CTX, dtype, start_m, qk_scale,
            BLOCK_M, HEAD_DIM, BLOCK_N, 4 - STAGE,
            ..., warp_specialize, IS_HOPPER)
    
    # 阶段 2: On-band（对角线，需要因果掩码）
    if STAGE & 2:
        acc, l_i, m_i = _attn_fwd_inner(
            acc, l_i, m_i, q, desc_k, desc_v,
            off_hz * N_CTX, dtype, start_m, qk_scale,
            BLOCK_M, HEAD_DIM, BLOCK_N, 2,
            ..., warp_specialize, IS_HOPPER)
    
    # Epilogue: 最终归一化
    m_i += tl.math.log2(l_i)  # 最终的 log-sum-exp
    acc = acc / l_i[:, None]  # 归一化输出
    
    # 写回结果
    offs_m = start_m * BLOCK_M + tl.arange(0, BLOCK_M)
    m_ptrs = M + off_hz * N_CTX + offs_m
    tl.store(m_ptrs, m_i)  # 保存 m 用于反向传播
    desc_o.store([qo_offset_y, 0], acc.to(dtype))
```

### Key Techniques

1. **Online softmax**: use `m_i` (the maximum) and `l_i` (the normalization factor) to implement a numerically stable online softmax
2. **Tiled computation**: Q is loaded only once, and K and V are loaded in blocks, which avoids storing the full attention matrix
3. **Two-stage processing**: causal attention is implemented in two stages, off-band and on-band
4. **Numerical stability**: a correction by the maximum avoids overflow

---

## Advanced Optimization Techniques<a id="advanced-optimization-techniques"></a>

### 1. TMA (Tensor Memory Accelerator)

**Purpose**: hardware-accelerated memory access on Hopper (H100+) GPUs

```python
from triton.tools.tensor_descriptor import TensorDescriptor

# 创建 descriptor
a_desc = TensorDescriptor(a, shape=[M, K], strides=[K, 1], 
                         block_shape=[BLOCK_M, BLOCK_K])

# 使用 TMA 加载
a = a_desc.load([offs_m, offs_k])

# 使用 TMA 存储
c_desc.store([offs_m, offs_n], result)
```

**Advantages**:
- The hardware checks boundaries automatically
- Lower register pressure
- Higher memory bandwidth

**Requirement**: compute capability >= 9.0

### 2. Warp Specialization

**Purpose**: let different warps run different tasks, raising hardware utilization

```python
# 在循环中启用
for i in tl.range(0, N, BLOCK_N, warp_specialize=True):
    # 编译器自动将操作分配到不同的 warp groups:
    # - Memory warp: 负责加载数据
    # - Compute warp: 负责计算
    pass
```

**Advantages**:
- Overlap memory access and compute
- More instruction-level parallelism

**Requirement**: used mainly on Blackwell, and being extended to other architectures

### 3. Persistent Kernel (Persistent PID Optimization)

**Purpose**: fix the number of thread blocks so that each thread block processes multiple tiles, reducing context switches

```python
@triton.jit
def persistent_kernel(..., NUM_SMS: tl.constexpr):
    start_pid = tl.program_id(0)  # 起始 tile ID
    num_tiles = num_pid_m * num_pid_n
    
    # 每个线程块处理多个 tiles
    for tile_id in tl.range(start_pid, num_tiles, NUM_SMS, flatten=True):
        # 计算当前 tile 的位置
        pid_m, pid_n = _compute_pid(tile_id, ...)
        
        # 处理 tile
        accumulator = compute_tile(...)
        
        # 软件流水线：计算当前 tile 的同时写回前一个 tile
        tile_id_c += NUM_SMS
        pid_m_c, pid_n_c = _compute_pid(tile_id_c, ...)
        write_back_tile(pid_m_c, pid_n_c, prev_result)
```

**Key points**:
- Grid size = `min(NUM_SMS, num_tiles)` rather than `num_tiles`
- Use a separate counter to pipeline compute and write-back
- `flatten=True` flattens the loop so that software pipelining is supported

**Advantages**:
- Less context-switch overhead
- Better SM occupancy
- Supports software pipelining

### 4. Low-Memory Optimization (Seeded PRNG)

**Purpose**: use a pseudorandom number generator to produce data on demand, instead of storing the full state

```python
@triton.jit
def _seeded_dropout(x_ptr, output_ptr, n_elements, p, seed, BLOCK_SIZE):
    pid = tl.program_id(0)
    block_start = pid * BLOCK_SIZE
    offsets = block_start + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements
    
    x = tl.load(x_ptr + offsets, mask=mask)
    
    # 使用 Philox PRNG 在 kernel 内生成随机数
    # 关键：使用 offsets 作为 PRNG 的 counter
    random = tl.rand(seed, offsets)
    x_keep = random > p
    
    # 应用 dropout
    output = tl.where(x_keep, x / (1 - p), 0.0)
    tl.store(output_ptr + offsets, output, mask=mask)
```

**Key techniques**:
- `tl.rand(seed, offsets)`: use `(seed, offset)` as the PRNG input
- Determinism: the same `(seed, offset)` produces the same random number
- Memory drops from O(N) to O(1) (only one seed value is required)

**Advantages**:
- Much lower memory use
- The full mask tensor does not have to be stored
- Reproducible (the same seed produces the same result)

### 5. Parallel Reduction

**Purpose**: an efficient parallel reduction (such as softmax or layer norm)

```python
@triton.jit
def softmax_kernel(output_ptr, input_ptr, n_rows, n_cols, BLOCK_SIZE):
    row_start = tl.program_id(0)
    row_step = tl.num_programs(0)
    
    # 每个程序处理多个行（减少启动开销）
    for row_idx in tl.range(row_start, n_rows, row_step, num_stages=4):
        # 加载行数据
        col_offsets = tl.arange(0, BLOCK_SIZE)
        row = tl.load(input_ptr + row_idx * n_cols + col_offsets, 
                     mask=col_offsets < n_cols, other=-float('inf'))
        
        # 1. 计算最大值（归约操作）
        row_max = tl.max(row, axis=0)
        
        # 2. 数值稳定的 exp
        row_minus_max = row - row_max
        numerator = tl.exp(row_minus_max)
        
        # 3. 计算 sum（归约操作）
        denominator = tl.sum(numerator, axis=0)
        
        # 4. 归一化
        softmax_output = numerator / denominator
        
        # 写回
        tl.store(output_ptr + row_idx * n_cols + col_offsets, 
                softmax_output, mask=col_offsets < n_cols)
```

**Optimization techniques**:
- **Multi-stage pipeline**: `num_stages=4` enables software pipelining
- **Multiple rows**: each program processes multiple rows, which reduces kernel launch overhead
- **Fused operations**: one pass completes max, exp, sum, and normalize

**What Triton optimizes automatically**:
- The compiler turns `tl.max` and `tl.sum` into an efficient warp-level reduction
- Shared memory is used for the cross-warp reduction
- Data-layout optimization is handled automatically

### 6. Autotune

**Purpose**: automatically select the best configuration

```python
@triton.autotune(
    configs=[
        triton.Config({'BLOCK_SIZE_M': 128, 'BLOCK_SIZE_N': 128}, num_warps=4),
        triton.Config({'BLOCK_SIZE_M': 64, 'BLOCK_SIZE_N': 128}, num_warps=8),
    ],
    key=['M', 'N', 'K'],  # 根据这些参数选择配置
)
@triton.jit
def kernel(...):
    pass
```

### 7. Epilogue Subtiling

**Purpose**: split the output into small pieces to reduce shared-memory use

```python
if EPILOGUE_SUBTILE:
    # 将 accumulator 分成两部分
    acc0, acc1 = split_accumulator(accumulator)
    c_desc.store([offs_m, offs_n], acc0)
    c_desc.store([offs_m, offs_n + BLOCK_N // 2], acc1)
else:
    c_desc.store([offs_m, offs_n], accumulator)
```

**Advantage**: frees shared memory, which can be used to add pipeline stages

### 8. Software Pipelining

**Purpose**: overlap memory access and compute

```python
# 在循环中启用
for i in tl.range(0, K, BLOCK_K, num_stages=3):
    # 编译器自动创建流水线：
    # Stage 0: 加载数据
    # Stage 1: 计算
    # Stage 2: 写回
    # 三个阶段同时进行
    pass
```

**Key parameters**:
- `num_stages`: the number of pipeline stages, usually 2-4
- Enough shared memory and registers are required

---

## Best Practices

### 1. Choosing the Block Size
- It must be a power of two: 32, 64, 128, 256
- Choose according to the data size and the hardware
- Use Autotune to choose automatically

### 2. Memory-Access Optimization
- Use a mask to handle boundaries
- Use `tl.multiple_of` to tell the compiler about alignment
- Consider coalesced memory-access patterns

### 3. Numerical Stability
- Use a float32 accumulator (even when the input is float16 or bf16)
- Subtract the maximum in softmax
- Watch out for floating-point precision

### 4. Debugging Tips
```python
# 使用 tl.device_print 调试
tl.device_print("value", x)

# 验证结果
torch.testing.assert_close(triton_result, pytorch_result)
```

### 5. Performance Analysis
```python
# 使用 triton.testing 基准测试
triton.testing.do_bench(kernel_func)

# 使用 Profiler
with triton.profiler.profile():
    result = kernel(args)
```

---

## References

- [Triton official documentation](https://triton-lang.org/)
- Flash Attention paper: https://arxiv.org/abs/2205.14135
- Example code: the `tutorials/` directory
