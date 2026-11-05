const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../assets/js/analytics.js'), 'utf8');
function load(href, storage = new Map(), blockedStorage = false, measurementId = 'G-TEST123456') {
  const scripts = [];
  const listeners = {};
  const window = {};
  const context = {
    window, URL, URLSearchParams, location: new URL(href),
    localStorage: {
      getItem(key) { if (blockedStorage) throw new Error('Blocked'); return storage.get(key); },
      setItem(key, value) { if (blockedStorage) throw new Error('Blocked'); storage.set(key, value); },
      removeItem(key) { if (blockedStorage) throw new Error('Blocked'); storage.delete(key); }
    },
    document: {
      currentScript: {dataset: {measurementId, siteUrl: 'https://johneyzheng.top'}},
      createElement: () => ({}),
      head: {append: script => scripts.push(script)},
      addEventListener: (name, callback) => { listeners[name] = callback; }
    }
  };
  vm.runInNewContext(source, context);
  return {
    scripts, window, context,
    events: () => Array.from(window.dataLayer || [], args => JSON.parse(JSON.stringify([...args]))),
    click(href, type = 'click', button = 0) {
      listeners[type]?.({type, button, target: {closest: () => href ? {href} : null}});
    }
  };
}

test('production builds do not load Google on local, preview, or lookalike origins', () => {
  for (const origin of ['http://localhost:4000', 'http://127.0.0.1:4173', 'http://[::1]:4173',
    'https://preview.example.com', 'https://johneyzheng.top.example.com', 'https://johneyzheng.top:4173']) {
    const page = load(origin);
    assert.equal(page.scripts.length, 0, origin);
    assert.equal(page.events().length, 0, origin);
  }
});

test('canonical site initializes once and leaves pageviews to the Google tag', () => {
  const page = load('https://johneyzheng.top/?utm_source=zhihu&utm_medium=referral');
  assert.equal(page.scripts.length, 1);
  assert.deepEqual(page.events()[1], ['config', 'G-TEST123456', {}]);
  vm.runInNewContext(source, page.context);
  assert.equal(page.scripts.length, 1);
  assert.equal(page.events().filter(args => args[0] === 'config').length, 1);
  assert.equal(page.events().filter(args => args[1] === 'page_view').length, 0);
});

test('owner opt-out survives navigation and can be explicitly reversed', () => {
  const storage = new Map();
  assert.equal(load('https://johneyzheng.top/?analytics=off', storage).scripts.length, 0);
  assert.equal(load('https://johneyzheng.top/posts/example/', storage).scripts.length, 0);
  assert.equal(load('https://johneyzheng.top/?analytics=on', storage).scripts.length, 1);
  assert.equal(load('https://johneyzheng.top/', storage).scripts.length, 1);
});

test('blocked storage does not break the site or ignore explicit opt-out', () => {
  assert.equal(load('https://johneyzheng.top/?analytics=off', new Map(), true).scripts.length, 0);
  assert.equal(load('https://johneyzheng.top/', new Map(), true).scripts.length, 1);
});

test('debug mode is explicit, does not persist, and respects opt-out', () => {
  const storage = new Map();
  const page = load('https://johneyzheng.top/?analytics=debug', storage);
  assert.deepEqual(page.events()[1][2], {debug_mode: true});
  assert.deepEqual(load('https://johneyzheng.top/', storage).events()[1][2], {});
  storage.set('analytics-disabled', '1');
  assert.equal(load('https://johneyzheng.top/?analytics=debug', storage).scripts.length, 0);
});

test('contact intent excludes email contents and GitHub clicks are limited to the owner', () => {
  const page = load('https://johneyzheng.top/');
  page.click('mailto:hello@example.com?subject=Private&body=Confidential');
  page.click('https://github.com/ZhengWG/project?tab=readme#section');
  page.click('https://github.com/zhengwg', 'auxclick', 1);
  for (const url of ['https://github.com/other/project', 'https://github.com/ZhengWG-other',
    'https://github.com/', 'https://github.com.evil.example/ZhengWG', '/writing/', null]) page.click(url);
  page.click('https://github.com/ZhengWG', 'auxclick', 2);
  assert.deepEqual(page.events().slice(2), [
    ['event', 'contact_click', {contact_method: 'email'}],
    ['event', 'github_visit', {link_domain: 'github.com', link_url: 'https://github.com/ZhengWG/project'}],
    ['event', 'github_visit', {link_domain: 'github.com', link_url: 'https://github.com/zhengwg'}]
  ]);
});

test('empty or invalid measurement IDs never load a remote tag', () => {
  for (const id of ['', 'invalid', 'G-TEST&extra=1']) assert.equal(load('https://johneyzheng.top/', new Map(), false, id).scripts.length, 0);
});
