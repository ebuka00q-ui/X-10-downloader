/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   ========================================================= */

/* =========================================================
   0. TEMPORARY TEST PACKAGE (TST) - REMOVABLE
   ========================================================= */
const VIC_TEST_CONFIG = Object.freeze({ enabled: true, queryFlag: "test", queryValue: "1", cacheName: "vic-sound-tst-audio-v1" });
const VIC_TEST_MODE = VIC_TEST_CONFIG.enabled && new URLSearchParams(location.search).get(VIC_TEST_CONFIG.queryFlag) !== "0";

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

const TEST_LYRICS_TIMED = TEST_LYRICS_TEXT.split('\n\n').map((chunk, i) => ({ time: i * 12, text: chunk }));

const VIC_TEST_SONGS = Object.freeze([
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
    lyrics_timed: TEST_LYRICS_TIMED 
  }
]);

const VIC_TEST_RELEASE_ID = "vic-tst-ep-williams";
const VIC_TEST_RELEASE = {
  id: VIC_TEST_RELEASE_ID, title: "Dear Mr Williams", type: "Single",
  release_date: "Testing", cover_url: VIC_TEST_SONGS[0].cover,
  tracks: VIC_TEST_SONGS.map(s => s.id), isTestRelease: true
};

/* =========================================================
   1. SERVICE CONNECTIONS
   ========================================================= */
const VIC_CONFIG = Object.freeze({
  SUPABASE: { url: "https://gkfivuvtpfetzatzhnaq.supabase.co", publishableKey: "PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY", songsTable: "songs", releasesTable: "releases" },
  SERVICES: { baseUrl: "", catalogue: "/listener/catalogue", releases: "/listener/releases", djProfile: "/listener/dj-profile", djChat: "/listener/dj/chat", downloadPermission: "/listener/download-permission", monetization: "/listener/monetization-config" },
  MEDIA: { publicDeliveryBaseUrl: "" },
  MONETIZATION: { enabled: false, provider: "none", placement: "bottom", format: "banner", refreshSeconds: 0, bannerHeight: 0, maxWidth: "100%", gap: 0, borderRadius: 0 },
  DJ: { fallbackName: "Vic-sound DJ", fallbackSubtitle: "Your personal music companion", fallbackCover: "", autoSuggestionEvery: 10, repeatNoticeThreshold: 5, historyLimit: 100 },
  STORAGE: { musicCache: "vic-sound-music-v2", state: "vic-sound-listener-state-v2", songs: "vic-sound-songs-v2", releases: "vic-sound-releases-v2", favorites: "vic-sound-favorites-v2", collections: "vic-sound-collections-v2", history: "vic-sound-listening-history-v2", anonymousId: "vic-sound-anonymous-id-v2", notifications: "vic-sound-notifications-v2" },
  DOWNLOAD_WORKERS_HOME: 5,
  DOWNLOAD_WORKERS_LATEST: 3,
  REQUEST_TIMEOUT: 12000
});

/* =========================================================
   2. APP STATE
   ========================================================= */
const state = {
  screen: "home", category: "All", query: "", songs: [], releases: [], currentId: null, playing: false,
  queue: [], queueIndex: 0, queueSource: { type: "catalogue", label: "Your Music" },
  shuffle: false, repeatMode: 1,
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
  isDownloading: false
};

// IndexedDB for partial chunks
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

