const test = require('node:test');
const assert = require('node:assert/strict');
const { displayTitle, displayDescription, seriesTitle, homeTitle } = require('../../assets/js/post-locale.js');

const post = {
  title: '推理 INFRA 方法论（0）：Roofline：用算力与带宽建立性能预算',
  description: '从算术强度出发。',
  title_en: 'Inference Infrastructure (0): Roofline: Performance Budgets from Compute and Bandwidth',
  description_en: 'Start from arithmetic intensity.',
  card_title: 'Roofline: performance budgets',
  en: '/assets/i18n/en/abc.html'
};

test('Chinese stays on the Chinese site', () => {
  assert.equal(displayTitle(post, 'zh'), post.title);
  assert.equal(displayDescription(post, 'zh'), post.description);
  assert.equal(homeTitle(post, 'zh'), 'Roofline：用算力与带宽建立性能预算');
});

test('English uses the translated title, description, and card title', () => {
  assert.equal(displayTitle(post, 'en'), post.title_en);
  assert.equal(displayDescription(post, 'en'), post.description_en);
  assert.equal(seriesTitle(post, 'en'), 'Roofline: Performance Budgets from Compute and Bandwidth');
  assert.equal(homeTitle(post, 'en'), 'Roofline: performance budgets');
});

test('a post without an English title stays in Chinese', () => {
  const original = { title: '只有中文', description: '' };
  assert.equal(displayTitle(original, 'en'), '只有中文');
  assert.equal(displayDescription(original, 'en'), '');
});
