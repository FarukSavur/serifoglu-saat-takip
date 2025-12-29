const CACHE_NAME = 'saat-takip-cache-v1';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Put a copy in cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try { cache.put(event.request, resClone); } catch (e) { }
        });
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html'))
    )
  );
});
