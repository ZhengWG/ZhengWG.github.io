# English terminology

Use the established English term. Do not coin a new name when the literature or the article already has one. Keep numbers, units, formulas, URLs, image paths, and fenced code exactly as written.

## Inference systems

- 推理: inference. 训练: training. 部署: deployment. 推理服务: inference serving.
- 算力: compute throughput, in FLOP/s. In the Roofline articles, F is peak FLOP/s. Do not write "compute power".
- 带宽: bandwidth. 算术强度: arithmetic intensity. 硬件转折点 / 拐点: ridge point (Williams, Waterman, Patterson, the Roofline model).
- 访存 / 搬运: memory traffic. HBM stays HBM. 显存: GPU memory, or HBM when the sentence is about HBM.
- 量化: quantization. 合批 / batch: batching. 连续批处理: continuous batching (Orca).
- 算子融合: operator fusion. GPU kernel stays kernel. 算子, when it means a GPU kernel, is kernel; when it means a framework operator, is operator.
- 投机推理: speculative decoding. 投机验证: verification in speculative decoding. Do not write "speculative inference".
- CUDA Graph, capture, replay: CUDA Graph, capture, replay.
- Overlap of compute and communication: overlap. 多流: multiple CUDA streams.
- Prefill, Decode, KV cache: prefill, decode, KV cache. 编码 in the EPD articles is the encoder stage.
- PD 分离: prefill–decode disaggregation. EPD: encoder–prefill–decode disaggregation.
- TP / DP / EP / CP / PP: tensor / data / expert / context / pipeline parallelism.
- 集合通信: collective communication. Keep AllReduce, AllGather, Reduce-Scatter, NVLink, RDMA, NUMA, PCIe, InfiniBand.
- MoE: Mixture-of-Experts. 专家: expert. 负载均衡: load balancing. 负载倾斜: load imbalance.
- 专家覆盖率: the fraction of experts that receive tokens. Call it expert coverage only when the article is counting experts touched by the batch.
- Attention, GQA, MQA, MHA, MLA: attention, grouped-query attention, multi-query attention, multi-head attention, multi-head latent attention. Expand once, then use the acronym. Keep GDN as the article defines it.
- 前缀缓存: prefix caching. SGLang's radix cache stays RadixAttention / radix cache when the article is about that design.
- 位置编码: positional encoding. RoPE stays RoPE.
- MFU: model FLOPs utilization. SLO: service-level objective. 准入: admission control.
- 图编译: graph compilation. Triton, GEMM, FlashAttention, DeepEP, DeepGEMM: keep those names.
- 低精度: low precision. FP8, INT8, W8A8: keep the tokens.
- tile: tile. 片上缓存 / SMEM: on-chip memory / shared memory, matching the sentence.

## Series titles

Use these titles and descriptions verbatim.

- `推理INFRA方法论-00-roofline`: title `Inference Infrastructure (0): Roofline: Performance Budgets from Compute and Bandwidth`. card_title `Roofline: performance budgets`. description `Start from arithmetic intensity, the ridge point, and measured HBM traffic to decide whether GEMM and attention are compute-bound or bandwidth-bound, and when quantization, batching, or fusion applies.`
- `推理INFRA方法论-01-communication`: title `Inference Infrastructure (1): Communication: From Collective Primitives to Cross-Node Topology`. card_title `From collectives to cross-node topology`. description `Decompose collective communication into step count, launch latency, and bytes per GPU, then use NVLink, RDMA, NUMA, and PCIe topology to explain measured differences.`
- `推理INFRA方法论-02-parallelism`: title `Inference Infrastructure (2): Distributed Inference: Choosing TP, DP, EP, CP, and PP`. card_title `Parallelism is a set of system trade-offs`. description `Reason about parallel layouts for attention and MoE from the budgets for weights, the KV cache, activations, and communication, including the extra constraints of long context and pipeline parallelism.`
- `推理INFRA方法论-03-hardware`: title `Inference Infrastructure (3): Inference Hardware: GPUs, NPUs, and the Memory Hierarchy`. card_title `GPUs, NPUs, and the memory hierarchy`. description `Put compute throughput, HBM, on-chip memory, and interconnect on one budget, and see why different hardware needs different kernels and deployment choices.`
- `推理INFRA方法论-04-attention`: title `Inference Infrastructure (4): Attention: From GQA and MLA to Hybrid State`. card_title `From GQA and MLA to hybrid state`. description `Use KV capacity, bytes read per step, and how the operator can be split to see how MLA, GDN, and compressed attention change the inference system.`
- `推理INFRA方法论-05-moe`: title `Inference Infrastructure (5): MoE Inference: Batching, DeepEP, DeepGEMM, and Load Balancing`. card_title `MoE inference: batching, DeepEP, DeepGEMM, and load balancing`. description `Follow batch size through expert coverage, communication volume, tile fill, and load imbalance, and check the analytical budget against end-to-end measurements.`
- `推理INFRA方法论-06-pd-epd`: title `Inference Infrastructure (6): PD and EPD: Disaggregation, State Transfer, and Resource Allocation`. card_title `PD and EPD: disaggregation, state transfer, and resource allocation`. description `Model the encoder, prefill, and decode separately, account for the transfer cost of embeddings and the KV cache, and derive machine ratios and admission control from the target SLO.`
- `推理INFRA方法论-07-optimization`: title `Inference Infrastructure (7): Execution: CUDA Graph, Speculative Decoding, Overlap, and Quantization`. card_title `CUDA Graph, speculative decoding, overlap, and quantization`. description `Turn the earlier bottleneck diagnosis into execution mechanisms, and state where CUDA Graph capture, speculative verification, multi-stream dependencies, operator fusion, and low-precision kernels apply.`

## Other established names

- FlashAttention, PagedAttention, RadixAttention, continuous batching, chunked prefill: keep.
- LoRA / Multi-LoRA: LoRA / multi-LoRA.
- RLHF, PPO, DPO, reward model: keep the usual names. 奖励模型: reward model. 策略模型: policy model. 参考模型: reference model.
- 长思维链 / Long-CoT: long chain-of-thought.
- Design patterns, GoF names: Singleton, Factory Method, Abstract Factory, Builder, Prototype, Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy, Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor. 职责模式: Chain of Responsibility. 克隆模式: Prototype. 构建模式: Builder. 监听模式: Observer. 备忘模式: Memento. 过滤器模式: Filter. 对象池: Object Pool. 回调: callback.
- 目标检测: object detection. 骨干网络: backbone. NMS: non-maximum suppression. Soft-NMS stays Soft-NMS. 锚框: anchor box.
- 非极大值抑制: non-maximum suppression.
- C++ and Python standard names stay as in the language: RAII, STL, move semantics, smart pointer, decorator, context manager, metaclass, garbage collection.
- Product names stay: SGLang, vLLM, vLLM-Omni, PyTorch, ONNX, TensorRT, CUDA, Triton, Keras, YOLO, SSD, BERT, Emacs, Org mode, Jekyll, Clash Verge, MathJax, Mermaid.
