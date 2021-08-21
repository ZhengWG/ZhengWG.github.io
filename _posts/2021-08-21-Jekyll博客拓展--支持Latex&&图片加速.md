---
layout: post
title: Jekyll博客拓展--支持Latex&&图片加速
date: 2021-08-21 13:19:24.000000000 +09:00
categories: [环境配置]
tags: [博客, Jekyll]
mathjax: true
---

- [前言](#sec-1)
- [Mathjax支持](#sec-2)
- [图床迁移](#sec-3)
  - [构建Github仓](#sec-3-1)
  - [获取CDN转换规则](#sec-3-2)
  - [通过PicGo上传图片](#sec-3-3)
  - [直接通过git自动上传](#sec-3-4)

# 前言<a id="sec-1"></a>

对前文博客构建的扩展支持：[基于Jekyll搭建博客](https://johneyzheng.top//posts/%E5%9F%BA%E4%BA%8EJekyll%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2/)

# Mathjax支持<a id="sec-2"></a>

添加 `mathjax` 支持包括两个部分：添加 `mathjax` 依赖；添加 `mathjax` 开关。 添加 `_includes/mathjax_support.html` :

```java
<div id="mathjax"></div>
     <script type="text/x-mathjax-config">
     MathJax.Hub.Config({
         tex2jax: {
             inlineMath: [ ["$","$"]],
                     skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                     processEscapes: true
                     }
         });
MathJax.Hub.Queue(function() {
        var all = MathJax.Hub.getAllJax();
        for (var i = 0; i < all.length; ++i)
            all[i].SourceElement().parentNode.className += ' has-jax';
    });
</script>

<script src="https://cdn.bootcdn.net/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML"></script>
```

添加 `mathjax` 开关，在 `_layouts/post.html` 添加:

```java
{/% if page.mathjax %}
<span>
  {/% include mathjax_support.html %}
</span>
{/% endif %}
```

上述配置下，在page中添加 `mathjax: true` 开关，支持markdown格式的内联,显示结果如下：

测试内联公式: $\frac{N\*C}{G\*K\*K}$

测试换行公式：

$$
\frac{N*C}{G*K*K}
$$

# 图床迁移<a id="sec-3"></a>

可采用的图床方案： [基于github的图床拓展](https://segmentfault.com/a/1190000039185826) [当前流行的其他图床方案](https://masantu.com/blog/2020-12-06/images-hosting/) [搭建个人专用图床](https://post.smzdm.com/p/a5kledr3/)

当前采用基于Github的图床，主要步骤为：

-   构建Github仓用于图片保存
-   基于[jsdelivr](https://www.jsdelivr.com/?docs=gh)进行CDN加速
-   通过[PicGo](https://github.com/Molunerfinn/PicGo)上传图片

## 构建Github仓<a id="sec-3-1"></a>

在 `Github` 上创建一个公开仓，用于存储博客需要的图片，本人采用的目录结构如下：

```sh
├── Imgs_blog
│   ├ Blog1
│   │   ├── 1.png
│   │   ├── 2.png
│   │   ├── 3.png
│   │   └── 4.png
│   ├ Blog2
│   │   ├── 1.jpg
│   │   ├── 2.jpg
│   │   ├── 3.jpg
│   │   ├── 4.jpg
│   │   ├── 5.jpg
│   │   ├── 6.jpg
│   │   ├── 7.jpg
│   │   └── 8.png
```

创建Token: `Setting-->Developer settings-->Personal access tokens-->New personal access token-->copy token`: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125031.png)

## 获取CDN转换规则<a id="sec-3-2"></a>

通过[jsdelivr](https://www.jsdelivr.com/?docs=gh)进行CDN加速:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125247.png)

本人的repo仓内某张图片为: `https://github.com/ZhengWG/Imgs_blog/Blog1/1.png`

所以，转换后的url为: `https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/Blog1/1.png`

## 通过PicGo上传图片<a id="sec-3-3"></a>

[PicGo](https://github.com/Molunerfinn/PicGo)可以将图片上传到图床(当然也可以直接通过git python工具进行自动化上传)，首先需要配置，github配置：

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125836.png)

创建对应文件夹然后进行图片上传（目前看不支持中文编码）:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125931.png)

上传后，插入转换后的图片即可： `https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/Blog1/1.png`

## 直接通过git自动上传<a id="sec-3-4"></a>

本人采用自动化上传的方案，可以通过python的git模块：

```python
from git import Repo

local_repo = 'https://github.com/ZhengWG/Imgs_blog/raw/master/'
repo = Repo(local_repo)

# upload files
if repo.untracker_files:
    index = repo.index
    index.add(['*'])
    upload_filename = os.path.basename(local_dir)
    mes_commit = 'add imgs for {}'.format(upload_filename)
    index.commit(mes_commit)
    remote = self.repo.remote()
    remote.push()
```
