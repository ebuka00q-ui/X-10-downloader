/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   ========================================================= */

/* =========================================================
   0. CONFIGURATION, KEYS & MONETIZATION (TOP LEVEL)
   ========================================================= */
const VIC_CONFIG = Object.freeze({
  // 1. BACKEND CONNECTIONS (PUT KEYS HERE)
  SUPABASE: {
    url: "https://gkfivuvtpfetzatzhnaq.supabase.co",
    publishableKey: "PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY", 
    songsTable: "songs",
    releasesTable: "releases"
  },
  SERVICES: {
    baseUrl: "", 
    catalogue: "/listener/catalogue",
    releases: "/listener/releases",
    djProfile: "/listener/dj-profile",
    djChat: "/listener/dj/chat",
    downloadPermission: "/listener/download-permission",
    monetization: "/listener/monetization-config"
  },
  MEDIA: { publicDeliveryBaseUrl: "" },

  // 2. MONETIZATION & ADS SETTINGS
  MONETIZATION: { 
    enabled: false, 
    provider: "none", 
    placement: "bottom", 
    format: "banner", 
    refreshSeconds: 0, 
    bannerHeight: 0, 
    maxWidth: "100%", 
    gap: 0, 
    borderRadius: 0 
  },

  // 3. DJ SETTINGS
  DJ: { 
    fallbackName: "Vic-sound DJ", 
    fallbackSubtitle: "Your personal music companion", 
    fallbackCover: "", 
    autoSuggestionEvery: 10, 
    repeatNoticeThreshold: 5, 
    historyLimit: 100 
  },

  // 4. STORAGE & DOWNLOAD CONSTANTS
  STORAGE: {
    musicCache: "vic-sound-music-v2", state: "vic-sound-listener-state-v2",
    songs: "vic-sound-songs-v2", releases: "vic-sound-releases-v2",
    favorites: "vic-sound-favorites-v2", collections: "vic-sound-collections-v2",
    history: "vic-sound-listening-history-v2", anonymousId: "vic-sound-anonymous-id-v2",
    notifications: "vic-sound-notifications-v2"
  },
  DOWNLOAD_WORKERS_HOME: 5,
  DOWNLOAD_WORKERS_LATEST: 3,
  REQUEST_TIMEOUT: 12000
});

/* =========================================================
   1. TEMPORARY TEST PACKAGE (TST) - REMOVABLE
   ========================================================= */
const VIC_TEST_CONFIG = Object.freeze({
  enabled: true,
  queryFlag: "test",
  queryValue: "1",
  cacheName: "vic-sound-tst-audio-v1"
});

const VIC_TEST_MODE = VIC_TEST_CONFIG.enabled &&
  new URLSearchParams(location.search).get(VIC_TEST_CONFIG.queryFlag) !== "0";

const VIC_TEST_COVERS = {
  one: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#020807"/><stop offset="1" stop-color="#0b4937"/></linearGradient></defs><rect width="700" height="700" fill="url(#g)"/><circle cx="350" cy="350" r="205" fill="none" stroke="#00f5a0" stroke-width="8" opacity=".7"/><path d="M110 350h65l35-90 55 180 55-145 55 110 50-90 45 35h85" fill="none" stroke="#00f5a0" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><text x="350" y="610" fill="#f3fffb" font-size="42" text-anchor="middle" font-family="Arial">TST 01</text></svg>'),
  two: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80",
  ep: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#020807"/><stop offset="1" stop-color="#07533d"/></linearGradient></defs><rect width="700" height="700" fill="url(#g)"/><circle cx="350" cy="310" r="205" fill="none" stroke="#00f5a0" stroke-width="10"/><path d="M140 310h70l45-110 65 220 70-170 65 130 45-70h80" fill="none" stroke="#00f5a0" stroke-width="18" stroke-linecap="round"/><text x="350" y="590" fill="#f3fffb" font-size="64" text-anchor="middle" font-family="Arial">TEST EP</text></svg>')
};

const TEST_LYRICS_TEXT = `Dear Mr Williams, I am sorry to say
That i have just read your letter over tea, here in the UK
And it troubles me greatly to see that you claim
That i endorse your view
Though you do not know my name
Or in fact where i live, how i think, feel or care
You see i am a Songwriter
And i live well, everywhere.

Did we meet at the Smithsons wedding in May ?
If we did my apologies, for it’s so long it’s hard to say
I do appreciate your efforts, to speak on my behalf
But the assumptions you make
Well in all honesty made me laugh.

You see as child on one Christmas day i was given a guitar
No unions, or subscriptions to pay
I was free just to sit and make all kinds of noise
No authorisation needed to play with my toys.

But then when older A & R said :
Ya can’t sing or play mate
And yar not right for us
It’s kinda alright
But we don’ ear a chorus
So ere’s a small deal and we own wha’ you write
And we’ll takes ours an’ more before yours mate
I’m sure that salright !

So then producers and studios got fat on the pot
And i got the bill and that was all that i got.

But i still have my music and that’s a god given thing
Free to anyone who wants to just play and sing
And i’m free to express and share what i please
Without you or your contracts
Or your boxes and fees.

So Mr Williams I am sure you are honorable in most every way
Although i remind you the world is the world , and is not the USA
Because to that god owns the copyright
And it is he only and not you who can say
When and if the music will dry up
For all of us one day.`;

const TEST_LYRICS_TIMED = TEST_LYRICS_TEXT.split('\n\n').map((chunk, i) => ({
  time: i * 12,
  text: chunk,
  type: i % 2 === 0 ? "main" : "spoken"
}));

