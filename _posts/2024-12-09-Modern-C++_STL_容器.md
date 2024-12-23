---
layout: post
title: Modern-C++_STL_容器
date: 2024-12-09 15:30:00.000000000 +09:00
categories: [语言]
tags: [C++]
---


- [前置背景](#sec-1)
- [序列容器](#sec-2)
- [关联容器](#sec-3)

# 前置背景<a id="sec-1"></a>

C++ `STL（Standard Template Library）` 是 C++ 标准库的重要组成部分，提供了丰富的数据结构和算法的实现。 `STL` 是基于泛型编程的，设计目标是高效、灵活和易用。它包含了通用的容器、算法、迭代器和函数对象。

STL 容器用于存储和管理数据，有多种类型，适合不同的应用场景，可分为：序列容器、关联式容器、无序容器。容器都具有的一个基本特性：它保存元素采用的是“值”（value）语义，也就是说， **容器里存储的是元素的拷贝、副本，而不是引用** 。所以元素很大，很多的时候，拷贝开销就会很大。一个解决方法式： **尽量为元素实现转移构造和转移赋值函数，在加入容器的时候使用 std::move() 来“转移”，减少元素复制的成本** ，也可以采用 `emplace_back` 函数来原地构造：

```c++
Point p;

v.push_back(p);  // 拷贝成本很高
v.push_back(std::move(p)); // 定义转移构造后可以转移存储
v.emplace_back(...) // 直接在容器内构造
```

# 序列容器<a id="sec-2"></a>

按照插入顺序存储元素, 一共有5种： `array` , `vector` , `deque` , `list` , `forward_list` 。其中，连续存储的数组为： `array` 、 `vector` 、 `deque` ；指针结构的链表： `list` 、 `forward_list` 。

其中， `array` 和 `vector` 为C内置的数组，开销最低，速度最快；array为静态数组，初始化的时候已经固定大小，而 `vecor` 为动态数组，可以后续随需增长。 `deque` 也为动态增长的数组，区别为两端高效插入/删除元素。

效率层面， `vector` 和 `deque` 的元素为连续存储，支持随机访问，所以插入的效率很低，查找效率高；而list/forward_list式链表结构，插入/删除操作只需要调整指针，更加高效，缺点是查找效率低，另外链表的存储成本也略高，因为每个元素都需要附加指针，指向链表的前后节点。

扩容机制上， `vector` 当容量达到上限时，会分配两倍大小新内存，然后进行旧元素的拷贝或者移动操作。建议先reserve提前分配空间，减少动态扩容的代价。而 `deque` 、 `list` 的扩容策略则更加保守，只按照固定的步长去增加容量。简单的遍历例子：

```c++
#include <iostream>
#include <vector>

int main() {
    std::vector<int> vec = {3, 1, 4};
    vec.push_back(2); // 在末尾插入

    // 按顺序遍历
    for (int x : vec) {
        std::cout << x << " "; // 输出: 3 1 4 2
    }
    return 0;
}
```

# 关联容器<a id="sec-3"></a>

关联容器，指的是通过 `键值对` 来存储数据，按照是否有序可以分为：有序容器和无序容器。

有序容器按照插入顺序存储元素，基于键值对存储元素，自动排序。C++有序容器使用的树结构，一般是有着最好查找性能的二叉树（红黑树）。

标准库中一共有四种有序容器： `set/multiset` 和 `map/multimap` 。其中 `set` 是集合， `map` 是关联数组, `multi` 支持重复元素/键。特点：

1.  元素按照一定顺序（通常是升序）存储。

2.  插入、删除、查找的时间复杂度为 `O(log n)` 。

3.  支持顺序遍历（如按键值排序的 std::map 或按元素排序的 std::set）。

无序容器基于哈希表实现，元素无序存储。无序容器同样有四种： `unordered_set/unordered_multiset` 和 `unordered_map/unordered_multimap` 。其数据结构不是红黑树，而是散列表。

无序容器虽然不要求顺序，但是对 key 的要求反而比有序容器更“苛刻”一些：要求 key 具备两个条件，一是可以计算 hash 值，二是能够执行相等比较操作。

无序容器和有序容器相比：

1.  元素以散列方式存储，无特定顺序。

2.  插入/删除/查找成本低，都为 `O(1)` ，最坏情况为 `O(n)` （例如哈希冲突严重时）。

3.  无法按照顺序遍历元素。

4.  有序容器由于平衡二叉搜索树需要额外存储父子节点的指针，内存开销较高；而无序容器，哈希表需要额外存储哈希值和处理冲突的链表或桶，内存开销取决于哈希表的装载因子。

简单使用例子：

```c++
#include <iostream>
#include <string>
#include <map>

int main() {
    std::map<int, std::string> m = { {2, 'B'} };
    // std::unordered_map<int, std::string> m = { {2, 'B'} };

    // 按键顺序遍历
    for (auto [key, value] : m) {
        std::cout << key << ": " << value << std::endl;
    }
    return 0;
}
```

对比如下：

| 特性   | 有序容器        | 无序容器        |
| 底层实现 | 平衡二叉搜索树（如红黑树） | 哈希表          |
| 数据存储顺序 | 按键或值排序存储 | 无序存储        |
| 查找效率 | O(log n)        | 平均 O(1)，最坏 O(n) |
| 插入删除效率 | O(log n)        | 平均 O(1)，最坏 O(n) |
| 遍历效率 | 支持顺序遍历，效率为 O(n) | 遍历无序，效率为 O(n) |
| 内存开销 | 较高            | 较低，取决于装载因子 |
| 适用场景 | 需要排序、范围查询或小数据量 | 快速查找、高效插入和大数据量 |
