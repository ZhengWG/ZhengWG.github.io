---
title: "Python: metaclass"
description: "Explains what a metaclass is and how it dynamically changes class behavior, using the YAML object registry as a worked example."
---
- [Preface](#sec-1)
- [Introduction to the metaclass Concept](#sec-2)
- [Case Study](#sec-3)

# Preface<a id="sec-1"></a>

This article focuses on how to use a `metaclass`. A `metaclass` is rarely used. To quote **Tim Peters**:

The main reason is that changing things with a `metaclass` may modify the normal Python type model, so it can put the whole code base at risk. It is usually used when developing framework-level Python libraries, and is rarely used at the application level.

# Introduction to the metaclass Concept<a id="sec-2"></a>

The core operation of a `metaclass` is "dynamically changing the behavior of a class". In **Python**, a class is itself an object, and every class is an instance of the built-in **Python** class `type`. A user-defined class is essentially created by overloading the `__call__` operator of the `type` class:

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

A `metaclass` is a subclass of the `type` class. It can replace the original `__call__` overloading mechanism of `type`, that is, these classes are created through the `metaclass`. By defining a `metaclass`, you can intercept the implementation of all of its subclasses and then dynamically modify the class implementation. Let's look at a classic use case (described in detail below):

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

# Case Study<a id="sec-3"></a>

`YAML` is a tool commonly used in Python for "serialization" and "deserialization". Its core functions are to **load** a YAML text file and convert the text into a series of `Python Object`s, or to **dump** a series of `Python Object`s into text. Looking at the `load` function in more detail, it builds a global `registry` and registers all the objects that need to be deserialized:

```python
registry = {}

def add_constructor(target_class):
    registry[target_class.yaml_tag] = target_class
```

With the implementation above, an `add_constructor(object)` call has to be added after the definition of every object that needs to be serialized. This is clearly not concise. A `metaclass` makes the implementation much more flexible:

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

As you can see, `YAMLObject` declares its `metaclass` as `YAMLObjectMetaclass`. This changes the usual class initialization, so that every subclass that inherits from `YAMLObject` is forced to have the following function call added after it is defined:

```python
cls.yaml_loader.add_constructor(cls.yaml_tag, cls.from_yaml)
```
