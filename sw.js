/* =========================================================
   VIC-SOUND LISTENER — SERVICE WORKER
   Release version: v8

   IMPORTANT RELEASE RULE:
   Increase RELEASE_VERSION whenever you intentionally publish
   changed app-shell files (index.html, style.css, app.js,
   manifest.json, or another file added to APP_FILES).

   The versioned shell cache is replaced as one unit. Music,
   downloads, IndexedDB, favourites and collections are stored
   separately and are NEVER deleted by this service worker.
   ========================================================= */
'use strict';

const RELEASE_VERSION = 'v9'; // BUMP THIS to publish an app update.
const SHELL_PREFIX = 'vic-sound-shell-';
const SHELL_CACHE = `${SHELL_PREFIX}${RELEASE_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

const PREF_DB = 'vic-sound-sw-preferences';
const PREF_STORE = 'settings';
const NOTIFICATION_SETTING = 'releaseNotificationsEnabled';

function openPreferencesDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(PREF_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PREF_STORE)) request.result.createObjectStore(PREF_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readNotificationPreference() {
  let db;
  try {
    db = await openPreferencesDB();
    return await new Promise(resolve => {
      const tx = db.transaction(PREF_STORE, 'readonly');
      const request = tx.objectStore(PREF_STORE).get(NOTIFICATION_SETTING);
      request.onsuccess = () => resolve(request.result === true);
      request.onerror = () => resolve(false);
    });
  } catch { return false; }
  finally { db?.close(); }
}

async function writeNotificationPreference(enabled) {
  const db = await openPreferencesDB();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PREF_STORE, 'readwrite');
      tx.objectStore(PREF_STORE).put(enabled === true, NOTIFICATION_SETTING);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Install the complete, versioned shell. A failed download aborts
    // installation so the currently working app remains active.
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_FILES);
    // Deliberately wait for the Listener's mandatory Update prompt.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Only versioned application-shell caches are eligible for deletion.
    // In particular, do not delete vic-sound-music-v*, vic-sound-tst*,
    // audio caches, or any IndexedDB database/object store.
    await Promise.all(names
      .filter(name => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      client.postMessage({ type: 'VIC_SOUND_WORKER_ACTIVATED', version: RELEASE_VERSION });
    }
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isShellAsset = APP_FILES.some(path => new URL(path, self.registration.scope).href === url.href);
  if (!isShellAsset && request.mode !== 'navigate') return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Cache-first is intentional here: app files changed without a
    // RELEASE_VERSION bump must not silently reach installed users.
    const cacheKey = request.mode === 'navigate' ? new URL('./index.html', self.registration.scope).href : request;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    // This is primarily a first-install/recovery fallback. Normal updates
    // arrive through a new worker version and a freshly populated shell cache.
    try {
      const response = await fetch(request);
      if (response && response.ok) await cache.put(cacheKey, response.clone());
      return response;
    } catch {
      return new Response('Vic-sound is unavailable offline. Please reconnect and try again.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    if (!(await readNotificationPreference())) return;
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; }
    catch { payload = { body: event.data ? event.data.text() : 'New music is available.' }; }
    const kind = payload.kind === 'home' ? 'home' : 'latest';
    const title = String(payload.title || (kind === 'home' ? 'New music added to Vic-sound' : 'New release on Vic-sound'));
    const body = String(payload.body || (kind === 'home' ? 'New music is ready in Home.' : 'A new release is waiting in Latest.'));
    const target = kind === 'home' ? './?screen=home' : './?screen=latest';
    const itemId = String(payload.musicId || payload.releaseId || payload.id || kind);
    await self.registration.showNotification(title, {
      body,
      icon: './file_000000008d2881f49ddcc5378e7331fa.png',
      badge: './file_000000008d2881f49ddcc5378e7331fa.png',
      tag: `vic-sound-${kind}-${itemId}`,
      renotify: false,
      data: { url: target, kind, itemId }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const data = event.notification.data || {};
    const targetURL = new URL(data.url || './?screen=latest', self.registration.scope).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(targetURL);
        client.postMessage({ type: data.kind === 'home' ? 'VIC_SOUND_OPEN_HOME' : 'VIC_SOUND_OPEN_LATEST', itemId: data.itemId || null });
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetURL);
  })());
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (data.type === 'SET_RELEASE_NOTIFICATIONS') {
    event.waitUntil(writeNotificationPreference(data.enabled === true));
  }
});
   