function injectVicEnhancementStyles() {
  if (byId("vicEnhancementStyles")) return;
  const style = document.createElement("style"); style.id = "vicEnhancementStyles";
  style.textContent = `
    .vic-toast{position:fixed;left:50%;bottom:calc(var(--nav,68px) + 78px);z-index:260;max-width:88%;padding:12px 17px;border:1px solid rgba(0,245,160,.35);border-radius:14px;background:#09221c;color:#f3fffb;text-align:center;font-size:13px;opacity:0;transform:translate(-50%,12px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
    .vic-toast.show{opacity:1;transform:translate(-50%,0)}
    
    /* PADDING FOR MINI-PLAYER */
    .screen { padding-bottom: 140px !important; }
    .vic-col-tracks { padding-bottom: 140px !important; }
    
    /* HOME LIST SINGLE LINE FIX */
    .music-row { display: grid !important; grid-template-columns: 56px minmax(0,1fr) auto auto !important; align-items: center !important; gap: 10px !important; }
    .music-main { display: flex !important; flex-direction: column !important; justify-content: center !important; text-align: left !important; min-width: 0 !important; overflow: hidden !important; }
    
    /* PLAYER CONTROLS CENTERING */
    .main-controls { display: flex !important; align-items: center !important; justify-content: center !important; gap: 30px !important; margin-top: 20px !important; width: 100% !important; }
    .main-controls button { display: flex !important; align-items: center !important; justify-content: center !important; }
    .main-play { width: 68px !important; height: 68px !important; border: 2px solid var(--green) !important; border-radius: 50% !important; color: var(--green) !important; font-size: 25px !important; box-shadow: 0 0 20px rgba(0,245,160,.18) !important; }

    /* SMART WAVES (Pause when not playing) */
    .playing-bars { animation-play-state: paused !important; opacity: 0.3; }
    .music-row.playing .playing-bars { animation-play-state: running !important; opacity: 1 !important; }

    /* DJ CONTROLS FIX */
    .vic-dj-playback { display: flex !important; align-items: center !important; justify-content: center !important; gap: 18px !important; margin: 15px auto !important; position: relative !important; z-index: 10 !important; }
    .vic-dj-playback button { width: 52px !important; height: 52px !important; border: 1px solid rgba(0,245,160,.42) !important; border-radius: 50% !important; background: #09221c !important; color: #00f5a0 !important; font-size: 21px !important; display: grid !important; place-items: center !important; }
    .vic-dj-playback button.vic-dj-main-play { width: 64px !important; height: 64px !important; background: #00f5a0 !important; color: #00140e !important; font-size: 25px !important; }

    /* LYRICS STYLING */
    #lyricsContent p { font-size: 16px; color: #71867f; margin: 10px 0; transition: all 0.3s ease; font-weight: 600; }
    #lyricsContent p.current { color: var(--green) !important; font-size: 18px; text-shadow: 0 0 10px rgba(0,245,160,0.3); }
    #lyricsContent p.past { opacity: 0.4; }

    /* FAVORITES SLIM LIST */
    .favorite-grid { display: flex !important; flex-direction: column !important; gap: 10px !important; width: 100% !important; }
    .collection-card { display: flex !important; align-items: center; justify-content: space-between; width: 100% !important; min-height: 64px !important; padding: 8px 12px !important; background: rgba(5,20,17,.96) !important; border: 1px solid rgba(0,245,160,.32) !important; border-radius: 12px !important; gap: 12px; margin-bottom: 2px; }
    .collection-open { display: flex !important; align-items: center; gap: 14px; flex: 1; background: transparent !important; border: none !important; padding: 0 !important; text-align: left; color: inherit !important; }
    .collection-open img { width: 48px !important; height: 48px !important; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .collection-card-info { display: flex; flex-direction: column; gap: 4px; background: transparent !important; min-width: 0; }
    .collection-card-info b { font-size: 14px !important; font-weight: 600; color: var(--text) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .collection-card-info small { font-size: 11px !important; color: var(--muted) !important; }
    .collection-card-more { width: 32px !important; height: 32px !important; border-radius: 50%; border: 1px solid rgba(0,245,160,.35); background: transparent !important; color: var(--text); font-size: 18px; display: grid; place-items: center; flex-shrink: 0; }

    /* FULL SCREEN COLLECTION VIEW */
    #vicCollectionView { position: fixed; inset: 0; z-index: 220; background: var(--bg); display: flex; flex-direction: column; transform: translateX(100%); transition: transform .3s cubic-bezier(.16,1,.3,1); }
    #vicCollectionView.open { transform: translateX(0); }
    .vic-col-header { position: sticky; top: 0; z-index: 10; padding: 15px 20px; display: flex; align-items: center; gap: 15px; background: rgba(2,8,7,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0,245,160,0.1); }
    .vic-col-hero { padding: 20px; display: flex; flex-direction: column; align-items: center; transition: all 0.3s ease; }
    .vic-col-hero img { width: 220px; height: 220px; border-radius: 16px; object-fit: cover; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
    .vic-track-item { display: grid; grid-template-columns: 50px 1fr auto; gap: 14px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,245,160,0.08); cursor: pointer; }
    .vic-track-item img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .vic-track-info { min-width: 0; }
    .vic-track-info b { display: block; font-size: 15px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vic-track-info small { display: block; font-size: 12px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vic-track-fav { background: transparent; border: none; font-size: 22px; color: var(--muted); cursor: pointer; padding: 8px; }
    .vic-track-fav.active { color: var(--green); }
    
    /* UPDATE BANNER */
    #vicUpdateBanner { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--green); color: #000; padding: 10px 20px; border-radius: 20px; font-weight: bold; z-index: 999; display: none; cursor: pointer; box-shadow: 0 4px 15px rgba(0,245,160,0.4); }
  `;
  document.head.appendChild(style);
}

// Inject Update Banner
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
  return { id: row.id ?? makeId(), title: safe(row.title || "Untitled"), artist: safe(row.artist || "Unknown artist"), album: safe(row.album), audio: resolveMediaURL(row.audio_url || row.audio || row.music_url), cover: resolveMediaURL(row.cover_url || row.cover), duration: Number(row.duration || 0), cat: genres, mood: moods, lyrics: safe(row.lyrics), lyrics_timed: row.lyrics_timed || null, release_date: safe(row.release_date), release_id: row.release_id || null, published: row.published ?? true, isTestTrack: Boolean(row.isTestTrack || row.is_test_track) };
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
  if (VIC_CONFIG.SERVICES.baseUrl) { try { const result = await serviceRequest(VIC_CONFIG.SERVICES.releases); state.releases = result?.releases || result || []; saveLocalData(); state.newRelease = state.releases.length > 0; renderLatest(); updateDots(); return state.releases; } catch (error) {} }
  if (state.backendConnected && supabaseClient) { try { const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.releasesTable).select("*").eq("published", true).order("created_at", { ascending: false }); if (error) throw error; state.releases = data || []; saveLocalData(); } catch (error) {} }
  state.newRelease = state.releases.length > 0; renderLatest(); updateDots(); return state.releases;
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

    const blob = new Blob(chunks, { type: response.headers.get("content-type") || "audio/mpeg" });
    const cacheResponse = new Response(blob, { headers: { "Content-Type": blob.type, "Content-Length": blob.size } });
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
   ========================
