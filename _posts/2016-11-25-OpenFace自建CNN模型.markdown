---
layout: post
title: Ubuntu自建CNN模型
date: 2016-11-25 20:25:24.000000000 +09:00
tags: Ubuntu; OpenFace
---
# Openface Home
>重点可参考：[杨存毅的博客][blog_address]

OpenFace官方网站：

```
https://cmusatyalab.github.io/openface/
https://cmusatyalab.github.io/openface/setup/
```
# 环境配置
```
Ubuntu16.04
Nvidia 940M
Cuda8.0
```
# 库环境
OpenCV2.4.11与cuda8.0具有一定的冲突性，可以安装opencv2.4.13，本机安装的是opencv3.10.
OpenCV2.4.13可参照[官方教程][Opencv2.4.13]（未测试）
OpenCV3.1的安装过程如下：
```
[compiler] sudo apt-get install build-essential
[required] sudo apt-get install cmake git libgtk2.0-dev pkg-config libavcodec-dev libavformat-dev libswscale-dev
[optional] sudo apt-get install python-dev python-numpy libtbb2 libtbb-dev libjpeg-dev libpng-dev libtiff-dev libjasper-dev libdc1394-22-dev
cd ~/opencv
mkdir release
cd release
cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local ..
make
sudo make install

```

# Dlib库，torch，OpenFace安装
此处略过，查看之前的内容
# 训练DNN模型
数据预处理：
```
for N in {1..8}; do ./util/align-dlib.py data/casia-facescrub/raw align outerEyesAndNose data/casia-facescrub/dlib-affine-sz:96 --size 96 & done
python2 ./util/prune-dataset.py data/casia-facescrub/dlib-affine-sz:96 --numImagesThreshold 3

```
Train之前需要做的处理：

`train.lua`:需要修正`module`和`OpenFaceOptim`模块：
```
local models = require 'model'
local openFaceOptim = require 'OpenFaceOptim'
```
改为：
```
local models = require './model.lua'
local openFaceOptim = require './OpenFaceOptim.lua'
```
另外还需要调整训练参数`opt.lua`，主要需要修改两个参数，减少对GPU的要求（不然容易out of memory）：
```
cmd:option('-peoplePerBatch', 15, 'Number of people to sample in each mini-batch.')
cmd:option('-imagesPerPerson', 20, 'Number of images to sample per person in each mini-batch.')
```
改为：
```
cmd:option('-peoplePerBatch', 1, 'Number of people to sample in each mini-batch.')
cmd:option('-imagesPerPerson', 2, 'Number of images to sample per person in each mini-batch.')
```
`test.lua`文件运行的时候发生错误找不到文件，直接改成绝对目录：

```
local batchRepresent = "../batch-represent/main.lua"
local lfwEval = "../evaluation/lfw.py"
```
改为：
```
local batchRepresent = "～/openface/batch-represent/main.lua"
local lfwEval = "~/openface/evaluation/lfw.py"
```
找不到`/data/lfw/aligned`文件：

修改`opt.lua`:
```
cmd:option('-lfwDir', '../data/lfw/aligned', 'LFW aligned image directory for testing.')
```
改为：
```
cmd:option('-lfwDir', '~/openface/data/lfw/aligned', 'LFW aligned image directory for testing.')
```
改过之后，开始训练和测试的时候，还是溢出了，再改：
```
cmd:option('-testBatchSize', 800, 'Batch size for testing.')
```
改成
```
cmd:option('-testBatchSize', 80, 'Batch size for testing.')
```
「**必须！**」为了要testing，改变在`opts.lua`中的`lfwDir`:
```
cmd:option('-lfwDir', '/media/tsunyi/0EF057F8F057E50D/codeDemo/openface-master/data/lfw/dlib-affine-sz:96', 'LFW aligned image directory for testing.'
```
更改`openface/batch-represent`下面的`batch-represent`和`opts`以减少GPU
更改`/openface/evaluation`下的`lfw.py`，相关文件路径


[Opencv2.4.13]: http://docs.opencv.org/2.4/doc/tutorials/introduction/linux_install/linux_install.html
[blog_address]: http://shamangary.logdown.com/posts/800267-openface-installation
