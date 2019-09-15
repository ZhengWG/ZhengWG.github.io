---
layout: post
title: nms and soft-nms
date: 2019-09-15 17:16:24.000000000 +09:00
tags: nms; CV
---
# Table of Contents

1.  [nms和soft-nms](#org73044cc)
    1.  [nms](#org06dfa46)
        1.  [nms代码实现](#orga3454df)
    2.  [soft-nms](#org02ecd64)
        1.  [soft-nms代码实现](#org552e4f8)


<a id="org73044cc"></a>

# nms和soft-nms


<a id="org06dfa46"></a>

## nms

主要是将各个重叠的box清理,得到score最高的主要box,代码步骤实现:

-   将所有的box框根据score进行升序排列
-   判断box序列是否为空
    -   保存当前的box序号
    -   计算最高score与其余的box的iou
    -   将iou大于阈值的box去除,得到余下的box序列
    -   更新box序列


<a id="orga3454df"></a>

### nms代码实现

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
            _xx2 = np.maximum(xx2[_index], xx2[order[1:]])
            _yy2 = np.maximum(yy2[_index], yy2[order[1:]])
            _w = np.maximum(0, _xx2 - _xx1 + 1)
            _h = np.maximum(0, _yy2 - _yy1 + 1)
            _areas_inter = _w * _h
            _overs = _areas_inter / (areas[_index] + areas[order[1:]] - _areas_inter)
            #更新order,_inds:+1,因为len(_overs)+1=len(order)
            #np.where(),只有condition的情况下,返回各维度的index tuple,这里只有一维:[0]
            _inds = np.where(_overs <= thre)[0]
            order = order[_inds + 1]


<a id="org02ecd64"></a>

## soft-nms

![pic-shortcoming for nms](https://github.com/ZhengWG/Imgs_blog/raw/master/nms_and_soft_nms/shortcoming_for_nms.jpeg)
传统的nms对于多个物体重叠的情况来说,会把低分的物体过滤掉,处理过于粗暴,参考上图;soft-nms的方法是将计算得到的iou和box本身的score的输入参数,重新计算box的置信度,最后根据新的置信度判断是否去除这个box,计算公式为:

线性加权:

\[ s_i=\left\{
\begin{array}{rcl}
s_i,                   &      &iou(M,b_i)<N_t\\
s_i(1-iou(M,b_i)),     &      &iou(M,b_i)>=N_t\\
\end{array} \right. \]

高斯加权:

\[
s_i = s_ie-\frac{iou(M,b_i)^2}{\sigma}
\]

代码实现步骤如下:

-   因为过程中需要对score进行更新,需要不能提前对box的score进行排序,需要遍历box,得到max_score的box序号:
    -   得到最高score box序号,交换当前序号和最大score的box参数,包括score,box位置
    -   遍历剩下的box与当前最高score的box进行iou的计算:
        -   根据定义的更新规则(线性加权或者高斯加权)更新score
        -   将score低于阈值的box交换到队列最后面,并更新队列数目,不再遍历这些box
        -   更新序号,循环遍历


<a id="org552e4f8"></a>

### soft-nms代码实现

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

论文参考:[soft-nms论文](http://link.zhihu.com/?target=http%3A//cn.arxiv.org/abs/1704.04503)

