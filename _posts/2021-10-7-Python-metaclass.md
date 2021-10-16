---
layout: post
title: Python-metaclass
date: 2021-10-7 01:03:47.000000000 +09:00
categories: [语言]
tags: [Python]
---
- [前言](#sec-1)
- [metaclass概念介绍](#sec-2)
- [案例介绍](#sec-3)

# 前言<a id="sec-1"></a>

本文重点介绍下 `metaclass` 的用法， `metaclass` 通常使用很少，引用 **Tim Peters** 的话：

主要原因还是: 涉及 `metaclass` 的修改，可能会对正常的Python类型模型进行修改，所以可能对整个代码库造成风险，通常在开发框架层面的Python库中会使用，但在应用层很少会用到。

# metaclass概念介绍<a id="sec-2"></a>

`metaclass` 核心操作是“动态改变类的行为”。因为在 **Python** 语言中，类其实也是对象，所有类也是基于 **Python** 内置类 `type` 类的实例，这里用户自定义类本质上也是 `type` 类的 `__call__` 运算符的重载：

```python
class MyClass:
  pass

instance = MyClass()

type(instance)
# 输出
<class '__main__.C'>

type(MyClass)
# 输出
<class 'type'>
```

而 `metaclass` 是 `type` 类的子类，它能够替换原始 `type` 的 `__call__` 运算重载机制，也就是这些类是通过 `metaclass` 创建的。通过定义 `metaclass` 便可以实现拦截其所有子类的实现，然后进行一些动态的类实现修改。下面看下一个经典使用场景（下面会详细介绍）：

```python
class YAMLObjectMetaclass(type):
  def __init__(cls, name, bases, kwds):
    super(YAMLObjectMetaclass, cls).__init__(name, bases, kwds)
    if 'yaml_tag' in kwds and kwds['yaml_tag'] is not None:
      cls.yaml_loader.add_constructor(cls.yaml_tag, cls.from_yaml)
  # 省略其余定义

class YAMLObject(metaclass=YAMLObjectMetaclass):
  yaml_loader = Loader
  # 省略其余定义
```

# 案例介绍<a id="sec-3"></a>

`YAML` 是Python常用的用于”序列化”和“反序列化”的工具。其核心功能是 **load** 一个yaml文本文件，然后将这个文本序列转化为一系列 `Python Object` ，或者将一系列 `Python Object` **dump** 成一系列文本序列。 展开其 `load` 功能，其通过建立一个全局的 `registry` ，将所有需要逆序列化的对象进行注册：

```python
registry = {}

def add_constructor(target_class):
    registry[target_class.yaml_tag] = target_class
```

基于上述实现，需要对每一个需要序列化的对象在定义后，都需要加上 `add_constructor(object)` 函数。但是这种操作明显是不够简洁的。而基于 `metaclass` 则可以灵活地进行实现：

```python
class YAMLObjectMetaclass(type):
  def __init__(cls, name, bases, kwds):
    super(YAMLObjectMetaclass, cls).__init__(name, bases, kwds)
    if 'yaml_tag' in kwds and kwds['yaml_tag'] is not None:
      cls.yaml_loader.add_constructor(cls.yaml_tag, cls.from_yaml)
  # 省略其余定义

class YAMLObject(metaclass=YAMLObjectMetaclass):
  yaml_loader = Loader
  # 省略其余定义
```

可以看到： `YAMLObject` 把 `metaclasss` 声明为 `YAMLObjectMetaclass` , 修改了通常类的初始化操作，使得所有继承 `YAMLObject` 的子类在定义后都会被强行添加函数：

```python
cls.yaml_loader.add_constructor(cls.yaml_tag, cls.from_yaml)
```
