/* =========================================================
   VIC-SOUND LISTENER — SERVICE WORKER
   Build: 2026-11-20-01

   Update policy:
   - New app shell files are checked against the network.
   - A waiting update is activated only after the user taps Update.
   - Old shell caches are cleaned up, but music/download caches are NEVER deleted.
   - Cache Storage used by app.js for downloaded music is left untouched.
   ========================================================= */

"use strict";

const SW_VERSION = "2026-11-20-01";
const SHELL_CACHE = `vic-sound-shell-${SW_VERSION}`;
const SHELL_PREFIX = "vic-sound-shell-";

// Keep this list limited to app-shell files that are expected to exist.
// Missing files are ignored during install.
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const request = new Request(path, { cache: "reload" });
        const response = await fetch(request);
        if (response.ok && response.type !== "opaque") {
          await cache.put(request, response);
        }
      } catch (_) {
        // A missing optional shell file must not prevent installation.
      }
    }));
    // Deliberately do NOT call skipWaiting() here.
    // The app shows an Update prompt and sends a message after user approval.
  })());
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "VIC_SOUND_SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      // Delete only old Vic-sound shell caches. Never touch music, covers,
      // downloaded tracks, test-track audio, or unrelated app caches.
      if (name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE) {
        return caches.delete(name);
      }
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

function isAppShellRequest(url) {
  return url.origin === self.location.origin &&
    (url.pathname.endsWith("/app.js") ||
     url.pathname.endsWith("/style.css") ||
     url.pathname.endsWith("/index.html") ||
     url.pathname.endsWith("/manifest.json") ||
     url.pathname.endsWith("/"));
}

function isNeverCacheRequest(request, url) {
  if (request.method !== "GET") return true;
  if (request.headers.has("range")) return true;
  if (request.destination === "audio" || request.destination === "video") return true;

  // Do not cache backend/API requests or streamed music.
  if (/supabase|storage\/v1|\/rest\/v1|\/functions\/v1/i.test(url.href)) return true;
  if (/\.(mp3|m4a|aac|ogg|wav|flac|mp4|webm)(\?|$)/i.test(url.href)) return true;
  return false;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(new Request(request, { cache: "no-store" }));
    if (response && response.ok && response.type !== "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(response => {
    if (response && response.ok && response.type !== "opaque") {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || await refresh || Response.error();
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isNeverCacheRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      return (await cache.match("./index.html")) ||
             (await cache.match("./")) ||
             Response.error();
    }));
    return;
  }

  if (isAppShellRequest(url)) {
    // JS/CSS/HTML always revalidate online; cached copies are offline fallback only.
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Covers and other same-origin static images can be refreshed without
  // interfering with music download caches.
  if (url.origin === self.location.origin &&
      ["image", "style", "script", "font"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
