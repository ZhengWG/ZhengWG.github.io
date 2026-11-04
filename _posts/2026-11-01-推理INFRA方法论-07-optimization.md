---
layout: post
title: "推理 INFRA 方法论（7）：核心优化：CUDA Graph、投机推理、Overlap 与量化"
date: 2026-11-01 09:00:00 +08:00
categories: [工程篇]
tags: [LLM, AI-Infra, 推理优化]
mathjax: true
description: "把前面各篇的瓶颈诊断落实到执行机制，梳理图捕获、投机验证、多流依赖、算子融合和低精度 kernel 的适用边界。"
image:
  src: /assets/img/inference-infra/covers/07-optimization.webp
  alt: "CUDA Graph replay, speculative verification, compute-transfer overlap, fusion, and low precision."
---

把前面各篇的瓶颈诊断落实到执行机制，梳理图捕获、投机验证、多流依赖、算子融合和低精度 kernel 的适用边界。

## CUDA Graph

核心机制:capture 阶段把一段 stream 上的 kernel launch 序列录成图(节点=kernel,边=依赖),instantiate 后 replay 时一次 API 调用提交整图——CPU launch 成本从 N × 单次下发(裸 `cudaLaunchKernel` ~2μs,PyTorch eager 5-12μs/op)变成一次 ~3μs;本次 1260 个微小节点的 GPU 侧 replay 约 0.96ms，摊到每节点约 0.76μs（含节点执行），不能作为任意 graph 的固定节点税。不开就 host-bound,这是可用性问题不是优化。实测 Qwen3.5-397B-FP8(TP8):每步 decode ~1770 个 kernel,开 Graph 时 B=1 的 TPOT 5.6ms,eager 下 141-146ms 且与 B 无关(慢 25×)——TP8 下最慢 rank 的提交会拖住 AllReduce。把 eager 单步时长除以 kernel 数约为 90μs/个，但这包含等待与执行，不能称为测得的单次 Python 下发耗时。

基础原理:capture 冻结三样东西(判断能否进 graph 的判据):

```
① 内存地址(指针烧进图)
② 按值传的标量参数(seq_len 传 int → 永远是 capture 时的值)
③ grid 配置与 kernel 选择(CPU 侧 if-else 只录当时走的分支)
⟹ 铁律:随步变化的量必须以【固定地址 GPU tensor 的内容】存在
   (slot_mapping / masked_m / block_table 都是这个模式:replay 前 copy_ 更新内容)
```

配套:batch 分桶 capture(1,2,4...256,padding 到最近桶);动态 shape 走 piecewise(attention 留图外 eager)。

如何 debug graph 问题(四步法):

```
① 关 graph 对比:--enforce-eager 结果对了 → 必是"烧死了某个每步变化量"
② capture 期报错(operation not permitted):capture 中做了 sync/malloc/嵌套 capture
   → 定位到子模块(codec 抢 capture 就是这类),显式关掉它的 graph
③ 静默错误(不崩但输出变坏):逐个 dump replay 前后的输入 tensor,
   找"哪个量每步该变但没变"——slot_mapping 写错 KV 槽是经典案例
④ nsys 看 replay 是否真生效:graph launch 应是一个大节点;若仍是碎 launch,
   说明桶没命中(shape 掉出 capture sizes)在走回退路径
```

实测连发 1260 个 kernel，裸 C++ 的主机提交时间为 2.4ms，CUDA Graph 约为 2.9μs。另一组 PyTorch eager/graph 对比的端到端耗时为 12.1/4.9ms，其中 GPU 工作约 4.87ms。主机提交时间与端到端时间需要分开计量；当 CPU 下发能被 GPU 工作覆盖时，降低提交开销带来的端到端收益就会减小。

## 投机推理:EAGLE / MTP / DFlash / DSpark

共同原理:draft 快速出 τ 个候选 → target 一次 forward 并行验证 → 接受采样保证输出分布与原模型严格一致(无损)。收益 = 把 τ 次串行的"读一遍权重"合成一次。

