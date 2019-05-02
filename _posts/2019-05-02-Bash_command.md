---
layout: post
title: bash常用命令总结
date: 2019-05-02 00:25:24.000000000 +09:00
tags: Bash; grep; xargs; sed; awk; find 
---
<div id="table-of-contents">
<h2>Table of Contents</h2>
<div id="text-table-of-contents">
<ul>
<li><a href="#sec-1">1. grep</a></li>
<li><a href="#sec-2">2. xargs</a></li>
<li><a href="#sec-3">3. sed</a></li>
<li><a href="#sec-4">4. awk</a></li>
<li><a href="#sec-5">5. find</a></li>
</ul>
</div>
</div>

# grep<a id="sec-1" name="sec-1"></a>

查找字符串
-   '-r':目录查找， `grep -r "sample" .`
-   '-c':显示匹配数， `grep -c "sample" .`
-   '-i':忽略大小写
-   '-n':输出行号

# xargs<a id="sec-2" name="sec-2"></a>

xargs将stdin的资料读入，并以空白字元或者断行字元作为分辨，将stdin资料分隔为arguments，其默认的命令为echo,如：

    echo "\t" | xargs
    t

-   '-n' 选择多行输出
-   '-d' 选择定界符
-   '-I' 占位符,可以指定字符串进行替换
-   '-P' 可以进行并行操作

# sed<a id="sec-3" name="sec-3"></a>

sed是非交互的编辑器，不修改原始文件，而是通过将原始文件存储到临时缓存区中进行修逐行处理，每处理一行就删除一行并将结果输出到屏幕上。sed命令可以通过定址的方式对文件进行编辑。定址的形式有数字，正则表达式，或者两者的结合。没有定址的话默认输出全部。

常见的命令:

-   打印：

p :

    cat test.output
    # [layer1],[Forward Timer],__conv__,3.108
    # [layer2],Forward Timer],__conv__,3.17
    # [layer2],Forward Timer],__conv__,13.17
    sed -n '$p' test.output
    # 打印出最后一行
    # -n表示只把符合要求的行进行打印，否则会把所有行以及符合要求都打印出来，即符合要求的行会被打印两遍
    # [layer2],Forward Timer],__conv__,13.17
    sed -n '/\[layer2/p' test.output
    # 把包含[layer2的行打印出来，[需要\进行转义
    # [layer2],Forward Timer],__conv__,3.17
    # [layer2],Forward Timer],__conv__,13.17
    sed -n '/\[layer1/,2p' test.output
    # 输出包含[layer1的行到第二行
    # [layer1],[Forward Timer],__conv__,3.108
    # [layer2],Forward Timer],__conv__,3.17

-   删除：

d:

    cat test.output
    # [layer1],[Forward Timer],__conv__,3.108
    # [layer2],Forward Timer],__conv__,3.17
    # [layer2],Forward Timer],__conv__,13.17
    sed '$d' test.output
    # 删除最后一行
    # [layer1],[Forward Timer],__conv__,3.108
    # [layer2],Forward Timer],__conv__,3.17
    sed '/\[layer2/d' test.output
    # 把包含[layer2的行删除
    # [layer1],[Forward Timer],__conv__,3.108
    sed -n '/\[layer1/,2d' test.output
    # 删除包含[layer1的行到第二行
    # [layer2],Forward Timer],__conv__,13.17

-   替换：