const VIC_TEST_SONGS = Object.freeze([
  { id: "vic-tst-1", title: "TST 01 — Sound Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: VIC_TEST_COVERS.one, cat: ["Pop", "Test"], mood: ["Calm", "Test"], duration: 180, isTestTrack: true, track_number: 1, release_id: "vic-tst-ep" },
  { id: "vic-tst-2", title: "TST 02 — Shuffle Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", cover: VIC_TEST_COVERS.two, cat: ["Afrobeats", "Test"], mood: ["Party", "Test"], duration: 150, isTestTrack: true, track_number: 2, release_id: "vic-tst-ep" },
  { id: "vic-tst-3", title: "TST 03 — Bass Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: VIC_TEST_COVERS.one, cat: ["Rap", "Test"], mood: ["Bass", "Test"], duration: 190, isTestTrack: true, track_number: 3, release_id: "vic-tst-ep" },
  { id: "vic-tst-4", title: "TST 04 — Rhythm Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: VIC_TEST_COVERS.two, cat: ["Hip-Hop", "Test"], mood: ["Rhythm", "Test"], duration: 200, isTestTrack: true, track_number: 4, release_id: "vic-tst-ep" },
  { id: "vic-tst-5", title: "TST 05 — Final Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", cover: VIC_TEST_COVERS.one, cat: ["Trap", "Test"], mood: ["Final", "Test"], duration: 170, isTestTrack: true, track_number: 5, release_id: "vic-tst-ep" },
  { 
    id: "vic-tst-williams", 
    title: "Dear Mr Williams", 
    artist: "Loveshadow", 
    album: "Spoken Word", 
    audio: "https://cdn.muxiv.com/cmv0kwd08009e3ysptd08chu4/96.ogg", 
    cover: "https://ccmixter.org/content/Loveshadow/ezgif-82cedba8bd1cbef693x94.gif", 
    cat: ["Spoken Word", "Test"], 
    mood: ["Calm", "Test"], 
    duration: 141, 
    isTestTrack: true, 
    lyrics: TEST_LYRICS_TEXT, 
    lyrics_timed: TEST_LYRICS_TIMED,
    track_number: 1,
    release_id: "vic-tst-williams-ep"
  }
]);

const VIC_TEST_RELEASE_ID = "vic-tst-ep-five";
const VIC_TEST_RELEASE = {
  id: VIC_TEST_RELEASE_ID, title: "Vic-sound Test EP", type: "EP",
  release_date: "Testing", cover_url: VIC_TEST_COVERS.ep,
  tracks: VIC_TEST_SONGS.slice(0, 5).map(s => s.id), isTestRelease: true
};

const VIC_TEST_RELEASE_WILLIAMS_ID = "vic-tst-williams-ep";
const VIC_TEST_RELEASE_WILLIAMS = {
  id: VIC_TEST_RELEASE_WILLIAMS_ID, title: "Dear Mr Williams", type: "Single",
  release_date: "Testing", cover_url: VIC_TEST_SONGS[5].cover,
  tracks: [VIC_TEST_SONGS[5].id], isTestRelease: true
};

/* =========================================================
   2. APP STATE
   ========================================================= */
const state = {
  screen: "home", category: "All", query: "", songs: [], releases: [], currentId: null, playing: false,
  queue: [], queueIndex: 0, queueSource: { type: "catalogue", label: "Your Music" },
  shuffle: false, 
  repeatMode: 1, // DEFAULT: REPEAT ALL
  collections: [], favorites: new Set(),
  player: false, queueOpen: false, djOpen: false, lyricsOpen: false,
  timerMode: "end", timerId: null, notifications: false, newRelease: false,
  downloaded: new Set(), downloadBusy: false, anonymousId: null,
  backendConnected: false, backendError: null, monetization: { ...VIC_CONFIG.MONETIZATION }, monetizationReady: false,
  djProfile: { name: VIC_CONFIG.DJ.fallbackName, subtitle: VIC_CONFIG.DJ.fallbackSubtitle, cover: VIC_CONFIG.DJ.fallbackCover },
  djOnline: false, djBusy: false, djCompletedSinceSuggestion: 0, djLastSuggestedId: null,
  djHistory: [], skippedSongs: {}, playedSongs: {}, lastAutoDJMessageAt: 0,
  currentCollection: null, modalOpen: false,
  activeDownloads: new Map(),
  downloadQueue: [],
  isDownloading: false,
  interactiveAdCounter: 0,
  pendingInteractiveAd: false
};

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open("vic-download-db", 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("downloads")) db.createObjectStore("downloads", { keyPath: "id" });
    if (!db.objectStoreNames.contains("chunks")) db.createObjectStore("chunks", { keyPath: ["songId", "index"] });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

/* =========================================================
   3. DOM HELPERS & UI UPDATES
   ========================================================= */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const audio = $("#audio");
const safe = value => String(value ?? "");
const songKey = id => String(id);

function escapeHTML(value) { return safe(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function formatTime(seconds) { const n = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`; }
function makeId() { return globalThis.crypto?.randomUUID?.() || `vic-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function getCurrentSong() { return state.songs.find(song => songKey(song.id) === songKey(state.currentId)) || null; }
function byId(id) { return document.getElementById(id); }

function notify(message) {
  let toast = byId("vicMessage");
  if (!toast) {
    toast = document.createElement("div"); toast.id = "vicMessage"; toast.className = "vic-toast";
    toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); document.body.appendChild(toast);
  }
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toast._hideTimer); toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setupServiceWorkerUpdate() {
  let banner = byId("vicUpdateBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "vicUpdateBanner";
    banner.textContent = "Update Available - Tap to Reload";
    banner.addEventListener("click", () => window.location.reload());
    document.body.appendChild(banner);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            banner.style.display = "block";
          }
        });
      });
    });
    
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "VIC_SOUND_OPEN_LATEST") go("latest");
      else if (event.data && event.data.type === "VIC_SOUND_OPEN_HOME") go("home");
    });
  }
}

