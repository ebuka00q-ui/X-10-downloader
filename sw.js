/* =========================================================
   VIC-SOUND LISTENER — SERVICE WORKER
   Version: v8
   ========================================================= */

'use strict';

const SHELL_VERSION = 'v8';
const SHELL_CACHE = `vic-sound-shell-${SHELL_VERSION}`;
const SHELL_PREFIX = 'vic-sound-shell-';
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
    if (!('indexedDB' in self)) { reject(new Error('IndexedDB is unavailable.')); return; }
    const request = indexedDB.open(PREF_DB, 1);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(PREF_STORE)) { db.createObjectStore(PREF_STORE); } };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readNotificationPreference() {
  let db;
  try {
    db = await openPreferencesDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PREF_STORE, 'readonly');
      const request = tx.objectStore(PREF_STORE).get(NOTIFICATION_SETTING);
      request.onsuccess = () => resolve(request.result === true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) { return false; } finally { db?.close(); }
}

async function writeNotificationPreference(enabled) {
  const db = await openPreferencesDB();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PREF_STORE, 'readwrite');
      tx.objectStore(PREF_STORE).put(enabled === true, NOTIFICATION_SETTING);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

/* INSTALL */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_FILES);
  })());
});

/* ACTIVATE */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) { client.postMessage({ type: 'VIC_SOUND_WORKER_ACTIVATED', version: SHELL_VERSION }); }
  })());
});

/* FETCH */
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match('./index.html');
        if (cached) return cached;
        return new Response('Vic-sound app shell is not available offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  const isShellAsset = APP_FILES.some(path => new URL(path, self.registration.scope).href === url.href);
  if (isShellAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      return fetch(request);
    })());
  }
});

/* PUSH */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    if (!(await readNotificationPreference())) return;
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (error) { payload = { body: event.data ? event.data.text() : 'New music is available.' }; }
    
    const kind = payload.kind === 'home' ? 'home' : 'latest';
    const title = String(payload.title || (kind === 'home' ? 'New music added to Vic-sound' : 'New release on Vic-sound'));
    const body = String(payload.body || (kind === 'home' ? 'New music is ready in Home.' : 'A new release is waiting in Latest.'));
    const target = kind === 'home' ? './?screen=home' : './?screen=latest';
    const itemId = String(payload.musicId || payload.releaseId || payload.id || kind);

    await self.registration.showNotification(title, {
      body, icon: './file_000000008d2881f49ddcc5378e7331fa.png', badge: './file_000000008d2881f49ddcc5378e7331fa.png',
      tag: `vic-sound-${kind}-${itemId}`, renotify: false, data: { url: target, kind, itemId }
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
        client.postMessage({ type: data.kind === 'home' ? 'VIC_SOUND_OPEN_HOME' : 'VIC_SOUND_OPEN_LATEST', itemId: data.itemId || null });
        if ('navigate' in client) await client.navigate(targetURL);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetURL);
  })());
});

/* MESSAGES */
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (data.type === 'SET_RELEASE_NOTIFICATIONS') { event.waitUntil(writeNotificationPreference(data.enabled === true)); return; }
});
