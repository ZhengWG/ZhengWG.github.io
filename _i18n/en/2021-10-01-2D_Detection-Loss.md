---
title: "2D Detection: Loss Functions"
description: "Introduces the loss functions commonly used in deep learning, from classification losses and regression losses to detection losses such as Focal Loss, QFocal Loss, and IoU-based losses, covering both principles and applications."
---
- [Preface](#sec-1)
- [Details](#sec-2)
  - [Classification Losses](#sec-2-1)
    - [Cross Entropy Loss](#sec-2-1-1)
    - [KL Divergence](#sec-2-1-2)
    - [Hinge Loss](#sec-2-1-3)
    - [Exponential Loss](#sec-2-1-4)
  - [Regression Losses](#sec-2-2)
    - [MAE Loss](#sec-2-2-1)
    - [MSE Loss](#sec-2-2-2)
    - [Smooth L1 Loss](#sec-2-2-3)
    - [Huber Loss](#sec-2-2-4)
  - [Detection Losses](#sec-2-3)
    - [Focal Loss](#sec-2-3-1)
    - [QFocal Loss](#sec-2-3-2)
    - [IoU Loss](#sec-2-3-3)

# Preface<a id="sec-1"></a>

This article briefly discusses the loss functions commonly used in deep learning, covering both principles and applications.

References: [Deep Learning - Loss Functions](https://zhuanlan.zhihu.com/p/97698386) [A First Look at AI](https://zhuanlan.zhihu.com/p/60302475)

# Details<a id="sec-2"></a>

The losses are introduced by application area:

-   Classification tasks: such as cross entropy loss, KL divergence, and hinge loss
-   Regression tasks: such as L1/L2 losses
-   Detection tasks: a detection loss mainly consists of a classification loss and a regression loss, but with optimizations made for detection

## Classification Losses<a id="sec-2-1"></a>

### Cross Entropy Loss<a id="sec-2-1-1"></a>

  Cross entropy loss is the most commonly used loss function in classification tasks. Its key definition is:

  $$
  y_i * log(1-p_i)
  $$

  Here $y_i$ is the label value and $p_i$ is the predicted probability. For binary classification, $y_i$ is 0/1; for multi-class classification it is a one-hot variable (only the gt entry is 1), so only the loss at the predicted gt entry is obtained.

  In deep learning, the output is usually converted into a probability distribution by softmax/sigmoid and the loss is then computed with cross entropy, for example `torch.nn.CrossEntropyLoss`.

### KL Divergence<a id="sec-2-1-2"></a>

  KL divergence measures the similarity of two distributions. It is defined as:

  $$
  KL divergence = entropy - cross entropy 
  $$

  The entropy describes the data distribution of the correct values (GT): $y^{gt} log(y^{gt})$, while the cross entropy describes the entropy difference between the correct values and the predicted values: $y^{gt} log(y^{pre})$. The entropy itself can be regarded as a constant, so optimizing the KL divergence can be turned into optimizing the cross entropy.

  The most common use of KL divergence is the `KL divergence` applied to `soft-label` in `Distillation`, where it measures the difference between the distributions of the `Teacher Model` and the `Student Model`.

  After expansion, the first term is the entropy of the original predicted distribution, which is a fixed term and can be dropped; the second term is $-qlog(p)$, that is, `cross_entropy`, except that here the `logits` output is a continuous probability.

### Hinge Loss<a id="sec-2-1-3"></a>
  The Hinge Loss is distributed as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_152010_resize.png)

  Its formula is as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_152042.png)

  Its core is that, unlike the simple 0-1 loss, hinge loss requires enough separation between positive and negative examples: the margin must be large enough, so it is a stricter loss function.

### Exponential Loss<a id="sec-2-1-4"></a>

  The exponential loss is defined as follows:
  
  $$
  L(Y, f(X)) = exp(-Yf(X))
  $$
  
  Here $Y$ is the prediction result and $f(X)$ is the predicted probability value. Application: `Adaboost`

## Regression Losses<a id="sec-2-2"></a>

### MAE Loss<a id="sec-2-2-1"></a>
   
  MAE stands for "Mean Absolute Error", which is the L1 Loss. It is defined as follows: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_153429.png)

  This loss suits the case where **the error between the model output and the true value follows a Laplace distribution (u=0, b=1)**. The Laplace distribution looks like this: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_153832_resize.png)

### MSE Loss<a id="sec-2-2-2"></a>

  MSE stands for "Mean Squared Error", which is the L2 Loss. It is defined as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_153120.png)

  This loss suits the case where **the error between the model output and the true value follows a Gaussian distribution**. The reasoning is that **minimizing the mean squared error loss is essentially equivalent to maximum likelihood estimation**.

### Smooth L1 Loss<a id="sec-2-2-3"></a>

  Compared with L1 Loss, Smooth L1 Loss remains differentiable at x=0. It does so by using a quadratic function as the transition when abs(x)<1. See [Smooth_L1_Loss_Pytorch](https://pytorch.org/docs/stable/generated/torch.nn.SmoothL1Loss.html). It is defined as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_154104.png)

  Faster-RCNN uses Smooth L1 Loss. The authors argue that it makes the loss more robust to outliers; that is, compared with the L2 loss function, it is less sensitive to outliers and abnormal values, its gradient changes are relatively smaller, and training is less likely to diverge.

### Huber Loss<a id="sec-2-2-4"></a>

  Huber Loss is a combination of MSE and MAE Loss. The idea is to use MSE when the error is close to 0, which keeps the loss differentiable and the gradient stable, and to use MAE when the error is large, which reduces the influence of outliers and keeps training stable. It is defined as follows: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_154343.png)

## Detection Losses<a id="sec-2-3"></a>

### Focal Loss<a id="sec-2-3-1"></a>
   
  Focal Loss comes from ICCV 2017: [Focal Loss for Dense Object Detection](https://openaccess.thecvf.com/content_ICCV_2017/papers/Lin_Focal_Loss_for_ICCV_2017_paper.pdf), from Kaiming He's team. It is very widely used in object detection and mainly addresses the **imbalance between positive and negative samples** in detection tasks. Its function is defined as follows:
     
  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_155518.png)

  Here p is the predicted confidence. Focal Loss increases the loss of hard cases, so that training pays more attention to difficult cases, which improves model performance and also speeds up convergence. Focal Loss is an extension of cross entropy loss. The difference between the two is as follows:
    
  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_160232.png)
    

### QFocal Loss<a id="sec-2-3-2"></a>

  QFocal Loss comes from [Generalized Focal Loss: Learning Qualified and Distributed Bounding Boxes for Dense Object Detection](https://arxiv.org/pdf/2006.04388.pdf). Its starting point is:

  As One-Stage detection algorithms keep developing, the original scheme of separate classification and regression losses has gradually shown some drawbacks for detection tasks. At the same time, methods that describe box quality, such as centerness/IoU Loss, raise a question: how to combine the description of box accuracy with the classification loss? QFocal Loss combines box quality with the classification loss. The difference between QFocal Loss and Focal Loss is that Focal Loss describes the loss on discrete classes, while QFocal Loss describes the loss on continuous labels (box quality). It is defined as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_161538.png)

### IoU Loss<a id="sec-2-3-3"></a>

  IoU Loss is a regression loss commonly used in detection tasks. Compared with the traditional L1/L2 Loss, IoU Loss corresponds to the final evaluation metric of detection, describes the accuracy of the predicted box better, and is scale-invariant, so it usually performs better. Its basic definition is:
    
  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_162131.png)
    
  Here A and B denote the detection box and the GT box. However, IoU Loss has some problems:
  
   -   It cannot describe the loss of boxes that do not intersect
   -   It cannot precisely describe how the boxes interact: a detection box and a GT box at different positions may have the same IoU.
  
  On top of IoU Loss, some later optimized losses followed:
    
   -   [GIoU Loss](https://arxiv.org/pdf/1902.09630.pdf): introduces the enclosing rectangle, so it pays attention not only to the overlapping region but also to the non-overlapping region, and adds a loss description for boxes that do not intersect.
   -   [DIoU/CIoU Loss](https://arxiv.org/pdf/1911.08287.pdf): DIoU Loss models the distances between points of the boxes in more detail and converges faster. CIoU Loss introduces the similarity of aspect ratios.
    
  The effect of each loss applied to YOLOv3 is as follows:

  ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-10-01-2D_Detection-Loss/2d_detection-Loss_20211001_163422.png)