function ensureModal() {
  let modal = byId("vicNativeModal");
  if (modal) return modal;
  modal = document.createElement("section"); modal.id = "vicNativeModal"; modal.className = "modal hidden"; modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `<div class="confirm" role="dialog" aria-modal="true"></div>`;
  document.querySelector(".app-shell")?.appendChild(modal);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  return modal;
}

function openModal({ title, body = "", buttons = [], onOpen = null }) {
  const modal = ensureModal(); const panel = $(".confirm", modal);
  panel.innerHTML = `<h2>${escapeHTML(title)}</h2><div class="vic-modal-body">${body}</div><div class="vic-modal-actions">${buttons.map((button, index) => `<button type="button" data-modal-action="${index}" class="${button.danger ? "danger" : ""}">${escapeHTML(button.label)}</button>`).join("")}</div>`;
  modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false"); state.modalOpen = true;
  buttons.forEach((button, index) => {
    $(`[data-modal-action="${index}"]`, panel)?.addEventListener("click", () => {
      if (button.keepOpen !== true) closeModal();
      if (button.action) button.action();
    });
  });
  onOpen?.(panel); $("input:not([type=checkbox]), textarea", panel)?.focus(); return panel;
}

function closeModal() {
  const modal = byId("vicNativeModal"); if (!modal) return;
  modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); state.modalOpen = false;
}

function askText(title, label, initialValue, onDone) {
  openModal({
    title, body: `<label class="vic-field"><span>${escapeHTML(label)}</span><input id="vicModalText" type="text" maxlength="50" value="${escapeHTML(initialValue || "")}" placeholder="Enter a name"></label>`,
    buttons: [{ label: "Cancel" }, { label: "Save", action: () => { const value = $("#vicModalText")?.value.trim(); if (!value) { notify("Please enter a name."); return; } onDone(value); } }]
  });
}

/* =========================================================
   4. LOCAL STORAGE
   ========================================================= */
function readJSON(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; } }
function getAnonymousId() {
  let id = ""; try { id = localStorage.getItem(VIC_CONFIG.STORAGE.anonymousId) || ""; if (!id) { id = makeId(); localStorage.setItem(VIC_CONFIG.STORAGE.anonymousId, id); } } catch { id = makeId(); }
  state.anonymousId = id; return id;
}

function loadLocalData() {
  state.songs = readJSON(VIC_CONFIG.STORAGE.songs, []).map(normaliseSong);
  state.releases = readJSON(VIC_CONFIG.STORAGE.releases, []);
  state.collections = readJSON(VIC_CONFIG.STORAGE.collections, []).filter(item => item && Array.isArray(item.songs)).map(item => ({ id: safe(item.id || makeId()), name: safe(item.name || "My Collection"), songs: [...new Set(item.songs.map(songKey))] }));
  state.favorites = new Set(readJSON(VIC_CONFIG.STORAGE.favorites, []).map(songKey));
  const history = readJSON(VIC_CONFIG.STORAGE.history, {});
  state.djHistory = Array.isArray(history.history) ? history.history : [];
  state.skippedSongs = history.skipped || {}; state.playedSongs = history.played || {};
  state.notifications = localStorage.getItem(VIC_CONFIG.STORAGE.notifications) === "true";
  if (byId("notificationSwitch")) byId("notificationSwitch").checked = state.notifications;
}

function saveLocalData() {
  writeJSON(VIC_CONFIG.STORAGE.songs, state.songs.filter(song => !song.isTestTrack));
  writeJSON(VIC_CONFIG.STORAGE.releases, state.releases);
  writeJSON(VIC_CONFIG.STORAGE.collections, state.collections);
  writeJSON(VIC_CONFIG.STORAGE.favorites, [...state.favorites]);
  writeJSON(VIC_CONFIG.STORAGE.history, { history: state.djHistory.slice(-VIC_CONFIG.DJ.historyLimit), skipped: state.skippedSongs, played: state.playedSongs });
}

/* =========================================================
   5. SUPABASE & BACKEND
   ========================================================= */
