---
layout: post
title: 双系统安装(WIN10+Ubuntu16)
date: 2016-11-17 20:25:24.000000000 +09:00
tags: 双系统安装; Ubuntu
---
# Windows下的安装准备
插入U盘（最好删除其他文件），打开`ULtraiso`软件，打开`Ubuntu16.04 ISO`文件，`启动`->`写入硬盘映像`，选择自己的U盘，选择`便捷启动`，开始写入。
![图片1](https://thumbnail10.baidupcs.com/thumbnail/c8c35594a069338eacf732035ef8f166?fid=2669703802-250528-675070489502619&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-GDkYR6L%2fuUgC1jQpjxa%2b%2fINgAiM%3d&expires=8h&chkbd=0&chkv=0&dp-logid=316968576900207265&dp-callid=0&time=1547452800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

![图片2](https://thumbnail10.baidupcs.com/thumbnail/196d86ed45c5710169236338da65a851?fid=2669703802-250528-1105153693443558&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-wdLIikn9MNoAG7KU3ow0DUT6cTU%3d&expires=8h&chkbd=0&chkv=0&dp-logid=316968576900207265&dp-callid=0&time=1547452800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image)

划分硬盘分区（50G为例）：Win10下，右键点击Windows键（`Windows+X`）选择`磁盘管理`；进入`磁盘管理`之后，选择分区的磁盘（建议选择最后一个磁盘），右键，选择`压缩卷`，系统会自动查询压缩空间，然后选择需要压缩的空间，这里选择50G，点击压缩，压缩成功（这里不需要新建压缩卷）。

# Ubuntu安装

插入之前制作的U盘，重启电脑，进入`boot`界面（按`F1`键，不同主板不一样），将自己U盘优先级调至最前。即可进入Ubuntu的安装，选择安装Ubuntu，中文，选择`其它选项`进行手动分区。
查看硬盘分区情况，选择`空闲`的分区，选择添加，上方分区空间大小，下边填写要挂载的分区，然后确定:
```
逻辑分区，200M，起始，Ext4日志文件系统，/boot；（引导分区200M足够） 
逻辑分区，4000M，起始，交换空间，无挂载点；（交换分区swap，一般不大于物理内存） 
主分区，15000M，起始，Ext4日志文件系统，/；（系统分区”/”或称作”/root”装系统和软件，15G以上足够） 
逻辑分区，剩余空间数，起始，Ext4日志文件系统，/home；（home分区存放个人文档） ，完成安装。
```
安装之后，可能会直接进入Ubuntu系统，需要进行`grub`的修复：
```
sudo update-grub2
```
出现:
```
Generating grub configuration file ...
Found linux image: /boot/vmlinuz-4.4.0-47-generic
Found initrd image: /boot/initrd.img-4.4.0-47-generic
Found linux image: /boot/vmlinuz-4.4.0-31-generic
Found initrd image: /boot/initrd.img-4.4.0-31-generic
Found memtest86+ image: /boot/memtest86+.elf
Found memtest86+ image: /boot/memtest86+.bin
Found Windows 10 (loader) on /dev/sdb1
Done
```

即可在开机启动项中，进行选择。

