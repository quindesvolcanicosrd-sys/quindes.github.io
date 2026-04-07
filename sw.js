const CACHE = 'pivot-v13';
const ASSETS = [
  './index.html',
  './css/global.css',
  './css/nav.css',
  './css/ajustes.css',
  './manifest.json',
  './js/core.js',
  './js/api.js',
  './js/ui.js',
  './js/auth.js',
  './js/wizard.js',
  './js/perfil.js',
  './js/ajustes.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/logo-loading.png',
  './html/login.html',
  './html/wizard-cuenta.html',
  './html/wizard-liga.html',
  './html/nav.html',
  './html/modals.html',
];

const NO_CACHE = ['workers.dev', 'script.google.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url =>
        fetch(url).then(res => {
          if (!res.ok) throw new Error(`${res.status} ${url}`);
          return c.put(url, res);
        }).catch(err => console.warn('[SW] No se pudo cachear:', err.message))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (NO_CACHE.some(s => url.includes(s))) {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.includes('/icons/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: false }).then(cached => {
      if (cached && !e.request.url.includes('?')) return cached;
      return fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});