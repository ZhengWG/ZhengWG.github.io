---
title: "2D Detection: General Detection Tricks"
description: "Summarizes general detection tricks for three scenarios: sample imbalance, small object detection, and dense or occluded scenes."
---
- [Preface](#sec-1)
- [Details](#sec-2)
  - [Sample Imbalance](#sec-2-1)
    - [Common Hard Example Strategies](#sec-2-1-1)
    - [Focal Loss and Its Variants](#sec-2-1-2)
  - [Small Object Detection](#sec-2-2)
    - [How to Fuse Multi-Scale Features](#sec-2-2-1)
    - [Looking at Detection Beyond the bbox](#sec-2-2-2)
  - [Dense and Occluded Scenes](#sec-2-3)
    - [Problems Caused by NMS](#sec-2-3-1)
    - [How to Make Boxes More Accurate?](#sec-2-3-2)
    - [How to Handle Highly Overlapping Scenes?](#sec-2-3-3)

# Preface<a id="sec-1"></a>

In general, a single detection model can rarely cover every scenario. Using different detection frameworks, training data, and training strategies for different scenarios is also very important. In this article I briefly summarize several common detection scenarios and introduce some general detection tricks for each of them:

-   The sample imbalance scenario
-   The small object detection scenario
-   The dense occlusion scenario

# Details<a id="sec-2"></a>

## Sample Imbalance<a id="sec-2-1"></a>

### Common Hard Example Strategies<a id="sec-2-1-1"></a>

`OHEM` (Online Hard Example Mining) was first proposed in [Training Region-based Object Detectors with Online Hard Example Mining](https://arxiv.org/pdf/1604.03540.pdf). Its core is to select `hard example`s as training samples to improve the network parameters. The `hard example`s are selected by the sample loss. Selecting directly by loss has the problem that there are many overlapping positive examples, so the authors use the result after `NMS`: an overlap above the threshold of 0.7 is considered a high overlap and is removed. Taking `Faster RCNN` as an example, the `ROI network` of `Fast RCNN` is split into two parts: one part is a read-only network that supports only forward inference; the other part supports both forward and backward passes. In actual training, the read-only network first runs a forward pass to get the loss of all ROIs, then a `hard ROI sampler` picks the `hard example`s according to the loss, and these `hard example`s are used as the input of the trained `ROI network`. The network structure is as follows:

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-03-2D_Detection-%25E9%2580%259A%25E7%2594%25A8%25E6%25A3%2580%25E6%25B5%258BTricks/2d_detection-%E9%80%9A%E7%94%A8%E6%A3%80%E6%B5%8BTricks_20211003_150730.png)

### Focal Loss and Its Variants<a id="sec-2-1-2"></a>

For `Focal Loss` and its variants, see [2D_Detection-Loss](https://johneyzheng.top/posts/2D_Detection-Loss/#sec-2-3-1). The core idea is to adjust the training tendency through losses that weight objects of different difficulty differently, so that `hard case`s receive more attention in the later stage of training and performance improves.

## Small Object Detection<a id="sec-2-2"></a>

For the One-Stage detection framework, here is a brief analysis of why small object detection performs poorly:

-   `Feature Map` size: downsampling in the `Feature Map` loses the features of small objects.
-   `Anchor` assignment: under the same conditions, small objects match fewer positive examples in `Anchor` assignment.

For reference: [A Survey of Recent Research on Small Object Detection in 2021](http://sjcj.nuaa.edu.cn/sjcjycl/article/html/202103001), which covers research on small object detection fairly comprehensively. [Awesome Tiny Object Detection](https://github.com/kuanhungchen/awesome-tiny-object-detection) collects a comprehensive set of papers and dataset introductions.

### How to Fuse Multi-Scale Features<a id="sec-2-2-1"></a>

Fusing multi-scale features is a common way to improve small object detection, and the classic framework for it is [RetinaNet](https://arxiv.org/pdf/1612.03144.pdf). `RetinaNet` uses an FPN network design. The core of the design is to fuse high-semantic features with large-scale features by fusing the features of large and small `feature map`s. The network structure is as follows:

 ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-03-2D_Detection-%25E9%2580%259A%25E7%2594%25A8%25E6%25A3%2580%25E6%25B5%258BTricks/2d_detection-%E9%80%9A%E7%94%A8%E6%A3%80%E6%B5%8BTricks_20211002_231923.png)

In addition, the fusion of `feature map`s happens mainly at the `backbone` level, where `DetNet` optimizes on top of the traditional `FPN`. See [2D_Detection-Backbone(DetNet)](https://johneyzheng.top//posts/2D_Detection-Backbone/#detnet)

### Looking at Detection Beyond the bbox<a id="sec-2-2-2"></a>

Detection based on bboxes inevitably leads to the problem of `Anchor competition`, which can be eased by optimizing the `sample strategy` and by `data augmentation`. There are also schemes that set aside the basic bbox detection scheme and approach the problem from other angles: the engineering side, and non-bbox schemes.

The engineering side (this wording may not be very rigorous) means looking at small object detection from the viewpoint of actual deployment. Small objects are small relative to a large input image, so the input image can be cropped to turn small objects into large ones, which addresses missed detections of small objects, and a final round of `nms` is then done on the full large image. Of course, this scheme inevitably slows things down. For an implementation, see [You only look twice](https://arxiv.org/pdf/1805.09512.pdf).

Non-bbox schemes are designed mainly to avoid problems at the `Anchor` level. The most common idea is to detect `Key points` on a larger `Feature map` and obtain the final detection boxes from the key points. Typical frameworks include [CornerNet](https://arxiv.org/pdf/1808.01244.pdf) and [CenterNet](https://arxiv.org/pdf/1904.07850.pdf).

## Dense and Occluded Scenes<a id="sec-2-3"></a>

### Problems Caused by NMS<a id="sec-2-3-1"></a>

NMS mainly cleans up overlapping boxes and keeps the main box with the highest score. The implementation steps in code are:

-   Sort all boxes by score in ascending order
-   Check whether the box sequence is empty
    -   Save the index of the current box
    -   Compute the IoU between the box with the highest score and the remaining boxes
    -   Remove the boxes whose IoU exceeds the threshold, which leaves the remaining box sequence
    -   Update the box sequence

The drawback of simple NMS is that it may directly filter out boxes with a low score and a high overlap, which can cause missed detections, especially in crowded or occluded scenes. Improvements based on simple `NMS` include:

-   [soft_nms](https://johneyzheng.top//posts/nms_soft-nms/): when several objects overlap, traditional nms filters out the low-scoring objects, which is too crude. `soft-nms` takes the computed `iou` and the box's own score as inputs, recomputes the box's confidence, and finally decides from the new confidence whether to remove the box.
-   [softer_nms](https://arxiv.org/abs/1809.08545): introduces a branch that describes the accuracy of the box during training (constrained by the KL divergence between the predicted value and the GT value), and then uses the predicted box confidence as the weight in the nms decision. The box-confidence branch of `softer nms` is in fact similar in some ways to `QFocal loss` and the `IoU Branch` (both introduced below).

### How to Make Boxes More Accurate?<a id="sec-2-3-2"></a>

1. IoU Branch && Centerness

   `IoU Branch` and `Centerness` are both designed to evaluate box confidence (or box quality) through an extra branch, and to combine it with the classification and regression branches to obtain more accurate boxes. The `IoU Branch` was first proposed by [IoU Net](https://link.zhihu.com/?target=https%3A//arxiv.org/abs/1807.11590); the network structure of `IoU Net` is shown below. It can predict the `IoU` between a detected bounding box and its corresponding ground-truth box, so that the network, like its classification module, has a sense of how accurately a detection box is localized. During inference, the predicted `IoU` can be used as the filtering mechanism of the subsequent `NMS`.

   ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-03-2D_Detection-%25E9%2580%259A%25E7%2594%25A8%25E6%25A3%2580%25E6%25B5%258BTricks/2d_detection-%E9%80%9A%E7%94%A8%E6%A3%80%E6%B5%8BTricks_20211001_205649.png)

   `Centerness` comes from [FCOS](https://arxiv.org/pdf/1904.01355.pdf), which is itself an `Anchor-Free` detection algorithm. It adds a `centerness` branch (parallel to the classification branch) to improve the quality of the predicted boxes. `centerness` is defined as follows:

   
   $$
   centerness^{*} = \sqrt{\frac{min(l^*, r^*)}{max(l^*, r^*)}*\frac{min(t^*, b^*)}{max(t^*, b^*)}}
   $$
   

   ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-03-2D_Detection-%25E9%2580%259A%25E7%2594%25A8%25E6%25A3%2580%25E6%25B5%258BTricks/2d_detection-%E9%80%9A%E7%94%A8%E6%A3%80%E6%B5%8BTricks_20211002_215651.png)

2.  QFocal Loss

    `QFocal Loss` comes from [Generalized Focal Loss](https://arxiv.org/pdf/2006.04388.pdf). Its core is to combine the definition of `centerness` with `Focal Loss`, which is equivalent to optimizing the classification branch and the centerness branch of `FCOS` together. For details see [2D_Detection-Loss](https://johneyzheng.top/posts/2D_Detection-Loss/#sec-2-3-2).

### How to Handle Highly Overlapping Scenes?<a id="sec-2-3-3"></a>

Detection performance drops on highly overlapping objects mainly because of the `Anchor` assignment problem:

 For `Anchor` assignment across multiple `Feature map` levels, the most basic approach matches objects by the `Anchor size` of each level. Another classic approach assigns by size and center-point position; see [FCOS](https://arxiv.org/pdf/1904.01355.pdf).

For `Anchor` assignment within a single `Feature map` level (more common, and harder to solve), a classic solution is to change the `Anchor match` method at the same position so that a single `Anchor` can match multiple objects. In detail: instead of the original `max iou` matching, a `TopK` matching is used, so that in crowded scenes a single `Anchor` can predict multiple objects. See [One Proposal, Multiple Predictions](https://arxiv.org/pdf/2003.09163.pdf). The matching result:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-03-2D_Detection-%25E9%2580%259A%25E7%2594%25A8%25E6%25A3%2580%25E6%25B5%258BTricks/2d_detection-%E9%80%9A%E7%94%A8%E6%A3%80%E6%B5%8BTricks_20211003_002746.png)
