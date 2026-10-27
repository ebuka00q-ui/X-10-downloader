// ============================================================
// VIC-SOUND SERVICE WORKER
// OFFLINE-FIRST APP SHELL
// ============================================================

const CACHE_NAME = "vic-sound-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );

  // Activate the new service worker immediately.
  self.skipWaiting();
});


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  // Take control of open Vic-sound pages immediately.
  self.clients.claim();
});


// ============================================================
// FETCH
// ============================================================

self.addEventListener("fetch", (event) => {
  // Only handle normal GET requests.
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      // --------------------------------------------------------
      // USE CACHED FILE FIRST
      // --------------------------------------------------------

      if (cachedResponse) {
        return cachedResponse;
      }


      // --------------------------------------------------------
      // IF NOT CACHED, TRY THE INTERNET
      // --------------------------------------------------------

      return fetch(event.request)
        .then((networkResponse) => {

          // Don't cache failed responses.
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "opaque"
          ) {
            return networkResponse;
          }


          // ----------------------------------------------------
          // SAVE A COPY FOR FUTURE OFFLINE USE
          // ----------------------------------------------------

          const responseCopy = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });

          return networkResponse;
        })

        // ------------------------------------------------------
        // INTERNET NOT AVAILABLE
        // ------------------------------------------------------

        .catch(() => {
          return caches.match("./index.html");
        });
    })
  );
});


// ============================================================
// MESSAGE CONTROL
// ============================================================

self.addEventListener("message", (event) => {

  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }

});
