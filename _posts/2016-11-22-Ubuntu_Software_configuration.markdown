---
layout: post
title: Ubuntu16常用软件安装
date: 2016-11-22 20:25:24.000000000 +09:00
categories: [环境配置]
tags: [Ubuntu]
---

概述：Ubuntu16下的基本软件环境设置

# 自带软件卸载

`Libreoffice`,`amazon链接`等，删除基本不用的自带软件:
```sh
sudo apt-get autoremove libreoffice*
sudo apt-get autoremove unity-webapps-common
sudo apt-get autoremove thunderbird totem rhythmbox empathy brasero simple-scan gnome-mahjongg aisleriot gnome-mines cheese transmission-common gnome-orca webbrowser-app gnome-sudoku  landscape-client-ui-install
```

# 安装搜狗输入法

官网下载[sogou for linux64][address_sogou]，直接安装：
```sh
sudo apt-get install libopencc1 fcitx-libs fcitx-libs-qt
sudo dpkg -i sougou***.deb
```
安装成功后，在系统设置-语言-语言设置-选择`fctix`，重启。

# 安装Chrome

下载`chrome`稳定版安装包，直接`dpkg`安装。
```sh
sudo apt-get install chromium-browser
```
`firefox`卸载：
```sh
dpkg --get-selections | grep firefox（查找安装的内容）
```
然后卸载：
```sh
sudo apt-get purge firefox firefox-locale-en unity-scope-firefoxbookmarks firefox-locale-zh-hans
```
# 安装WPS
同样下载[WPS][address_wps] `deb`安装包，直接`dpkg`安装:
```sh
sudo dpkg -i wps***.deb
```
WPS有时会出现不支持中文输入的问题。打开`/usr/bin/wps(word)`进行修改：
```sh
cd /usr/bin/
sudo gedit wps
```
打开后，添加：
```sh
export XMODIFIERS="@im=fcitx"
export QT_IM_MODULE="fcitx"
```
![图片1](https://github.com/ZhengWG/Imgs_blog/raw/master/Ubuntu16%E5%B8%B8%E7%94%A8%E8%BD%AF%E4%BB%B6%E5%AE%89%E8%A3%85/1.png)
ppt、excel部分和word一样的方法添加环境变量，只是编辑的文件各不同：
```sh
sudo gedit /usr/bin/wpp
sudo gedit /usr/bin/et
```
# 安装Emacs
安装Emacs25版本
```sh
sudo apt-add-repository -y ppa:adrozdoff/emacs
sudo apt update
sudo apt install emacs25
```
# 调整时间差
Ubuntu下设置：
```sh
sudo timedatectl set-local-rtc 1
```
然后在windows下更新最新时间即可。

# 更改键位

编辑文件：/usr/share/X11/xkb/keycodes/evdev

该文件定义了按键和keycode的关系，如预设的CAPS_LOCK键为66，需要更改对应的功能键


[address_sogou]: https://pinyin.sogou.com/linux/
[address_wps]: http://www.wps.cn/product/wpslinux/#
