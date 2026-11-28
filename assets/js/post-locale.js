(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.postLocale = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function localized(post, language, field) {
    const english = post[field + '_en'];
    return language === 'en' && english ? english : (post[field] || '');
  }

  function displayTitle(post, language) {
    return localized(post, language, 'title');
  }

  function displayDescription(post, language) {
    return localized(post, language, 'description');
  }

  function seriesTitle(post, language) {
    return displayTitle(post, language)
      .replace(/^推理 INFRA 方法论（\d+）：/, '')
      .replace(/^Inference Infrastructure \(\d+\):\s*/, '');
  }

  function homeTitle(post, language) {
    if (language === 'en' && post.card_title) return post.card_title;
    if (language === 'en') return seriesTitle(post, language);
    return (post.title || '').replace(/^推理 INFRA 方法论（\d+）：/, '');
  }

  return { displayTitle, displayDescription, seriesTitle, homeTitle };
});