let supabaseClient = null;
function loadSupabaseLibrary() { return new Promise((resolve, reject) => { if (window.supabase?.createClient) return resolve(window.supabase); const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"; script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error("Supabase library did not load.")); script.onerror = () => reject(new Error("Could not load Supabase library.")); document.head.appendChild(script); }); }

async function connectBackend() {
  const { url, publishableKey } = VIC_CONFIG.SUPABASE;
  if (!publishableKey || publishableKey.includes("PASTE_")) { state.backendConnected = false; return false; }
  try {
    const library = await loadSupabaseLibrary();
    supabaseClient = library.createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.songsTable).select("id").limit(1);
    if (error) throw error;
    state.backendConnected = true; state.backendError = null; return true;
  } catch (error) { state.backendConnected = false; state.backendError = error.message; return false; }
}

function resolveMediaURL(value) { const raw = safe(value).trim(); if (!raw) return ""; if (/^(https?:|data:|blob:)/i.test(raw)) return raw; const base = VIC_CONFIG.MEDIA.publicDeliveryBaseUrl.replace(/\/$/, ""); return base ? `${base}/${raw.replace(/^\/+/, "")}` : raw; }

function normaliseSong(row = {}) {
  const genres = Array.isArray(row.genre) ? row.genre : safe(row.genre || row.cat).split(",").map(x => x.trim()).filter(Boolean);
  const moods = Array.isArray(row.mood) ? row.mood : safe(row.mood).split(",").map(x => x.trim()).filter(Boolean);
  return { 
    id: row.id ?? makeId(), title: safe(row.title || "Untitled"), artist: safe(row.artist || "Unknown artist"), 
    album: safe(row.album), audio: resolveMediaURL(row.audio_url || row.audio || row.music_url), 
    cover: resolveMediaURL(row.cover_url || row.cover), duration: Number(row.duration || 0), 
    cat: genres, mood: moods, lyrics: safe(row.lyrics), lyrics_timed: row.lyrics_timed || null, 
    release_date: safe(row.release_date), release_id: row.release_id || null, 
    track_number: Number(row.track_number || 0), 
    published: row.published ?? true, isTestTrack: Boolean(row.isTestTrack || row.is_test_track) 
  };
}

function applyTestMusic() {
  if (!VIC_TEST_MODE) return state.songs;
  const realSongs = state.songs.filter(song => !song.isTestTrack);
  const ids = new Set(realSongs.map(songKey));
  const tests = VIC_TEST_SONGS.map(normaliseSong).filter(song => !ids.has(songKey(song.id)));
  state.songs = [...tests, ...realSongs]; return state.songs;
}

async function loadSongs() {
  if (VIC_CONFIG.SERVICES.baseUrl) { try { const result = await serviceRequest(VIC_CONFIG.SERVICES.catalogue); state.songs = (result?.songs || result || []).map(normaliseSong); applyTestMusic(); saveLocalData(); renderHome(); return state.songs; } catch (error) {} }
  if (state.backendConnected && supabaseClient) { try { const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.songsTable).select("*").eq("published", true).order("created_at", { ascending: false }); if (error) throw error; state.songs = (data || []).map(normaliseSong); applyTestMusic(); saveLocalData(); renderHome(); return state.songs; } catch (error) {} }
  applyTestMusic(); renderHome(); return state.songs;
}

async function loadReleases() {
  if (VIC_CONFIG.SERVICES.baseUrl) { 
    try { 
      const result = await serviceRequest(VIC_CONFIG.SERVICES.releases); 
      const oldCount = state.releases.length;
      state.releases = result?.releases || result || []; 
      saveLocalData(); 
      if (state.releases.length > oldCount) state.newRelease = true;
      renderLatest(); updateDots(); return state.releases; 
    } catch (error) {} 
  }
  if (state.backendConnected && supabaseClient) { 
    try { 
      const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.releasesTable).select("*").eq("published", true).order("created_at", { ascending: false }); 
      if (error) throw error; 
      const oldCount = state.releases.length;
      state.releases = data || []; 
      saveLocalData();
      if (state.releases.length > oldCount) state.newRelease = true;
    } catch (error) {} 
  }
  renderLatest(); updateDots(); return state.releases;
}

/* =========================================================
   6. UNIFIED DOWNLOAD ENGINE (IndexedDB + Cache API)
   ========================================================= */
