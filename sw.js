const CACHE_NAME = 'x10-downloader-v1';

const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/file_0000000074e081f681d168ece0276989~2.jpg'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
