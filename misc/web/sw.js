const CACHE_NAME = 'mcpe-original-shell-v2-landscape';
const BASE = new URL('./', self.location).pathname;
const CORE = [
  './',
  './index.html',
  './MinecraftPE.js',
  './MinecraftPE.wasm',
  './manifest.webmanifest',
  './studio/index.html',
  './studio/app.js',
  './studio/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(CORE.map((path) => cache.add(new URL(path, self.location).href)));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => request.mode === 'navigate' ? caches.match(new URL('./index.html', self.location).href) : Response.error()))
  );
});
