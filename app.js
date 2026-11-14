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
But we don’ `ear a chorus
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
  if (VIC_CONFIG.SERVICES.baseUrl) { try { const result = await serviceRequest(VIC_CONFIG.SERVICES.catalogue); state.songs = (result?.songs || result || []).map(normaliseSong); applyTestMusic(); sa
