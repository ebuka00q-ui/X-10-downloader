/* VIC-SOUND SERVICE WORKER
   Change VERSION only when you intentionally want the in-app update prompt.
   Editing this file or app shell files without changing VERSION installs silently.
*/
const VERSION = "1.0.1";
const SHELL_CACHE_PREFIX = "vic-sound-shell-";
const SHELL_CACHE = `${SHELL_CACHE_PREFIX}${VERSION}`;
const MEDIA_CACHE_PREFIX = "vic-sound-media-"; // Reserved: never delete user music caches.
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./vinyl.svg"
];

let updateRequired = false;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const existing = await caches.keys();
    const oldShellCaches = existing.filter(name => name.startsWith(SHELL_CACHE_PREFIX));
    updateRequired = oldShellCaches.length > 0 && !oldShellCaches.includes(SHELL_CACHE);

    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const request = new Request(path, { cache: "reload" });
        const response = await fetch(request);
        if (response.ok && (response.type === "basic" || response.type === "cors")) {
          await cache.put(request, response);
        }
      } catch (_) {
        // A missing optional shell asset must not prevent installation.
      }
    }));

    // Same VERSION: activate quietly. Different VERSION: wait for the user's prompt.
    if (!updateRequired) await self.skipWaiting();
    else {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "VIC_SOUND_UPDATE_AVAILABLE", version: VERSION });
      }
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      if (name.startsWith(SHELL_CACHE_PREFIX) && name !== SHELL_CACHE) return caches.delete(name);
      return Promise.resolve(false);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const message = event.data || {};
  if (message.type === "CHECK_UPDATE_STATUS") {
    event.waitUntil((async () => {
      // Re-check persistent cache names because a waiting worker may be restarted.
      const names = await caches.keys();
      updateRequired = names.some(name => name.startsWith(SHELL_CACHE_PREFIX) && name !== SHELL_CACHE);
      const reply = { type: "VIC_SOUND_UPDATE_STATUS", version: VERSION, updateRequired };
      if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
      else event.source?.postMessage(reply);
    })());
  }
  if (message.type === "SKIP_WAITING" && updateRequired) self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Keep API calls and audio/media downloads network-driven; only cache app shell files.
  const isShellFile = APP_SHELL.some(path => new URL(path, self.location.href).pathname === url.pathname);
  if (!isShellFile) return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Network-first means app.js/style.css changes arrive on the next online reload,
    // even when VERSION stays the same. The version number controls the prompt only.
    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === "navigate") {
        const fallback = await cache.match("./index.html");
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});

// This displays notifications sent by a configured server-side Web Push service.
// Permission alone is not enough; the app must also create/store a PushSubscription.
self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch (_) { payload = { body: event.data ? event.data.text() : "A new release is available." }; }
  const title = payload.title || "Vic-sound";
  const options = {
    body: payload.body || "New music has been added.",
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: payload.tag || "vic-sound-release",
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || "./?screen=latest" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./?screen=latest", self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
        