async function getMusicCache(song = null) { if (!("caches" in window)) return null; const cacheName = song?.isTestTrack ? VIC_TEST_CONFIG.cacheName : VIC_CONFIG.STORAGE.musicCache; return caches.open(cacheName); }
function formatDataSize(bytes) { const value = Math.max(0, Number(bytes) || 0); if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`; if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`; return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`; }

async function downloadTrackStream(song, onProgress) {
  const cache = await getMusicCache(song);
  const url = new URL(song.audio, location.href).href;
  if (await cache.match(url)) return true;

  const db = await dbPromise;
  let downloadState = await new Promise(res => {
    const tx = db.transaction("downloads", "readonly"); const req = tx.objectStore("downloads").get(song.id); req.onsuccess = () => res(req.result || null); req.onerror = () => res(null);
  });

  let startByte = downloadState ? downloadState.bytes : 0;
  let totalBytes = downloadState ? downloadState.totalBytes : 0;
  let chunks = [];

  if (startByte > 0) {
    chunks = await new Promise(res => {
      const tx = db.transaction("chunks", "readonly"); const req = tx.objectStore("chunks").getAll(IDBKeyRange.bound([song.id, 0], [song.id, Infinity]));
      req.onsuccess = () => res(req.result.map(c => c.data));
      req.onerror = () => res([]);
    });
  }

  const headers = {};
  if (startByte > 0) headers["Range"] = `bytes=${startByte}-`;

  try {
    const response = await fetch(url, { headers });
    if (!response.ok && response.status !== 206) throw new Error("Network error");
    
    if (startByte > 0 && response.status === 200) {
      startByte = 0; chunks = [];
      await new Promise(res => { const tx = db.transaction(["downloads", "chunks"], "readwrite"); tx.objectStore("downloads").delete(song.id); tx.objectStore("chunks").delete(IDBKeyRange.bound([song.id, 0], [song.id, Infinity])); tx.oncomplete = res; });
    }

    if (!totalBytes) {
      const contentRange = response.headers.get("content-range");
      if (contentRange) totalBytes = parseInt(contentRange.split("/")[1], 10);
      else totalBytes = parseInt(response.headers.get("content-length") || "0", 10);
    }

    const reader = response.body.getReader();
    let receivedBytes = startByte;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkIndex = chunks.length;
      chunks.push(value);
      receivedBytes += value.length;

      await new Promise(res => {
        const tx = db.transaction(["downloads", "chunks"], "readwrite");
        tx.objectStore("chunks").put({ songId: song.id, index: chunkIndex, data: value });
        tx.objectStore("downloads").put({ id: song.id, bytes: receivedBytes, totalBytes });
        tx.oncomplete = res;
      });

      if (onProgress) onProgress(receivedBytes, totalBytes);
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const blob = new Blob(chunks, { type: contentType });
    const cacheResponse = new Response(blob, { headers: { "Content-Type": contentType, "Content-Length": blob.size } });
    await cache.put(url, cacheResponse);

    await new Promise(res => { const tx = db.transaction(["downloads", "chunks"], "readwrite"); tx.objectStore("downloads").delete(song.id); tx.objectStore("chunks").delete(IDBKeyRange.bound([song.id, 0], [song.id, Infinity])); tx.oncomplete = res; });
    
    return true;
  } catch (error) {
    throw error;
  }
}

async function getDownloadedSongs() {
  state.downloaded.clear(); if (!("caches" in window)) return state.downloaded;
  for (const song of state.songs) {
    if (!song.audio) continue;
    try { const cache = await getMusicCache(song); const url = new URL(song.audio, location.href).href; if (cache && await cache.match(url)) state.downloaded.add(songKey(song.id)); } catch {}
  }
  updateOfflineCount(); return state.downloaded;
}

function updateOfflineCount() {
  const count = byId("offlineCount"); const status = byId("offlineStatus"); const message = byId("offlineMessage"); const card = byId("offlineCard");
  if (!count) return;
  const total = state.songs.filter(song => song.audio).length; const saved = state.downloaded.size;
  count.textContent = `${saved} of ${total}`;
  if (!total) { if (status) status.textContent = "Waiting for music"; if (message) message.textContent = "Music will appear here when it is published."; return; }
  const percent = Math.round(saved / total * 100);
  card?.style.setProperty("--offline-progress", `${percent}%`);
  card?.classList.toggle("is-complete", saved === total);
  card?.classList.toggle("is-preparing", saved > 0 && saved < total);
  if (saved === total) { if (status) status.textContent = "Offline ready"; if (message) message.textContent = "Your saved music is ready for offline listening."; }
  else { if (status) status.textContent = navigator.onLine ? "Offline music" : "Offline"; if (message) message.textContent = navigator.onLine ? "Music can be saved for listening without internet." : "Reconnect to save more music for offline listening."; }
}

async function prepareOfflineMusic() {
  if (!navigator.onLine || state.downloadBusy) return;
  state.downloadBusy = true;
  try {
    await getDownloadedSongs();
    const pending = state.songs.filter(song => song.audio && !song.isTestTrack && !state.downloaded.has(songKey(song.id)));
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length && navigator.onLine) {
        const song = pending[cursor++];
        try {
          await downloadTrackStream(song);
          state.downloaded.add(songKey(song.id));
          updateOfflineCount();
        } catch (error) { console.warn("Could not cache", song.title, error); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(VIC_CONFIG.DOWNLOAD_WORKERS_HOME, pending.length) }, worker));
  } finally { state.downloadBusy = false; updateOfflineCount(); }
}

/* =========================================================
   7. LATEST RELEASES & QUEUE
   ========================================================= */
const vicReleaseDownloadState = new Map();

function renderLatest() {
  const box = byId("latestList"); if (!box) return;
  let displayReleases = [...state.releases];
  if (VIC_TEST_MODE) {
    if (!displayReleases.some(r => songKey(r.id) === VIC_TEST_RELEASE_ID)) displayReleases.push(VIC_TEST_RELEASE);
    if (!displayReleases.some(r => songKey(r.id) === VIC_TEST_RELEASE_WILLIAMS_ID)) displayReleases.push(VIC_TEST_RELEASE_WILLIAMS);
  }

  if (!displayReleases.length) { box.innerHTML = `<div class="empty-state"><b>No new releases yet</b><span>New music will appear here.</span></div>`; return; }

  box.innerHTML = displayReleases.map(release => {
    const progress = vicReleaseDownloadState.get(songKey(release.id));
    const trackCount = Array.isArray(release.tracks) ? release.tracks.length : Number(release.song_count || release.track_count || 0);
    const status = progress?.complete ? "complete" : progress?.active ? "active" : "";
    let action = "";
    if (status === "complete") {
      action = `<span style="color:var(--green);font-weight:700;display:inline-flex;align-items:center;gap:5px;margin-top:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Completed</span>`;
    } else if (status === "active") {
      const downloadedMB = formatDataSize(progress.bytes || 0);
      const totalMB = formatDataSize(progress.totalBytes || 0);
      action = `<div style="width:100%;margin-top:5px;"><div style="width:100%;height:6px;border-radius:99px;background:#203a32;overflow:hidden;margin:5px 0;"><span style="display:block;width:${Math.max(0,Math.min(100,progress.percent || 0))}%;height:100%;background:var(--green);"></span></div><small style="color:var(--muted);font-size:10px;">Downloading — ${downloadedMB} of ${totalMB} (${progress.percent || 0}%)</small></div>`;
    } else {
      action = `<button class="release-action" data-release-download="${escapeHTML(release.id)}" style="margin-top:6px;">⇩ Download　›</button>`;
    }
    return `<article class="release-card"><img class="release-cover" src="${escapeHTML(release.cover_url || release.cover || "")}" alt=""><div class="release-info"><h3>${escapeHTML(release.title || "Untitled release")}</h3><p>${escapeHTML(release.type || "Release")}</p><p>♬ ${trackCount || "—"} songs</p><p>▣ ${escapeHTML(release.release_date || "")}</p>${action}</div><span style="color:var(--muted);">›</span></article>`;
  }).join("");
}

function queueReleaseDownload(id) {
  const release = (songKey(id) === VIC_TEST_RELEASE_ID) ? VIC_TEST_RELEASE : (songKey(id) === VIC_TEST_RELEASE_WILLIAMS_ID) ? VIC_TEST_RELEASE_WILLIAMS : state.releases.find(r => songKey(r.id) === songKey(id));
  if (!release) return;

  const songsToDownload = release.tracks.map(tid => getSong(tid)).filter(Boolean);
  
  if (state.monetization.enabled && state.monetization.provider !== "none") {
    openModal({
      title: "Unlock this download",
      body: `<p>Watch a rewarded advertisement to unlock ${escapeHTML(release.title)}.</p>`,
      buttons: [
        { label: "Not now" },
        { label: "Watch Ad", action: async () => {
            closeModal();
            const verified = await requestVerifiedReward(release);
            if (verified) pushSongsToDownloadQueue(songsToDownload, release.id);
            else notify("Ad not completed. Download locked.");
          }
        }
      ]
    });
  } else {
    pushSongsToDownloadQueue(songsToDownload, release.id);
  }
}

