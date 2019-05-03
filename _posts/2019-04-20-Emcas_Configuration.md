---
layout: post
title: emacs配置初步
date: 2019-04-20 20:25:24.000000000 +09:00
tags: Emacs
---
<div id="table-of-contents">
<h2>Table of Contents</h2>
<div id="text-table-of-contents">
<ul>
<li><a href="#sec-1">1. 前言</a></li>
<li><a href="#sec-2">2. 基本快捷键</a></li>
<li><a href="#sec-3">3. 改变默认的Emacs设置</a></li>
<li><a href="#sec-4">4. 特性相关</a>
<ul>
<li><a href="#sec-4-1">4.1. 特性的加载与Package的安装</a></li>
<li><a href="#sec-4-2">4.2. 基本特性介绍</a></li>
<li><a href="#sec-4-3">4.3. 常用插件介绍</a></li>
</ul>
</li>
</ul>
</div>
</div>

# 前言<a id="sec-1" name="sec-1"></a>

仅仅emacs入门，先主要将emacs作为一个文本编辑器来使用，学习路线主要参考[子龙山人21天emacs](http://book.emacs-china.org/) ，
现在完成了前十天的基础内容

现就其中的一些基本操作以及基本 `packages` 的功能作简单的介绍。

个人配置可参考[配置](https://github.com/ZhengWG/Emacs_Configuration_Zheng)地址

# 基本快捷键<a id="sec-2" name="sec-2"></a>

这里只记录自己常用的一些快捷键：

光标切换：
-   `C-f,C-b,C-n,C-p` 分别为向前，后，上，下移动
-   `C-a,C-e` 分别为移动到行首，行末
-   `S-a,S-e` 分别为隔行向上，下移动
-   `S->,S-<` 分别为移动到文首，文末
-   `S-g g` 为移动到指定行
-   `C-l` 切换光标所在页面的位置：中央-上端-下端-原位置

buffer切换：
-   `C-x C-b` 打开窗口显示所有buffer
-   `C-x b` 切换到相应buffer
-   `C-x k` 删除相应buffer

窗口相关：
-   `C-x 0` 关闭当前窗口
-   `C-x 1` 只显示当前窗口
-   `C-x 2` 水平复制当前窗口
-   `C-x 3` 垂直复制当前窗口
-   `C-x 4 f` 在垂直打开的窗口中打开对应文件
-   `C-x 4 d` 在垂直打开的窗口中打开对应文件夹(dired-mode)
-   `C-x o` 在各个窗口间切换光标

区域编辑：
-   `C-S-Space` 开始选中模式，移动光标进行选择
-   `C-k` 删除光标后行
-   `C-/` 撤销操作
-   `C-w` 区域删除
-   `M-w` 复制
-   `C-y` 粘贴

文件相关：
-   `C-x C-f` 在当前文件夹内查找文件
-   `C-x C-s` 保存当前文件
-   `C-x s` 依次保存buffer中的文件

其他功能相关：
-   `C-h,v,f` 寻找快捷键，变量，函数的帮助信息
-   `C-g` 关闭命令
-   `M-x xxx` 打开相关的 `xxx` mode或者函数功能等
-   `C-x C-e` 执行某段lisp代码

Lisp相关：
`lisp` 语言可参考[官方快速指南](https://learnxinyminutes.com/docs/elisp/)

# 改变默认的Emacs设置<a id="sec-3" name="sec-3"></a>

    ;; 关闭工具栏，tool-bar-mode 即为一个 Minor Mode
    (tool-bar-mode -1)
    ;; 开启全局Company补全
    (global-company-mode 1)
    ;; 关闭备份文件(~后缀的文件)
    (setq make-backup-files nil)
    ;; 关闭文件滑动控件
    (scroll-bar-mode -1)
    ;; 显示行号
    (global-linum-mode 1)
    ;; 更改光标的样式
    (setq cursor-type 'bar)
    ;; 关闭启动帮助画面
    (setq inhibit-splash-screen 1)
    ;; 更改显示字体大小 16pt
    (set-face-attribute 'default nil :height 160)
    ;; 快速打开配置文件
    (defun open-init-file()
      (interactive)
      (find-file "~/.emacs.d/init.el"))
    ;; 这一行代码，将函数 open-init-file 绑定到 <f2> 键上
    (global-set-key (kbd "<f2>") 'open-init-file)
    ;; 设置选中背景颜色为蓝色
    (set-face-background 'region "blue")
    ;; 将emacs的删除功能设置与其他图形界面编辑器相同
    (delete-selection-mode 1)
    ;; 高亮当前行
    (global-hl-line-mode 1)
    ;; 关闭默认的哔哔提示音
    (setq ring-bell-function 'ignore)

# 特性相关<a id="sec-4" name="sec-4"></a>

## 特性的加载与Package的安装<a id="sec-4-1" name="sec-4-1"></a>

Emacs自带了很多特性，常见的有 `recentf:用于打开最近打开的文件` 等，
此外还可以通过其他插件安装多种特性。

常用 `require` 命令进行特性加载, `require` 从文件中加载特性:

    (require 'recentf)
    ;; 打开该mode
    (recentf-mode 1)
    ;; 设置最大的文件数目
    (setq recentf-max-menu-item 10)
    ;; 设置快捷键
    (global-set-key (kbd "C-x C-r") 'recentf-open-files)
    ;; 默认文本解码设置为UTF-8
    (set-language-environment "UTF-8")

对于不同模块可以根据类型进行模块式设计，如在文件夹下的 `lisp` 目录下，
添加不同类型的模块，但需要在初始化文件 `init.el` 中添加文件位置：
`(add-to-list 'load-path "~/.emacs.d/lisp/")` ,同时在模块文件中
添加 `(provide 'modul-name)` ,
则在 `init.el` 文件便可通过 =require=命令调用

在开启有些mode的时候往往会在某些条件下才会触发，这是会用到[钩子(hook)](https://www.gnu.org/software/emacs/manual/html_node/emacs/Hooks.html) ,如：

    (add-hook 'emacs-lisp-mode-hook 'show-paren-mode)

该命令表示在启动 `emacs-lisp-mode` 的时候才会启动 `show-paren-mode` ，
用于括号匹配显示。

由于默认的插件源非常有限(可以通过 `M-x package-list-packages` 查看)，
可以通过外在的插件源头来更新，常用的有[MELPA](https://melpa.org/) ，包含了3000左右的插件,
可以通过以下命令进行设置：

    (require 'package)
         (package-initialize)
         (setq package-archives '(("gnu"   . "http://elpa.emacs-china.org/gnu/")
                          ("melpa" . "http://elpa.emacs-china.org/melpa/"))))

在得到的 `packages` 表单里可以通过 `I` 来标记安装， `D` 来标记删除，
 `U` 来标记更新，标记完成后需要通过 `X` 来确认。

最后通过以下命令对Packages List内的Packages进行安装:

    ;; cl - Common Lisp Extension
    (require 'cl)
    
    ;; Add Packages
    (defvar my/packages '(
                   ;; --- Auto-completion ---
                   company
                   ;; --- Better Editor ---
                   hungry-delete
                   swiper
                   counsel
                   smartparens
                   ;; --- Major Mode ---
                   js2-mode
                   ;; --- Minor Mode ---
                   nodejs-repl
                   exec-path-from-shell
                   ;; --- Themes ---
                   monokai-theme
                   ;; solarized-theme
                   ) "Default packages")
    
    (setq package-selected-packages my/packages)
    
    (defun my/packages-installed-p ()
        (loop for pkg in my/packages
              when (not (package-installed-p pkg)) do (return nil)
              finally (return t)))
    
    (unless (my/packages-installed-p)
        (message "%s" "Refreshing package database...")
        (package-refresh-contents)
        (dolist (pkg my/packages)
          (when (not (package-installed-p pkg))
            (package-install pkg))))

## 基本特性介绍<a id="sec-4-2" name="sec-4-2"></a>

这里就对一些Emacs自带的特性作简单的介绍:

Major Mode: 整体文件模式对应的模式类型，有text-mode, special-mode, prog-mode

Minor Mode: 增强性功能的Mode

可以定义对不同的文件开启不同的Major Mode:

    (setq auto-mode-alist
          (append
           '(("\\.js\\'" . js2-mode))
           '(("\\.html\\'" . web-mode))
           auto-mode-alist))

自带的一些特性介绍：
-   `recentf` : 近期打开的文件， 更改快捷键后 `C-c C-r` 打开最近文件
-   `cl` : Common Lisp Extension
-   Org-mode相关：参照[个人博客Org-mode介绍](https://www.johneyzheng.top/2019/01/Org_mode/)
    -   [Capture](https://orgmode.org/manual/Capture.html) :可以定义模板添加功能，详见[博客](http://www.zmonster.me/2018/02/28/org-mode-capture.html)
    -   [Agenda](https://www.gnu.org/software/emacs/manual/html_node/org/Agenda-commands.html) :日程管理工具
    -   [Pomodoro](https://www.emacswiki.org/emacs/pomodoro) :番茄工作法

## 常用插件介绍<a id="sec-4-3" name="sec-4-3"></a>

安装完插件后可以通过 `M-x customize-group` 选择对应的插名称进行功能设置

-   [company](http://company-mode.github.io/) :提供了各种自动补全的功能, 将其应用于全局：=(global-company-mode t)= ，company依靠 `company-backends` 进行补全，如需要对Python进行补全的话，则需要在模式钩子下激活 `anaconda-mode` ,

当前的 `backends` 值可以通过 `C-h v company-backends` 得到
-   [hungry-delete](https://github.com/nflath/hungry-delete) :一次性用于删除多个空格或者换行
-   [swiper](https://github.com/abo-abo/swiper) :该插件其实集成了 `swiper` , `counsel` , `Ivy` 三个插件，Ivy用于补全操作(用于文件查找匹配等),swiper用于当前文件查找字符所在位置,counsel实现了更多功能并与emacs命令进行匹配，能够更好的应用Ivy，

`C-s` 可实现查找功能，同样命令可在搜索结果之间进行切换
-   [smartparens](https://github.com/Fuco1/smartparens) :用于显示对应匹配的括号
-   [popwin-mode](https://github.com/m2ym/popwin-el) :将光标移动到新开的窗口中
-   [Hippie](https://www.emacswiki.org/emacs/HippieExpand) :提供更多补全功能，如其他buffer中的字符的补全
-   [Dired](https://www.gnu.org/software/emacs/manual/html_node/emacs/Dired.html) :提供了强大的文件管理相关的功能， `C-x d` 可以进入 `Dired-mode`,可以在该模式下进行文件操作，可以通过 `C-x C-q` 进行编辑操作(如重命名)，其他便捷操作有：
    -   `+` :创建目录
    -   `C` :拷贝
    -   `D` :删除
    -   `d` :标记删除
    -   `u` :取消标记
    -   `x` :执行标记
-   [expand-region](https://github.com/magnars/expand-region.el) :能够通过 `C-=` 进行内容的选中，该快捷键需要绑定：
    
        (global-set-key (kbd "C-=") 'er/expand-region)

-   [Occur-mode](https://www.emacswiki.org/emacs/OccurMode) :能够查询字符并对字符所在行显示，可在显示的缓存内进行编辑， `M-s o=进行选中内容的搜索显示，按 =e` 可进行编辑模式
-   [iedit-mode](https://github.com/victorhge/iedit) :能够对选中的内容进行共同编辑，选中内容后，通过 `M-s e` 进入iedit模式(快捷键需要绑定)：
    
        (global-set-key (kbd "M-s e") 'iedit-mode)

-   [Evil](https://bytebucket.org/lyro/evil/raw/default/doc/evil.pdf) :实现了Vim的大部分功能
-   [Cask](https://github.com/cask/cask) :Cask能够辅助Packages的管理，安装后会在 `.emacs.d` 目录下生成 `Cask` 文件，集成Packages， 通过 `cask install` 自动安装包, 之后结合 `pallet` 进行包的安装管理即可，需要在初始化文件中设置：
    
        require 'cask "<path-to-cask>/cask.el")
        (cask-initialize)    ; 类似于 package-initialize

-   [pallet](https://github.com/rdallasgray/pallet) :基于Cask的包管理工具，可实现不同版本Emacs的包管理等功能，配置过程如下:
    
        ;; 激活过程
        (pallet-mode)  
        (pallet-init)    ; 在.emacs.d 中生成一个 Cask 文件, 写入源与现有包
        (pallet-install) ; 将 elpa 中的 package 拷贝到.Cask/<you version>/elpa 目录中
        
        ;; 配置过程
        (require 'pallet)
        (pallet-mode t)      ; 激活 pallet, 在安装包时将 Cask 文件写入相应信息

-   [use-package](https://github.com/jwiegley/use-package) :更安全的加载包的方式，部分包出错的时候不会让整个Emacs停止工作，可以对各个包的配置进行集中设置，方便实现auto-load和键绑定，简单使用如下：
    
        (use-package package-name
          :commands
          (global-company-mode) ;;auto-load实现
          ;;快捷键设置
          :bind (("M-s O" . moccur)
                 :map isearch-mode-map
                 ("M-o" . isearch-moccur)
                 ("M-O" . isearch-moccur-all))
          :init
          (setq my-var1 "xxx")
          :config
          (progn
            (setq my-var2 "xxx")
            (setq my-var3 "xxx")
            )
          :defer t
          )

-   JavaScript相关：
    -   [js2-mode](https://github.com/mooz/js2-mode) :js2-mode主要提供了：语法高亮+语法检查器(Linter)
    -   [nodejs-repl](https://github.com/abicky/nodejs-repl.el) :可用于执行缓冲区的代码，需要系统自身已经安装了NodeJS
    -   [js2-refactor](https://github.com/magnars/js2-refactor.el) :用于重构JavaScript的Minor Mode，可以通过 `C-c C-m` 进行功能前缀的加入
-   [web-mode](https://github.com/fxbois/web-mode) :常用的编辑前端代码的Major Mode
