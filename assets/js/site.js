const query = new URLSearchParams(location.search);
let savedLanguage = 'zh';
try { savedLanguage = localStorage.getItem('site-language') || localStorage.getItem('lab-preview-language') || 'zh'; } catch (_) {}
const language = ['zh', 'en'].includes(query.get('lang')) ? query.get('lang') : (savedLanguage === 'en' ? 'en' : 'zh');
const ui = siteUI[language];
const main = document.querySelector('#main');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.update()))).catch(() => {});
}
const nativePost = main.querySelector('[data-native-post]');
const nativeCollection = main.querySelector('[data-native-collection]');
const requested = nativePost ? 'article' : nativeCollection ? 'collection' : query.get('page') || main.dataset.page || 'home';
const page = Object.hasOwn(ui.pages, requested) ? requested : 'static';
document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hans';
if (!nativePost && page !== 'static' && (nativeCollection || page !== main.dataset.page)) main.replaceChildren(document.getElementById(page).content.cloneNode(true));
if (!nativePost && page !== 'static') document.title = `${ui.pages[page]} · Johney Zheng`;
const writingPages = ['article', 'tags', 'categories', 'collection', 'archives'];
const activePage = writingPages.includes(page) ? 'writing' : page === 'tool' ? 'experiments' : page;
document.querySelector(`[data-nav="${activePage}"]`)?.setAttribute('aria-current', 'page');
document.querySelectorAll('[data-nav]').forEach(link => { link.textContent = ui.navigation[link.dataset.nav]; });

function route(destination, values = {}, hash = '') {
  const path = destination === 'home' ? '/' : destination === 'article' ? '/' : destination === 'collection' ? `/${values.type || 'tags'}/` : `/${destination}/`;
  const params = new URLSearchParams({...values, lang: language});
  if (destination === 'article' || destination === 'collection') params.set('page', destination);
  return `${path}?${params}${hash ? `#${hash}` : ''}`;
}
function english(text) { return englishCopy[text] || text; }
function termLabel(term) { return language === 'en' ? english(term) : term; }
function translate(root) {
  if (language !== 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (node.parentElement.closest('[data-original], script, style, template, [data-site-lang]')) return;
    const trimmed = node.textContent.trim();
    if (Object.hasOwn(englishCopy, trimmed)) node.textContent = node.textContent.replace(trimmed, englishCopy[trimmed]);
  });
  root.querySelectorAll('[aria-label], [title], [placeholder]').forEach(element => {
    if (element.closest('[data-original]')) return;
    ['aria-label', 'title', 'placeholder'].forEach(attribute => {
      const value = element.getAttribute(attribute);
      if (value && englishCopy[value]) element.setAttribute(attribute, englishCopy[value]);
    });
  });
}
function localizeLinks(root) {
  root.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return;
    const url = new URL(raw, location.href);
    if (raw.startsWith('?page=')) {
      const values = Object.fromEntries(url.searchParams);
      const destination = values.page;
      delete values.page; delete values.lang;
      link.setAttribute('href', route(destination, values, url.hash.slice(1)));
    } else if (url.origin === location.origin && !url.pathname.startsWith('/assets/')) {
      url.searchParams.set('lang', language);
      link.setAttribute('href', url.pathname + url.search + url.hash);
    }
  });
}
translate(document.body);
localizeLinks(document.body);
document.querySelectorAll('[data-site-lang]').forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.siteLang === language));
  button.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.set('lang', button.dataset.siteLang);
    try { localStorage.setItem('site-language', button.dataset.siteLang); } catch (_) {}
    location.href = url.href;
  });
});
const themeButton = document.querySelector('.theme-toggle');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute('aria-label', theme === 'dark' ? ui.themeLight : ui.themeDark);
}
try { setTheme(localStorage.getItem('site-theme') || localStorage.getItem('lab-preview-theme') || 'light'); } catch (_) { setTheme('light'); }
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(theme);
  try { localStorage.setItem('site-theme', theme); } catch (_) {}
});
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function postLink(post) { return `${post.url}?lang=${language}`; }
function coverImage(post, decorative = false) {
  if (!post.image?.src) return null;
  const img = element('img', undefined, 'post-cover-image');
  img.src = post.image.src;
  img.alt = decorative ? '' : post.image.alt;
  img.width = 1672;
  img.height = 941;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}