function pushSongsToDownloadQueue(songs, releaseId) {
  if (!songs.length) return;
  const progress = { active: true, complete: false, done: 0, total: songs.length, bytes: 0, totalBytes: 0, percent: 0 };
  vicReleaseDownloadState.set(songKey(releaseId), progress);
  renderLatest();
  
  songs.forEach(s => {
    if (!state.downloadQueue.includes(s.id)) state.downloadQueue.push(s.id);
  });
  
  processDownloadQueue();
}

async function processDownloadQueue() {
  if (state.isDownloading) return;
  state.isDownloading = true;

  while (state.downloadQueue.length > 0) {
    if (state.activeDownloads.size >= VIC_CONFIG.DOWNLOAD_WORKERS_LATEST) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    const songId = state.downloadQueue.shift();
    const song = getSong(songId);
    if (!song) continue;

    state.activeDownloads.set(songId, song);
    downloadTrackStream(song, (received, total) => {
      // Update specific download UI if needed
    }).then(() => {
      state.downloaded.add(songKey(songId));
      insertDownloadedSong(song);
      saveLocalData(); renderHome(); updateOfflineCount();
    }).catch(e => {
      console.warn("Download failed", song.title);
    }).finally(() => {
      state.activeDownloads.delete(songId);
      processDownloadQueue(); 
    });
  }
  state.isDownloading = false;
}

function insertDownloadedSong(song) {
  if (state.songs.some(s => s.id === song.id)) return;
  
  if (!song.release_id) {
    state.songs.unshift(song);
    return;
  }
  
  const releaseSongs = state.songs.filter(s => s.release_id === song.release_id);
  if (releaseSongs.length === 0) {
    state.songs.unshift(song);
    return;
  }
  
  const insertIndex = state.songs.findIndex(s => 
    s.release_id === song.release_id && 
    (s.track_number || 0) > (song.track_number || 0)
  );
  
  if (insertIndex !== -1) {
    state.songs.splice(insertIndex, 0, song);
  } else {
    const lastIndex = state.songs.map(s => s.release_id).lastIndexOf(song.release_id);
    state.songs.splice(lastIndex + 1, 0, song);
  }
}

async function requestVerifiedReward(release) {
  const adapter = (window.VicSoundAdProviders || {})[state.monetization.provider];
  if (!state.monetization.enabled || !adapter?.showRewarded) return true;
  try {
    const rewardEvent = await adapter.showRewarded({ release });
    return !!rewardEvent?.eventId;
  } catch (error) { return false; }
}

/* =========================================================
   8. RENDERING & UI
   ========================================================= */
function renderHome() {
  const box = byId("homeMusicList"); if (!box) return;
  const songs = filteredSongs();
  if (!songs.length) { box.innerHTML = `<div class="empty-state"><b>No music found</b><span>Try another search or category.</span></div>`; return; }
  box.innerHTML = songs.map(song => `
    <article class="music-row ${songKey(song.id) === songKey(state.currentId) && state.playing ? "playing" : ""}">
      <button class="music-main" data-play="${escapeHTML(song.id)}"><img class="cover" src="${escapeHTML(song.cover)}" alt=""></button>
      <button class="music-main" data-play="${escapeHTML(song.id)}"><b>${escapeHTML(song.title)}</b><small>${escapeHTML(song.artist)}</small></button>
      <span class="playing-bars">▮▮▮</span>
      <button class="favorite-toggle ${isSongFavorite(song.id) ? "active" : ""}" data-fav="${escapeHTML(song.id)}">${isSongFavorite(song.id) ? "♥" : "♡"}</button>
    </article>
  `).join("");
}

function filteredSongs() {
  const query = state.query.trim().toLowerCase();
  return state.songs.filter(song => {
    const tags = [...song.cat, ...song.mood].map(x => safe(x).toLowerCase());
    const categoryMatch = state.category === "All" || tags.includes(state.category.toLowerCase());
    const searchMatch = !query || song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query) || song.album.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
}

function updatePlayer() {
  const song = getCurrentSong(); if (!song) return;
  
  const isDJ = state.queueSource?.type === "dj";
  const coverSrc = isDJ && state.djProfile.cover ? state.djProfile.cover : song.cover || "";

  ["playerTitle", "miniTitle"].forEach(id => { if (byId(id)) byId(id).textContent = song.title; });
  ["playerArtist", "miniArtist"].forEach(id => { if (byId(id)) byId(id).textContent = song.artist; });
  ["playerCover", "miniCover"].forEach(id => { if (byId(id)) byId(id).src = coverSrc; });
  
  if (byId("playPause")) byId("playPause").textContent = state.playing ? "Ⅱ" : "▶";
  if (byId("miniPlay")) byId("miniPlay").textContent = state.playing ? "Ⅱ" : "▶";
  if (byId("currentTime")) byId("currentTime").textContent = formatTime(audio.currentTime);
  if (byId("duration")) byId("duration").textContent = formatTime(audio.duration || song.duration);
  if (byId("progress")) byId("progress").value = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  const mini = byId("miniPlayer"); mini?.classList.toggle("visible", Boolean(state.currentId));
  updateModeButtons(); updateDJPlaybackControls();
  
  if (byId("lyricsPlayPause")) byId("lyricsPlayPause").textContent = state.playing ? "Ⅱ" : "▶";
  if (byId("lyricsProgress")) byId("lyricsProgress").value = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  if (byId("lyricsCurrentTime")) byId("lyricsCurrentTime").textContent = formatTime(audio.currentTime);
  if (byId("lyricsDuration")) byId("lyricsDuration").textContent = formatTime(audio.duration || song.duration);
}

audio.addEventListener("play", () => { state.playing = true; updatePlayer(); renderHome(); });
audio.addEventListener("pause", () => { state.playing = false; updatePlayer(); renderHome(); });
audio.addEventListener("timeupdate", () => { updatePlayer(); syncLyrics(); });
audio.addEventListener("ended", () => { 
  recordCompletedPlay(); 
  
  if (navigator.onLine) {
    state.interactiveAdCounter++;
    if (state.interactiveAdCounter >= 10) {
      state.pendingInteractiveAd = true;
      state.interactiveAdCounter = 0;
    }
  }

  if (state.repeatMode === 2) { audio.currentTime = 0; start(); return; } 
  playNextQueueEntry(); 
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.pendingInteractiveAd) {
    state.pendingInteractiveAd = false;
    openModal({
      title: "Interactive Ad",
      body: "<p>This is a sponsored interactive ad. Thank you for listening.</p>",
      buttons: [{ label: "Close", action: () => closeModal() }]
    });
  }
});