| 方法 | draft 形态 | 核心机制 | 上限/实测 |
| --- | --- | --- | --- |
| EAGLE-3 | 目标模型特征上的小 AR 头 | 特征级自回归 + tree attention 多路验证 | 串行 draft 封顶 2-3× |
| MTP | 模型自带多 token 头(DS/Qwen 原生) | 训练时就学,1 步 τ≈1.8-2;实测 Qwen3.5 3 步接受长度 3.1 | TPOT 1/8/32 并发 2.45/5.1/7.6 ms(不开 5.6/8.9/16.4) |
| DFlash | block diffusion 小模型 | 一次 forward 出整块 draft(并行!)+ 目标模型特征/KV 注入提升接受率 | 6× 无损,比 EAGLE-3 高至 2.5×;Blackwell 上 gpt-oss-120b 达 15× |
| DSpark(DeepSpec) | DFlash 基础上 | ①半自回归生成:找回块内 token 间依赖(纯 diffusion 丢失)②置信度调度验证:只在有把握时投机 | DS-V4 生产 serving 在用 |

对应的系统优化手段:

```
① draft 并行化是新主线:EAGLE 的瓶颈是 draft 自己串行 → DFlash 用 diffusion 一次出块
② 高并发下的投机经济学(DSpark 解决的问题):verify batch = B×τ,大并发时算力被
   verify 膨胀吃掉 → 置信度调度 = 接受率预期低时退化回普通 decode,不为低质量 draft 付验证费
③ 与 CUDA Graph 配合:draft/verify 两套 graph 分别分桶;tree attention 的 mask 走固定 buffer
④ 与 MoE 交互:verify 的 B×τ 个 token 反而提高 M_e —— 投机在 MoE 上有隐藏的正外部性
⑤ 与 MLA 交互：本次实测中，每卡 128 头的 MLA decode 主要受算力限制，verify 的 q_len=2 时 attention 耗时增加到 2.0–2.2 倍。投机验证增加了 attention 工作量，能否获得端到端收益还取决于接受长度。TP 切头后，需按每卡头数重新判断瓶颈。
```

## Multi-Stream Overlap

能重叠的前提:占用不同的硬件资源。 同抢 SM 的两个 kernel 并不真并行(只是分时)。资源清单:

```
SM(计算) / Copy Engine(D2H/H2D,独立 DMA)/ NIC(RDMA 在网卡上飞)/ CPU(下发/前处理)
```

方法论三步:

```
① 找配对:一条流的空闲资源 = 另一条流的瓶颈资源
   例:layer-wise KV 传输(Copy/NIC)∥ 下一层计算(SM)
      DeepEP hook(NIC)∥ shared expert(SM)
      TBO(micro-batch A 的 all2all ∥ B 的 GEMM)
② 建依赖:cudaStreamWaitEvent 让 GPU 自己排序(CPU 不阻塞)
   ★ 双缓冲必须配【反向 event】:生产者复用 buffer 前确认消费者读完
     ——漏掉 = data race 静默错误(不崩,数值慢慢坏)
③ 验收判据:被藏的时间 < 主流时间,且暴露段 = max 而非 sum
   量化:overlap 效率 = 1 − (实测步时间 − max(A,B)) / min(A,B)
```

## 算子融合

为什么融合(三重收益,重要性排序):

```
① 消中间结果的 HBM 往返(主收益):A→B→C 三个 kernel,B 的输入输出各走一遍 HBM;
   融合后中间量活在寄存器/SRAM → I 直接提升(FlashAttention 的本质,见[第0章]({% post_url 2026-01-01-推理INFRA方法论-00-roofline %}))
② 消 launch 税:N 次 launch → 1 次(eager 下每次 5-12μs,decode ~1770 个 kernel 时是主项;CUDA Graph 下仍省每节点 ~0.76μs 和 kernel 自身 ~2μs 的最短执行时间)
③ 910B 特有:碎算子落在弱的 Vector/Scalar 核,融合把负载挪回 Cube → 双重收益
```

简单 demo(RMSNorm + QKV 投影):

