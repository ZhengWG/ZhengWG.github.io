---
title: "2D Detection: Model Acceleration (Network Design)"
description: "Covers network-side acceleration for detection models: the lightweight networks SqueezeNet, MobileNet and ShuffleNet, OneNet's NMS-free design, and network pruning."
---
- [Preface](#sec-1)
- [Details](#sec-2)
  - [Network Acceleration](#sec-2-1)
    - [SqueezeNet](#sec-2-1-1)
    - [MobileNet](#sec-2-1-2)
    - [ShuffleNet](#sec-2-1-3)
    - [OneNet](#sec-2-1-4)
    - [Network Pruning](#sec-2-1-5)

# Preface<a id="sec-1"></a>

Accelerating a deep learning network has two parts: acceleration on the network-structure side and acceleration on the engineering side. Network-level acceleration mainly optimizes the network structure, and focuses on the network's amount of computation and number of parameters.

# Details<a id="sec-2"></a>

## Network Acceleration<a id="sec-2-1"></a>

In image detection, the speed bottleneck on the network side lies mostly in the backbone, so many network acceleration tricks are built around the backbone. Below we introduce three commonly used lightweight networks: SqueezeNet, MobileNet, and ShuffleNet.

From them we can learn some general strategies for designing lightweight networks. We also add one more network, OneNet, which mainly explores an `NMS-free` scheme for object detection. Finally, we add a plug-and-play network acceleration strategy: network pruning.

### SqueezeNet<a id="sec-2-1-1"></a>

[SqueezeNet](https://arxiv.org/pdf/1602.07360.pdf) was published at ICLR in 2017. When it was published it claimed performance similar to AlexNet with only 1/50 of AlexNet's parameters. Its core structure is the `Fire module`, and the whole network is built by stacking this module: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E7%BD%91%E7%BB%9C%E5%8A%A0%E9%80%9F_20210904_140649.png) The module has two parts, `squeeze` and `expand`:

The squeeze layer uses 1x1 convolutions to reduce the channel dimension, which compresses the features. The expand layer then contains two kinds of convolutions in parallel, 3x3 and 1x1, in order to obtain receptive fields of different sizes. Finally, all the feature maps produced by the expand layer are concatenated into the output feature map. SqueezeNet's key ideas fall into two aspects:

-   Smaller convolution kernels: going from AlexNet to SqueezeNet, we can see that large kernels are avoided as much as possible, or a large kernel can be replaced by several small kernels (the same receptive field, but fewer parameters and better results).
-   The squeeze-expand operation: squeeze reduces the amount of computation, and expand limits the loss of accuracy. Traces of this kind of operation can be seen in the later Inception networks (for the Inception series see [2D_Detection-BackBone](https://johneyzheng.top/posts/2D_Detection-Backbone)).

### MobileNet<a id="sec-2-1-2"></a>

[MobileNet](https://arxiv.org/pdf/1704.04861.pdf) is a classic of lightweight networks. Its key contribution is `separable convolution`, which is introduced in [2D_Detection-Basic Deep Learning Units](https://johneyzheng.top/posts/2D_Detection-%E5%9F%BA%E6%9C%AC%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E5%8D%95%E5%85%83).

Its core idea is to split an ordinary convolution into two parts: `depthwise convolution` and `pointwise convolution`. The convolution evolves as follows: first, each channel of the input feature map (assume M channels) is convolved separately, and the results are concatenated into an intermediate feature map; then a pointwise convolution (1x1xMxN) produces the final feature map with N channels. The ratio of the computation of a separable convolution to that of an ordinary convolution is $1/N + 1/(D_k\*D_k)$, where $D_k$ is the kernel size used by the depthwise convolution (usually 3). Because N is usually large, the final ratio is close to 1/9. The core structure is illustrated below: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E7%BD%91%E7%BB%9C%E5%8A%A0%E9%80%9F_20210904_143655.png)

Separable convolution does cost some accuracy. [MobileNetV2](https://arxiv.org/abs/1801.04381) and [MobileNetV3](https://arxiv.org/pdf/1905.02244.pdf) later made a series of optimizations on top of V1, aiming to improve accuracy while keeping the network lightweight. The improvements are as follows. MobileNetV2:

-   `Inverted Residual Block`: its core has two parts, a residual structure and an hourglass structure. The residual structure follows ResNet. The key of the hourglass structure is again the use of 1x1 convolutions to raise and lower the dimension, in the order: 1x1 dimension increase -> separable convolution -> 1x1 dimension reduction.
-   `ReLU6`: MobileNetV1 uses the ReLU6 function: $relu6(x)=min(max(x, 0), 6)$. The advantage of this activation function is that it limits the range of the ReLU output, so that numerical resolution stays good even in the low-precision FP16 mode on mobile devices. Its problem is the loss it brings to the feature output, because it truncates at both ends, and the loss is especially visible for low-dimensional features. Therefore MobileNetV2's activation strategy is: high-dimensional feature outputs (the 1x1 dimension increase and the separable convolution output) still use the ReLU6 activation, but after the dimension reduction a linear activation is used directly.

MobileNetV3:

-   Fine-tuned network structure: the authors mainly adjust the tail of the network. The core idea is still to change dimensions with 1x1 convolutions and to shrink the feature map, which lowers the amount of computation: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E7%BD%91%E7%BB%9C%E5%8A%A0%E9%80%9F_20210904_150443.png)

-   Introducing the SE module: a plug-and-play module whose core is a channel attention module. The authors use a few tricks when introducing it to reduce its time cost: the SE module is placed after the depthwise convolution, the pooled channel features are first shrunk by 4x through an fc layer and then restored through another fc layer, and the result is then combined with the features after the depthwise convolution by element-wise addition: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E7%BD%91%E7%BB%9C%E5%8A%A0%E9%80%9F_20210904_151208.png)

-   Activation function: the core point is that the `sigmoid` activation is slow, so the `h-swish` activation is used instead. It is implemented on top of ReLU, so it is faster and more compatible.

### ShuffleNet<a id="sec-2-1-3"></a>

The ShuffleNet series consists of two papers: [ShuffleNetV1](https://arxiv.org/abs/1707.01083) and [ShuffleNetV2](https://arxiv.org/abs/1807.11164). In my opinion, the series offers two main insights:

1.  It proposes the concept of `Channel shuffle`, which can be implemented with ordinary tensor operations. To some extent this provides a more lightweight way to fuse features across channels (compared with channel fusion based on 1x1 convolutions).
2.  It discusses the basic rules of designing a high-performance network from the viewpoint of real hardware inference (GPU, presumably?), which is a useful reference.

The core of ShuffleNetV1 is the concept of `Channel shuffle`. On top of separable convolution it designs a lighter network structure: 1x1 group convolution plus Channel shuffle replace the original pointwise convolution to fuse features between channels: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F%28%E7%BD%91%E7%BB%9C%E7%AF%87%29_20210904_154436.png)

ShuffleNetV2 to some extent overturns the design of ShuffleNetV1 (my personal view). From the viewpoint of model inference, the authors found that networks with the same FLOPs (the number of computations in one inference) can still have different inference speeds. Two more key factors affect inference speed: memory access cost (MAC) and the degree of parallelism of the network. On this basis the authors propose 4 basic principles for building a high-performance network:

-   When the input and output features of a layer are the same, MAC is smallest and speed is fastest
-   Too many group convolutions increase MAC
-   Too much fragmentation in the network, such as too many branches, hurts speed
-   Element-wise operations have very low FLOPS but high MAC, and also hurt speed

On this basis, the authors found some unreasonable designs in ShuffleNetV1 and designed the new ShuffleNetV2 structure: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F%28%E7%BD%91%E7%BB%9C%E7%AF%87%29_20210904_155230.png)

### OneNet<a id="sec-2-1-4"></a>

The sections above mostly introduced acceleration strategies at the backbone level. [OneNet](https://peizesun.github.io/OneNet.pdf) instead designs an NMS-free detection scheme at the detection-network level. From the viewpoint of the overall scheme, its advantages are:

-   A fully convolutional network
-   No NMS or self-attention module

The core of OneNet is the sample matching strategy used in training, that is, how to make the network learn a `one-to-one` matching strategy.

OneNet's sample matching is based on the `minimum cost` method. Concretely, during sample matching in training, it first computes each sample's loss, then computes a cost from the loss, and finally selects the sample with the minimum cost as the matched object. The cost is defined as the sum of the classification loss and the location loss between the sample and the gt: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-09-04-2D_Detection-%25E6%25A8%25A1%25E5%259E%258B%25E5%258A%25A0%25E9%2580%259F%2528%25E7%25BD%2591%25E7%25BB%259C%25E7%25AF%2587%2529/2d_detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F%28%E7%BD%91%E7%BB%9C%E7%AF%87%29_20210904_160315.png)

The authors state in the paper that the classification loss is the key to removing NMS, whereas methods such as Faster-RCNN/SSD/YOLO/FCOS, which rely on box IoU, point distance, object scale, and so on, only consider the location cost.

### Network Pruning<a id="sec-2-1-5"></a>

Network pruning can be regarded as a general network acceleration strategy, usually used to speed up a network after the network design has been fixed. Microsoft's open-source [NNI](https://github.com/microsoft/nni) toolkit provides a number of commonly used model pruning and quantization strategies.

Pruning works because deep models are over-parameterized, which can also be seen as a form of overfitting. By principle, network pruning falls into two categories: structured pruning and unstructured pruning.

Structured pruning is usually model trimming at a high level, such as channel-level, vector-level, and filter-level. In my opinion it depends to some extent on experience, and some of the network structure designs mentioned earlier can also be regarded as structured pruning to some degree. In addition, NAS (Neural Architecture Search) based model structure search can usually also be applied to search for pruned structures.

Unstructured pruning trims model weights at a finer granularity: it turns a dense parameter matrix into a sparser one. The general procedure is:

-   First train a large model normally
-   Decide which layers to prune and design the parameters; based on those parameters, prune the weights with smaller values in the network
-   Fine-tune the pruned network

In general, structured pruning brings a clear network speedup but may lose some accuracy (if resources allow, NAS-based search is usually more effective). Unstructured pruning does not necessarily lose accuracy, but because the sparse matrix is non-contiguous, it does not necessarily speed up inference in real deployment.