// REPEAT LOGIC (DEFAULT IS GREEN REPEAT ALL)
function updateModeButtons() {
  const repeatButtons = [byId("repeat"), byId("playerRepeatTop")].filter(Boolean);
  const repeatSymbol = state.repeatMode === 2 ? "↻¹" : "↻";
  repeatButtons.forEach(button => { 
    button.textContent = repeatSymbol; 
    button.classList.toggle("active", state.repeatMode !== 0); 
  });
}
function cycleRepeat() { state.repeatMode = (state.repeatMode + 1) % 3; updateModeButtons(); notify(["Repeat is off.", "Repeat all is on.", "Repeat one is on."][state.repeatMode]); }
function toggleShuffle() { state.shuffle = !state.shuffle; notify(state.shuffle ? "Shuffle is on." : "Shuffle is off."); }

function updateLyrics() {
  const song = getCurrentSong(); if (!song) return;
  
  byId("lyricsCover").src = song.cover;
  byId("lyricsTitle").textContent = song.title;
  byId("lyricsArtist").textContent = song.artist;
  byId("lyricsPlayPause").textContent = state.playing ? "Ⅱ" : "▶";

  const box = byId("lyricsContent"); if (!box) return;
  
  if (!song.lyrics || !song.lyrics.trim()) { 
    box.innerHTML = `<p style="color:var(--muted); text-align:center; margin-top:20px;">Lyrics are not available for this song yet.</p>`; 
    return; 
  }
  
  if (Array.isArray(song.lyrics_timed) && song.lyrics_timed.length) {
    box.innerHTML = song.lyrics_timed.map((line, index) => `<p class="lyric-line type-${line.type || 'main'}" data-lyric-time="${Number(line.time) || 0}" data-lyric-index="${index}">${escapeHTML(line.text)}</p>`).join("");
  } else { box.textContent = song.lyrics; }
  syncLyrics();
}

