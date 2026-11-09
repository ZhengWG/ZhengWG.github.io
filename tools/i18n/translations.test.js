const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const postsDir = path.join(root, '_posts');
const englishDir = path.join(root, '_i18n', 'en');

function splitFrontMatter(text) {
  if (!text.startsWith('---')) return { meta: {}, body: text };
  const parts = text.split(/^---[ \t]*\r?\n/m, 3);
  const meta = {};
  for (const line of (parts[1] || '').split('\n')) {
    const match = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])) value = value.slice(1, -1);
    meta[match[1]] = value;
  }
  return { meta, body: parts[2] || '' };
}

function fenceCount(text) {
  return text.split('\n').filter(line => line.trimStart().startsWith('```')).length;
}

function tokens(text, pattern) {
  return [...text.matchAll(pattern)].map(match => match[0]).sort();
}

const posts = fs.readdirSync(postsDir).filter(name => name.endsWith('.md')).sort();

test('every Chinese post has an English version', () => {
  const missing = posts.filter(name => !fs.existsSync(path.join(englishDir, name)));
  assert.deepEqual(missing, []);
});

for (const name of posts) {
  test(name, () => {
    const sourcePath = path.join(postsDir, name);
    const englishPath = path.join(englishDir, name);
    if (!fs.existsSync(englishPath)) return;
    const source = fs.readFileSync(sourcePath, 'utf8');
    const english = fs.readFileSync(englishPath, 'utf8');
    const { meta, body } = splitFrontMatter(english);
    assert.ok(meta.title, 'missing title');
    assert.ok(meta.description, 'missing description');
    assert.equal(/[\u4e00-\u9fff]/.test(meta.title), false, `Chinese left in title: ${meta.title}`);
    assert.equal(/[\u4e00-\u9fff]/.test(meta.description), false, 'Chinese left in description');
    assert.ok(body.trim().length > 80, 'body is too short to be a translation');
    assert.equal(fenceCount(english), fenceCount(source), 'code fence count changed');
    assert.deepEqual(
      tokens(english, /\{%[ \t]*post_url[ \t]+[^%]+%\}/g),
      tokens(source, /\{%[ \t]*post_url[ \t]+[^%]+%\}/g),
      'post_url tags changed'
    );
    const sourceImages = tokens(source, /!\[[^\]]*\]\([^)\s]+\)|<img\b[^>]*\bsrc="[^"]+"/g);
    for (const image of sourceImages) {
      const src = /(?:\]\(|src=")([^)"\s]+)/.exec(image)[1];
      assert.ok(english.includes(src), `missing image ${src}`);
    }
  });
}
