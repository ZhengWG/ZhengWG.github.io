---
layout: post
title: Turtlebot2i软件包的安装与配置
date: 2018-04-20 20:25:24.000000000 +09:00
tags: Turtlebot2i; ROS

---
概述：`Turtlebot2i`是针对`turtlebot2-arm`版本的软件安装包，这里简单介绍一下它的的安装与编译，根据实际情况与官方教程有所不同。本文的软件安装过程：先安装`ROS-kinetic`基本功能包-测试主从机`ssh`通信-配置`Turtlebot2i`软硬件。

# 硬件列表
`Kubuki`底座；`sr300`摄像头；`astra`摄像头；`phantomx`机械臂，工控机（这里我用了自己的笔记本代替）。
![图片1][图片1]

# 软件列表
系统：`ubuntu16 LTS`(建议安装最新核的系统，本人系统核为`4.13.0-32-generic`，用`uname -r`命令查看,`ubuntu14`编译需要更改相关库文件以及部分`lanuch`文件)
Ros版本：`ros-kinectic`

[软件包下载地址](https://github.com/Interbotix/turtlebot2i)

# 基本ROS包编译

> [官方参考](https://github.com/Interbotix/turtlebot2i/wiki/Full-Build-Instructions)

## GTK安装
```
sudo apt-get install build-essential libgtk-3-dev
```
## 安装源
```
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
```
## 添加key并更新
```
sudo apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-key 421C365BD9FF1F717815A3895523BAEEB01FA116
sudo apt update && sudo apt upgrade
```
## ssh安装(用于远程控制)
```
sudo apt install vino ssh gedit
```
修改参数，勾选`允许其他人查看您的桌面`，`允许其他用户控制您的桌面`，取消勾选`必须对本机器的每次访问进行确认`:
```
vino-preferences
```
![图片2][图片2]

## 安装ROS-kinetic安装包
```
sudo apt install git build-essential ros-kinetic-desktop
sudo rosdep init
rosdep update
sudo apt install python-rosinstall
```

# 主从机控制

## 主从机通信
获取两台电脑的`IP`（假设此时从属笔记本已经连接上了主控制PC网络）：
```
ifconfig
```
![图片3][图片3]
上图中的`inet`的地址即为该电脑的`IP`(台式机连接有线的话则为`eth0`)，得到计算机的主机名：
```
hostname
```
两台电脑`hosts`文件加入主从机的主机名和`IP`：
```
sudo chmod a+w /etc/hosts
vim /etc/hosts
```
![图片4][图片4]
重启网络：
```
sudo /etc/init.d/networking restart 
```
两台电脑需要进行同步(可能需要安装`sudo apt install ntpdate`)：
```
sudo apt-get install chrony
sudo ntpdate ntp.ubuntu.com
#安装ssh:
sudo apt-get install openssh-server
#查看ssh状态：
sudo service ssh status
```
显示：`ssh start/running, process 1271`。

开始通信，台式机进行`ping`，连接笔记本,`hostname`为各自电脑的`hostname`：
```
ssh PC_hostname
ping laotop_hostname
```
会得到相应的信息,进行`demo`的测试（ROS）,台式机上运行:
```
ssh PC_hostname
roscore
```
启动`listener`，并且设置`ROS_MASTER_URI`：
```
export ROS_MASTER_URI=http://PC_hostname:11311
rosrun rospy_tutorials talker.py  
```
笔记本上运行：
```
ssh laptop_hostname
export ROS_MASTER_URI=http://PC_hostname:11311
rosrun rospy_tutorials listener.py
```
可以得到`hello`的信息。

## 主从Turtlebot控制
主机上进行`.bashrc`文件的修改，可以不用再需要`ssh`:
```
gedit ~/.bashrc
```
加入以下内容：
```
export ROS_HOSTNAME=PC_hostname
export ROS_MASTER_URI=http://PC_hostname:11311
```
笔记本上需要添加：
```
export ROS_HOSTNAME=laptop_hostname
export ROS_MASTER_URI=http://PC_hostname:11311
```
主机台式机上运行：
```
roscore
```
计算机上运行：
```
rosrun turtlesim turtlesim_node
```
![图片5][图片5]
台式机上运行即可：
```
rosrun turtlesim draw_square
```
`Turtlebot`监控,在笔记本上：
``
roslaunch turtlebot_bringup minimal.launch --screen
``
台式机上：
```
roslaunch turtlebot_teleop keyboard_teleop.launc
```

# Turtlebot2i功能包安装

## RealSense安装包安装
原教程中需要更新系统核到`4.0.4.10`以上，如果核的版本在此以上则无需升级，直接安装：
```
sudo apt install ros-kinetic-librealsense ros-kinetic-realsense-camera
#安装过程中会报错，但是貌似不影响使用。
sudo apt-get install libglfw3-dev
cd librealsense
mkdir build && cd build
cmake ../
cmake ../ -DBUILD_EXAMPLES=true
make && sudo make install
cd ..
sudo cp config/99-realsense-libusb.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && udevadm trigger
./scripts/patch-realsense-ubuntu-xenial.sh
```
安装结束后可以测试`demo`，进入`~/librealsense/build/examples/capture/`目录,执行：
```
./rs-capture
```
![图片6][图片6]

## Turtlebot官方包安装
```
sudo apt install ros-kinetic-turtlebot* libudev-dev ros-kinetic-find-object-2d ros-kinetic-rtabmap-ros ros-kinetic-mov
eit ros-kinetic-octomap-ros ros-kinetic-manipulation-msgs ros-kinetic-controller-manager python-wxgtk3.0

```

## Turtlebot2i包下载和编译
```
source /opt/ros/kinetic/setup.bash
cd ~
mkdir -p ~/turtlebot2i/src
cd ~/turtlebot2i/src
git clone https://github.com/Interbotix/turtlebot2i.git .
git clone https://github.com/Interbotix/arbotix_ros.git -b turtlebot2i
git clone https://github.com/Interbotix/phantomx_pincher_arm.git
git clone https://github.com/Interbotix/ros_astra_camera -b filterlibrary
git clone https://github.com/Interbotix/ros_astra_launch
cd ~/turtlebot2i
catkin_make
```

## 修改Shell环境变量
打开`~/.bashrc`文件，修改环境变量:
```
gedit ~/.bashrc
```
添加以下内容：
```
source /opt/ros/kinetic/setup.bash
source /home/用户名/turtlebot2i/devel/setup.bash
alias goros='source devel/setup.sh'
export ROS_HOSTNAME=example.hostname
export TURTLEBOT_3D_SENSOR=astra
export TURTLEBOT_3D_SENSOR2=sr300
export TURTLEBOT_BATTERY=None
export TURTLEBOT_STACKS=interbotix
export TURTLEBOT_ARM=pincher
```
最后`source`脚本文件:
```
source ~/.bashrc
```
## 建立UDEV规则
```
sudo usermod -a -G dialout turtlebot
cd ~/turtlebot2i/
goros
rosrun kobuki_ftdi create_udev_rules
rosrun astra_camera create_udev_rules
cd ~/turtlebot2i/src/turtlebot2i_misc
```
另外还需要建立机械臂端口的`udev`规则，这里与教程有所不同，教程中再次设定了底座的端口名，但是前面其实已经设定了，所以不需要再次设定，而且原教程的方法在我的电脑上不适用。这里介绍我自己的方法：

先打开`99-turtlebot2i.rules`规则文件：
```
gedit 99-turtlebot2i.rules
```
插入`arbotix`机械臂控制板(控制板需要烧录固件，并且安装驱动，参照[arbotix控制板使用](https://www.johneyzheng.top/2018/04/ROS_PhantomXArm/))，查看其端口名:
```
lsusb
```
![图片7][图片7]
其中的`FT232`端口即为`arbotix`驱动板的端口，查看`usb`名:
```
ls /dev -l
```
![图片8][图片8]
端口为`ttyUSB0`端口，底座端口为`ttyUSB1`，注意最好记录两者所插的USB口，两者端口插反的话有可能导致端口识别错误,查看`ttyUSB0`端口的信息：
```
udevadm info -a -p $(udevadm info -q path -n /dev/ttyUSB0)
```
找到对应的KERNELS（为第一个带有：的`KERNELS`的之后那个）`2-1`：
![图片9][图片9]
建立`uedv`规则：`KERNELS=="2-1", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", MODE="0777", SYMLINK+="arbotix"`

复制到规则目录，重启规则：
```
sudo cp ./99-turtlebot2i.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && sudo service udev restart && sudo udevadm trigger
```
可以进行测试机械臂，连接电源，重接跳线帽，输入：
```
arbotix_terminal
ls
```
可以得到各个舵机的编号：`1,2,3,4,5.....`

## 测试demo
连接好底座，机械臂控制板（底座供电，注意usb口要保持保持一致接入），`astra`摄像头以及`sr300`摄像头。

测试demo,打开端口输入：
```
roscore
```
再输入：
```
roslaunch turtlebot2i_bringup turtlebot2i_demo1.launch rviz:=true
```
得到：
![图片10][图片10]

# 如何学习ROS

## 学习资料

开始学习教程 - 立刻进入和开始使用ROS开始学习教程 - 立刻进入和开始使用[ROS教程](http://wiki.ros.org/cn/ROS/Tutorials)
  
概览 - 通读ROS和它的功能的这个[概览](http://wiki.ros.org/cn/ROS/Introduction)。

有关ROS架构的更多详细信息，请参考[ROS核心文档](http://wiki.ros.org/cn/ROS) 。

找答案 有三个地方去寻找你的问题的答案。第一个就是维基。请尝试右上角的“搜索”（ Search）功能。如果你不能找到你的问题的解决方法，就尝试搜索[官网](http://answers.ros.org)或者邮件列表归档。或者在[官方论坛](http://answers.ros.org/questions/ask/ )上提出问题。查看[支持页面](http://wiki.ros.org/Support)获取更多信息。

找代码 查看[ROS软件包](http://www.ros.org/browse/list.php)这个浏览软件包的工具可以让你搜索一些有用的软件包。

你也可以通过浏览公开的[ROS代码库](http://wiki.ros.org/RecommendedRepositoryUsage/CommonGitHubOrganizations)的这个列表来寻找做相似工作的群组

如何使用这个wiki 请参考[维基导航](http://wiki.ros.org/ROS/Tutorials/NavigatingTheWiki)来获取更多信息。

## ROS机器人操作系统官方教程说明

示例源码文件夹：`/opt/row_ws/src`

环境配置：`rosdep install --from-paths src -iy`

配置完成后：`All required rosdeps installed successfully`

编译功能包：在`ros_ws`目录下输入：
```
catkin_make -j1 -l1
```
如果没有遇到错误，就可以使用功能包中的教程进行实验了。在`.bashrc`中添加：`source /opt/ros_ws/devel/setup.bash`,或者使用：
```
echo "source /opt/ros_ws/devel/setup.bash" >> ~/.bashrc
```
测试（源码位于`/opt/ros_ws/src/common_tutorials/`）：
```
roscore
rosrun turtlesim turtlesim_node
rosrun turtle_actionlib shape_server
rosrun turtle_actionlib shape_client
```
测试（示例源码在`/opt/ros_ws/src/geometry_tutorials`）：
```
roslaunch turtle_tf2 turtle_tf2_demo.launch
rviz
```

[图片1]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/1.jpg
[图片2]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/2.png
[图片3]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/3.png
[图片4]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/4.png
[图片5]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/5.png
[图片6]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/6.png
[图片7]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/7.png
[图片8]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/8.png
[图片9]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/9.png
[图片10]: https://github.com/ZhengWG/Imgs_blog/raw/master/Turtlebot2i%E8%BD%AF%E4%BB%B6%E5%8C%85%E7%9A%84%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AE/10.png
