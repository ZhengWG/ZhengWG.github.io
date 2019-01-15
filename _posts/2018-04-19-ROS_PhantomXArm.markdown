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

[图片1]: https://thumbnail10.baidupcs.com/thumbnail/af0324038be4c131f27f8c251c962738?fid=2669703802-250528-347897463954350&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-VrMI2cRpdm5oesZxbMKjILXJlog%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片2]: https://thumbnail10.baidupcs.com/thumbnail/11945ba9024d3fe0a652e7d12cfda973?fid=2669703802-250528-1066197947450291&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-CEeeXqyINX1CPIGZKYBjlJ%2bcODg%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片3]: https://thumbnail10.baidupcs.com/thumbnail/f8fb7779a85e11ad50ded9fbcc4b444d?fid=2669703802-250528-22476911788669&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-pAC7OC3Zpjh5tuPA5eoO4PGsJ%2f8%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片4]: https://thumbnail10.baidupcs.com/thumbnail/530a90048f783b08d5ca1fd3a8e5bea0?fid=2669703802-250528-1099954769557276&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-IESbt%2b2QYvflMXdYBlhtwIAtWCM%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片5]: https://thumbnail10.baidupcs.com/thumbnail/6b4802c9f4ca7e65e0bd3e1a7446576a?fid=2669703802-250528-890608461771504&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-P3tCbWt%2b0HBVHkALpRNXlroEF3Q%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片6]: https://thumbnail10.baidupcs.com/thumbnail/bd44761c39871818fe80e0984c469c92?fid=2669703802-250528-1020760396440247&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-dlabqqPyuOXDLdLOpop%2fb5uhZ1k%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片7]: https://thumbnail10.baidupcs.com/thumbnail/005aefcd7bffc593afd2d96de7869f3d?fid=2669703802-250528-298296508775695&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-hQly2D6XlnSdy03THKSRa8j1jUk%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片8]: https://thumbnail10.baidupcs.com/thumbnail/eb6d677ae3c13b18ae9f9845a6ca0d16?fid=2669703802-250528-863300071505278&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-aCwcZhQ81rkpjfAivyXBb%2f3AaO8%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片9]: https://thumbnail10.baidupcs.com/thumbnail/439d97022e861cd3c3f1de089da1ac60?fid=2669703802-250528-121669645154664&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-sXgp4ReB0QZICIlW4ajHn87fKpo%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片10]: https://thumbnail10.baidupcs.com/thumbnail/e9271dabe9d5df02b11b069240acfdfb?fid=2669703802-250528-178462680925685&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-IfW%2fbCkLC0RsnOwamXvo%2bcAmyIA%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片11]: https://thumbnail10.baidupcs.com/thumbnail/bd44761c39871818fe80e0984c469c92?fid=2669703802-250528-357784885980782&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-q3R3KzFGDafhpi5Ao15g%2bVzLhmA%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片12]: https://thumbnail10.baidupcs.com/thumbnail/005aefcd7bffc593afd2d96de7869f3d?fid=2669703802-250528-717388189494807&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-1IMvFRN%2fSBOHnhgOn4WSgXlizmI%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片13]: https://thumbnail10.baidupcs.com/thumbnail/da820ec3638d50a84f9d8eb9396e1f67?fid=2669703802-250528-982203885828851&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-v1G82uPqm1JHJ81GwEVVnoLChwk%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片14]: https://thumbnail10.baidupcs.com/thumbnail/4c6be707f5bdbaee90e2422e7c93fdb0?fid=2669703802-250528-347429919543110&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-%2fivHGF0H%2boroS1sG9%2fWDSvd85Aw%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片15]: https://thumbnail10.baidupcs.com/thumbnail/0bd2ad3f9933d6f39632b5e437e307e7?fid=2669703802-250528-555977225345853&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-m8n2o5QiqaE6l9HhSWPqqzg%2f2bs%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片16]: https://thumbnail10.baidupcs.com/thumbnail/170d819438cc3d8030bcb744a6b5a075?fid=2669703802-250528-946766298435422&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-%2f%2fmY3ryZiKj10eEdlLzs2aenMh0%3d&expires=8h&chkbd=0&chkv=0&dp-logid=343329080615893768&dp-callid=0&time=1547550000&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
