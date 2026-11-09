---
title: "Common Bash Commands"
description: "A summary of common usage for the grep, xargs, sed, awk, and find commands, with examples."
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

Search for strings
-   '-r': search directories recursively, `grep -r "sample" .`
-   '-c': show the number of matches, `grep -c "sample" .`
-   '-i': ignore case
-   '-n': print line numbers

# xargs<a id="sec-2" name="sec-2"></a>

xargs reads data from stdin and splits it into arguments, using whitespace or newline characters as delimiters. Its default command is echo, for example:
```sh
    echo "\t" | xargs
    t
```

-   '-n' limits the number of arguments per output line
-   '-d' sets the delimiter
-   '-I' sets a placeholder, which can be replaced with a specified string
-   '-P' enables parallel execution

# sed<a id="sec-3" name="sec-3"></a>

sed is a non-interactive editor. It does not modify the original file. Instead, it stores the original file in a temporary buffer and processes it line by line: after each line is processed, the line is removed from the buffer and the result is written to the screen. sed commands edit a file by addressing: an address can be a number, a regular expression, or a combination of the two. With no address, sed acts on every line by default.

Common commands:

-   Print:

p :
```sh
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
```

-   Delete:

d:
```sh
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
```

-   Substitute:

s: by default, it matches the first occurrence of the pattern on each line
```sh
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
```

-   Other common modifiers
    -   ^: anchors at the start of a line
    -   $: anchors at the end of a line
    -   .: matches any single character except a newline
    -   \*: matches zero or more of the preceding character; it is often combined with . as .\* to mean any number of characters
    -   []: matches any one character in the given set; common usage: [0-9], [a-zA-Z]
    -   x\\{m\\}: exactly m consecutive x
    -   x\\{m,\\}: at least m consecutive x
    -   -i: edit the file in place

# awk<a id="sec-4" name="sec-4"></a>

The basic format of the awk command is =awk 'condition1 {action1} condition2 {action2} &#x2026;' filename

awk reserved words: BEGIN runs when the awk program starts, before any data is read, and the action after BEGIN is executed only once at the start; END runs after awk has processed all data, just before the program ends, and the action after END is executed only once at the end.

awk will not execute until it sees a complete pair of single quotes.

```sh
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
```

# find<a id="sec-5" name="sec-5"></a>

The most common use is to find files by name (regular expressions are supported):
```sh
    find . -name "*.txt"
    # .为当前目录，*.txt为所有txt文件
    # ./test.txt
    # ./log.txt
```

Other search modes:

-   -perm: permissions, such as 755, where the owner can read, write, and execute, and others can read and execute
-   -user: user name, such as find . -user zheng
-   -size: size, such as find . -size +1000000c, which finds files larger than 1M
-   -depth: recurse into subdirectories, such as find . -name "\*.txt" -depth