```
不融合:read x → RMSNorm → write x' → read x' → GEMM → write qkv     (x' 往返 2 次 HBM)
融合:  read x → norm 在寄存器 → 直接进 GEMM epilogue → write qkv    (省 2·B·d·bpp 流量)
B=256, d=7168：每层减少约 7.3MB 的 HBM 流量；按实测有效带宽估算，约对应 2μs 的搬运时间，并可减少一次 kernel launch。
单独的 RMSNorm kernel 实测为 3.3μs（sgl_kernel）/ 6.9μs（torch）。
CUDA Graph 下 61 层累积 ~0.25ms(eager 口径才到 ~0.5ms)
```

判据(什么能融、什么不能):

```
可融:elementwise 链(add/mul/act/norm)+ GEMM 的 prologue/epilogue → torch.compile/手写
不可融:独立 GEMM 之间、库调用(cuDNN/cuBLAS 黑盒)、复杂 reshape 打断的序列
   → 这些的 launch 税只能靠 CUDA Graph 兜(形状可枚举)或算法级合批(形状动态)
```

## 量化

| 硬件                          | 原生 MMA 支持 | 应走路线                  | 反量化开销的性质                                                                                                                                                    | 适用场景                  |
|-------------------------------|---------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| Hopper (SM90)                 | FP8           | FP8 双边 (DeepGEMM)       | 无反量化：权重激活都是 FP8，直接喂 WGMMA。开销转为升维 (promotion)——每 128 个 K 用 CUDA Core 把 Tensor Core 的部分和乘 scale 升到 FP32。因为 CUDA Core 与 Tensor Core 物理独立，这步能与下一批 矩阵乘(MMA) 重叠 | 通用                      |
| Blackwell (SM100+)            | FP4           | FP4 (DS-V4 路线)          | 同上，粒度更细（权重字节再半）                                                                                                                               | 通用                      |
| Ampere / Turing / NPU         | INT8          | W8A8 双边                 | 无（INT8 直接进 MMA）                                                                                                                                            | 大并发                      |
| Ampere / 老卡 / NPU           | 无 FP8/FP4    | INT4 weight-only (Marlin) | 有真实反量化：INT4 权重必须先解包+乘 scale 还原成 FP16 才能进 MMA。这些指令跑在 CUDA Core 上，只能靠 指令流水并行(ILP) 塞进 MMA 的空隙，塞不下就是净损失          | 小 batch decode / 压显存  |


几个量化库的介绍：

| 特性       | Marlin (ISTA)           | DeepGEMM (DeepSeek)       | Humming (蚂蚁)                         |
|------------|------------------------|---------------------------|----------------------------------------|
| 场景       | W4A16 稠密，B≤32       | FP8 MoE grouped           | 两者都要                               |
| 权重/激活  | INT4 / FP16            | FP8 / FP8                 | INT1-8 + 任意≤8bit 浮点 / 六种激活     |
| scale      | per-group g128         | 1×128 激活，128×128 权重  | 含 UE8M0（DS为国产芯片对齐的格式）     |
| 硬件       | Ampere                 | Hopper                    | SM75+ 全覆盖                           |
| 体积       | 中                     | ~300 行核心               | 100+KB 全库，JIT                       |

- **Marlin 优化：**
  1. **异步全局加载 + 环形共享内存队列**
     权重从显存搬到共享内存的过程用异步拷贝指令发起，不阻塞计算；共享内存里维护一个环形队列做多级缓冲，让“搬第 N+2 块”和“算第 N 块”同时进行。缓冲级数（流水深度）需要调优——级数太少，反量化会等数据到位；级数太多，共享内存装不下，反而降低同时驻留的线程块数量。
  2. **缓存驱逐提示避免二级缓存污染**
     权重是流式访问，每块只读一次就不再用；而激活要被反复复用。如果任由权重填满二级缓存，就会把该留下的激活挤出去。Marlin 给权重的读取加上“读完即可驱逐”的提示，把二级缓存留给真正需要复用的数据。
  3. **共享内存异或交织消除访问冲突**
     共享内存被划分成多个存储体，同一时刻多个线程访问同一存储体会串行化。4 比特权重打包后，相邻数据的地址间隔变了，原本无冲突的访问模式会大量撞车。Marlin 对地址做异或变换重新打散映射，恢复无冲突访问。
  4. **任务调度与同步**
     把矩阵乘按输出块划分成任务，均衡分配到所有流处理器上，避免最后一批任务只占用少数计算单元（即计算资源的“波次量化”损失）。

