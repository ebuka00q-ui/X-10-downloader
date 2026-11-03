/* ========================================================= VIC-SOUND
LISTENER — SERVICE WORKER Versioned app shell; preserves music and
user-data caches.
========================================================= */

“use strict”;

const SHELL_CACHE = “vic-sound-shell-v3”; const SHELL_PREFIX =
“vic-sound-shell-”; const APP_FILES = [ “./”, “./index.html”,
“./style.css”, “./app.js”, “./manifest.json”];

const PREF_DB = “vic-sound-sw-preferences”; const PREF_STORE =
“settings”; const NOTIFICATION_SETTING = “releaseNotificationsEnabled”;

/* ———- Small IndexedDB preference store ———- */

function openPreferencesDB() { return new Promise((resolve, reject) => {
if (!(“indexedDB” in self)) { reject(new Error(“IndexedDB is
unavailable.”)); return; }

    const request = indexedDB.open(PREF_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PREF_STORE)) {
        db.createObjectStore(PREF_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

}); }

async function readNotificationPreference() { let db; try { db = await
openPreferencesDB(); return await new Promise((resolve, reject) => {
const tx = db.transaction(PREF_STORE, “readonly”); const request =
tx.objectStore(PREF_STORE).get(NOTIFICATION_SETTING); request.onsuccess
= () => resolve(request.result === true); request.onerror = () =>
reject(request.error); }); } catch { // Fail closed: never display a
push notification without opt-in. return false; } finally { db?.close();
} }

async function writeNotificationPreference(enabled) { const db = await
openPreferencesDB(); try { await new Promise((resolve, reject) => {
const tx = db.transaction(PREF_STORE, “readwrite”);
tx.objectStore(PREF_STORE).put(enabled === true, NOTIFICATION_SETTING);
tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort
= () => reject(tx.error); }); } finally { db.close(); } }

/* ———- Install / activate ———- */

self.addEventListener(“install”, event => { event.waitUntil(
caches.open(SHELL_CACHE).then(cache => cache.addAll(APP_FILES)) );

// Activate the new shell version without deleting music caches.
self.skipWaiting(); });

self.addEventListener(“activate”, event => { event.waitUntil((async ()
=> { const names = await caches.keys();

    // Delete only old Vic-sound app-shell caches.
    // Never delete music, test music, or other app data caches.
    await Promise.all(
      names
        .filter(name => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();

})()); });

/* ———- Fetch strategy ———- */

self.addEventListener(“fetch”, event => { const request = event.request;

if (request.method !== “GET”) return;

const url = new URL(request.url);

// Do not intercept third-party media, analytics, or API requests. if
(url.origin !== self.location.origin) return;

// Navigation: try the network first so a new app version can load. //
Use the cached app page only when the device is offline. if
(request.mode === “navigate”) { event.respondWith((async () => { try {
const response = await fetch(request); if (response && response.ok) {
const cache = await caches.open(SHELL_CACHE); await
cache.put(“./index.html”, response.clone()); } return response; } catch
{ return (await caches.match(“./index.html”)) || new Response(“Vic-sound
is unavailable offline.”, { status: 503, headers: { “Content-Type”:
“text/plain; charset=utf-8” } }); } })()); return; }

// App-shell assets: use the versioned cache, then network. const
isShellAsset = APP_FILES.some(path => { const assetURL = new URL(path,
self.registration.scope); return assetURL.href === url.href; });

if (isShellAsset) { event.respondWith((async () => { const cache = await
caches.open(SHELL_CACHE); const cached = await cache.match(request); if
(cached) return cached;

      const response = await fetch(request);
      if (response && response.ok && response.type !== "opaque") {
        await cache.put(request, response.clone());
      }
      return response;
    })());

}

// All other same-origin requests are left to the browser/network. // In
particular, this worker does not replace audio/API errors with HTML. });

/* ———- Push notifications ———- */

self.addEventListener(“push”, event => { event.waitUntil((async () => {
// The preference defaults to OFF. The app must explicitly store //
opt-in before the worker is allowed to show release notifications. if
(!(await readNotificationPreference())) return;

    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = {
        title: "New music on Vic-sound",
        body: event.data ? event.data.text() : "A new release is available."
      };
    }

    const title = String(payload.title || "New music on Vic-sound");
    const releaseId = String(payload.releaseId || payload.id || "latest");
    const options = {
      body: String(payload.body || "A new release is available in Latest."),
      icon: "./file_000000008d2881f49ddcc5378e7331fa.png",
      badge: "./file_000000008d2881f49ddcc5378e7331fa.png",
      tag: `vic-sound-release-${releaseId}`,
      renotify: false,
      data: {
        url: "./",
        releaseId
      }
    };

    // A stable tag replaces an existing notification for this release
    // instead of stacking duplicate copies.
    await self.registration.showNotification(title, options);

})()); });

self.addEventListener(“notificationclick”, event => {
event.notification.close();

event.waitUntil((async () => { const targetURL = new URL(“./”,
self.registration.scope).href; const windows = await
self.clients.matchAll({ type: “window”, includeUncontrolled: true });

    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        client.postMessage({
          type: "VIC_SOUND_OPEN_LATEST",
          releaseId: event.notification.data?.releaseId || null
        });
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetURL);
    }

})()); });

/* ———- Messages from the Listener app ———- */

self.addEventListener(“message”, event => { const data = event.data ||
{};

if (data.type === “SKIP_WAITING”) { self.skipWaiting(); return; }

if (data.type === “SET_RELEASE_NOTIFICATIONS”) { const enabled =
data.enabled === true;
event.waitUntil(writeNotificationPreference(enabled)); return; }

if (data.type === “CLEAR_OLD_SHELL_CACHES”) { event.waitUntil((async ()
=> { const names = await caches.keys(); await Promise.all( names
.filter(name => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)
.map(name => caches.delete(name)) ); })()); } });
  
