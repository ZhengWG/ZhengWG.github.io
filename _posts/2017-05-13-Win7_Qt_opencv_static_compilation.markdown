---
layout: post
title: Win7下基于Qt和opencv的程序的运行
date: 2017-05-13 20:25:24.000000000 +09:00
categories: [环境配置]
tags: [Qt, 静态编译]
---
# Qt的静态编译
Qt的版本：`qt-opensource-windows-x86-mingw491_opengl-5.4.0.exe`
注意点：安装组件的时候要注意全选组件


Qt的静态库安装：
这里没有编译静态库，直接使用网上下载的`release`版本的Qt静态库：
下载后直接可以用静态库进行配置,把静态库集成到`QtCreator`里面:
1. 打开`QtCreator`的菜单`工具`--》`选项`;
2. 然后对话框左边选择`构建和运行`;
3. 在构建和运行页面，右边选择`Qt Versions`;
4. 点击右上角`添加`，会弹出查找`qmake.exe`的对话框，找到刚才装的静态库安装目录`\5.3.2\bin\qmake.exe`;
5. 点击确定，就看到新的Qt库;
6. 点击右下角`Apply`按钮，应用配置。
注意一个问题，如果静态库`bin`目录没有`qt.conf`文件，会出现如下错误：
```
Qt没有被正确安装，请运行makeinstall
```
	可以按照[参考博客][address_blog]修复问题。
测试：
新建项目，需要选择两个库，默认的库和新建的`static`库，新建窗口程序：
![图片1](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/1.jpg)

![图片2](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/2.jpg)

打开界面文件，拖入一个控件：

![图片3](https://thumbnail10.baidupcs.com/thumbnail/f65e9d8ba1d016a99316622b7a08597e?fid=2669703802-250528-9568149817825&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-qApEjmtGSYaFPqLVIn2ryN%2bNHCw%3d&expires=8h&chkbd=0&chkv=0&dp-logid=316445576312036794&dp-callid=0&time=1547449200&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

选择static的release进行编译。

![图片4](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/3.jpg)

在生成的目录里面会有一个大概14M的`exe`文件即为静态编译得到的`exe`文件：

![图片5](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/5.jpg)

双击`exe`文件便可：

![图片6](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/6.jpg)

该程序可以在没有配置环境的电脑上运行。

# Opencv的配置

时间原因，没有成功完成OpenCV的静态编译过程，这里仅就OpenCV的静态编译以及打包动态库文件进行说明。
OpenCV的安装：
OpenCV版本：`OpenCV3.1`
双击解压缩OpenCV下载文件：生成OPENCVDIR目录
打开`CMake`，在`source code`中填写`OpenCV源码`，目录为`%OPENCVDIR%/sources`,在`build the binaries`中填写编译后的目录，本例中填写为`%OPENCVDIR%/bin`,按下下方的`conigure`键，之后会弹出一个对话框，按照下图选择，之后点击Next：

![图片8](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/8.png)

分别在`C`和`C++`出填写目录：
```
%QTDIR%/tools/mingw482_32/bin/gcc.exe
%QTDIR%/tools/mingw482_32/bin/g++.exe
```
点击`finish`，之后`CMake`会自动`configure`，这段时间可能会因为无法下载`ffmepg.dl`文件引发错误，这时候需要翻墙下载。之后再单击一下，其中可以添加OpenCV的外来模块：`Contrib_modeul`，在`Opencv_extra_module`选中，现在的模块的`module`文件夹，但是可能部分模块无法编译成功，取消勾选即可，比如`dnn`模块等等。再次`configure`，等待确认好了之后，再单击`generate`，等到下方状态框中显示`done`的时候就可以退出`CMake`。

**NOTE**:有的版本上说要勾选`WITH_OPENGL`和`WITH_QT`，本过程中没有勾选，编译成功，勾选以后不能成功。

进入`cmd`，然后进入`%OPENCVDIR%/bin`目录,之后输入`mingw32-make`，按回车等待`mingw`进行编译，根据电脑不同，时间会有长短，一般会大概20分钟左右。等待编译结束，再输入`mingw32-make install`，这个会比较快，大概1分钟以内。

现在我们已经完成了OpenCV的编译，之后我们会将其同Qt结合。`Pro`文件夹中需要添加：
```
INCLUDEPATH += D:\software\opencv\opencv\bin\install\include \
D:\software\opencv\opencv\bin\install\include\opencv \
D:\software\opencv\opencv\bin\install\include\opencv\opencv2
LIBS += D:\software\opencv\opencv\bin\install\x86\mingw\lib\lib*.a \
```
最后需要在`exe`文件中添加`dll`文件,包括OpenCV的`dll`文件和Qt的部分`dll`文件以及一些系统的`dll`文件:

![图片7](https://github.com/ZhengWG/Imgs_blog/raw/master/2017-05-13-Win7%E4%B8%8B%E5%9F%BA%E4%BA%8EQt%E5%92%8Copencv%E7%9A%84%E7%A8%8B%E5%BA%8F%E7%9A%84%E8%BF%90%E8%A1%8C/7.jpg)


[address_blog]: http://www.cnblogs.com/andy65007/p/3493309.html
