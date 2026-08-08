---
title: About Me
icon: fas fa-info
order: 9
---

<div class="about">

<div class="about-switch" role="group" aria-label="Language">
  <button type="button" class="about-lang active" data-lang="zh" aria-pressed="true">中文</button>
  <button type="button" class="about-lang" data-lang="en" aria-pressed="false">English</button>
</div>

<!-- ─────────────── 中文 ─────────────── -->
<section class="about-pane" data-pane="zh">

<p class="about-lead">
你好，我是 <strong>Johney Zheng</strong>，一名算法／开发工程师。<br>
目前专注于 <strong>AI Infra</strong> 与 <strong>CV 算法</strong>方向。
</p>

<p>
这个博客记录我在模型部署、推理优化和工程实践上的笔记。从底层的算子与集群通信，
到上层的推理技术栈，再到相关的算法设计——大多是把踩过的坑和读过的论文整理成自己能复用的形式。
</p>

<h2>主要方向</h2>

<div class="about-grid">
  <div class="about-card">
    <h3>AI Infra</h3>
    <p>推理技术栈、集群通信、Triton Kernel、算子优化，以及长思维链模型对基础设施的影响。</p>
  </div>
  <div class="about-card">
    <h3>模型部署</h3>
    <p>离线部署与推理加速，GPU／TPU／XPU 等异构硬件的选型与优化策略。</p>
  </div>
  <div class="about-card">
    <h3>CV 算法</h3>
    <p>2D／3D 检测、分割与跟踪，以及相关论文的解读笔记。</p>
  </div>
  <div class="about-card">
    <h3>工程实践</h3>
    <p>Python 与 Modern C++、设计模式、并发编程，以及开发环境配置。</p>
  </div>
</div>

<p class="about-tip">
提示：按 <kbd>⌘</kbd><kbd>K</kbd>（Windows 为 <kbd>Ctrl</kbd><kbd>K</kbd>）可以随时全站搜索。
</p>

<h2>联系</h2>

<p>
如果想联系我，<strong>请优先邮件</strong>：<a href="mailto:{{ site.social.email }}">{{ site.social.email }}</a><br>
或者Follow <a href="https://github.com/{{ site.github.username }}" target="_blank" rel="noopener">GitHub @{{ site.github.username }}</a>。
</p>

</section>

<!-- ─────────────── English ─────────────── -->
<section class="about-pane" data-pane="en" hidden>

<p class="about-lead">
Hi, I'm <strong>Johney Zheng</strong> — an algorithm and software engineer
working on <strong>AI infrastructure</strong> and <strong>computer vision</strong>.
</p>

<p>
This blog is where I share my notes and learnings on model deployment, inference optimization,
and engineering practice — covering everything from low-level kernel and collective communication,
to LLM inference stacks, to algorithmic design. 
Mostly, it's a place where I turn my mistakes and papers I've read into something I can actually reuse.

<h2>What I work on</h2>

<div class="about-grid">
  <div class="about-card">
    <h3>AI Infrastructure</h3>
    <p>Inference stacks, collective communication, Triton kernels, operator optimization, and what long chain-of-thought models imply for infra.</p>
  </div>
  <div class="about-card">
    <h3>Model Deployment</h3>
    <p>Offline deployment and inference acceleration across heterogeneous targets — GPU, TPU, and other accelerators.</p>
  </div>
  <div class="about-card">
    <h3>Computer Vision</h3>
    <p>2D and 3D detection, segmentation, and tracking, plus paper reading notes.</p>
  </div>
  <div class="about-card">
    <h3>Engineering</h3>
    <p>Python and modern C++, design patterns, concurrency, and development tooling.</p>
  </div>
</div>

<p class="about-tip">
Tip: press <kbd>⌘</kbd><kbd>K</kbd> (or <kbd>Ctrl</kbd><kbd>K</kbd>) to search the whole site from anywhere.
</p>

<h2>Contact</h2>

<p>
<strong>Email is the best way to reach me</strong>:
<a href="mailto:{{ site.social.email }}">{{ site.social.email }}</a><br>
Or follow <a href="https://github.com/{{ site.github.username }}" target="_blank" rel="noopener">GitHub @{{ site.github.username }}</a>.
</p>

<script>
(function () {
  var root = document.querySelector('.about');
  if (!root) return;
  var KEY = 'about-lang';
  var btns = root.querySelectorAll('.about-lang');

  function show(lang) {
    root.querySelectorAll('.about-pane').forEach(function (p) {
      p.hidden = p.dataset.pane !== lang;
    });
    btns.forEach(function (b) {
      var on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.lang); });
  });

  /* Remember the reader's choice; otherwise follow the browser's language. */
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  var initial = saved || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  show(initial);
})();
</script>
