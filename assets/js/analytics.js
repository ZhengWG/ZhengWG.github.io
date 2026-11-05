(() => {
  const settings = document.currentScript.dataset;
  const id = settings.measurementId;
  const site = new URL(settings.siteUrl);
  // Production builds are also served locally for review.
  if (!/^G-[A-Z0-9]+$/.test(id) || location.origin !== site.origin) return;

  const mode = new URLSearchParams(location.search).get('analytics');
  let disabled = mode === 'off';
  try {
    if (mode === 'off') localStorage.setItem('analytics-disabled', '1');
    if (mode === 'on') localStorage.removeItem('analytics-disabled');
    disabled = disabled || localStorage.getItem('analytics-disabled') === '1';
  } catch (_) {}
  if (disabled || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, mode === 'debug' ? {debug_mode: true} : {});
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(script);

  function trackLink(event) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.protocol === 'mailto:') {
      // Record contact intent, not the address, subject or message.
      window.gtag('event', 'contact_click', {contact_method: 'email'});
    } else if (url.protocol === 'https:' && url.hostname === 'github.com'
        && url.pathname.split('/')[1].toLowerCase() === 'zhengwg') {
      window.gtag('event', 'github_visit', {
        link_domain: url.hostname,
        link_url: url.origin + url.pathname
      });
    }
  }
  document.addEventListener('click', trackLink);
  document.addEventListener('auxclick', trackLink);
})();