s:默认是对每行搜索到的第一个符合要求的字符进行匹配

    cat test.output
    # [layer1],[Forward Timer],__conv__,3.108
    # [layer2],[layer2],Forward Timer],__conv__,3.17
    # [layer2],Forward Timer],__conv__,13.17
    sed 's/\[layer2]/Zheng/' test.output
    # 仅对行内第一个匹配到的字符进行替换
    # [layer1],[Forward Timer],__conv__,3.108
    # Zheng,[layer2],Forward Timer],__conv__,3.17
    # Zheng,Forward Timer],__conv__,13.17
    sed 's/\[layer2]/Zheng/g' test.output
    # 代表对行内所有匹配得打的字符进行替换
    # [layer1],[Forward Timer],__conv__,3.108
    # Zheng,Zheng,Forward Timer],__conv__,3.17
    # Zheng,Forward Timer],__conv__,13.17
    sed -n '1,2s/[1-9]$/Zheng/p' test.output
    # 处理1-2行，对一个数字结尾的行，将数字替换成Zheng，并且打印输出
    # [layer1],[Forward Timer],__conv__,3.10Zheng
    # [layer2],[layer2],Forward Timer],__conv__,3.1Zheng
    sed -n '1,2s/\([1-9]\)$/Zheng\1/p' test.output
    # \1为匹配符，能够匹配前面字符内容，在该基础上加上内容，但需要将前面的匹配的内容通过\(\)括号括出来
    # [layer1],[Forward Timer],__conv__,3.10Zheng8
    # [layer2],[layer2],Forward Timer],__conv__,3.1Zheng7
    sed -n '1,2s/\(\.[0-9]\)/\1zheng/p' test.output 
    # 同上，只是在后面添加内容
    # [layer1],[Forward Timer],__conv__,3.1zheng08
    # [layer2],[layer2],Forward Timer],__conv__,3.1zheng7

-   其他常用修饰符
    -   ^:行首定位符
    -   $:行尾定位符
    -   .:匹配除换行以外的单个字符
    -   \*:匹配零个或者多个前导字符，常与.配合使用.\*表示任意多个字符
    -   []:匹配指定字符组内的任一字符，常见用法：[0-9],[a-zA-Z]
    -   x\\{m\\}:表示连续m个x
    -   x\\{m,\\}:表示至少连续m个x
    -   -i:直接对文本进行编辑

# awk<a id="sec-4" name="sec-4"></a>

awk命令的基本格式为 =awk '条件1 {动作1} 条件2 {动作2} &#x2026;' 文件名

awk保留字：BEGIN,awk程序开始时，尚未读取任何数据之前执行，BEGIN后的动作只在程序开始时执行一次；END，在awk程序处理完所有数据，即将结束时执行，END后动作只在程序结束时执行一次。

awk只要检测不到完整的单引号就不会执行。

    cat test.output 
    # [layer1] [backward_Timer] __conv__      3.108
    # [layer2] [Forward_Timer] __conv__       19.17
    # [layer3]                  [backward_Timer] __conv__ 13.17
    # [layer3]                  [Forward_Timer] __conv__ 9.17
    awk 'BEGIN {print "This is just for test!"} {print $2}' test.output
    # awk比cut更加智能，cut指令不能很好地识别空格间隔，而awk则对空格和制表符都能很好的识别
    # BEGIN为执行命令前输出
    # This is just for test!
    # [backward_Timer]
    # [Forward_Timer]
    # [Forward_Timer]
    awk 'END {print "Just print layer2 and score>10"} $4>10 && /Forward_Timer/ {print }' test.output 
    # END 为执行命令结束后输出
    # awk指令支持正则，需要将正则指令通过//框出
    # &&表示多重与指令，或操作为||
    # [layer2] [Forward_Timer] __conv__       19.17
    # Just print layer2 and score>10
    awk '{printf "row:%d,column:%d\n",NR,NF}' test.output 
    # NR:内置变量，为处理的行数
    # NF:内置变量，为处理的列数
    # %d为格式话输出，需要用printf，和print的区别是可以格式化输出，且默认无换行
    # row:1,column:4
    # row:2,column:4
    # row:3,column:4
    # row:4,column:4
    awk '/Forward_Timer/ {sum += $4;i++} END {printf "%.2f\n",sum/i}' test.output 
    # 多个命令需要;连接
    # 14.17

# find<a id="sec-5" name="sec-5"></a>

最常用的通过名字进行查找文件(支持正则)：

    find . -name "*.txt"
    # .为当前目录，*.txt为所有txt文件
    # ./test.txt
    # ./log.txt

其他查找模式：

-   -perm:权限，如755，主可读可写可执行，其他可读可执行
-   -user:用户名，如find . -user zheng
-   -size:大小，如find . -size +1000000c，大于1M的文件
-   -depth:递归子目录,如find . -name "\*.txt" -depth
