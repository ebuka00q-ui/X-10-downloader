/* VIC-SOUND LISTENER SERVICE WORKER — deliberate shell release v11 */
'use strict';
const SHELL_VERSION = 'v11';
const SHELL_CACHE = `vic-sound-shell-${SHELL_VERSION}`;
const SHELL_PREFIX = 'vic-sound-shell-';
const APP_FILES = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './vinyl.svg'];
const PREF_DB = 'vic-sound-sw-preferences';
const PREF_STORE = 'settings';
const NOTIFICATION_SETTING = 'releaseNotificationsEnabled';
function openPreferencesDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(PREF_DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(PREF_STORE)) request.result.createObjectStore(PREF_STORE); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function readNotificationPreference() {
  let db; try { db = await openPreferencesDB(); return await new Promise((resolve, reject) => { const tx = db.transaction(PREF_STORE, 'readonly'); const req = tx.objectStore(PREF_STORE).get(NOTIFICATION_SETTING); req.onsuccess = () => resolve(req.result === true); req.onerror = () => reject(req.error); }); } catch { return false; } finally { db?.close(); }
}
async function writeNotificationPreference(enabled) {
  const db = await openPreferencesDB(); try { await new Promise((resolve, reject) => { const tx = db.transaction(PREF_STORE, 'readwrite'); tx.objectStore(PREF_STORE).put(enabled === true, NOTIFICATION_SETTING); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
self.addEventListener('install', event => event.waitUntil((async () => { const cache = await caches.open(SHELL_CACHE); await cache.addAll(APP_FILES); })()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  // Delete only obsolete Vic-sound shell caches. Audio, TST, IndexedDB and user data are untouched.
  await Promise.all(names.filter(name => name.startsWith(SHELL_PREFIX) && name !== SHELL_CACHE).map(name => caches.delete(name)));
  await self.clients.claim();
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) client.postMessage({ type: 'VIC_SOUND_WORKER_ACTIVATED', version: SHELL_VERSION });
})()));
self.addEventListener('fetch', event => {
  const request = event.request; if (request.method !== 'GET') return;
  const url = new URL(request.url); if (url.origin !== self.location.origin) return;
  const shellURLs = APP_FILES.map(path => new URL(path, self.registration.scope).href);
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE); const cached = await cache.match('./index.html');
      if (cached) return cached;
      try { return await fetch(request); } catch { return new Response('Vic-sound is not available offline yet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })()); return;
  }
  if (shellURLs.includes(url.href)) {
    event.respondWith((async () => { const cache = await caches.open(SHELL_CACHE); const cached = await cache.match(request); if (cached) return cached; return fetch(request); })());
  }
});
self.addEventListener('push', event => event.waitUntil((async () => {
  if (!(await readNotificationPreference())) return;
  let payload = {}; try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || 'New music is available.' }; }
  const kind = payload.kind === 'home' ? 'home' : 'latest'; const title = String(payload.title || (kind === 'home' ? 'New music added to Vic-sound' : 'New release on Vic-sound'));
  const body = String(payload.body || (kind === 'home' ? 'New music is ready in Home.' : 'A new release is waiting in Latest.'));
  const target = kind === 'home' ? './?screen=home' : './?screen=latest'; const itemId = String(payload.musicId || payload.releaseId || payload.id || kind);
  await self.registration.showNotification(title, { body, icon: './icon.svg', badge: './icon.svg', tag: `vic-sound-${kind}-${itemId}`, renotify: false, data: { url: target, kind, itemId } });
})()));
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil((async () => {
  const data = event.notification.data || {}; const target = new URL(data.url || './?screen=latest', self.registration.scope).href;
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) { if ('focus' in client) { await client.focus(); if ('navigate' in client) await client.navigate(target); return; } }
  if (self.clients.openWindow) await self.clients.openWindow(target);
})()); });
self.addEventListener('message', event => { const data = event.data || {}; if (data.type === 'SKIP_WAITING') self.skipWaiting(); if (data.type === 'SET_RELEASE_NOTIFICATIONS') event.waitUntil(writeNotificationPreference(data.enabled === true)); });
  
