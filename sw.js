const CACHE = 'quindes-v7';
const ASSETS = [
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/logo-loading.png',
];

// Nunca cachear estos
const NO_CACHE = ['app.js', 'workers.dev', 'script.google.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
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
      .then(clients => clients.forEach(client => client.navigate(client.url)))
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca cachear app.js ni llamadas a APIs
  if (NO_CACHE.some(s => url.includes(s))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first para iconos y logo (siempre toma el nuevo si hay red)
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

  // Cache-first para el resto
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
