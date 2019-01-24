---
layout: post
title: ROS与PhantomXArm机械臂配置
date: 2018-04-19 19:25:24.000000000 +09:00
tags: ROS; PhantomXArm
---
# 硬件接线
机械臂与排线相连，三个端口等效:
![图片1][图片1]
FTDI串口线，直接与电脑相连(确定方向不要接反)：
![图片2][图片2]
![图片3][图片3]
管脚控制USB供电（USB），或者电源线接电（VIN）：
![图片4][图片4]
电源线接12V5A电源：
![图片5][图片5]
# 安装Arduio
```
mkdir ~/tools
cd ~/tools
```
下载`arduino-1.05`或者`1.06` 解压缩到当前目录，启动`arduino` 
```
~/tools/arduino-1.0.5/arduino
```
安装`arbotix`包：
```
sudo apt-get update
sudo apt-get install ros-indigo-arbotix
```
下载`arbotix` 源码：
```
cd ~/tools/
git clone https://github.com/Interbotix/arbotix.git
```
将该文件夹拷贝到库文件所在的文件夹，重启`arduino`可以发现有新的`ros` 例文件，以及新的开发板选项：
![图片6][图片6]
![图片7][图片7]
# ROS固件的烧录
插入`FTDI`线连接电脑，检查是否插入`USB`：
```
lsusb
```
插入的`USB`为`(UART) IC`:
![图片8][图片8]
检查`ttyUSB0`端口是否存在，打开新终端：
```
ls /dev/ -la
```
发现`ttyUSB0`,但是权限受到限制：
![图片9][图片9]
添加权限：
```
sudo chmod 777 /dev/ttyUSB0
```
可得到：
![图片10][图片10]
插入`FTDI`数据线，同时先安装[FTDI驱动](http://www.ftdichip.com/Drivers/VCP.htm),下载对应的FTDI驱动文件，解压缩文件，驱动安装：
```
sudo rmmod ftdi_sio
sudo rmmod usbserial
```
打开ros样例文件,选择对应的板项，选择串口。
![图片11][图片11]
![图片12][图片12]
![图片13][图片13]
下载程序，进行固件的烧录：
![图片14][图片14]
# 安装turtlebot_arm包
安装`deb`包：
```
sudo apt-get install ros-indigo-turtlebot-arm
```
安装工作空间管理工具（`rosdep`初始化可能需要删除原来的初始化文件）：
```
sudo apt-get install python-rosdep python-wstool
sudo rosdep init
rosdep update
```
创建机械臂的工作空间并且下载编译代码：
```
mkdir ~/turtlebot_arm
cd ~/turtlebot_arm
wstool init src
cd src
wstool set turtlebot_arm https://github.com/turtlebot/turtlebot_arm.git --git --version=indigo-devel
wstool update turtlebot_arm
cd ..
source /opt/ros/indigo/setup.bash
rosdep install --from-paths src -i -y
catkin_make
```
# 测试机械臂
连接USB线，电机线以及电源线，终端执行:
```
arbotix_terminal
```
检测电机：
```
ArbotiX Terminal --- Version 0.1
Copyright 2011 Vanadium Labs LLC
>>  ls
1    2    3    4    5 .... .... .... ....
.... .... .... .... .... .... .... .... ....
```
进入包目录：
```
roscd turtlebot_arm_bringup
```
修改配置文件：
```
cd config/
cat arm.yaml
```
修改`port`为`/dev/ttyUSB0`，打开新终端，启动`arm`：
```
roscore
roslaunch phantomx_pincher_arm_bringup arm.launch 
```
新终端：
```
arbotix_gui
```
![图片15][图片15]
# 启动MoveIt
```
roscore
roslaunch phantomx_pincher_arm_bringup moveit.launch
```
![图片16][图片16]

[图片1]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/1.png
[图片2]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/2.png
[图片3]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/3.png
[图片4]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/4.png
[图片5]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/5.png
[图片6]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/6.png
[图片7]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/7.png
[图片8]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/8.png
[图片9]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/9.png
[图片10]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/10.png
[图片11]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/11.png
[图片12]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/12.png
[图片13]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/13.png
[图片14]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/14.png
[图片15]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/15.png
[图片16]: https://github.com/ZhengWG/Imgs_blog/raw/master/ROS%E4%B8%8EPhantomXArm%E6%9C%BA%E6%A2%B0%E8%87%82%E9%85%8D%E7%BD%AE/16.png