- **DeepGEMM 优化：**
  1. **两级累加**
     FP8 张量核心内部的累加器精度有限，深度方向（K 维通常七千以上）一路累加会让部分和越滚越大，新加进来的小数值在低位被截断丢失。解法是张量核心只连续累加四条矩阵乘指令（相当于 128 个 K 元素），然后交给 CUDA 计算核心乘上缩放因子、提升到 FP32 寄存器继续累加。实测：全正数据、K=16K 时一路低精度累到底的相对误差约 25%（正态数据只有 0.3%），两级累加约 0.17%，等于 BF16 输出舍入。
  2. **掩码布局**
     专家并行下每个专家每步收到的行数都在变，而 CUDA Graph 要求形状固定。解法是把输入缓冲区的形状固定成“最大行数”，另外用一个存放在显存里的计数张量记录每个专家的真实行数——地址固定（满足图捕获），内容每步可变（满足动态负载）。核函数运行时读这个计数，跳过完全没有数据的块，只对有效行发射计算。配合小的行分块尺寸，把按 tile 计的填充浪费从十倍级压下来（BM=16、M_e≈11 时约 1.4 倍）；tile 还是访存瓶颈时，这部分浪费不占时间。

- **Humming 优化：**
  - 它的判断是：低比特矩阵乘的各项优化手段彼此正交——异步加载和缓冲流水与权重位宽无关；共享内存交织方案只随打包格式变化；反量化插入在哪一级只随数据格式变化；分块尺寸只随矩阵形状变化。手写核函数把这些选择焊死成一种固定组合（所以 Marlin 只做 4 比特权重配 FP16 激活，DeepGEMM 只做 FP8 的专家并行矩阵乘），而即时编译可以在运行时按“权重类型 × 激活类型 × 量化策略 × 硬件代际”的具体组合，现场拼装出对应的特化核函数。
  - 这解释了它的两个特点：
    1. **支持面极广**（8 比特以下任意权重类型、六种激活类型、图灵架构以后的全部 N 卡、稠密与专家并行两种矩阵乘都支持）
    2. **库规模小**（整个库只有一百多 KB，仅依赖 PyTorch 和编译器。项目致谢栏直接列出了 DeepGEMM、Marlin、LMDeploy、CUTLASS 四家。）

## 系列导航

| 章节 | 文章 | 编排日期 |
| --- | --- | --- |
| 0 | [Roofline：用算力与带宽建立性能预算]({% post_url 2026-01-01-推理INFRA方法论-00-roofline %}) | 2026-01-01 |
| 1 | [通信模型：从集合原语到跨机拓扑]({% post_url 2026-02-13-推理INFRA方法论-01-communication %}) | 2026-02-13 |
| 2 | [分布式推理：TP、DP、EP、CP 与 PP 的取舍]({% post_url 2026-03-29-推理INFRA方法论-02-parallelism %}) | 2026-03-29 |
| 3 | [推理硬件：GPU、NPU 与存储层级]({% post_url 2026-05-11-推理INFRA方法论-03-hardware %}) | 2026-05-11 |
| 4 | [Attention 演变：从 GQA、MLA 到混合状态]({% post_url 2026-06-24-推理INFRA方法论-04-attention %}) | 2026-06-24 |
| 5 | [MoE 推理：Batch、DeepEP、DeepGEMM 与负载均衡]({% post_url 2026-08-06-推理INFRA方法论-05-moe %}) | 2026-08-06 |
| 6 | [PD 与 EPD：阶段分离、状态传输与资源配比]({% post_url 2026-09-19-推理INFRA方法论-06-pd-epd %}) | 2026-09-19 |
| 7 | **核心优化：CUDA Graph、投机推理、Overlap 与量化（本篇）** | 2026-11-01 |

上一篇：[PD 与 EPD：阶段分离、状态传输与资源配比]({% post_url 2026-09-19-推理INFRA方法论-06-pd-epd %})
