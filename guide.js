// Лёгкий приватный счётчик SEO-страниц: без cookies, без PII. Отправляет
// событие landing (просмотр и клик по кнопке) в тот же сборщик, что и приложение.
(function () {
  // Отказ от сбора (?noanalytics в приложении) действует и здесь: до 04.10.2026
  // счётчик его не смотрел, и заходы владельца и смоков шли в статистику.
  try { if (localStorage.getItem('slovo-no-analytics') === '1') return; } catch (e) {}
  // Адрес переопределяется так же, как в приложении: смок e2e/vutm.mjs ведёт
  // события на локальный приёмник, а не в боевую базу.
  var ep = (typeof window.SLOVO_ANALYTICS_ENDPOINT === 'string' && window.SLOVO_ANALYTICS_ENDPOINT) || 'https://slovo-analytics.giventurn1.workers.dev/e';
  // Метка источника — тот же список, что в src/analytics.ts (там же — почему).
  // Наружу уходит только значение из списка, никогда не сырая строка из ссылки.
  var UTM = {
    'chatgpt.com': 'chatgpt.com', 'chat.openai.com': 'chatgpt.com', 'openai': 'chatgpt.com',
    'perplexity': 'perplexity.ai', 'perplexity.ai': 'perplexity.ai',
    'copilot': 'copilot.microsoft.com', 'copilot.microsoft.com': 'copilot.microsoft.com',
    'gemini': 'gemini.google.com', 'gemini.google.com': 'gemini.google.com',
    'claude': 'claude.ai', 'claude.ai': 'claude.ai',
    'deepseek': 'deepseek.com', 'chat.deepseek.com': 'deepseek.com',
    'grok': 'grok.com', 'grok.com': 'grok.com',
    'youtube': 'youtube.com', 'youtube.com': 'youtube.com',
    'reddit': 'reddit.com', 'reddit.com': 'reddit.com',
    'producthunt': 'producthunt.com', 'producthunt.com': 'producthunt.com',
    'alternativeto': 'alternativeto.net', 'alternativeto.net': 'alternativeto.net'
  };
  var utm = '';
  try {
    var us = (new URL(location.href).searchParams.get('utm_source') || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(UTM, us)) utm = UTM[us];
  } catch (e) {}
  function br() { var u = navigator.userAgent; return /Edg\//.test(u) ? 'edge' : /Firefox\//.test(u) ? 'firefox' : /Chrome\//.test(u) ? 'chrome' : /Safari\//.test(u) ? 'safari' : 'other'; }
  function os() { var u = navigator.userAgent; return /Android/.test(u) ? 'android' : /iPhone|iPad/.test(u) ? 'ios' : /Windows/.test(u) ? 'windows' : /Mac OS X/.test(u) ? 'macos' : 'other'; }
  var mobile = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || innerWidth < 768;
  var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  if (ref === location.hostname) ref = '';
  if (ref === '' && utm !== '') ref = 'utm:' + utm;
  var page = location.pathname.replace(/^\/|\/$/g, '') || 'home';
  function send(props) {
    try {
      var body = JSON.stringify({
        n: 'landing', sid: Math.random().toString(36).slice(2, 12),
        dev: mobile ? 'mobile' : 'desktop', br: br(), os: os(),
        wc: (typeof VideoEncoder !== 'undefined') ? 1 : 0, wg: ('gpu' in navigator) ? 1 : 0,
        lang: (navigator.language || '').slice(0, 2), ref: ref, p: props
      });
      navigator.sendBeacon(ep, new Blob([body], { type: 'text/plain' }));
    } catch (e) {}
  }
  send({ page: page });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta]');
    if (a) send({ page: page, cta: 1 });
  });
})();