function syncLyrics() {
  if (!state.lyricsOpen) return;
  const lines = $$("[data-lyric-time]"); if (!lines.length) return;
  let active = -1; lines.forEach((line, index) => { if (audio.currentTime >= Number(line.dataset.lyricTime)) active = index; });
  lines.forEach((line, index) => { line.classList.toggle("current", index === active); line.classList.toggle("past", index < active); line.classList.toggle("upcoming", index > active); });
  lines[active]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function openLyrics() { updateLyrics(); byId("lyricsSheet")?.classList.add("open"); byId("lyricsSheet")?.setAttribute("aria-hidden", "false"); state.lyricsOpen = true; }
function closeLyrics() { byId("lyricsSheet")?.classList.remove("open"); byId("lyricsSheet")?.setAttribute("aria-hidden", "true"); state.lyricsOpen = false; }

function openSearch() { byId("searchPanel")?.classList.add("open"); byId("searchPanel")?.setAttribute("aria-hidden", "false"); setTimeout(() => byId("searchInput")?.focus(), 50); }
function closeSearch() { state.query = ""; if (byId("searchInput")) byId("searchInput").value = ""; byId("searchPanel")?.classList.remove("open"); byId("searchPanel")?.setAttribute("aria-hidden", "true"); renderHome(); }

function back() {
  if (byId("vicCollectionView")?.classList.contains("open")) {
    byId("vicCollectionView").classList.remove("open");
    state.currentCollection = null;
    return;
  }
  if (state.modalOpen) { closeModal(); return; }
  if (byId("notificationPopover") && !byId("notificationPopover").classList.contains("hidden")) { byId("notificationPopover").classList.add("hidden"); return; }
  if (state.lyricsOpen) { closeLyrics(); return; }
  if (byId("timerSheet")?.classList.contains("open")) { closeTimer(); return; }
  if (byId("searchPanel")?.classList.contains("open")) { closeSearch(); return; }
  if (state.djOpen) { closeDJ(); return; }
  if (state.queueOpen) { closeQueue(); return; }
  if (state.player) { closePlayer(); return; }
  if (state.screen !== "home") { go("home"); return; }
  notify("Press back once more to exit Vic-sound.");
}

function setupBackNavigation() {
  let lastHomeBackAt = 0; const backTrap = { vicSound: true };
  history.replaceState(backTrap, "", location.href); history.pushState(backTrap, "", location.href);
  window.addEventListener("popstate", () => {
    const panelOpen = state.modalOpen || state.lyricsOpen || state.queueOpen || state.djOpen || state.player || byId("timerSheet")?.classList.contains("open") || byId("searchPanel")?.classList.contains("open") || (byId("notificationPopover") && !byId("notificationPopover").classList.contains("hidden")) || byId("vicCollectionView")?.classList.contains("open");
    if (panelOpen || state.screen !== "home") { history.pushState(backTrap, "", location.href); back(); lastHomeBackAt = 0; return; }
    const now = Date.now(); if (now - lastHomeBackAt <= 2200) { lastHomeBackAt = 0; return; }
    lastHomeBackAt = now; history.pushState(backTrap, "", location.href); notify("Press back once more to exit Vic-sound.");
  });
}

function bindEvents() {
  $$(".nav-item").forEach(button => button.addEventListener("click", () => go(button.dataset.screen)));
  byId("searchToggle")?.addEventListener("click", openSearch);
  byId("searchClose")?.addEventListener("click", closeSearch);
  byId("searchInput")?.addEventListener("input", event => { state.query = event.target.value; renderHome(); });
  byId("categoryRow")?.addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (!button) return; state.category = button.dataset.category; $$(".category").forEach(item => item.classList.toggle("active", item === button)); renderHome(); });
  byId("homeMusicList")?.addEventListener("click", event => { const favorite = event.target.closest("[data-fav]"); if (favorite) { toggleFavorite(favorite.dataset.fav); return; } const play = event.target.closest("[data-play]"); if (play) playSongById(play.dataset.play); });
  byId("favoriteGrid")?.addEventListener("click", event => { const open = event.target.closest("[data-collection-open]"); if (open) { openCollection(open.dataset.collectionOpen); return; } const menu = event.target.closest("[data-collection-menu]"); if (menu) collectionMenu(menu.dataset.collectionMenu); });
  byId("favoriteDjCover")?.addEventListener("click", openDJ);
  $(".favorite-dj-card")?.addEventListener("click", event => { if (event.target.closest("#favoriteDjPlay")) return; openDJ(); });
  byId("favoriteDjPlay")?.addEventListener("click", event => { event.stopPropagation(); speakDJIntro(); });
  byId("miniOpen")?.addEventListener("click", openPlayer);
  byId("miniPlay")?.addEventListener("click", toggle);
  byId("miniPrev")?.addEventListener("click", prev);
  byId("miniNext")?.addEventListener("click", next);
  byId("playerBack")?.addEventListener("click", back);
  byId("playPause")?.addEventListener("click", toggle);
  byId("prev")?.addEventListener("click", prev);
  byId("next")?.addEventListener("click", next);
  byId("openQueueFromPlayer")?.addEventListener("click", openQueue);
  byId("playerFav")?.addEventListener("click", () => { const song = getCurrentSong(); if (song) toggleFavorite(song.id); });
  byId("shuffle")?.addEventListener("click", toggleShuffle);
  byId("repeat")?.addEventListener("click", cycleRepeat);
  byId("playerRepeatTop")?.addEventListener("click", cycleRepeat);
  byId("progress")?.addEventListener("input", event => { if (audio.duration) audio.currentTime = Number(event.target.value) / 100 * audio.duration; });
  byId("queueBack")?.addEventListener("click", back);
  byId("queueClose")?.addEventListener("click", closeQueue);
  byId("queueFav")?.addEventListener("click", () => { const song = getCurrentSong(); if (song) toggleFavorite(song.id); });
  byId("queueTimer")?.addEventListener("click", openTimer);
  byId("lyricsButton")?.addEventListener("click", openLyrics);
  byId("lyricsSheet")?.addEventListener("click", event => { if (event.target === byId("lyricsSheet")) closeLyrics(); });
  byId("djBack")?.addEventListener("click", back);
  byId("djSend")?.addEventListener("click", () => { const input = byId("djInput"); const value = input?.value || ""; if (input) input.value = ""; command(value); });
  byId("djInput")?.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); byId("djSend")?.click(); } });
  byId("djMic")?.addEventListener("pointerdown", event => { event.preventDefault(); startVoice(); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => byId("djMic")?.addEventListener(type, stopVoice));
  
  byId("latestList")?.addEventListener("click", event => { const button = event.target.closest("[data-release-download]"); if (button) queueReleaseDownload(button.dataset.releaseDownload); });
  byId("latestBell")?.addEventListener("click", () => byId("notificationPopover")?.classList.toggle("hidden"));
  byId("headerBell")?.addEventListener("click", () => byId("notificationPopover")?.classList.toggle("hidden"));
  byId("notificationSwitch")?.addEventListener("change", event => setNotifications(event.target.checked));
  byId("cancelExit")?.addEventListener("click", closeModal);
  byId("confirmExit")?.addEventListener("click", () => { byId("exitModal")?.classList.add("hidden"); notify("You can now leave Vic-sound using your device controls."); });

  byId("lyricsPlayPause")?.addEventListener("click", toggle);
  byId("lyricsProgress")?.addEventListener("input", e => {
    if (audio.duration) {
      audio.currentTime = (e.target.value / 100) * audio.duration;
      syncLyrics();
    }
  });
}

async function init() {
  getAnonymousId(); loadLocalData(); applyTestMusic(); setupVoice(); bindEvents();
  setupServiceWorkerUpdate();
  renderHome(); renderLatest(); updateDots(); updateModeButtons();
  await getDownloadedSongs(); updateOfflineCount(); applyDJProfile(); await loadDJProfile();
  if (state.songs.length) { makeQueue(state.songs, { type: "catalogue", label: "Your Music" }); setCurrentSong(state.songs[0]); }
  await connectBackend(); await loadSongs(); await loadReleases(); await loadMonetizationSettings();
  if (navigator.onLine) prepareOfflineMusic();
  setupBackNavigation();
}

init();
