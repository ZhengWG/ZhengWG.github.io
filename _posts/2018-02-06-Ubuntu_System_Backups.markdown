---
layout: post
title: Ubuntu16系统的备份与迁移
date: 2018-02-06 20:25:24.000000000 +09:00
tags: Ubuntu; 系统备份
---
概述：关于ubuntu系统的备份与恢复，网上资料很多，但多是错误或者不全的。这里介绍一下正确的系统备份与恢复的步骤，也可以在不同的电脑上拷贝自己的系统。

值得注意的是，为了系统恢复的方便，自己系统的分区为：`主分区（/）`，`home分区（/home)`，`交换空间`，以及`boot分区（/boot）`。这里进行了分别备份，以供不同的恢复需求。采用的是`livecd`的恢复方式，因为自己用`tar`方式备份，直接删除文件有错误，所以直接用`livdcd`的方式。

**PS**: 这里没有考虑`efi`系统分区，实际步骤类似，但是对不支持`efi`分区的电脑就会出错。

部分图片引自[IT之家][address_IT之家]，侵删。

# 硬件需求
Ubuntu系统U盘（`livecd`）

备份数据的移动硬盘

# 备份过程
启动过程中从U盘启动，采用试用Ubuntu系统的方式，进入`livecd`模式
![图片1][图片1]
进入`root`模式：
```
sudo su
fdisk -l
```
显示分区情况：
![图片2][图片2]
其中`boot`分区为`/dev/sda5,home`分区为`/dev/sda7`,主分区为`/dev/sda8`,进入`sudo`模式：

分别进行挂载：
```
# mount /dev/sda5 /boot
# mount /dev/sda7 /
# mount /dev/sda8 /mnt
```
再对移动硬盘进行挂载：
```
# mount /media/ubuntu/移动硬盘对应盘符 /data
```
进行备份：
```
# mksquashfs /mnt /data/ubuntu_main.sfs(文件名任意)
# mksquashfs /home /data/ubuntu_home.sfs(文件名任意)
# mksquashfs /boot /data/ubuntu_boot.sfs(文件名任意)
# sync(让系统保存一下数据)
```
卸载硬盘：
```
# umount /data
# umount /mnt
# umount /home
# umount /boot
```
到此备份成功。

# 恢复系统
恢复系统指的是将一个系统完全恢复成之前的状态，采用`tar`命令恢复系统只能覆盖原有文件，无法删除文件，而采用`livecd`的方式则可以完全恢复成指定的系统。先要对之前的启动文件和分区文件做一个备份，分别为`/etc/fstab,/etc/fstab.d`（可能没有）,`/boot/grub/grub.cfg`：
```
sudo cp /etc/fstab /media/用户名/移动硬盘对应盘符/
sudo cp /boot/grub/grub.cfg /media/用户名/移动硬盘对应盘符/
```
接下来进行恢复系统，同样利用系统u盘进入livecd模式。同样进入root模式，查看分区情况：
![图片3][图片3]
假设分区情况如上：`/dev/sda1`为`/boot`分区，`/dev/sda2`为`/主分区`，`/dev/sda3`为`/home`分区。对`/home分区`和`/主分区`进行格式化：
```
# sudo su
# mkfs.ext4 /dev/sda2
# mkfs.ext4 /dev/sda3
```
然后分别进行挂载：
```
# mount /dev/sda2 /mnt
```
新建`home`和`boot`文件:
```
# mkdir /mnt/home
# mkdir /mnt/boot
```
挂载其他两个盘：
```
# mount /dev/sda1 /mnt/boot
# mount /dev/sda3 /mnt/home
```
挂载数据盘：
```
# mkdir /rescovery/mnt
# mkdir /rescovery/home
# mkdir /rescovery/boot
# mount -o loop /media/ubuntu/移动硬盘盘符/ubuntu_main.sfs /rescovery/mnt
# mount -o loop /media/ubuntu/移动硬盘盘符/ubuntu_home.sfs /rescovery/home
# mount -o loop /media/ubuntu/移动硬盘盘符/ubuntu_boot.sfs /rescovery/boot\
```
复制文件：
```
# cp -a /recovery/mnt/* /mnt
# cp -a /recovery/home/* /mnt/home
# cp -a /recovery/boot/* /mnt/boot
```
然后拷贝之前的`fstab`和`grub.cfg`文件到硬盘：
```
# cp /media/ubuntu/移动硬盘盘符/fstab /mnt/etc/
# cp /media/ubuntu/移动硬盘盘符/grub.cfg /mnt/boot/grub/
```
挂载虚拟文件系统，这是为了后面修复引导做准备。
```
#mount --o bind /dev /mnt/dev
#mount --o bind /proc /mnt/proc
#mount --o bind /sys /mnt/sys
```
`chroot`进入已经还原的操作系统:
```
#chroot /mnt
```
查看当前`UUID`,由于我们格式化了分区，所以`UUID`发生了变化，若不修改，系统将无法正常挂载分区，导致启动异常。故需要修改本机系统的`UUID`设置,当前终端不要关闭，新建一个终端，输入`blkid`,显示如下：
![图片][图片4]
对`fstab`文件进行格式化两个盘的`UUID`的更改,在`chroot`过的端口输入：
```
# nano /etc/fstab
```
更改两个`UUID`，`ctrl+x`退出，`Y`保存。进行`grub`的更新：
```
# grub-install /dev/sda
# update-grub
```
退出并卸载盘：
```
# exit
# umount /mnt/dev
# umount /mnt/sys
# umount /proc
# sync
```
重启即可





[address_IT之家]: https://www.ithome.com/
[图片1]: https://thumbnail10.baidupcs.com/thumbnail/bf4f04cc25771426e1354ee24a62eba0?fid=2669703802-250528-886678420642874&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-H6KBkNSj%2bWUQkpJvEJ6olpkJynw%3d&expires=8h&chkbd=0&chkv=0&dp-logid=322645388918808527&dp-callid=0&time=1547470800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片2]: https://thumbnail10.baidupcs.com/thumbnail/a3f144a167b8bb8f855b613280c395d4?fid=2669703802-250528-1003171764448725&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-DVeMx0K9oSxZP0xfULswaG7T8qM%3d&expires=8h&chkbd=0&chkv=0&dp-logid=322645388918808527&dp-callid=0&time=1547470800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片3]: https://thumbnail10.baidupcs.com/thumbnail/224be15360ef379543abb5da80268b94?fid=2669703802-250528-345047071881643&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-ggV4fhrfeXwoAKDHQOOF1ro%2bnDw%3d&expires=8h&chkbd=0&chkv=0&dp-logid=322645388918808527&dp-callid=0&time=1547470800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image
[图片4]: https://thumbnail10.baidupcs.com/thumbnail/43db6b469e54d250e25708603aa2a93e?fid=2669703802-250528-90310093717786&rt=pr&sign=FDTAER-DCb740ccc5511e5e8fedcff06b081203-2vvV7h67WhuSz8%2fppQMjgtVq0RU%3d&expires=8h&chkbd=0&chkv=0&dp-logid=322645388918808527&dp-callid=0&time=1547470800&size=c10000_u10000&quality=90&vuk=2669703802&ft=image

