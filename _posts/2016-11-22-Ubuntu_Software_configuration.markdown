---
layout: post
title: Ubuntu16常用软件安装
date: 2016-11-22 20:25:24.000000000 +09:00
tags: Ubuntu; Emacs
---
概述：Ubuntu16下的基本软件环境设置

# 自带软件卸载

`Libreoffice`,`amazon链接`等，删除基本不用的自带软件:
```
sudo apt-get autoremove libreoffice*
sudo apt-get autoremove unity-webapps-common
sudo apt-get autoremove thunderbird totem rhythmbox empathy brasero simple-scan gnome-mahjongg aisleriot gnome-mines cheese transmission-common gnome-orca webbrowser-app gnome-sudoku  landscape-client-ui-install
```

# 安装搜狗输入法

官网下载[sogou for linux64][address_sogou]，直接安装：
```
sudo apt-get install libopencc1 fcitx-libs fcitx-libs-qt
sudo dpkg -i sougou***.deb
```
安装成功后，在系统设置-语言-语言设置-选择`fctix`，重启。

# 安装Chrome

下载`chrome`稳定版安装包，直接`dpkg`安装。
```
sudo apt-get install chromium-browser
```
`firefox`卸载：
```
dpkg --get-selections | grep firefox（查找安装的内容）
```
然后卸载：
```
sudo apt-get purge firefox firefox-locale-en unity-scope-firefoxbookmarks firefox-locale-zh-hans
```
# 安装WPS
同样下载[WPS][address_wps] `deb`安装包，直接`dpkg`安装:
```
sudo dpkg -i wps***.deb
```
WPS有时会出现不支持中文输入的问题。打开`/usr/bin/wps(word)`进行修改：
```
cd /usr/bin/
sudo gedit wps
```
打开后，添加：
```
export XMODIFIERS="@im=fcitx"
export QT_IM_MODULE="fcitx"
```
![图片1](https://thumbnail10.baidupcs.com/thumbnail/f6bf2439f9e46e8f44ea6429a7ecc3a6?fid=2669703802-250528-1008930021479680&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-1D8HvCrG2O4rWsekXkes%2bZ0Gz%2bI%3d&expires=8h&chkbd=0&chkv=0&dp-logid=322358356242950466&dp-callid=0&time=1547470800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)
ppt、excel部分和word一样的方法添加环境变量，只是编辑的文件各不同：
```
sudo gedit /usr/bin/wpp
sudo gedit /usr/bin/et
```
# 安装Emacs
安装Emacs25版本
```
sudo apt-add-repository -y ppa:adrozdoff/emacs
sudo apt update
sudo apt install emacs25
```
# 调整时间差
Ubuntu下设置：
```
sudo timedatectl set-local-rtc 1 
```
然后在windows下更新最新时间即可。


[address_sogou]: https://pinyin.sogou.com/linux/
[address_wps]: http://www.wps.cn/product/wpslinux/#

