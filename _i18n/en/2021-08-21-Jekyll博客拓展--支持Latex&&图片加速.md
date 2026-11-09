---
title: "Extending a Jekyll Blog: LaTeX Support and Image Acceleration"
description: "How to add MathJax support to a Jekyll blog and move its images to a GitHub-based image host accelerated by the jsdelivr CDN, uploading with PicGo or git."
---

- [Preface](#sec-1)
- [MathJax Support](#sec-2)
- [Image Host Migration](#sec-3)
  - [Create the GitHub Repository](#sec-3-1)
  - [Get the CDN Conversion Rule](#sec-3-2)
  - [Upload Images with PicGo](#sec-3-3)
  - [Upload Automatically with git](#sec-3-4)

# Preface<a id="sec-1"></a>

This extends the setup from the earlier post: [Building a Blog with Jekyll](https://johneyzheng.top//posts/%E5%9F%BA%E4%BA%8EJekyll%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2/)

# MathJax Support<a id="sec-2"></a>

Adding `mathjax` support has two parts: adding the `mathjax` dependency, and adding a `mathjax` switch. Add `_includes/mathjax_support.html`:

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

Add the `mathjax` switch by adding the following to `_layouts/post.html`:

```java
{/% if page.mathjax %}
<span>
  {/% include mathjax_support.html %}
</span>
{/% endif %}
```

With the configuration above, adding the `mathjax: true` switch to a page enables markdown-style inline and display math. The rendered results are as follows:

Test of an inline formula: $\frac{N\*C}{G\*K\*K}$

Test of a display (multi-line) formula:

$$
\frac{N*C}{G*K*K}
$$

# Image Host Migration<a id="sec-3"></a>

Image host options that can be used: [Extending a GitHub-based image host](https://segmentfault.com/a/1190000039185826) [Other popular image host options](https://masantu.com/blog/2020-12-06/images-hosting/) [Building a personal image host](https://post.smzdm.com/p/a5kledr3/)

The image host currently in use is based on GitHub. The main steps are:

-   Create a GitHub repository to store the images
-   Use [jsdelivr](https://www.jsdelivr.com/?docs=gh) for CDN acceleration
-   Upload images with [PicGo](https://github.com/Molunerfinn/PicGo)

## Create the GitHub Repository<a id="sec-3-1"></a>

Create a public repository on `Github` to store the images the blog needs. The directory structure I use is as follows:

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

Create a token: `Setting-->Developer settings-->Personal access tokens-->New personal access token-->copy token`: ![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125031.png)

## Get the CDN Conversion Rule<a id="sec-3-2"></a>

Use [jsdelivr](https://www.jsdelivr.com/?docs=gh) for CDN acceleration:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125247.png)

One of the images in my repo is: `https://github.com/ZhengWG/Imgs_blog/Blog1/1.png`

So the converted url is: `https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/Blog1/1.png`

## Upload Images with PicGo<a id="sec-3-3"></a>

[PicGo](https://github.com/Molunerfinn/PicGo) can upload images to the image host (you can of course also automate the upload directly with a git python tool). First it needs to be configured; the github configuration:

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125836.png)

Create the corresponding folder and then upload the images (it currently does not seem to support Chinese encoding):

![img](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog//2021-08-21-Jekyll%25E5%258D%259A%25E5%25AE%25A2%25E6%258B%2593%25E5%25B1%2595--%25E6%2594%25AF%25E6%258C%2581Latex&&%25E5%259B%25BE%25E7%2589%2587%25E5%258A%25A0%25E9%2580%259F/blog_mathjax_pic_20210821_125931.png)

After uploading, just insert the converted image URL: `https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/Blog1/1.png`

## Upload Automatically with git<a id="sec-3-4"></a>

I use an automated upload scheme, which can be done with the git module of python:

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
