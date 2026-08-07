const CACHE_NAME = 'x10-downloader-v1';

const APP_SHELL = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/chat.js',
    '/favorites.js',
    '/history.js',
    '/manifest.json'
];

// INSTALL
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle page navigation
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });

                    return response;
                })
                .catch(() => {
                    return caches.match('/index.html');
                })
        );

        return;
    }

    // Handle normal same-origin files
    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((response) => {
                            if (!response || response.status !== 200) {
                                return response;
                            }

                            const responseClone = response.clone();

                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });

                            return response;
                        });
                })
        );
    }
});
