---
layout: post
title: ROS下Astra Pro和RealSense摄像头配置
date: 2018-04-19 20:25:24.000000000 +09:00
categories: [环境配置]
tags: [ROS, RGB-D摄像头]
---
概述：

系统：`ubuntu14.04.5(64)`+`ASTRA`+`SR300`摄像头

摄像头型号：`ORBBEC Astra`摄像头+`RealSense SR300`

`ROS`版本：`Indigo version`

**Note**:驱动的安装和系统版本有关系，所以务必使用支持更新的系统版本，这里使用的是`ubuntu14.04.5`,另外`github`上的程序包因为会不断更新，所以部分文件会有不同，注意版本。

# ORBBEC Astra驱动安装
请在下面网址，分别下载对应包：[Package1][address_package1],[Package2][address_package2]

也可以直接下载打包好的资源：[安装包][address_package3]

首先安装驱动，依据版本选择下载驱动中合适的版本：`OpenNI-Linux-x64-2.3`
安装必要的头文件和库：
```
sudo apt-get install build-essential freeglut3 freeglut3-dev
```
检查`udev`版本：
```
ldconfig -p | grep libudev.so.1
cd /lib/x86_64-linux-gnu
sudo ln -s libudev.so.x.x.x libudev.so.1
```
安装驱动,解压缩文件:
```
cd OpenNI-Linux-x64-2.3
sudo sh install.sh
```
该操作会产生`OpenNIDevEnvironment` 文件：
```
source OpenNIDevEnvironment
```
编译示例程序:
```
cd Samples/SimpleViewer
make
```
启动示例程序之前需要设置权限：
```
sudo apt-get install libgl1-mesa-dri
```
运行示例程序：
```
cd Bin/x64-Release
./SimpleViewer
```
效果如下：
![图片1][图片1]

# SR300驱动安装
[官方驱动][address_sr300]
这里安装在主文件夹内：
```
git clone https://github.com/IntelRealSense/librealsense
```
解压进入文件夹，更新系统：
```
sudo apt-get update && sudo apt-get upgrade && sudo apt-get dist-upgrade
```
安装依赖项：
```
sudo apt-get install libudev-dev pkg-config libgtk-3-dev
```
进入`libsense`文件夹后，执行：
```
./scripts/install_glfw3.sh
```
安装`gcc-5`:
```
sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt-get update`
sudo apt-get install gcc-5 g++-5
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-5 60 --slave /usr/bin/g++ g++ /usr/bin/g++-5
sudo update-alternatives --set gcc "/usr/bin/gcc-5
```
因为最新的`linsense`安装包的`cmake`文档文件需要`cmake3`以上的版本，所以这里先需要安装`cmake3`：
```
sudo apt-get install cmake3
```
进行源码编译：
```
mkdir build
cd build
cmake ..
make && sudo make install
cmake ../ -DBUILD_EXAMPLES=true
make && sudo make install
```
编译完成后，因为`ubuntu14`下软件依赖于`cmake2.8`,所以要卸载`cmake3`：
```
sudo apt-get remove cmake3
sudo apt-get remove cmake-data
sudo apt-get install cmake
```
安装`Video4Linux`(liunx下的内核驱动),拷贝文件：
```
sudo cp config/99-realsense-libusb.rules /etc/udev/rules.d/
```
强制使用新的`udev`规则：
```
sudo udevadm control --reload-rules && udevadm trigger
```
安装`openssl`:
```
sudo apt-get install libssl-dev
```
安装补丁模块：
```
./scripts/patch-realsense-ubuntu-xenial.sh
```
安装完毕之后 ，插入`sr300`摄像头，执行命令，会发现有驱动安装：
```
sudo dmesg | tail -n 50
```
进入到之前的`build/examples/capture`文件夹，执行`demo`：
```
cd build/examples/capture
./rs-capture'
```
![图片2][图片2]

# ROS安装
1. 安装
```
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
#设置密钥
sudo apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net --recv-key 0xB01FA116
#如果上面的命令超时，则执行
sudo apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-key 0xB01FA116
```
2. 初始化：
```
sudo apt-get install ros-indigo-desktop-full
sudo rosdep init
sudo rosdep update
```
3. 环境设置：
```
echo "source /opt/ros/indigo/setup.bash" >> ~/.bashrc
source ~/.bashrc
```
4. 安装`rosinstall`:
```
sudo apt-get install python-rosinstall
```
5. 验证demo：

初始化ROS环境，全局参数，以及每个节点注册等工作：
```
roscore
```
打开一个终端，开启一个小乌龟界面：
```
rosrun turtlesim turtlesim_node
```
![图片3][图片3]
再打开一个终端，键盘控制小乌龟移动
```
rosrun turtlesim turtle_teleop_key
```
再打开终端，看到`Ros node`图形展示
```
rosrun rqt_graph rqt_graph
```
# ROS下使用Astra摄像头
安装`astra_camera`和`astra_launch`驱动：
```
sudo apt-get install ros-indigo-astra-camera ros-indigo-astra-launch
```
打开一个新终端，执行`astra_launch`:
```
roslaunch astra_launch astra.launch
```
正常的话可以通过`rqt_image_view`进行显示：
```
rosrun rqt_image_view rqt_image_view
```
可分别显示RGB图像和深度图像：
![图片4][图片4]
也可以采用`rviz`来进行显示：如果出现`rviz`显示界面全黑的情况需要强制软件渲染：
```
export LIBGL_ALWAYS_SOFTWARE=1
```
再次打开`rviz`:
```
 rosrun rviz rviz
```
更改`Fixed Frame`为`camera_rgb_frame`，并Add一个`camera`:
![图片5][图片5]
更改`image Topic`为`/camera/rgb/image_raw`，即可在左下方显示rgb图像：
![图片6][图片6]
更改`Fixed Frame`为`mera_depth_optical_frame`，并Add一个`PointCloud2`，更改`PointCloud2`中的`topic`图像为`/camera/depth/points`，得到点云图像：
![图片7][图片7]
# ROS下使用RealSense摄像头
`Deb`安装：
```
sudo apt-get install ros-kineticros-realsense-camera
```
源码安装：
```
cd /
mkdir catkin_ws/src
git clone https://github.com/intel-ros/realsense.git
cd ..
catkin_make
rospack profile
```
打开一个新终端：
```
roscore
roslaunch realsense_camera sr300_nodelet_rgbd.launch
rosrun rqt_image_view rqt_image_view
```
![图片8][图片8]
`Rviz`下：
```
rosrun rviz rviz
```
![图片9][图片9]


[address_package1]: https://github.com/ktossell
[address_package2]: https://orbbec3d.com/develop/
[address_package3]: http://download.csdn.net/detail/zhangrelay/9705366
[address_sr300]: https://github.com/IntelRealSense/librealsense
[图片1]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/1.png
[图片2]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/2.png
[图片3]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/3.png
[图片4]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/4.jpg
[图片5]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/5.png
[图片6]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/6.png
[图片7]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/7.png
[图片8]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/8.png
[图片9]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS-kinetic%E4%B8%8BAstra%20Pro%E5%92%8CRealSense%E6%91%84%E5%83%8F%E5%A4%B4%E9%85%8D%E7%BD%AE/9.png
