---
layout: post
title: 浙大玉泉Ubuntu VPN设置
date: 2016-07-05 20:25:24.000000000 +09:00
categories: [环境配置]
tags: [ZJU, VPN]
---
概述：针对浙大玉泉校区的Ubuntu下的VPN设置

# 内网有线IP设置
玉泉有线都是要绑定固定`ip`的，实验室无需和`mac`地址绑定，命令如下:

```sh
sudo gedit /etc/network/interfaces
```

需要先`ifconfig`确定网卡号

**说明**：DNS也在这里直接设置了，不要去`/etc/resolv.conf`里设置，那个只是临时的，开机就又没用了。寝室里需要绑定`mac`地址请自行google

```sh
auto eth0
iface eth0 inet static
address /你的ip/
netmask 255.255.255.0
gateway /你的网关/
dns-nameservers 10.10.0.21
sudo ip addr flush enp5s0 #注意替换网卡名称
sudo systemctl restart networking.service
```

此时如果重启会显示设备未托管，解决方法是直接修改文件：

```sh
sudo gedit /etc/NetworkManager/NetworkManager.conf
```

将文件中原本的`false`改为`true`。

```sh
[ifupdown]
managed=true
```

保存重启之后就可以连接内网了，可以得到响应：

```sh
ping 10.5.1.7 #浙大VPN服务器地址
```
# VPN L2TP设置
以下命令需要在联通外网的情况下使用。由于台式机没有无线网卡，所以我用自己的手机连接上电脑后，连`ZJUWLAN`然后在`更多连接方式`里选择`USB共享`。此时台式机可上网。（如果是笔记本请直接连ZJUWLAN）。
依次在终端中输入如下命令。重启后右上角新建VPN连接(Ubuntu14):

```sh
sudo apt-add-repository ppa:seriy-pr/network-manager-l2tp
sudo apt-get update
sudo apt-get install network-manager-l2tp
sudo service xl2tpd stop
sudo update-rc.d xl2tpd disable
```

Ubuntu16需要安装特殊安装包并且禁止更新：

```sh
sudo dpkg -i iproute_3.12.0-2_all.deb
sudo dpkg -i xl2tpd_1.2.5+zju-1_amd64.deb
sudo su
echo "xl2tpd hold" | dpkg --set-selections
#然后查看不更新的软件包
dpkg --get-selections | grep hold1
#看到如下结果就表示成功，此时再更新软件也不会造成错误
xl2tpd                      hold
```

