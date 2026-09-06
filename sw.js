// Service worker SLOVO — офлайн-запуск установленного приложения.
// Генерируется на сборке: vite.config.ts (слот slovo-sw) подставляет список и версию
// (версия — хэш СОДЕРЖИМОГО прекэша: правка index/иконок без смены имён чанков
// тоже обновляет SW).
//
// Стратегии:
//  - навигации → сеть-первой (обновления приходят сразу; в кэш только r.ok — разовый
//    503 не должен отравить офлайн); офлайн → кэш (без учёта query) → index каталога →
//    редирект на корень: base './' делает корневой index на под-пути нерабочим
//    (относительные ассеты резолвятся мимо кэша), а с корня оболочка стартует
//  - /assets/* → кэш-первым (имена хэшированы содержимым, иммутабельны)
//  - прочее same-origin (guide.js, og, manifest, иконки…) → сеть-первой, офлайн —
//    из кэша: cache-first здесь навсегда замораживал бы нехэшированные файлы
//  - Google Fonts → кэш-первым со фоновым обновлением (офлайн шрифты живут)
//  - остальное (аналитика, CDN моделей перевода и вырезания) не трогаем: transformers.js кэширует
//    модели сам в Cache API, аналитике офлайн просто не судьба
const VERSION = 'a529fb6244';
const CORE = 'slovo-core-' + VERSION;
const RUNTIME = 'slovo-runtime-v1';
const FONTS = 'slovo-fonts-v1';
const PRECACHE = ["/","/assets/beatWorker-C4BdgBBW.js","/assets/ExportModal-Ba0gdH9x.js","/assets/main-BCw1fANS.css","/assets/main-D4UpDDj4.js","/assets/preflight-CWTRAPDE.js","/assets/segmentWorker-CKneSRn9.js","/assets/testHook-BLHTpFu9.js","/assets/translateWorker-N5qVh9nZ.js","/assets/vendor-BmWERINj.js","/icon-192.png","/icon-512.png","/icon-maskable.png","/index.html","/manifest.webmanifest","/vibes/index.html"];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('slovo-core-') && k !== CORE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok) {
          const c = await caches.open(CORE);
          c.put(req, r.clone());
        }
        return r;
      } catch {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit !== undefined) return hit;
        if (url.pathname.endsWith('/')) {
          const dir = await caches.match(url.pathname + 'index.html');
          if (dir !== undefined) return dir;
        }
        // под-путь без кэша: корневой index тут не запустится (base './' резолвит
        // ассеты мимо кэша) — уводим на корень, там оболочка есть
        if (url.pathname !== '/' && url.pathname !== '/index.html') {
          return Response.redirect('/', 302);
        }
        const root = await caches.match('/index.html');
        return root ?? Response.error();
      }
    })());
    return;
  }

  const hashed = sameOrigin && url.pathname.startsWith('/assets/');
  if (hashed || isFont) {
    // иммутабельные чанки и шрифты: кэш-первым; шрифты тихо освежаем фоном
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit !== undefined) {
        if (isFont) {
          e.waitUntil(fetch(req).then(async (r) => {
            if (r.ok || r.type === 'opaque') (await caches.open(FONTS)).put(req, r.clone());
          }).catch(() => undefined));
        }
        return hit;
      }
      const r = await fetch(req);
      if (r.ok || r.type === 'opaque') {
        const c = await caches.open(isFont ? FONTS : RUNTIME);
        c.put(req, r.clone());
      }
      return r;
    })());
    return;
  }

  // нехэшированное same-origin (guide.*, og, robots, manifest, иконки): сеть-первой —
  // деплой доезжает сразу; кэш только как офлайн-фолбэк
  e.respondWith((async () => {
    try {
      const r = await fetch(req);
      if (r.ok) (await caches.open(RUNTIME)).put(req, r.clone());
      return r;
    } catch (err) {
      const hit = await caches.match(req);
      if (hit !== undefined) return hit;
      throw err;
    }
  })());
});