function seriesCard(post, number) {
  const link = element('a', undefined, 'series-card');
  link.href = postLink(post);
  const img = coverImage(post, true);
  if (img) link.append(img);
  const copy = element('div', undefined, 'series-card-copy');
  copy.dataset.original = '';
  copy.append(element('small', `${String(number).padStart(2, '0')} / ${post.date}`), element('h3', post.title.replace(/^推理 INFRA 方法论（\d）：/, '')), element('p', post.description));
  link.append(copy);
  return link;
}
function postRow(post, number) {
  const link = element('a');
  link.href = postLink(post);
  const copy = element('div');
  const title = element('h3', post.title);
  const description = element('p', post.description);
  title.dataset.original = '';
  description.dataset.original = '';
  copy.append(element('small', `${post.date} / ${post.categories.map(termLabel).join(' · ')}`), title);
  if (post.description) copy.append(description);
  link.append(element('span', String(number).padStart(2, '0')), copy, element('span', '↗'));
  return link;
}
function showPosts(target, posts) {
  target.replaceChildren();
  posts.forEach((post, i) => target.append(postRow(post, i + 1)));
  if (!posts.length) target.append(element('p', ui.empty, 'archive-note'));
}
function setCounts(posts) {
  document.querySelectorAll('[data-result-count]').forEach(el => { el.textContent = `${ui.count(posts.length)} · ${ui.originalNote}`; });
}
function groupedTerms(posts, type) {
  const terms = new Map();
  posts.forEach(post => post[type].forEach(term => terms.set(term, (terms.get(term) || 0) + 1)));
  return [...terms].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function renderTerms(posts) {
  const terms = groupedTerms(posts, page);
  document.querySelector('[data-term-count]').textContent = ui.terms(terms.length);
  const target = document.querySelector('[data-taxonomy]');
  terms.forEach(([term, count]) => {
    const link = element('a');
    link.href = route('collection', {type: page, term});
    link.append(element('span', termLabel(term)), element('small', ui.count(count)), element('b', '→'));
    target.append(link);
  });
}
function renderArchive(posts) {
  const years = [...new Set(posts.map(post => post.date.slice(0, 4)))];
  const jumps = document.querySelector('[data-archive-years]');
  const target = document.querySelector('[data-archive-list]');
  years.forEach(year => {
    const jump = element('a', year);
    jump.href = `#year-${year}`;
    jumps.append(jump);
    const section = element('section', undefined, 'archive-group');
    section.id = `year-${year}`;
    const title = element('div', undefined, 'section-rule');
    const selected = posts.filter(post => post.date.startsWith(year));
    title.append(element('h2', year), element('span', ui.count(selected.length)));
    const list = element('div', undefined, 'series-table');
    showPosts(list, selected);
    section.append(title, list);
    target.append(section);
  });
}
function normalizedSlug(value) {
  return decodeURIComponent(value).toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
}
function rewriteArticleLinks(root, posts) {
  root.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) return;
    let url;
    try { url = new URL(raw, location.href); } catch (_) { return; }
    if (['johneyzheng.top', 'www.johneyzheng.top', 'zhengwg.github.io', location.hostname].includes(url.hostname)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const name = parts[0]?.toLowerCase();
      if (name === 'posts' && parts[1]) {
        const found = posts.find(post => normalizedSlug(post.slug) === normalizedSlug(parts[1]));
        link.href = found ? postLink(found) + url.hash : route('writing', {q: decodeURIComponent(parts[1])});
      } else if (['tags', 'categories'].includes(name)) {
        const keys = [...new Set(posts.flatMap(post => post[name]))];
        const term = keys.find(key => normalizedSlug(key) === normalizedSlug(parts[1] || ''));
        link.href = term ? route('collection', {type:name, term}) : route(name);
      } else if (['about', 'archives', 'agents'].includes(name)) {
        link.href = route(name === 'agents' ? 'experiments' : name);
      } else if (url.hostname !== location.hostname && !parts.length) {
        link.href = route('home');
      }
    }
  });
  localizeLinks(root);
}
async function renderArticle(posts) {
  const slug = nativePost?.dataset.nativePost || query.get('post') || '推理INFRA方法论-00-roofline';
  const post = posts.find(item => item.slug === slug || normalizedSlug(item.slug) === normalizedSlug(slug));
  const body = document.querySelector('[data-post-body]');
  if (!post) { document.querySelector('[data-post-title]').textContent = ui.noArticle; body.textContent = ui.noArticle; return; }
  if (!nativePost) { location.replace(postLink(post) + location.hash); return; }
  document.title = `${post.title} · Johney Zheng`;
  for (const [selector, value] of [['[data-post-title]', post.title], ['[data-post-description]', post.description], ['[data-post-date]', post.date]]) {
    const target = document.querySelector(selector);
    target.textContent = value;
    target.dataset.original = '';
  }
  document.querySelector('[data-post-language]').textContent = post.language === 'en' ? (language === 'en' ? 'Original: English' : '原文：英文') : ui.original;
  body.lang = post.language;
  const cover = coverImage(post);
  if (cover && !document.querySelector('.article-cover')) {
    cover.loading = 'eager';
    document.querySelector('.article-heading').after(cover);
    cover.classList.add('article-cover');
  }
  const taxonomy = document.querySelector('[data-post-taxonomy]');
  taxonomy.replaceChildren();
  ['categories', 'tags'].forEach(type => post[type].forEach(term => {
    const link = element('a', termLabel(term));
    link.href = route('collection', {type, term});
    taxonomy.append(link);
  }));
  body.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; });
  body.querySelectorAll('div.highlighter-rouge').forEach(block => {
    const source = block.querySelector('.rouge-code pre') || block.querySelector('pre');
    if (!source) return;
    const pre = source.cloneNode(true);
    pre.dataset.language = /language-([\w+-]+)/.exec(block.className)?.[1] || '';
    block.replaceWith(pre);
  });
  body.querySelectorAll('pre').forEach(pre => {
    if (pre.dataset.language === 'mermaid' || pre.querySelector('code.language-mermaid')) {
      const diagram = element('div', pre.textContent, 'mermaid');
      pre.replaceWith(diagram);
    }
  });
  body.querySelectorAll('table').forEach(table => {
    const wrapper = element('div', undefined, 'reading-table');
    wrapper.tabIndex = 0;
    table.before(wrapper);
    wrapper.append(table);
  });
  body.querySelectorAll('pre').forEach(pre => {
    const wrapper = element('div', undefined, 'code-block');
    const bar = element('div');
    const languageName = pre.dataset.language || (pre.querySelector('code')?.className || '').replace('language-', '');
    const copyButton = element('button', ui.copy);
    copyButton.type = 'button';
    copyButton.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pre.textContent); copyButton.textContent = ui.copied; }
      catch (_) { copyButton.textContent = ui.copyFailed; }
    });
    bar.append(element('span', languageName || 'CODE'), copyButton);
    pre.before(wrapper);
    wrapper.append(bar, pre);
  });
  const toc = document.querySelector('[data-post-toc]');
  body.querySelectorAll('h2, h3').forEach((heading, index) => {
    if (!heading.id) heading.id = `section-${index}`;
    const link = element('a', heading.textContent);
    link.href = '#' + encodeURIComponent(heading.id);
    if (heading.tagName === 'H3') link.className = 'toc-subheading';
    toc.append(link);
  });
  toc.dataset.original = '';
  rewriteArticleLinks(body, posts);
  if (post.mermaid || body.querySelector('.mermaid')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@8/dist/mermaid.min.js';
    script.onload = () => {
      window.mermaid.initialize({startOnLoad:false, securityLevel:'strict', theme:document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'});
      window.mermaid.init(undefined, body.querySelectorAll('.mermaid'));
    };
    document.head.append(script);
  }
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}
async function renderTool() {
  const tool = query.get('tool') === 'house-price' ? 'house-price' : 'ai-tracker';
  const title = tool === 'house-price' ? '城市房价观察' : 'AI 前沿追踪';
  document.title = `${termLabel(title)} · Johney Zheng`;
  const description = tool === 'house-price' ? '以杭州公开房价数据为样本，探索数据整理、交互分析与对话查询。' : '聚合 AI 领域的动态与信息线索，作为进一步阅读和探索的起点。';
  document.querySelector('[data-tool-title]').textContent = termLabel(title);
  document.querySelector('[data-tool-description]').textContent = termLabel(description);
  document.querySelector('[data-tool-kind]').textContent = tool;
  const app = document.querySelector('[data-tool-app]');
  await LabTools.mount(app, {tool, language, params:query});
  app.setAttribute('aria-busy', 'false');
}
async function renderContent() {
  if (page === 'static') return;
  if (page === 'tool') { await renderTool(); return; }
  if (['about', 'projects', 'experiments'].includes(page)) return;
  const response = await fetch('/assets/data/posts.json');
  if (!response.ok) throw new Error('Index could not be loaded');
  const posts = await response.json();
  const series = posts.filter(post => post.slug.startsWith('推理INFRA方法论-')).sort((a,b) => a.slug.localeCompare(b.slug));
  if (page === 'home') {
    document.querySelectorAll('.chapter-list a').forEach((link, i) => { link.href = postLink(series[i]); });
    const cover = coverImage(series[0], true);
    if (cover) document.querySelector('.feature-heading').prepend(cover);
    document.querySelectorAll('.article-rows a').forEach((link, i) => {
      const post = posts[i];
      if (!post) return;
      link.href = postLink(post);
      link.querySelector('time').textContent = post.date.replaceAll('-', '.');
      link.querySelector('h3').textContent = termLabel(post.title.replace(/^推理 INFRA 方法论（\d）：/, ''));
    });
    document.querySelector('.section-rule a[href*="writing"]').textContent = language === 'en' ? `Browse all ${posts.length} articles ↗` : `${posts.length} 篇笔记，持续积累 ↗`;
  } else if (page === 'research') {
    const list = document.querySelector('[data-series]');
    list.classList.replace('series-table', 'series-covers');
    series.forEach((post, i) => list.append(seriesCard(post, i)));
    list.after(element('p', ui.originalNote, 'archive-note'));
  } else if (page === 'writing') {
    const search = document.querySelector('#article-search');
    function filter() {
      const text = search.value.trim().toLowerCase();
      const matching = posts.filter(post => [post.title, post.description, ...post.tags, ...post.categories, ...post.tags.map(termLabel), ...post.categories.map(termLabel)].join(' ').toLowerCase().includes(text));
      showPosts(document.querySelector('[data-writing]'), matching);
      setCounts(matching);
      const url = new URL(location.href);
      text ? url.searchParams.set('q', search.value) : url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    search.value = query.get('q') || '';
    search.addEventListener('input', filter);
    filter();
  } else if (page === 'tags' || page === 'categories') {
    renderTerms(posts);
  } else if (page === 'collection') {
    const type = (query.get('type') || nativeCollection?.dataset.type) === 'categories' ? 'categories' : 'tags';
    const term = query.get('term') || nativeCollection?.dataset.term || '';
    const matching = posts.filter(post => post[type].includes(term));
    document.querySelector('[data-collection-kind]').textContent = type === 'tags' ? ui.tag : ui.category;
    document.querySelector('[data-collection-title]').textContent = termLabel(term);
    document.title = `${termLabel(term)} · ${ui.pages[type]} · Johney Zheng`;
    setCounts(matching);
    showPosts(document.querySelector('[data-collection-posts]'), matching);
  } else if (page === 'archives') {
    renderArchive(posts);
  } else if (page === 'article') {
    await renderArticle(posts);
  }
}
renderContent().catch(error => {
  console.error(error);
  const message = element('p', ui.error, 'load-error');
  message.setAttribute('role', 'alert');
  main.prepend(message);
});
