---
title: "Non-Maximum Suppression (NMS) and Soft-NMS"
description: "Explains how non-maximum suppression removes overlapping boxes, how Soft-NMS rescores them with linear or Gaussian weighting instead, and gives Python implementations of both."
---
# Table of Contents

1.  [NMS and Soft-NMS](#org73044cc)
    1.  [NMS](#org06dfa46)
        1.  [NMS implementation](#orga3454df)
    2.  [Soft-NMS](#org02ecd64)
        1.  [Soft-NMS implementation](#org552e4f8)


<a id="org73044cc"></a>

# NMS and Soft-NMS


<a id="org06dfa46"></a>

## NMS

Non-maximum suppression (NMS) clears overlapping boxes and keeps the main box with the highest score. The implementation steps are:

-   Sort all boxes by score in ascending order
-   Check whether the box sequence is empty
    -   Save the index of the current box
    -   Compute the IoU between the highest-scoring box and the remaining boxes
    -   Remove the boxes whose IoU is greater than the threshold, which leaves the remaining box sequence
    -   Update the box sequence


<a id="orga3454df"></a>

### NMS implementation
```python
    #coding:utf-8
    import numpy as np

    def py_cpu_nms(dets, thre):
        #输入:dets:为输入的box numpy原始序列:x1,y1,x2,y2,score
        #输入:thre:iou阈值
        xx1 = dets[:, 0]
        yy1 = dets[:, 1]
        xx2 = dets[:, 2]
        yy2 = dets[:, 3]
        scores = dets[:, 4]
        #+1是因为默认顶点所在的轮廓边也为目标区域
        areas = (xx2 - xx1 + 1) * (yy2 -yy1 + 1)
        out = []
        #按照score排序
        order = scores.argsort()[::-1]
        while len(order):
            _index = order[0]
            out.append(_index)
            #计算index对应的box和剩余box的iou,进行筛选
            _xx1 = np.maximum(xx1[_index], xx1[order[1:]])
            _yy1 = np.maximum(yy1[_index], yy1[order[1:]])
            _xx2 = np.minimum(xx2[_index], xx2[order[1:]])
            _yy2 = np.minimum(yy2[_index], yy2[order[1:]])
            _w = np.maximum(0, _xx2 - _xx1 + 1)
            _h = np.maximum(0, _yy2 - _yy1 + 1)
            _areas_inter = _w * _h
            _overs = _areas_inter / (areas[_index] + areas[order[1:]] - _areas_inter)
            #更新order,_inds:+1,因为len(_overs)+1=len(order)
            #np.where(),只有condition的情况下,返回各维度的index tuple,这里只有一维:[0]
            _inds = np.where(_overs <= thre)[0]
            order = order[_inds + 1]
```

<a id="org02ecd64"></a>

## Soft-NMS

![pic-shortcoming for nms](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/nms_and_soft_nms/shortcoming_for_nms.jpeg)
When several objects overlap, traditional NMS filters out the lower-scoring objects, which is too crude (see the figure above). Soft-NMS instead takes the computed IoU and the box's own score as inputs, recomputes the box's confidence, and then decides from the new confidence whether to remove the box. The formulas are:

Linear weighting:
![Linear weighting formula](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/nms_and_soft_nms/ltximg/org-ltximg_1180780576c3081aa0d4eb0be10ec0cfc93e1d40.png)

Gaussian weighting:

![Gaussian weighting formula](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/nms_and_soft_nms/ltximg/org-ltximg_61f6887da1166368bd2448b5a3d8010748c7ff5c.png)

The implementation steps are as follows:

-   Because scores are updated during the process, the boxes cannot be sorted by score in advance. Instead, iterate over the boxes to find the index of the box with max_score:
    -   Once the index of the highest-scoring box is found, swap the parameters of the current box and the max-score box, including the score and the box position
    -   Iterate over the remaining boxes and compute the IoU with the current highest-scoring box:
        -   Update the score according to the chosen update rule (linear weighting or Gaussian weighting)
        -   Swap boxes whose score falls below the threshold to the end of the queue, update the queue length, and stop iterating over those boxes
        -   Update the index and keep looping


<a id="org552e4f8"></a>

### Soft-NMS implementation
```python
    #coding:utf-8
    import numpy as np
    #coding:utf-8
    #coding:utf-8

    def soft-nms(dets, thre=0.001, Nt=0.1, sigma=0.5, method=1):
        #输入:dets:为输入的box numpy原始序列
        #thre:更新权重后score阈值,Nt为iou阈值,sigma为高斯权重的参数
        #method,0:nms,1:线性权重;2:高斯权重
        N = dets.shape[0]
        for i in range(N):
            #pos为与i比较的box序号
            x1 = dets[i][0]
            y1 = dets[i][1]
            x2 = dets[i][2]
            y2 = dets[i][3]
            score = dets[i][4]
            max_score = dets[i][4]
            pos_tmp = i + 1
            pos = i
            #得到最大的score box序号
            while (pos_tmp < N):
                if max_score < dets[pos_tmp][4]:
                    max_score = dets[pos_tmp][4]
                    pos = pos_tmp
                pos_tmp += 1
            #swap pos and i index box
            dets[i] = dets[pos]
            dets[pos][0] = x1
            dets[pos][1] = y1
            dets[pos][2] = x2
            dets[pos][3] = y2
            dets[pos][4] = score

            #更新max score box的参数
            x1 = dets[i][0]
            y1 = dets[i][1]
            x2 = dets[i][2]
            y2 = dets[i][3]
            area = (x2 - x1 + 1) * (y2 - y1 + 1)
            pos_tmp = i + 1
            while (pos_tmp < N):
                xt1 = dets[pos_tmp][0]
                yt1 = dets[pos_tmp][1]
                xt2 = dets[pos_tmp][2]
                yt2 = dets[pos_tmp][3]
                scoret = dets[pos_tmp][4]
                areat = (xt2 - xt1 + 1) * (yt2 - yt1 + 1)
                #计算iou
                w = max(0, min(xt2, x2) - max(xt1, x1) + 1)
                h = max(0, min(yt2, y2) - max(yt1, y1) + 1)
                #if inter_area > 0
                if w*h > 0:
                    iou = w*h / (area + areat - w*h)
                    if iou > Nt:
                        if method == 1:
                            weight = 1 - iou
                        else if method == 2:
                            weight = -np.exp(iou * iou / sigma)
                        else:
                            weight = 1
                        #更新score
                        dets[pos_tmp][4] *= weight
                #如果score小于阈值,则将box扔到最后面废弃,pos_tmp-=1重新计算
                if dets[pos_tmp][4] < thre:
                    dets[pos_tmp] = dets[N-1]
                    dets[N-1][0] = xt1
                    dets[N-1][1] = yt1
                    dets[N-1][2] = xt2
                    dets[N-1][3] = yt2
                    dets[N-1][4] = scoret
                    N = N - 1
                    pos_tmp -= 1
                pos_tmp += 1
        out = [_ for _ in N]
        return out
```

Paper reference: [Soft-NMS paper](http://link.zhihu.com/?target=http%3A//cn.arxiv.org/abs/1704.04503)
