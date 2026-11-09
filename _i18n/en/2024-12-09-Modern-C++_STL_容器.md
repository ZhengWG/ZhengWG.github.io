---
title: "Modern C++: STL Containers"
description: "Introduces the STL container categories, covering sequence containers, ordered associative containers, and unordered containers, along with their value semantics, storage layout, growth behavior, and complexity."
---


- [Background](#sec-1)
- [Sequence Containers](#sec-2)
- [Associative Containers](#sec-3)

# Background<a id="sec-1"></a>

The C++ `STL (Standard Template Library)` is an important part of the C++ standard library and provides implementations of a rich set of data structures and algorithms. The `STL` is based on generic programming and is designed to be efficient, flexible, and easy to use. It contains general-purpose containers, algorithms, iterators, and function objects.

STL containers store and manage data. They come in several kinds suited to different application scenarios, and can be divided into sequence containers, associative containers, and unordered containers. All containers share one basic property: they store elements with "value" semantics, which means that **a container stores copies of its elements, not references**. So when elements are large and numerous, the copying cost can be very high. One solution: **implement move constructors and move assignment operators for your elements as far as possible, and use std::move() to "move" them in when adding them to a container, which reduces the cost of copying elements**. You can also use the `emplace_back` function to construct in place:

```c++
Point p;

v.push_back(p);  // 拷贝成本很高
v.push_back(std::move(p)); // 定义转移构造后可以转移存储
v.emplace_back(...) // 直接在容器内构造
```

# Sequence Containers<a id="sec-2"></a>

Sequence containers store elements in insertion order. There are five of them: `array`, `vector`, `deque`, `list`, and `forward_list`. Of these, the contiguously stored arrays are `array`, `vector`, and `deque`; the pointer-based linked lists are `list` and `forward_list`.

`array` and `vector` are built-in C arrays, with the lowest overhead and the highest speed. `array` is a static array whose size is fixed at initialization, while `vecor` is a dynamic array that can grow later as needed. `deque` is also a dynamically growing array; the difference is that it inserts and deletes elements efficiently at both ends.

In terms of efficiency, the elements of `vector` and `deque` are stored contiguously and support random access, so insertion is inefficient and lookup is efficient. list/forward_list are linked structures, where insertion and deletion only need to adjust pointers, which is more efficient. Their drawback is slow lookup, and the storage cost of a linked list is also slightly higher, because every element needs extra pointers to the previous and next nodes.

As for capacity growth, when a `vector` reaches its capacity limit, it allocates new memory of twice the size and then copies or moves the old elements over. It is recommended to call reserve first to allocate space in advance and reduce the cost of dynamic growth. The growth strategies of `deque` and `list` are more conservative: they only increase capacity by a fixed step. A simple traversal example:

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

# Associative Containers<a id="sec-3"></a>

Associative containers store data as `key-value pairs`. Depending on whether they are ordered, they divide into ordered containers and unordered containers.

Ordered containers store elements in insertion order, store elements based on key-value pairs, and sort automatically. C++ ordered containers use a tree structure, generally a binary tree with the best lookup performance (a red-black tree).

The standard library has four ordered containers: `set/multiset` and `map/multimap`. Here `set` is a set, `map` is an associative array, and `multi` supports duplicate elements/keys. Characteristics:

1.  Elements are stored in a certain order (usually ascending).

2.  Insertion, deletion, and lookup have time complexity `O(log n)`.

3.  They support ordered traversal (such as std::map sorted by key or std::set sorted by element).

Unordered containers are implemented on a hash table, and elements are stored without order. There are also four unordered containers: `unordered_set/unordered_multiset` and `unordered_map/unordered_multimap`. Their data structure is not a red-black tree but a hash table.

Although unordered containers do not require ordering, their requirements on the key are in fact somewhat "stricter" than those of ordered containers: the key must satisfy two conditions, first that a hash value can be computed for it, and second that equality comparison can be performed on it.

Unordered containers compared with ordered containers:

1.  Elements are stored by hashing, with no particular order.

2.  Insertion, deletion, and lookup are cheap, all `O(1)`, and the worst case is `O(n)` (for example when hash collisions are severe).

3.  Elements cannot be traversed in order.

4.  Ordered containers have higher memory overhead because the balanced binary search tree needs extra storage for parent and child node pointers. For unordered containers, the hash table needs extra storage for hash values and for the linked lists or buckets that handle collisions, and the memory overhead depends on the load factor of the hash table.

A simple usage example:

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

The comparison is as follows:

| Feature   | Ordered containers        | Unordered containers        |
| Underlying implementation | Balanced binary search tree (such as a red-black tree) | Hash table          |
| Data storage order | Stored sorted by key or value | Stored unordered        |
| Lookup efficiency | O(log n)        | Average O(1), worst case O(n) |
| Insertion and deletion efficiency | O(log n)        | Average O(1), worst case O(n) |
| Traversal efficiency | Supports ordered traversal, with efficiency O(n) | Traversal is unordered, with efficiency O(n) |
| Memory overhead | Higher            | Lower, depends on the load factor |
| Applicable scenarios | Need for sorting, range queries, or small data sizes | Fast lookup, efficient insertion, and large data sizes |
