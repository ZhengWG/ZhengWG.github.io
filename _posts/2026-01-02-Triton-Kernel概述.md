---
layout: post
title: Triton Kernel概述
date: 2026-01-02 18:43:50.000000000 +09:00
categories: [工程篇]
tags: [Kernel]
mathjax: true
---

## 目录
1. [基本背景](#基本背景)
2. [基本语法](#基本语法)
3. [核心概念](#核心概念)
4. [详细示例：Flash Attention](#详细示例flash-attention)
5. [高级优化技巧](#高级优化技巧)

---

## 基本背景

### 什么是 Triton
- **定义**: Triton 是面向 GPU 的 Python 编程语言和编译器
- **目标**: 简化 GPU kernel 编写，无需 CUDA/HIP 的底层知识
- **优势**: 
  - Python 语法，易于编写和维护
  - 自动优化内存访问和调度
  - 支持自动调优 (Autotune)

### 适用场景
- 融合算子 (Fused Operators)
- 自定义优化算法 (如 Flash Attention)
- 性能敏感的计算密集型任务

---

## 基本语法

### 1. Kernel 定义
```python
import triton
import triton.language as tl

@triton.jit
def kernel_name(x_ptr, y_ptr, n_elements, BLOCK_SIZE: tl.constexpr):
    # kernel 代码
    pass
```

**要点**:
- `@triton.jit`: 装饰器标记 Triton kernel
- `tl.constexpr`: 编译时常量，必须是 2 的幂

### 2. 程序 ID 和偏移量
```python
pid = tl.program_id(axis=0)  # 当前程序块的 ID
block_start = pid * BLOCK_SIZE
offsets = block_start + tl.arange(0, BLOCK_SIZE)  # [0, 1, 2, ..., BLOCK_SIZE-1]
```

### 3. 内存操作
```python
# 加载
mask = offsets < n_elements
x = tl.load(x_ptr + offsets, mask=mask)

# 存储
tl.store(output_ptr + offsets, result, mask=mask)
```

### 4. 常用操作
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

### 5. 循环
```python
# 标准循环
for i in range(0, K, BLOCK_SIZE_K):
    # 处理逻辑
    
# 支持自动流水线
for i in tl.range(0, K, BLOCK_SIZE_K, num_stages=3):
    # 编译器自动流水线化
```

---

## 核心概念

### Block 概念
- **Block**: 每个程序实例处理的数据块
- **Block Size**: 必须是 2 的幂 (32, 64, 128, ...)
- **Block Pointer**: 指向数据的指针

### Launch Grid
```python
def grid(META):
    return (triton.cdiv(n_elements, META['BLOCK_SIZE']),)

kernel[grid](args)
```

### 数据类型
- `tl.float16`, `tl.bfloat16`, `tl.float32`, `tl.int32`, `tl.int64`
- `tl.float8e5`, `tl.float8e4nv` (FP8 格式)
- `tl.constexpr`: 编译时常量

---

## 详细示例：Flash Attention

Flash Attention 是 Triton 的经典应用，展示了如何实现内存高效的注意力机制。

### 算法核心思想

传统注意力计算需要存储完整的注意力矩阵 (O(N²) 内存)，Flash Attention 通过分块计算和在线 softmax，将内存复杂度降低到 O(N)。

### 完整实现

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

### 关键技术点

1. **在线 Softmax**: 使用 `m_i` (最大值) 和 `l_i` (归一化因子) 实现数值稳定的在线 softmax
2. **分块计算**: Q 只加载一次，K/V 分块加载，避免存储完整注意力矩阵
3. **两阶段处理**: 因果注意力通过 off-band 和 on-band 两阶段实现
4. **数值稳定**: 使用最大值修正避免溢出

---

## 高级优化技巧

### 1. TMA (Tensor Memory Accelerator)

**用途**: Hopper (H100+) GPU 硬件加速的内存访问

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

**优势**:
- 硬件自动处理边界检查
- 降低寄存器压力
- 更高的内存带宽

**要求**: Compute Capability >= 9.0

### 2. Warp Specialization

**用途**: 让不同 warp 执行不同任务，提高硬件利用率

```python
# 在循环中启用
for i in tl.range(0, N, BLOCK_N, warp_specialize=True):
    # 编译器自动将操作分配到不同的 warp groups:
    # - Memory warp: 负责加载数据
    # - Compute warp: 负责计算
    pass
```

**优势**:
- 重叠内存访问和计算
- 提高指令级并行度

**要求**: 主要用于 Blackwell，正在扩展到其他架构

### 3. Persistent Kernel (Persistent PID 优化)

**用途**: 固定线程块数，每个线程块处理多个 tile，减少上下文切换

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

**关键点**:
- Grid size = `min(NUM_SMS, num_tiles)` 而非 `num_tiles`
- 使用独立的计数器实现计算-写回流水线
- `flatten=True` 启用循环扁平化以支持软件流水线

**优势**:
- 减少上下文切换开销
- 更好的 SM 占用率
- 支持软件流水线

### 4. Low-Memory 优化 (Seeded PRNG)

**用途**: 使用伪随机数生成器按需生成数据，而非存储完整状态

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

**关键技术**:
- `tl.rand(seed, offsets)`: 使用 `(seed, offset)` 作为 PRNG 输入
- 确定性: 相同的 `(seed, offset)` 产生相同的随机数
- 内存从 O(N) 降低到 O(1) (只需一个 seed 值)

**优势**:
- 大幅降低内存占用
- 不需要存储完整的 mask tensor
- 可重现（相同 seed 产生相同结果）

### 5. Parallel Reduction 优化

**用途**: 高效的并行归约操作（如 softmax、layer norm）

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

**优化技巧**:
- **多阶段流水线**: `num_stages=4` 启用软件流水线
- **多行处理**: 每个程序处理多个行，减少 kernel 启动开销
- **融合操作**: 一次遍历完成 max、exp、sum、normalize

**Triton 自动优化**:
- 编译器自动将 `tl.max` 和 `tl.sum` 转换为高效的 warp-level reduction
- 使用共享内存进行跨 warp reduction
- 自动处理数据布局优化

### 6. Autotune

**用途**: 自动选择最优配置

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

**用途**: 将输出分成小块，减少共享内存使用

```python
if EPILOGUE_SUBTILE:
    # 将 accumulator 分成两部分
    acc0, acc1 = split_accumulator(accumulator)
    c_desc.store([offs_m, offs_n], acc0)
    c_desc.store([offs_m, offs_n + BLOCK_N // 2], acc1)
else:
    c_desc.store([offs_m, offs_n], accumulator)
```

**优势**: 释放共享内存，可用于增加 pipeline stage

### 8. 软件流水线 (Software Pipelining)

**用途**: 重叠内存访问和计算

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

**关键参数**:
- `num_stages`: 流水线阶段数，通常 2-4
- 需要足够的共享内存和寄存器

---

## 最佳实践

### 1. Block Size 选择
- 必须是 2 的幂: 32, 64, 128, 256
- 根据数据大小和硬件特性选择
- 使用 Autotune 自动选择

### 2. 内存访问优化
- 使用 mask 处理边界
- 利用 `tl.multiple_of` 提示编译器对齐
- 考虑内存合并访问模式

### 3. 数值稳定性
- 使用 float32 accumulator (即使输入是 float16/bf16)
- Softmax 时减去最大值
- 注意浮点精度问题

### 4. 调试技巧
```python
# 使用 tl.device_print 调试
tl.device_print("value", x)

# 验证结果
torch.testing.assert_close(triton_result, pytorch_result)
```

### 5. 性能分析
```python
# 使用 triton.testing 基准测试
triton.testing.do_bench(kernel_func)

# 使用 Profiler
with triton.profiler.profile():
    result = kernel(args)
```

---

## 参考资料

- [Triton 官方文档](https://triton-lang.org/)
- Flash Attention 论文: https://arxiv.org/abs/2205.14135
- 示例代码: `tutorials/` 目录
