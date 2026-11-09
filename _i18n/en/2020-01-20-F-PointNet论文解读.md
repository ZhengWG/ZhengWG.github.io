---
title: "Frustum PointNets for 3D Object Detection from RGB-D Data"
description: "A reading of Frustum PointNets, which uses a 2D detector to obtain frustum proposals, segments the point cloud with PointNet, and estimates 3D boxes with T-Net and a box estimation PointNet, covering its motivation, pipeline, and ablations."
---

# Contents

1.  [Background and Core Idea](#orgbdf0781)
2.  [Algorithm Pipeline](#org1340f96)
3.  [Algorithm Details](#orgff9b8a5)

[Frustum PointNets for 3D Object Detection from RGB-D data](https://arxiv.org/pdf/1711.08488.pdf)


<a id="orgbdf0781"></a>

# Background and Core Idea

Motivation: the authors argue that learning directly from the point cloud in 3D space to obtain the position and size of 3D boxes is more efficient and does not lose point cloud information. However, convolving over the global point cloud consumes too many resources. Images give fairly accurate 2D detection results, but the positions are imprecise, so the two can be combined: first obtain a rough 3D proposal from 2D detection, and then compute the precise position in a further step.


<a id="org1340f96"></a>

# Algorithm Pipeline

-   Pipeline: the paper first uses a 2D detector on the RGB image to obtain 2D boxes as proposals, then maps them into 3D frustums using depth data to get the corresponding 3D point cloud (not a point cloud from precise segmentation). The 3D points inside the frustum are then segmented in 3D by PointNet; this is essentially a binary classification of the points (or a multi-class classification, using a one-hot class vector, when there are several classes). The 3D box is then predicted on the masked point cloud, with the point cloud center as the coordinate origin and the coordinate axes aligned with the frustum direction. After that, T-Net (a lightweight PointNet that predicts the center point again, which can be viewed as alignment) is applied, and the 3D Box Estimation PointNet then predicts the detection box

-   Framework diagrams:
    ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/2020-01-20-F-PointNet%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/2020_01_04_F-PointNet_20210710_003128.png)
    ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/2020-01-20-F-PointNet%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/2020_01_04_F-PointNet_20210710_003218.png)

-   Core points:
    -   Obtain the point cloud in frustum coordinates from the 2D detection result and the depth data
    -   PointNet performs precise segmentation of the point cloud
    -   T-net + PointNet localize in two steps on the point cloud


<a id="orgff9b8a5"></a>

# Algorithm Details

-   Other details:
    -   Corner loss: the L1 distance loss over each corner point
    -   3D box prediction is based on the local coordinate
        ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/2020-01-20-F-PointNet%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/2020_01_04_F-PointNet_20210710_003248.png)
    
    -   Data augmentation: flip and translate the object on the 2D image, then sample, flip, and translate the point cloud in the corresponding 3D frustum
-   Shortcomings:
    -   It depends heavily on the performance of the 2D detector
    -   Different objects in the same frustum are hard to detect
-   Ablation study:
    ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/2020-01-20-F-PointNet%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/2020_01_04_F-PointNet_20210710_003415.png)
    ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/2020-01-20-F-PointNet%E8%AE%BA%E6%96%87%E8%A7%A3%E8%AF%BB/2020_01_04_F-PointNet_20210710_003433.png)
