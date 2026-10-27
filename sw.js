const CACHE_NAME = 'hamyar-cache-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/manifest-admin.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // برای فایل‌های HTML و API ها، همیشه از شبکه (سرور) بخوان، نه کش
  if (event.request.mode === 'navigate' || 
      event.request.url.includes('/api/') || 
      event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // برای عکس‌ها و فایل‌های استاتیک، اول کش را چک کن
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
