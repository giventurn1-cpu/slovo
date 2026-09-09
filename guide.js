// Лёгкий приватный счётчик SEO-страниц: без cookies, без PII. Отправляет
// событие landing (просмотр и клик по кнопке) в тот же сборщик, что и приложение.
(function () {
  var ep = 'https://slovo-analytics.giventurn1.workers.dev/e';
  function br() { var u = navigator.userAgent; return /Edg\//.test(u) ? 'edge' : /Firefox\//.test(u) ? 'firefox' : /Chrome\//.test(u) ? 'chrome' : /Safari\//.test(u) ? 'safari' : 'other'; }
  function os() { var u = navigator.userAgent; return /Android/.test(u) ? 'android' : /iPhone|iPad/.test(u) ? 'ios' : /Windows/.test(u) ? 'windows' : /Mac OS X/.test(u) ? 'macos' : 'other'; }
  var mobile = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || innerWidth < 768;
  var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  if (ref === location.hostname) ref = '';
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
