---
layout: post
title: 2D检测算法综述(2D Detection)
date: 2021-07-25 17:19:40.000000000 +09:00
categories: [算法篇]
tags: [CV, 综述]
---
- [前言](#sec-1)
- [公开数据集](#sec-2)
- [经典论文](#sec-3)
- [基本结构](#sec-4)
- [Backbone](#sec-5)
- [超参](#sec-6)
- [Loss](#sec-7)
- [经典检测经典框架](#sec-8)
- [网络加速](#sec-9)
- [通用检测Tricks](#sec-10)
- [部分论文解读Links](#sec-11)

# 前言<a id="sec-1"></a>

本文旨在总结之前自己涉及的 `2D-Detection` 相关的知识内容，按照下文组织内容，分篇章不定时更新。

主要参考来源：

-   `<<深度学习之Pytorch物体检测实战>>`
-   网络: `知乎` / `CSDN` etc

# 公开数据集<a id="sec-2"></a>

常用的数据集链接如下：

-   2D物体检测数据集:
    -   [Pascal VOC](https://pjreddie.com/projects/pascal-voc-dataset-mirror/)
    -   [Object365](http://www.objects365.org/overview.html)
    -   [COCO](https://cocodataset.org/)
-   3D物体检测数据集:
    -   [KITTI](http://www.cvlibs.net/datasets/kitti/)
    -   [nuScenes](https://nuscenes.org/)
    -   [Lyft](https://self-driving.lyft.com/)
    -   [Waymo](https://waymo.com/)

# STARTED 经典论文<a id="sec-3"></a>

说明： 更新于2021-05-02

参考：[github_object_detection](https://github.com/hoya012/deep_learning_object_detection)

不同Detectio算法框架性能对比:

| Detector             | VOC07(mAP@IoU=0.5) | VOC12(mAP@IoU=0.5) | COCO(mAP@IoU=0.5:0.95) | Published In |
| RCNN                 | 58.5               | -                  | -                      | CVPR'14      |
| SPP-Net              | 59.2               | -                  | -                      | ECCV'14      |
| MR-CNN               | 78.2(07+12)        | 73.9(07+12)        | -                      | ICCV'15      |
| Fast RCNN            | 70.0(07+12)        | 68.4(07+12)        | 19.7                   | ICCV'15      |
| Faster RCNN          | 73.2(07+12)        | 70.4(07+12)        | 21.9                   | NIPS'15      |
| YOLO v1              | 66.4(07+12)        | 57.9(07+12)        | -                      | CVPR'16      |
| G-CNN                | 66.8               | 66.4(07+12)        | -                      | CVPR'16      |
| AZNet                | 70.4               | -                  | 22.3                   | CVPR'16      |
| ION                  | 80.1               | 77.9               | 33.1                   | CVPR'16      |
| HyperNet             | 76.3(07+12)        | 71.4(07+12)        | -                      | CVPR'16      |
| OHEM                 | 78.9(07+12)        | 76.3(07+12)        | 22.4                   | CVPR'16      |
| MPN                  | -                  | -                  | 33.2                   | BMVC'16      |
| SSD                  | 76.8(07+12)        | 74.9(07+12)        | 31.2                   | ECCV'16      |
| GBDNet               | 77.2(07+12)        | -                  | 27.0                   | ECCV'16      |
| CPF                  | 76.4(07+12)        | 72.6(07+12)        | -                      | ECCV'16      |
| R-FCN                | 79.5(07+12)        | 77.6(07+12)        | 29.9                   | NIPS'16      |
| DeepID-Net           | 69.0               | -                  | -                      | PAMI'16      |
| NoC                  | 71.6(07+12)        | 68.8(07+12)        | 27.2                   | TPAMI'16     |
| DSSD                 | 81.5(07+12)        | 80.0(07+12)        | 33.2                   | arXiv'17     |
| TDM                  | -                  | -                  | 37.3                   | CVPR'17      |
| FPN                  | -                  | -                  | 36.2                   | CVPR'17      |
| YOLO v2              | 78.6(07+12)        | 73.4(07+12)        | -                      | CVPR'17      |
| RON                  | 77.6(07+12)        | 75.4(07+12)        | 27.4                   | CVPR'17      |
| DeNet                | 77.1(07+12)        | 73.9(07+12)        | 33.8                   | ICCV'17      |
| CoupleNet            | 82.7(07+12)        | 80.4(07+12))       | 34.4                   | ICCV'17      |
| RetinaNet            | -                  | -                  | 39.1                   | ICCV'17      |
| DSOD                 | 77.7(07+12)        | 76.3(07+12)        | -                      | ICCV'17      |
| SMN                  | 70.0               | -                  | -                      | ICCV'17      |
| Light-Head R-CNN     | -                  | -                  | 41.5                   | arXiv'17     |
| YOLO v3              | -                  | -                  | 33.0                   | arXiv'18     |
| SIN                  | 76.0(07+12)        | 73.1(07+12)        | 23.2                   | CVPR'18      |
| STDN                 | 80.9(07+12)        | -                  | -                      | CVPR'18      |
| RefineDet            | 83.8(07+12)        | 83.5(07+12)        | 41.8                   |              |
| SNIP                 | -                  | -                  | 45.7                   | CVPR'18      |
| Relation-Network     | -                  | -                  | 32.5                   | CVPR'18      |
| Cascade R-CNN        | -                  | -                  | 42.8                   | CVPR'18      |
| MLKP                 | 80.6(07+12)        | 77.2(07+12)        | 28.6                   | CVPR'18      |
| Fitness-NMS          | -                  | -                  | 41.8                   | CVPR'18      |
| RFBNet               | 82.2(07+12)        | -                  | -                      | ECCV'18      |
| CornerNet            | -                  | -                  | 42.1                   | ECCV'18      |
| PFPNet               | 84.1(07+12)        | 83.7(07+12)        | 39.4                   | ECCV'18      |
| Pelee                | 70.9(07+12)        | -                  | -                      | NIPS'18      |
| HKRM                 | 78.8(07+12)        | -                  | 37.8                   | NIPS'18      |
| M2Det                | -                  | -                  | 44.2                   | AAAI'19      |
| E-DAD                | 81.2               | 82.0               | 43.1                   | AAAI'19      |
| ScratchDet           | 84.1(07+12)        | 83.6(07+12)        | 39.1                   | CVPR'19      |
| Libra R-CNN          | -                  | -                  | 43.0                   | CVPR'19      |
| Reasoning-RCNN       | 82.5(07+12)        | -                  | 43.2                   | CVPR'19      |
| FSAF                 | -                  | -                  | 44.6                   | CVPR'19      |
| AmoebaNet+NAS-FPN    | -                  | -                  | 47.0                   | CVPR'19      |
| Cascade-RetinaNet    | -                  | -                  | 41.1                   | CVPR'19      |
| TridenNet            | -                  | -                  | 48.4                   | ICCV'19      |
| DAFS                 | 85.3(07+12)        | 83.1(07+12)        | 40.5                   | ICCV'19      |
| Auto-FPN             | 81.8(07+12)        | -                  | 40.5                   | ICCV'19      |
| FCOS                 | -                  | -                  | 44.7                   | ICCV'19      |
| FreeAnchor           | -                  | -                  | 44.8                   | NeurIPS'19   |
| DetNAS               | 81.5(07+12)        | -                  | 42.0                   | NeurIPS'19   |
| NATS                 | -                  | -                  | 42.0                   | NeurIPS'19   |
| AmoebaNet+NAS-FPN+AA | -                  | -                  | 50.7                   | arXiv'19     |
| EfficientDet         | -                  | -                  | 51.0                   | arXiv'19     |

# 基本结构<a id="sec-4"></a>

  [2D_Detection-基本深度学习单元](https://johneyzheng.top/posts/2D_Detection-%E5%9F%BA%E6%9C%AC%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E5%8D%95%E5%85%83/)

# Backbone<a id="sec-5"></a>

  [2D_Detection-Backbone](https://johneyzheng.top/posts/2D_Detection-Backbone/)

# 超参<a id="sec-6"></a>

  `TODO`

# Loss<a id="sec-7"></a>

  [2D_Detection-Loss](https://johneyzheng.top/posts/2D_Detection-Loss/)

# 经典检测经典框架<a id="sec-8"></a>

  [2D_Detection-经典检测算法框架](https://johneyzheng.top/posts/2D_Detection-%E7%BB%8F%E5%85%B8%E6%A3%80%E6%B5%8B%E6%A1%86%E6%9E%B6%E4%BB%8B%E7%BB%8D/)

# 模型加速<a id="sec-9"></a>

  [2D_Detection-模型加速(网络篇)](https://johneyzheng.top/posts/2D_Detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F(%E7%BD%91%E7%BB%9C%E7%AF%87)/)

  [2D_Detection-模型加速(工程篇)](https://johneyzheng.top/posts/2D_Detection-%E6%A8%A1%E5%9E%8B%E5%8A%A0%E9%80%9F(%E5%B7%A5%E7%A8%8B%E7%AF%87)/)

# 常见场景检测Tricks<a id="sec-10"></a>

  `STARTED`

# 部分论文解读Links<a id="sec-11"></a>

  `STARTED`
