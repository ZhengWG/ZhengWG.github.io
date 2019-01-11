---
layout: post
title: Ubuntu16LTS+Cuda8+OpenCV3+Matlab2014a+python+Caffe配置
date: 2016-12-10 20:25:24.000000000 +09:00
tags: 系统配置; Ubuntu; OpenFace; Caffe
---

> [参考博客][参考博客]

# 安装Cuda驱动
采用下载文件安装，在系统设置选择软件和更新，更改下载源，选择`aliyun`，选择附件驱动，选择使用`NVIDA binary driver.......nvidia-367`

![软件更新图片](https://thumbnail10.baidupcs.com/thumbnail/fc9d796178ad1a4191230a11e684dac7?fid=2669703802-250528-598673463397308&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-jcjeSbUgUcpCBbSAT8IyRkUGRJ8%3d&expires=8h&chkbd=0&chkv=0&dp-logid=249185088311834398&dp-callid=0&time=1547197200&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)
![驱动安装图片](https://thumbnail10.baidupcs.com/thumbnail/934bfe3df20d50c84e2045f25927cd2d?fid=2669703802-250528-468014980013160&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-0dnE3V5gA6CaxoMN05SlQnENnjQ%3d&expires=8h&chkbd=0&chkv=0&dp-logid=249206331802147630&dp-callid=0&time=1547197200&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

提示重启后，终端输入：
```
sudo nvidia-settings 
```
弹出界面如下：
![驱动测试图片](https://thumbnail10.baidupcs.com/thumbnail/96a222b6e54604539be2ad4c62e20493?fid=2669703802-250528-848509026897922&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-uz9DvLa%2fhpBJ06HMRCB9XeAwv7I%3d&expires=8h&chkbd=0&chkv=0&dp-logid=249206331802147630&dp-callid=0&time=1547197200&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

说明驱动安装成功，通过`nvidia-smi`也可以得到GPU信息。
# 安装Cuda8
官网下载[cuda8.0][address_cuda]的deb文件，安装：
```
sudo dpkg -i xxxxxx.deb(下载的文件名)
sudo apt-get update
sudo apt-get install cuda
```
安装完成后修改配置文件`sudo gedit /etc/profile`，最后加入两行：
```
export PATH=/usr/local/cuda-8.0/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda-8.0/lib64:$LD_LIBRARY_PATH
```
使其生效：

```
source /etc/profile
```
可通过以下语句进行验证：
```
nvcc --version
```
得到版本信息，最后进行cuda demo的验证：
```
cd /usr/local/cuda-8.0/samples/1_Utilities/deviceQuery
make
./deviceQuery
```
# Cudnn下载安装
官网下载[cudnn][address_cudnn]，需要注册登录，下载速度很慢，下载`cudnn5.1 Library for Linux`版本，为tgz压缩文件，解压文件后进入`include`文件，进行头文件的复制：
```
sudo cp cudnn.h /usr/local/cuda/include/
```
再转到`lib64`目录下：
```
sudo cp lib* /usr/local/cuda/lib64/
cd /usr/local/cuda/lib64/
sudo rm -rf libcudnn.so libcudnn.so.5
sudo ln -s libcudnn.so.5.1.5 libcudnn.so.5
sudo ln -s libcudnn.so.5 libcudnn.so
sudo ldconfig
```
其中`libcudnn.so.5.1.5`等文件可能因版本不同而不同，注意和自己版本对照。
# 安装Matlab
Matlab下载得到的为两个rar文件和crack文件夹，解压缩rar文件需要安装unrar：
```
sudo apt-get install unrar
unrar *****.part1.rar
```
Part2文件在part1解压缩的过程也会被解压缩，最后得到一个iso文件，挂载iso文件：
```
sudo mount -o loop MATHWORKS_R2014A.iso /media/zheng/study/linux/matlab2014
```
再转到当前目录：
```
cd /media/zheng/software/matlab2014
sudo ./install
```
选择不联网安装，密钥任意：`12345-67890-12345-67890` ，选择安装目录，最后激活需要`crack`文件夹的`license_405329_R2014a.lic`文件，最后要将对应的`libmwservices.so`复制到matlab安装目录下`/bin/glnxa64/libmwservices.so`
最后安装`Matlabsupport`可以添加快捷方式：
```
sudo apt-get install matlab-support
```
如果配置正确的话安装过程中一直选择yes即可。
# 安装OpenCV3.1.0
官网下载linux版本的[OpenCV3.1.0][address_OpenCV]，先安装python依赖项：
```
sudo apt-get update
sudo apt-get install -y build-essential cmake git pkg-config
sudo apt-get install -y libprotobuf-dev libleveldb-dev libsnappy-dev libhdf5-serial-dev protobuf-compiler
sudo apt-get install -y libatlas-base-dev
sudo apt-get install -y --no-install-recommends libboost-all-dev
sudo apt-get install -y libgflags-dev libgoogle-glog-dev liblmdb-dev
sudo apt-get install -y python-pip
sudo apt-get install -y python-dev
sudo apt-get install -y python-numpy python-scipy 
```
```
sudo apt-get install --assume-yes libopencv-dev build-essential cmake git libgtk2.0-dev pkg-config python-dev python-numpy libdc1394-22 libdc1394-22-dev libjpeg-dev libpng12-dev libtiff5-dev libjasper-dev libavcodec-dev libavformat-dev libswscale-dev libxine2-dev libgstreamer0.10-dev libgstreamer-plugins-base0.10-dev libv4l-dev libtbb-dev libqt4-dev libfaac-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev libxvidcore-dev x264 v4l-utils unzip 
```
安装Opencv依赖项：
```
sudo apt-get install build-essential cmake git
sudo apt-get install ffmpeg libopencv-dev libgtk-3-dev python-numpy python3-numpy libdc1394-22 libdc1394-22-dev libjpeg-dev libpng12-dev libtiff5-dev libjasper-dev libavcodec-dev libavformat-dev libswscale-dev libxine2-dev libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev libv4l-dev libtbb-dev qtbase5-dev libfaac-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev libxvidcore-dev x264 v4l-utils unzip
```
编译之前需要做一些更改，期间可能会发生cuda与opencv的冲突问题（`graphcuts.cpp`中），需要作如下更改：
```
cd  'opencv-3.1.0/modules/cudalegacy/src
sudo gedit graphcuts.cpp
```
将相关部分替代：
```
#include "precomp.hpp"

// GraphCut has been removed in NPP 8.0

#if !defined (HAVE_CUDA) || defined (CUDA_DISABLER) || (CUDART_VERSION >= 8000)

 void cv::cuda::graphcut(GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, Stream&) { throw_no_cuda(); }

 void cv::cuda::graphcut(GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, GpuMat&, Stream&) { throw_no_cuda(); }
```
同时，最后提前下载编译过程需要的文件：`linux-808b791a6eac9ed78d32a7666804320e`，目录为`/opencv3.1.0/3rdparty/ippcv/downloads`

完成上述工作后，可以终端`cd`到`opencv`解压缩文件中，新建`build`文件夹：
```
mkdir build   cd build/
cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local -D WITH_TBB=ON -D WITH_V4L=ON -D WITH_QT=ON -D WITH_OPENGL=ON -DCUDA_NVCC_FLAGS="-D_FORCE_INLINES" ..
```
编译完成后：
```
make -j8
```
此时，如果因为`g++`版本过高，产生错误，需要对`CMakeList.txt`文件进行更改，开头加入：
```
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}-D_FORCE_INLINES")
```
错误如下：
```
/usr/include/string.h: In function ‘void__mempcpy_inline(void, const void, size_t)’:/usr/include/string.h:652:42: error: ‘memcpy’ was not declared inthis scope return (char ) memcpy (dest, src, n)+ n;
```
最后，进行编译make即可：`sudo make install`
Opencv编译成功之后，但是并没有安装到自己的系统中，需要进行`install`,加入动态库：
```
sudo sh -c 'echo "/usr/local/lib" > /etc/ld.so.conf.d/opencv.conf'
sudo ldconfig
sudo gedit /etc/profile #在最后加入两行
#若无gedit命令，sudo apt-get install gedit
PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig
export PKG_CONFIG_PATH
```
#pkg-config可以参考[博客][adress_pkgconfig]

最后将`ippicv`中的64位lib文件复制到`/usr/local/lib`下,文件位于: `~ /opencv-3.1.0/3rdparty/ippicv/unpack/ippicv_lnx/lib/intel64/libippicv.a`重启系统，转到之前的`build`目录,运行：
```
sudo apt-get install checkinstall
sudo checkinstall 
```
然后按照提示安装就可以了。使用`checkinstall`的目的是为了更好的管理我安装的opencv，因为opencv的安装很麻烦，卸载更麻烦，其安装的时候修改了一大堆的文件，当我想使用别的版本的opencv时，将当前版本的opencv卸载就是一件头疼的事情，因此需要使用`checkinstall`来管理我的安装。

执行了`checkinstall`后，会在build文件下生成一个以`backup`开头的`.tgz`的备份文件和一个以`build`开头的`.deb`安装文件，当你想卸载当前的opencv时，直接执行`dpkg -r build`即可。


# 安装Caffe
[caffe-master][address_caffe]下载，首先安装各种依赖包：
```
sudo apt-get update
sudo apt-get install -y build-essential cmake git pkg-config
sudo apt-get install -y libprotobuf-dev libleveldb-dev libsnappy-dev libhdf5-serial-dev protobuf-compiler
sudo apt-get install -y libatlas-base-dev
sudo apt-get install -y--no-install-recommends libboost-all-dev
sudo apt-get install -y libgflags-dev libgoogle-glog-dev liblmdb-dev
sudo apt-get install -y python-pip
sudo apt-get install -y python-dev
sudo apt-get install -y python-numpy python-scipy
```
创建`Makefiel.config`文件:
```
cd caffe
sudo cp Makefile.config.example Makefile.config
sudo gedit Makefile.config
```
打开之后修改如下内容:
1. 若使用`cudnn`，则将`# USE_CUDNN := 1`修改成:`USE_CUDNN := 1`
2. 若使用的opencv版本是3的，则将`# OPENCV_VERSION := 3`修改为：`OPENCV_VERSION := 3`
3. 若要使用python来编写`layer`，则需要将`# WITH_PYTHON_LAYER := 1`修改为`WITH_PYTHON_LAYER := 1`
4. 重要的一项 将`# Whatever else you find you need goes here.`下面的
```
INCLUDE_DIRS := $(PYTHON_INCLUDE) /usr/local/include
LIBRARY_DIRS := $(PYTHON_LIB) /usr/local/lib /usr/lib
```
修改为:
```
INCLUDE_DIRS := $(PYTHON_INCLUDE) /usr/local/include /usr/include/hdf5/serial
LIBRARY_DIRS := $(PYTHON_LIB) /usr/local/lib /usr/lib /usr/lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu/hdf5/serial
```
这是因为ubuntu16.04的文件包含位置发生了变化，尤其是需要用到的`hdf5`的位置，所以需要更改这一路径
5. 若使用MATLAB接口的话，则要讲`MATLAB_DIR`换成你自己的MATLAB安装路径:
```
MATLAB_DIR := /media/zheng/study-software/linux_matlabmatlab2014a
``` 
打开`Makefiel`文件：将
```
NVCCFLAGS +=-ccbin=$(CXX) -Xcompiler-fPIC $(COMMON_FLAGS)
```
替换
```
NVCCFLAGS += -D_FORCE_INLINES -ccbin=$(CXX) -Xcompiler -fPIC $(COMMON_FLAGS)
```
编辑`/usr/local/cuda/include/host_config.h`，将其中的第`115`行注释掉:
```
#error-- unsupported GNU version! gcc versions later than 4.9 are not supported!`
```
最新版本的不需更改，version已经更新为5。

最后`make`：
```
make all -j8
make runtest -j8
make pycaffe -j8
make matcaffe -j8
```
`Matcaffe`可能会产生相关`gcc`版本的问题，但是目前貌似不影响使用。

测试Matlab功能：

转到`caffe-master`目录：
```
make all matcaffe
make mattest
```
如果发生了如下错误：
```
Invalid MEX-file ‘**/caffe.mexa64’ 
/usr/local/MATLAB/R2014a/bin/glnxa64/../../sys/os/glnxa64/libstdc++.so.6
```
则需要链接文件：
```
ln -sf /usr/lib/x86_64-linux-gnu/libstdc++.so.6 /media/zheng/study/linux/MATLAB/bin/glnxa64/libstdc++.so.6
```
运行正确结果如下：

![Caffe编译成功图片](https://thumbnail10.baidupcs.com/thumbnail/df28b3ae80b086b09766adf32f465699?fid=2669703802-250528-164186304842510&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-O5xcwQbXUXtLfT74JpGnOV0khpc%3d&expires=8h&chkbd=0&chkv=0&dp-logid=249206331802147630&dp-callid=0&time=1547197200&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

至此，Caffe配置完毕。

[参考博客]: http://blog.csdn.net/zhongshijunacm/article/details/52824894
[address_cuda]: https://developer.nvidia.com/cuda-80-ga2-download-archive
[address_cudnn]: https://developer.nvidia.com/rdp/cudnn-archive
[address_OpenCV]: https://opencv.org/releases.html
[adress_pkgconfig]: http://www.cppblog.com/colorful/archive/2012/05/05/173750.aspx
[address_caffe]: https://github.com/BVLC/caffe
