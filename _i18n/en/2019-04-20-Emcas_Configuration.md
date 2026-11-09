---
title: "Getting Started with Emacs Configuration"
description: "A beginner's guide to Emacs configuration: basic key bindings, changing default settings, loading features and installing packages, and a short tour of commonly used packages."
---
<div id="table-of-contents">
<h2>Table of Contents</h2>
<div id="text-table-of-contents">
<ul>
<li><a href="#sec-1">1. Introduction</a></li>
<li><a href="#sec-2">2. Basic Key Bindings</a></li>
<li><a href="#sec-3">3. Changing the Default Emacs Settings</a></li>
<li><a href="#sec-4">4. Features</a>
<ul>
<li><a href="#sec-4-1">4.1. Loading Features and Installing Packages</a></li>
<li><a href="#sec-4-2">4.2. Overview of Basic Features</a></li>
<li><a href="#sec-4-3">4.3. Commonly Used Plugins</a></li>
</ul>
</li>
</ul>
</div>
</div>

# Introduction<a id="sec-1" name="sec-1"></a>

This is only an introduction to Emacs. For now I mainly use Emacs as a text editor, and my learning path mostly follows [Zilongshanren's 21 Days of Emacs](http://book.emacs-china.org/) ,
of which I have finished the first ten days of basic content.

Below is a brief introduction to some of the basic operations and the functions of the basic `packages`.

My personal configuration is available at this [configuration](https://github.com/ZhengWG/Emacs_Configuration_Zheng) repository.

# Basic Key Bindings<a id="sec-2" name="sec-2"></a>

Only the key bindings I use frequently are recorded here:

Cursor movement:
-   `C-f,C-b,C-n,C-p` move forward, backward, up, and down respectively
-   `C-a,C-e` move to the beginning and the end of the line
-   `S-a,S-e` move up and down by every other line
-   `S->,S-<` move to the beginning and the end of the file
-   `S-g g` moves to a specified line
-   `C-l` cycles the position of the cursor's line in the window: center, top, bottom, original position

Buffer switching:
-   `C-x C-b` opens a window listing all buffers
-   `C-x b` switches to the specified buffer
-   `C-x k` kills the specified buffer

Windows:
-   `C-x 0` closes the current window
-   `C-x 1` shows only the current window
-   `C-x 2` splits the current window horizontally
-   `C-x 3` splits the current window vertically
-   `C-x 4 f` opens the specified file in the vertically opened window
-   `C-x 4 d` opens the specified directory in the vertically opened window (dired-mode)
-   `C-x o` moves the cursor between windows

Region editing:
-   `C-S-Space` starts selection mode; move the cursor to select
-   `C-k` deletes the rest of the line after the cursor
-   `C-/` undoes the last operation
-   `C-w` deletes the region
-   `M-w` copies
-   `C-y` pastes

Files:
-   `C-x C-f` finds a file in the current directory
-   `C-x C-s` saves the current file
-   `C-x s` saves the files in the buffers one by one

Other functions:
-   `C-h,v,f` look up help information for key bindings, variables, and functions
-   `C-g` cancels a command
-   `M-x xxx` opens the `xxx` mode or runs the function, etc.
-   `C-x C-e` evaluates a piece of Lisp code

Lisp:
For the `lisp` language, see the [official quick guide](https://learnxinyminutes.com/docs/elisp/)

# Changing the Default Emacs Settings<a id="sec-3" name="sec-3"></a>

```emacs-lisp
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
```

# Features<a id="sec-4" name="sec-4"></a>

## Loading Features and Installing Packages<a id="sec-4-1" name="sec-4-1"></a>

Emacs ships with many features, such as `recentf: used to open recently opened files`.
In addition, many more features can be installed through other plugins.

The `require` command is commonly used to load a feature; `require` loads a feature from a file:
```emacs-lisp
    (require 'recentf)
    ;; 打开该mode
    (recentf-mode 1)
    ;; 设置最大的文件数目
    (setq recentf-max-menu-item 10)
    ;; 设置快捷键
    (global-set-key (kbd "C-x C-r") 'recentf-open-files)
    ;; 默认文本解码设置为UTF-8
    (set-language-environment "UTF-8")
```

For different modules, you can use a modular design by type: for example, add modules of different types to the `lisp` directory under the config folder,
but the location must be added in the initialization file `init.el`:
`(add-to-list 'load-path "~/.emacs.d/lisp/")` . At the same time, add
`(provide 'modul-name)` in the module file,
and then the `init.el` file can load it with the =require= command.

Some modes are triggered only under certain conditions when they are enabled. This is where [hooks](https://www.gnu.org/software/emacs/manual/html_node/emacs/Hooks.html) are used, for example:
```emacs-lisp
    (add-hook 'emacs-lisp-mode-hook 'show-paren-mode)
```

This command means that `show-paren-mode` is started only when `emacs-lisp-mode` is started,
and it is used to highlight matching parentheses.

The default package sources are very limited (you can check them with `M-x package-list-packages`),
so you can use an external package source to get updates. A commonly used one is [MELPA](https://melpa.org/) , which contains about 3000 plugins.
It can be set up with the following commands:
```emacs-lisp
    (require 'package)
         (package-initialize)
         (setq package-archives '(("gnu"   . "http://elpa.emacs-china.org/gnu/")
                          ("melpa" . "http://elpa.emacs-china.org/melpa/"))))
```

In the resulting `packages` list, press `I` to mark a package for installation, `D` to mark it for deletion,
and `U` to mark it for update. After marking, press `X` to confirm.

Finally, use the following commands to install the packages in the package list:
```emacs-lisp
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
```

## Overview of Basic Features<a id="sec-4-2" name="sec-4-2"></a>

Here is a brief introduction to some features that Emacs ships with:

Major Mode: the mode type that corresponds to the file as a whole, such as text-mode, special-mode, and prog-mode

Minor Mode: a mode that provides additional functionality

You can define different Major Modes to be enabled for different files:
```emacs-lisp
    (setq auto-mode-alist
          (append
           '(("\\.js\\'" . js2-mode))
           '(("\\.html\\'" . web-mode))
           auto-mode-alist))
```

Some of the built-in features:
-   `recentf` : recently opened files. After changing the key binding, `C-c C-r` opens the recent files
-   `cl` : Common Lisp Extension
-   Org-mode: see the [Org-mode introduction on my blog](https://www.johneyzheng.top/2019/01/Org_mode/)
    -   [Capture](https://orgmode.org/manual/Capture.html) : lets you define templates for adding entries; see the [blog post](http://www.zmonster.me/2018/02/28/org-mode-capture.html) for details
    -   [Agenda](https://www.gnu.org/software/emacs/manual/html_node/org/Agenda-commands.html) : a schedule management tool
    -   [Pomodoro](https://www.emacswiki.org/emacs/pomodoro) : the Pomodoro technique

## Commonly Used Plugins<a id="sec-4-3" name="sec-4-3"></a>

After installing a plugin, you can use `M-x customize-group` and select the plugin's name to configure its features.

-   [company](http://company-mode.github.io/) : provides various auto-completion features. To apply it globally: =(global-company-mode t)= . company completes through `company-backends`; to complete Python, for example, you need to activate `anaconda-mode` in the mode hook,

The current value of `backends` can be obtained with `C-h v company-backends`
-   [hungry-delete](https://github.com/nflath/hungry-delete) : deletes multiple spaces or newlines at once
-   [swiper](https://github.com/abo-abo/swiper) : this plugin actually integrates three plugins, `swiper` , `counsel` , and `Ivy`. Ivy is used for completion (file lookup and matching, etc.), swiper finds the position of a string in the current file, and counsel provides more functions and matches them with Emacs commands so that Ivy can be used better,

`C-s` performs the search, and the same command switches between search results
-   [smartparens](https://github.com/Fuco1/smartparens) : highlights the matching parentheses
-   [popwin-mode](https://github.com/m2ym/popwin-el) : moves the cursor into the newly opened window
-   [Hippie](https://www.emacswiki.org/emacs/HippieExpand) : provides more completion features, such as completing strings from other buffers
-   [Dired](https://www.gnu.org/software/emacs/manual/html_node/emacs/Dired.html) : provides powerful file management features. `C-x d` enters `Dired-mode`, where you can operate on files, and `C-x C-q` makes the buffer editable (for example, to rename files). Other convenient operations are:
    -   `+` : create a directory
    -   `C` : copy
    -   `D` : delete
    -   `d` : mark for deletion
    -   `u` : remove the mark
    -   `x` : execute the marks
-   [expand-region](https://github.com/magnars/expand-region.el) : selects content with `C-=`. This key binding needs to be bound:
```emacs-lisp
        (global-set-key (kbd "C-=") 'er/expand-region)
```

-   [Occur-mode](https://www.emacswiki.org/emacs/OccurMode) : searches for a string and displays the lines containing it; you can edit in the displayed buffer. `M-s o` searches for and displays the selected content, and pressing =e enters edit mode
-   [iedit-mode](https://github.com/victorhge/iedit) : edits all occurrences of the selected content together. After selecting content, `M-s e` enters iedit mode (the key binding needs to be bound):
```emacs-lisp
        (global-set-key (kbd "M-s e") 'iedit-mode)
```

-   [Evil](https://bytebucket.org/lyro/evil/raw/default/doc/evil.pdf) : implements most of the functionality of Vim
-   [Cask](https://github.com/cask/cask) : Cask helps manage Packages. After installation it generates a `Cask` file under the `.emacs.d` directory that integrates the Packages, and `cask install` installs the packages automatically. After that, use it together with `pallet` to install and manage packages. The following needs to be set in the initialization file:
```emacs-lisp
        require 'cask "<path-to-cask>/cask.el")
        (cask-initialize)    ; 类似于 package-initialize
```

-   [pallet](https://github.com/rdallasgray/pallet) : a package management tool based on Cask that can manage packages across different Emacs versions, among other things. The configuration process is as follows:
```emacs-lisp
        ;; 激活过程
        (pallet-mode)
        (pallet-init)    ; 在.emacs.d 中生成一个 Cask 文件, 写入源与现有包
        (pallet-install) ; 将 elpa 中的 package 拷贝到.Cask/<you version>/elpa 目录中

        ;; 配置过程
        (require 'pallet)
        (pallet-mode t)      ; 激活 pallet, 在安装包时将 Cask 文件写入相应信息
```

-   [use-package](https://github.com/jwiegley/use-package) : a safer way to load packages. When some package fails, it does not stop the whole Emacs from working. It lets you configure each package in one place, making auto-load and key bindings easy. Simple usage is as follows:
```emacs-lisp
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
```

-   JavaScript:
    -   [js2-mode](https://github.com/mooz/js2-mode) : js2-mode mainly provides syntax highlighting and a syntax checker (Linter)
    -   [nodejs-repl](https://github.com/abicky/nodejs-repl.el) : can be used to execute the code in a buffer; NodeJS must already be installed on the system
    -   [js2-refactor](https://github.com/magnars/js2-refactor.el) : a Minor Mode for refactoring JavaScript; `C-c C-m` adds the function prefix
-   [web-mode](https://github.com/fxbois/web-mode) : a commonly used Major Mode for editing front-end code
