---
layout: post
title: Ubuntu安装OpenFace
date: 2016-11-15 20:25:24.000000000 +09:00
tags: 系统配置; Ubuntu; OpenFace
---
# 安装准备

```
sudo apt-get install build-essential -y
sudo apt-get install cmake -y
sudo apt-get install curl -y
sudo apt-get install gfortran -y
sudo apt-get install git -y
sudo apt-get install libatlas-dev -y
sudo apt-get install libavcodec-dev -y
sudo apt-get install libavformat-dev -y
sudo apt-get install libboost-all-dev -y
sudo apt-get install libgtk2.0-dev -y
sudo apt-get install libjpeg-dev -y
sudo apt-get install liblapack-dev -y
sudo apt-get install libswscale-dev -y
sudo apt-get install pkg-config -y
sudo apt-get install python-dev -y
sudo apt-get install python-pip -y
sudo apt-get install wget -y
sudo apt-get install zip -y 
```
# 安装库
```
sudo pip2 install numpy -i https://pypi.tuna.tsinghua.edu.cn/simple
sudo pip2 install scipy -i https://pypi.tuna.tsinghua.edu.cn/simple
sudo pip2 install pandas -i https://pypi.tuna.tsinghua.edu.cn/simple
sudo pip2 install scikit-learn -i https://pypi.tuna.tsinghua.edu.cn/simple
sudo pip2 install scikit-image -i https://pypi.tuna.tsinghua.edu.cn/simple
```
# 安装Torch
安装torch：
```
git clone https://github.com/torch/distro.git ~/torch --recursive
cd ~/torch; bash install-deps;
./install.sh
source ~/.bashrc
```
安装相关包：
```
~/torch/install/bin/luarocks install dpnn
~/torch/install/bin/luarocks install nn
~/torch/install/bin/luarocks install optim
~/torch/install/bin/luarocks install csvigo
~/torch/install/bin/luarocks install cunn
~/torch/install/bin/luarocks install torchx 
~/torch/install/bin/luarocks install graphicsmagick
~/torch/install/bin/luarocks install cutorch
```
# 安装OpenCV
```
mkdir -p src
cd src
```
复制编译好的OpenCV到`src`目录下
# 安装Dlib
下载[Dlib][dlib]
通过以下过程安装：
```
mkdir -p ~/src  
cd ~/src tar xf dlib-18.16.tar.gz  
cd dlib-18.16/python_examples  
mkdir build  
cd build  
cmake ../../tools/python  
cmake --build . --config Release  
sudo cp dlib.so /usr/local/lib/python2.7/dist-packages 
```
# 安装OpenFace
```
git clone https://github.com/cmusatyalab/openface.git 
sudo python2 setup.py install
models/get-models.sh
```
运行demo2：

`./demos/compare.py images/examples/{lennon*,clapton*}`

运行demo3：

`./demos/classifier.py infer models/openface/celeb-classifier.nn4.small2.v1.pkl ./images/examples/carell.jpg`

# 测试OpenFace
## 第一步
在`OpenFace/`文件中建立一个名为`training-images/`的文件夹:
`mkdir training-images`
## 第二步
为你想识别的每个人建立一个子文件夹。例如：
```
mkdir training-images/will-ferrell/
mkdir training-images/chad-smith/
mkdir training-images/jimmy-fallon/
```
## 第三步
将每个人的所有图像拷贝进对应的子文件夹。确保每张图像上只出现一张脸。不需要裁剪脸部周围的区域。OpenFace 会自己裁剪。
## 第四步
从这个 OpenFace 的根目录中运行这个 OpenFace 脚本。

1.进行姿势检测和校准：

`./util/align-dlib.py training-images/ align outerEyesAndNose aligned-images/ --size 96`

这将创建一个新`aligned-images/`子文件夹，带有每一个测试图像的裁剪过的并且对齐的版本。

2.从对齐的图像中生成表征：

`./batch-represent/main.lua -outDir generated-embeddings/ -data aligned-images/`

运行完后，这个`aligned-images/`子文件夹会包含一个带有每张图像的嵌入csv 文件。

3.训练自己的面部检测模型：

`./demos/classifier.py train generated-embeddings/`

这将产生名为`generated-embeddings/classifier.pkl`的新文件名。这个文件有你将用来识别新面部的 SVM 模型。

## 第五步
识别面部，获取一张未知脸的新照片。把它像这样传递给分类器脚本：

`./demos/classifier.py infer ./generated-embeddings/classifier.pkl your_test_image.jpg`

你需要得到一个看起来像这样的预测：
```
=== /test-images/will-ferrel-1.jpg ===
Predict will-ferrell with 0.73 confidence.
```
从这里开始你可以利用这个Python 脚本 做任何你想做的：

`./demos/classifier.py`

**Tips**：

如果你得到了坏的结果，请尝试在第三步中为每个人添加更多一些照片（尤其是不同姿势的照片）。这个脚本总是会给出一个预测，即便是一张它不知道的脸。在真实的应用中，你会看到信度得分，并抛除低信度的预测，因为它们很可能是错误的



[dlib]: https://github.com/davisking/dlib/releases
