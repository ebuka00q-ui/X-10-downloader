/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   ========================================================= */

/* =========================================================
   0. TEMPORARY TEST PACKAGE (TST) - REMOVABLE
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

// REAL TEST SONG WITH TIMED LYRICS
const VIC_TEST_LYRICS = Object.freeze([
  { time: 0, text: "This is the beginning of the test track" },
  { time: 5, text: "Watch the lyrics scroll and highlight" },
  { time: 10, text: "Proving the engine works in real-time" },
  { time: 15, text: "Syncing perfectly with the audio" },
  { time: 20, text: "Vic-sound Listener is ready" }
]);

const VIC_TEST_SONGS = Object.freeze([
  { id: "vic-tst-1", title: "TST 01 — Sound Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: VIC_TEST_COVERS.one, cat: ["Pop", "Test"], mood: ["Calm", "Test"], duration: 180, isTestTrack: true, lyrics: "Real timed lyrics test.", lyrics_timed: VIC_TEST_LYRICS },
  { id: "vic-tst-2", title: "TST 02 — Shuffle Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", cover: VIC_TEST_COVERS.two, cat: ["Afrobeats", "Test"], mood: ["Party", "Test"], duration: 150, isTestTrack: true },
  { id: "vic-tst-3", title: "TST 03 — Bass Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: VIC_TEST_COVERS.one, cat: ["Rap", "Test"], mood: ["Bass", "Test"], duration: 190, isTestTrack: true },
  { id: "vic-tst-4", title: "TST 04 — Rhythm Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: VIC_TEST_COVERS.two, cat: ["Hip-Hop", "Test"], mood: ["Rhythm", "Test"], duration: 200, isTestTrack: true },
  { id: "vic-tst-5", title: "TST 05 — Final Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", cover: VIC_TEST_COVERS.one, cat: ["Trap", "Test"], mood: ["Final", "Test"], duration: 170, isTestTrack: true }
]);

const VIC_TEST_RELEASE_ID = "vic-tst-ep-five";
const VIC_TEST_RELEASE = {
  id: VIC_TEST_RELEASE_ID, title: "Vic-sound Test EP", type: "EP",
  release_date: "Testing", cover_url: VIC_TEST_COVERS.ep,
  tracks: VIC_TEST_SONGS.map(s => s.id), isTestRelease: true
};

/* =========================================================
   1. SERVICE CONNECTIONS (CONFIGURATION KEYS)
   ========================================================= */
const VIC_CONFIG = Object.freeze({
  SUPABASE: {
    url: "https://gkfivuvtpfetzatzhnaq.supabase.co",
    publishableKey: "PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY", // PUT KEY HERE
    songsTable: "songs",
    releasesTable: "releases"
  },
  SERVICES: {
    baseUrl: "", // PUT PUBLIC BACKEND URL HERE
    catalogue: "/listener/catalogue",
    releases: "/listener/releases",
    djProfile: "/listener/dj-profile",
    djChat: "/listener/dj/chat",
    downloadPermission: "/listener/download-permission",
    monetization: "/listener/monetization-config"
  },
  MEDIA: { publicDeliveryBaseUrl: "" },
  MONETIZATION: { enabled: false, provider: "none", placement: "bottom", format: "banner", refreshSeconds: 0, bannerHeight: 0, maxWidth: "100%", gap: 0, borderRadius: 0 },
  DJ: { fallbackName: "Vic-sound DJ", fallbackSubtitle: "Your personal music companion", fallbackCover: "", autoSuggestionEvery: 10, repeatNoticeThreshold: 5, historyLimit: 100 },
  STORAGE: {
    musicCache: "vic-sound-music-v2", state: "vic-sound-listener-state-v2",
    songs: "vic-sound-songs-v2", releases: "vic-sound-releases-v2",
    favorites: "vic-sound-favorites-v2", collections: "vic-sound-collections-v2",
    history: "vic-sound-listening-history-v2", anonymousId: "vic-sound-anonymous-id-v2",
    notifications: "vic-sound-notifications-v2"
  },
  DOWNLOAD_WORKERS: 2, // Allows concurrent downloads
  REQUEST_TIMEOUT: 12000
});

/* =========================================================
   2. APP STATE
   ========================================================= */
const state = {
  screen: "home", category: "All", query: "", songs: [], releases: [], currentId: null, playing: false,
  queue: [], queueIndex: 0, queueSource: { type: "catalogue", label: "Your Music" },
  shuffle: false, repeatMode: 0, collections: [], favorites: new Set(),
  player: false, queueOpen: false, djOpen: false, lyricsOpen: false,
  timerMode: "end", timerId: null, notifications: false, newRelease: false,
  downloaded: new Set(), downloadBusy: false, anonymousId: null,
  backendConnected: false, backendError: null, monetization: { ...VIC_CONFIG.MONETIZATION }, monetizationReady: false,
  djProfile: { name: VIC_CONFIG.DJ.fallbackName, subtitle: VIC_CONFIG.DJ.fallbackSubtitle, cover: VIC_CONFIG.DJ.fallbackCover },
  djOnline: false, djBusy: false, djCompletedSinceSuggestion: 0, djLastSuggestedId: null,
  djHistory: [], skippedSongs: {}, playedSongs: {}, lastAutoDJMessageAt: 0,
  currentCollection: null, modalOpen: false,
  activeDownloads: new Map(), // Tracks active download states
  downloadQueue: [],
  isDownloadPaused: false
};

/* =========================================================
   3. DOM HELPERS & DOWNLOAD ENGINE (IndexedDB)
   ========================================================= */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const audio = $("#audio");
const safe = value => String(value ?? "");
const songKey = id => String(id);

// DOWNLOAD ENGINE DATABASE
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open("vic-download-db", 1);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("downloads")) {
      db.createObjectStore("downloads", { keyPath: "id" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function getDownloadState(id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("downloads", "readonly");
    const req = tx.objectStore("downloads").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function saveDownloadState(stateData) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("downloads", "readwrite");
    tx.objectStore("downloads").put(stateData);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function escapeHTML(value) {
  return safe(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function formatTime(seconds) { const n = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`; }
function makeId() { return globalThis.crypto?.randomUUID?.() || `vic-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function getCurrentSong() { return state.songs.find(song => songKey(song.id) === songKey(state.currentId)) || null; }
function byId(id) { return document.getElementById(id); }

function notify(message) {
  let toast = byId("vicMessage");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "vicMessage"; toast.className = "vic-toast";
    toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* =========================================================
   4. VIC-SOUND NATIVE MODALS & INJECTED STYLES
   ========================================================= */
function injectVicEnhancementStyles() {
  if (byId("vicEnhancementStyles")) return;
  const style = document.createElement("style");
  style.id = "vicEnhancementStyles";
  style.textContent = `
    .vic-toast{position:fixed;left:50%;bottom:calc(var(--nav,68px) + 78px);z-index:260;max-width:88%;padding:12px 17px;border:1px solid rgba(0,245,160,.35);border-radius:14px;background:#09221c;color:#f3fffb;text-align:center;font-size:13px;opacity:0;transform:translate(-50%,12px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
    .vic-toast.show{opacity:1;transform:translate(-50%,0)}
    
    /* PLAYER CONTROLS CENTERING & PADDING FIX */
    .main-controls { display: flex; align-items: center; justify-content: center; gap: 25px; margin-top: 20px; width: 100%; }
    .main-controls button { display: flex; align-items: center; justify-content: center; }
    .main-play { width: 68px !important; height: 68px !important; border: 2px solid var(--green) !important; border-radius: 50%; color: var(--green); font-size: 25px !important; box-shadow: 0 0 20px rgba(0,245,160,.18); }
    .screen { padding-bottom: 140px !important; } /* Padding so mini-player doesn't block */

    #vicNativeModal{z-index:240}
    #vicNativeModal .confirm{max-height:min(82dvh,720px);overflow:auto;background:radial-gradient(circle at top right,rgba(0,245,160,.10),transparent 45%),#061512}
    #vicNativeModal .vic-modal-body{display:block;max-height:55dvh;overflow:auto;margin:12px 0 18px}
    #vicNativeModal .vic-modal-actions{display:flex;flex-wrap:wrap;gap:8px}
    #vicNativeModal .vic-modal-actions button{flex:1 1 105px;padding:9px 12px;border:1px solid rgba(0,245,160,.22);background:#0a2520;color:#f3fffb}
    #vicNativeModal .vic-modal-actions button:last-child{background:var(--green,#00f5a0);color:#00140e}
    #vicNativeModal .vic-modal-actions button.danger{background:#a83232;color:#fff}
    #vicNativeModal .vic-field{display:grid;gap:8px;color:var(--muted,#8da59d);font-size:12px}
    #vicNativeModal input[type=text]{width:100%;min-height:46px;padding:10px 12px;border:1px solid rgba(0,245,160,.35);border-radius:12px;background:#020807;color:#f3fffb;font:inherit}
    #vicNativeModal .vic-modal-note{margin:4px 0 12px;color:var(--muted,#8da59d);font-size:12px;line-height:1.5}
    #vicNativeModal .vic-check-list,#vicNativeModal .vic-collection-track-list{display:grid;gap:8px}
    #vicNativeModal .vic-check-row,#vicNativeModal .vic-track-choice{display:flex;align-items:center;gap:10px;min-height:54px;padding:8px;border:1px solid rgba(0,245,160,.16);border-radius:12px;background:rgba(0,245,160,.035)}
    #vicNativeModal .vic-check-row input,#vicNativeModal .vic-track-choice input{width:18px;height:18px;accent-color:var(--green,#00f5a0);flex:0 0 auto}
    #vicNativeModal .vic-check-row span,#vicNativeModal .vic-track-choice span{min-width:0;flex:1;display:grid;gap:3px}
    #vicNativeModal .vic-check-row small,#vicNativeModal .vic-track-choice small{color:var(--muted,#8da59d);font-size:10px}
    #vicNativeModal .vic-track-choice img{width:40px;height:40px;border-radius:8px;object-fit:cover}
    #vicNativeModal .vic-secondary-action{width:100%;margin-top:10px;padding:11px;border:1px dashed rgba(0,245,160,.4);border-radius:12px;background:rgba(0,245,160,.06);color:var(--green,#00f5a0)}

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
    .vic-col-tracks { padding: 0 16px 120px; flex: 1; overflow-y: auto; }
    .vic-track-item { display: grid; grid-template-columns: 50px 1fr auto; gap: 14px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,245,160,0.08); cursor: pointer; }
    .vic-track-item img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
    .vic-track-info { min-width: 0; }
    .vic-track-info b { display: block; font-size: 15px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vic-track-info small { display: block; font-size: 12px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vic-track-fav { background: transparent; border: none; font-size: 22px; color: var(--muted); cursor: pointer; padding: 8px; }
    .vic-track-fav.active { color: var(--green); }
    
    /* SMART WAVES (Only animate on playing song) */
    .music-row.playing .playing-bars { animation-play-state: running !important; }
    .music-row:not(.playing) .playing-bars { animation-play-state: paused !important; opacity: 0.3; }
  `;
  document.head.appendChild(style);
}

function ensureModal() {
  let modal = byId("vicNativeModal");
  if (modal) return modal;
  modal = document.createElement("section");
  modal.id = "vicNativeModal"; modal.className = "modal hidden"; modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `<div class="confirm" role="dialog" aria-modal="true"></div>`;
  document.querySelector(".app-shell")?.appendChild(modal);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  return modal;
}

function openModal({ title, body = "", buttons = [], onOpen = null }) {
  const modal = ensureModal();
  const panel = $(".confirm", modal);
  panel.innerHTML = `
    <h2>${escapeHTML(title)}</h2>
    <div class="vic-modal-body">${body}</div>
    <div class="vic-modal-actions">
      ${buttons.map((button, index) => `<button type="button" data-modal-action="${index}" class="${button.danger ? "danger" : ""}">${escapeHTML(button.label)}</button>`).join("")}
    </div>
  `;
  modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false"); state.modalOpen = true;
  buttons.forEach((button, index) => {
    $(`[data-modal-action="${index}"]`, panel)?.addEventListener("click", () => {
      if (button.keepOpen !== true) closeModal();
      if (button.action) button.action();
    });
  });
  onOpen?.(panel);
  $("input:not([type=checkbox]), textarea", panel)?.focus();
  return panel;
}

function closeModal() {
  const modal = byId("vicNativeModal");
  if (!modal) return;
  modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); state.modalOpen = false;
}

function askText(title, label, initialValue, onDone) {
  openModal({
    title,
    body: `<label class="vic-field"><span>${escapeHTML(label)}</span><input id="vicModalText" type="text" maxlength="50" value="${escapeHTML(initialValue || "")}" placeholder="Enter a name"></label>`,
    buttons: [
      { label: "Cancel" },
      { label: "Save", action: () => { const value = $("#vicModalText")?.value.trim(); if (!value) { notify("Please enter a name."); return; } onDone(value); } }
    ]
  });
}

/* =========================================================
   5. LOCAL STORAGE AND ANONYMOUS LISTENER
   ========================================================= */
function readJSON(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { console.warn("Local save failed:", error); return false; } }
function getAnonymousId() {
  let id = "";
  try { id = localStorage.getItem(VIC_CONFIG.STORAGE.anonymousId) || ""; if (!id) { id = makeId(); localStorage.setItem(VIC_CONFIG.STORAGE.anonymousId, id); } } catch { id = makeId(); }
  state.anonymousId = id; return id;
}

function loadLocalData() {
  state.songs = readJSON(VIC_CONFIG.STORAGE.songs, []).map(normaliseSong);
  state.releases = readJSON(VIC_CONFIG.STORAGE.releases, []);
  state.collections = readJSON(VIC_CONFIG.STORAGE.collections, [])
    .filter(item => item && Array.isArray(item.songs))
    .map(item => ({ id: safe(item.id || makeId()), name: safe(item.name || "My Collection"), songs: [...new Set(item.songs.map(songKey))] }));
  state.favorites = new Set(readJSON(VIC_CONFIG.STORAGE.favorites, []).map(songKey));
  const history = readJSON(VIC_CONFIG.STORAGE.history, {});
  state.djHistory = Array.isArray(history.history) ? history.history : [];
  state.skippedSongs = history.skipped || {};
  state.playedSongs = history.played || {};
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
   6. PROVIDER-NEUTRAL REQUEST LAYER
   ========================================================= */
function serviceURL(path) { const base = VIC_CONFIG.SERVICES.baseUrl.replace(/\/$/, ""); return `${base}${path}`; }
async function serviceRequest(path, options = {}) {
  if (!VIC_CONFIG.SERVICES.baseUrl) throw new Error("Vic-sound service endpoint is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIC_CONFIG.REQUEST_TIMEOUT);
  try {
    const response = await fetch(serviceURL(path), {
      ...options, signal: controller.signal,
      headers: { "Content-Type": "application/json", "X-Vic-Listener-ID": state.anonymousId || getAnonymousId(), ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`Service request failed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  } finally { clearTimeout(timeout); }
}

/* =========================================================
   7. SUPABASE CONNECTION
   ========================================================= */
let supabaseClient = null;
function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error("Supabase library did not load."));
    script.onerror = () => reject(new Error("Could not load Supabase library."));
    document.head.appendChild(script);
  });
}

async function connectBackend() {
  const { url, publishableKey } = VIC_CONFIG.SUPABASE;
  if (!publishableKey || publishableKey.includes("PASTE_")) { state.backendConnected = false; return false; }
  try {
    const library = await loadSupabaseLibrary();
    supabaseClient = library.createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.songsTable).select("id").limit(1);
    if (error) throw error;
    state.backendConnected = true; state.backendError = null; return true;
  } catch (error) {
    state.backendConnected = false; state.backendError = error.message; return false;
  }
}

function resolveMediaURL(value) {
  const raw = safe(value).trim(); if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const base = VIC_CONFIG.MEDIA.publicDeliveryBaseUrl.replace(/\/$/, "");
  return base ? `${base}/${raw.replace(/^\/+/, "")}` : raw;
}

function normaliseSong(row = {}) {
  const genres = Array.isArray(row.genre) ? row.genre : safe(row.genre || row.cat).split(",").map(x => x.trim()).filter(Boolean);
  const moods = Array.isArray(row.mood) ? row.mood : safe(row.mood).split(",").map(x => x.trim()).filter(Boolean);
  return {
    id: row.id ?? makeId(), title: safe(row.title || "Untitled"), artist: safe(row.artist || "Unknown artist"),
    album: safe(row.album), audio: resolveMediaURL(row.audio_url || row.audio || row.music_url),
    cover: resolveMediaURL(row.cover_url || row.cover), duration: Number(row.duration || 0),
    cat: genres, mood: moods, lyrics: safe(row.lyrics), lyrics_timed: row.lyrics_timed || null,
    release_date: safe(row.release_date), release_id: row.release_id || null,
    published: row.published ?? true, isTestTrack: Boolean(row.isTestTrack || row.is_test_track)
  };
}

function applyTestMusic() {
  if (!VIC_TEST_MODE) return state.songs;
  const realSongs = state.songs.filter(song => !song.isTestTrack);
  const ids = new Set(realSongs.map(songKey));
  const tests = VIC_TEST_SONGS.map(normaliseSong).filter(song => !ids.has(songKey(song.id)));
  state.songs = [...tests, ...realSongs];
  return state.songs;
}

async function loadSongs() {
  if (VIC_CONFIG.SERVICES.baseUrl) {
    try {
      const result = await serviceRequest(VIC_CONFIG.SERVICES.catalogue);
      state.songs = (result?.songs || result || []).map(normaliseSong);
      applyTestMusic(); saveLocalData(); renderHome(); return state.songs;
    } catch (error) {}
  }
  if (state.backendConnected && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.songsTable).select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      state.songs = (data || []).map(normaliseSong);
      applyTestMusic(); saveLocalData(); renderHome(); return state.songs;
    } catch (error) {}
  }
  applyTestMusic(); renderHome(); return state.songs;
}

async function loadReleases() {
  if (VIC_CONFIG.SERVICES.baseUrl) {
    try {
      const result = await serviceRequest(VIC_CONFIG.SERVICES.releases);
      state.releases = result?.releases || result || [];
      saveLocalData(); state.newRelease = state.releases.length > 0; renderLatest(); updateDots(); return state.releases;
    } catch (error) {}
  }
  if (state.backendConnected && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.releasesTable).select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      state.releases = data || []; saveLocalData();
    } catch (error) {}
  }
  state.newRelease = state.releases.length > 0;
  renderLatest(); updateDots(); return state.releases;
}


/* =========================================================
   8. MONETIZATION & DJ PROFILE
   ========================================================= */
function safeCssLength(value, fallback = "0px") {
  const textValue = String(value ?? "").trim();
  return /^(\d+(\.\d+)?(px|rem|em|vh|vw|%)|0)$/.test(textValue) ? (textValue === "0" ? "0px" : textValue) : fallback;
}

function applyMonetizationSettings(settings = {}) {
  const incoming = settings.display || settings;
  const allowedPlacements = ["bottom", "home-top", "favorites-top", "latest-top"];
  const placement = allowedPlacements.includes(incoming.placement) ? incoming.placement : "bottom";
  state.monetization = {
    enabled: settings.enabled === true, provider: safe(settings.provider || "none").toLowerCase(),
    format: safe(settings.format || "banner").toLowerCase(), placement,
    refreshSeconds: Math.max(0, Math.min(3600, Number(settings.refreshSeconds ?? 0))),
    bannerHeight: safeCssLength(incoming.height ?? settings.bannerHeight, "0px"),
    maxWidth: /^(100%|\d+(\.\d+)?(px|rem|vw))$/.test(String(incoming.maxWidth || "100%")) ? String(incoming.maxWidth || "100%") : "100%",
    gap: safeCssLength(incoming.gap ?? settings.gap, "0px"),
    borderRadius: safeCssLength(incoming.borderRadius ?? settings.borderRadius, "0px")
  };
  const slot = byId("bottomAdPlacement");
  if (slot) {
    const targets = { "bottom": document.body, "home-top": byId("homeScreen"), "favorites-top": byId("favoritesScreen"), "latest-top": byId("latestScreen") };
    const target = targets[placement] || document.body;
    if (placement === "bottom") {
      document.body.appendChild(slot); slot.classList.remove("ad-inline");
      slot.style.position = "fixed"; slot.style.left = "50%"; slot.style.bottom = "calc(var(--nav) + env(safe-area-inset-bottom))";
      slot.style.transform = "translateX(-50%)"; slot.style.width = "min(100%,520px)";
    } else if (target) {
      const anchor = placement === "home-top" ? byId("offlineCard") : placement === "favorites-top" ? $(".favorite-dj-card", target) : $(".latest-heading", target);
      if (anchor) target.insertBefore(slot, anchor); else target.prepend(slot);
      slot.classList.add("ad-inline"); slot.style.position = "relative"; slot.style.left = "auto"; slot.style.bottom = "auto"; slot.style.transform = "none"; slot.style.width = "100%";
    }
    slot.dataset.provider = state.monetization.provider; slot.dataset.format = state.monetization.format; slot.dataset.configuredPlacement = placement;
    slot.style.height = state.monetization.bannerHeight; slot.style.minHeight = "0px"; slot.style.maxWidth = state.monetization.maxWidth;
    slot.style.margin = `${state.monetization.gap} auto`; slot.style.borderRadius = state.monetization.borderRadius;
    slot.hidden = true; document.body.classList.remove("has-ad");
  }
  state.monetizationReady = true;
  const adapters = window.VicSoundAdProviders || {};
  const adapter = adapters[state.monetization.provider];
  if (state.monetization.enabled && state.monetization.format === "banner" && adapter?.mountBanner && slot) {
    Promise.resolve(adapter.mountBanner({ container: slot, settings: state.monetization })).then(result => {
      const filled = result === true || result?.filled === true;
      slot.hidden = !filled;
      if (filled && placement === "bottom") { document.documentElement.style.setProperty("--ad-height", state.monetization.bannerHeight || "54px"); document.body.classList.add("has-ad"); }
    }).catch(() => { slot.hidden = true; });
  }
  return state.monetization;
}

async function loadMonetizationSettings() {
  if (!VIC_CONFIG.SERVICES.baseUrl) { applyMonetizationSettings(VIC_CONFIG.MONETIZATION); return state.monetization; }
  try {
    const settings = await serviceRequest(VIC_CONFIG.SERVICES.monetization);
    applyMonetizationSettings(settings || VIC_CONFIG.MONETIZATION);
  } catch (error) { applyMonetizationSettings(VIC_CONFIG.MONETIZATION); }
  return state.monetization;
}

function applyDJProfile(profile = {}) {
  state.djProfile = { name: safe(profile.name || VIC_CONFIG.DJ.fallbackName), subtitle: safe(profile.subtitle || VIC_CONFIG.DJ.fallbackSubtitle), cover: safe(profile.cover_url || profile.cover || VIC_CONFIG.DJ.fallbackCover) };
  const small = byId("favoriteDjCover"); const large = byId("djCoverLarge");
  [small, large].forEach(element => {
    if (!element) return;
    element.style.backgroundImage = state.djProfile.cover ? `linear-gradient(0deg,rgba(0,0,0,.12),rgba(0,0,0,.12)),url("${state.djProfile.cover.replace(/["\\]/g, "")}")` : "";
    element.style.backgroundSize = "cover"; element.style.backgroundPosition = "center"; element.classList.toggle("has-dj-cover", Boolean(state.djProfile.cover));
  });
  const cardTitle = $(".favorite-dj-card h2"); const cardSubtitle = $(".favorite-dj-card p");
  if (cardTitle) cardTitle.textContent = state.djProfile.name; if (cardSubtitle) cardSubtitle.textContent = state.djProfile.subtitle;
  const djTitle = $("#djOverlay .overlay-head b"); const djSubtitle = $("#djOverlay .overlay-head small");
  if (djTitle) djTitle.textContent = state.djProfile.name; if (djSubtitle) djSubtitle.textContent = state.djProfile.subtitle;
}

async function loadDJProfile() {
  if (!VIC_CONFIG.SERVICES.baseUrl) { applyDJProfile(); return; }
  try { const profile = await serviceRequest(VIC_CONFIG.SERVICES.djProfile); applyDJProfile(profile || {}); } catch (error) { applyDJProfile(); }
}


/* =========================================================
   9. HOME, CATEGORY AND SEARCH
   ========================================================= */
function filteredSongs() {
  const query = state.query.trim().toLowerCase();
  return state.songs.filter(song => {
    const tags = [...song.cat, ...song.mood].map(x => safe(x).toLowerCase());
    const categoryMatch = state.category === "All" || tags.includes(state.category.toLowerCase());
    const searchMatch = !query || song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query) || song.album.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
}

function renderHome() {
  const box = byId("homeMusicList"); if (!box) return;
  const songs = filteredSongs();
  if (!songs.length) { box.innerHTML = `<div class="empty-state"><b>No music found</b><span>Try another search or category.</span></div>`; return; }
  box.innerHTML = songs.map(song => `
    <article class="music-row ${songKey(song.id) === songKey(state.currentId) && state.playing ? "playing" : ""}">
      <button class="music-main" data-play="${escapeHTML(song.id)}" aria-label="Play ${escapeHTML(song.title)}"><img class="cover" src="${escapeHTML(song.cover)}" alt=""></button>
      <button class="music-main" data-play="${escapeHTML(song.id)}"><b>${escapeHTML(song.title)}</b><small>${escapeHTML(song.artist)}</small></button>
      <span class="playing-bars">▮▮▮</span>
      <button class="favorite-toggle ${isSongFavorite(song.id) ? "active" : ""}" data-fav="${escapeHTML(song.id)}" aria-label="${isSongFavorite(song.id) ? "In favorites" : "Add to favorites"}">${isSongFavorite(song.id) ? "♥" : "♡"}</button>
    </article>
  `).join("");
}


/* =========================================================
   10. RELEASES (REAL DOWNLOADS & DATA CONSUMPTION)
   ========================================================= */
const vicReleaseDownloadState = new Map();

function formatDataSize(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function renderLatest() {
  const box = byId("latestList"); if (!box) return;
  
  let displayReleases = [...state.releases];
  if (VIC_TEST_MODE && !displayReleases.some(r => songKey(r.id) === VIC_TEST_RELEASE_ID)) {
    displayReleases.unshift(VIC_TEST_RELEASE);
  }

  if (!displayReleases.length) {
    box.innerHTML = `<div class="empty-state"><b>No new releases yet</b><span>New music will appear here.</span></div>`; return;
  }

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
      action = `<div style="width:100%;margin-top:5px;">
        <div style="width:100%;height:6px;border-radius:99px;background:#203a32;overflow:hidden;margin:5px 0;"><span style="display:block;width:${Math.max(0,Math.min(100,progress.percent || 0))}%;height:100%;background:var(--green);"></span></div>
        <small style="color:var(--muted);font-size:10px;">Downloading — ${downloadedMB} of ${totalMB} (${progress.percent || 0}%)</small>
      </div>`;
    } else {
      action = `<button class="release-action" data-release-download="${escapeHTML(release.id)}" style="margin-top:6px;">⇩ Download　›</button>`;
    }

    return `<article class="release-card">
      <img class="release-cover" src="${escapeHTML(release.cover_url || release.cover || "")}" alt="">
      <div class="release-info">
        <h3>${escapeHTML(release.title || "Untitled release")}</h3>
        <p>${escapeHTML(release.type || "Release")}</p>
        <p>♬ ${trackCount || "—"} songs</p>
        <p>▣ ${escapeHTML(release.release_date || "")}</p>
        ${action}
      </div><span style="color:var(--muted);">›</span></article>`;
  }).join("");
}

async function downloadTestRelease(release) {
  const tracks = VIC_TEST_SONGS.map(normaliseSong);
  if (!navigator.onLine) { notify("Connect to the internet before downloading the test EP."); return; }
  
  let totalBytes = 0;
  for (const track of tracks) {
    try {
      const res = await fetch(track.audio, { method: "HEAD" });
      const len = res.headers.get("content-length");
      if (len) totalBytes += parseInt(len, 10);
    } catch {}
  }
  if (totalBytes === 0) totalBytes = tracks.length * 5 * 1024 * 1024;

  const progress = { active: true, complete: false, done: 0, total: tracks.length, bytes: 0, totalBytes, percent: 0 };
  vicReleaseDownloadState.set(songKey(release.id), progress);
  renderLatest();

  try {
    const cache = await caches.open(VIC_TEST_CONFIG.cacheName);
    let completedBytes = 0;
    
    for (let index = 0; index < tracks.length; index++) {
      const song = tracks[index];
      const url = new URL(song.audio, location.href).href;
      let response = await cache.match(url);
      
      if (!response) {
        const networkResponse = await fetch(url, { mode: "cors" });
        if (!networkResponse.ok) throw new Error(`Could not download ${song.title}.`);
        
        if (networkResponse.body?.getReader) {
          const reader = networkResponse.body.getReader();
          const chunks = [];
          let received = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.byteLength;
            progress.bytes = completedBytes + received;
            progress.percent = Math.round((progress.bytes / totalBytes) * 100);
            renderLatest();
          }
          response = new Response(new Blob(chunks, { type: "audio/mpeg" }), { headers: { "Content-Type": "audio/mpeg" } });
          completedBytes += received;
        } else {
          const blob = await networkResponse.blob();
          response = new Response(blob, { headers: { "Content-Type": "audio/mpeg" } });
          completedBytes += blob.size;
        }
        await cache.put(url, response.clone());
      } else {
        completedBytes += (await response.clone().blob()).size;
      }
      
      progress.bytes = completedBytes;
      progress.done = index + 1;
      progress.percent = Math.round((progress.done / tracks.length) * 100);
      renderLatest();
    }
    
    progress.active = false; progress.complete = true; progress.percent = 100;
    localStorage.setItem("vic-sound-test-ep-downloaded", "1");
    const existingIds = new Set(state.songs.map(songKey));
    state.songs = [...tracks.filter(song => !existingIds.has(songKey(song.id))), ...state.songs];
    tracks.forEach(song => state.downloaded.add(songKey(song.id)));
    saveLocalData(); renderLatest(); renderHome(); updateOfflineCount();
    notify("Test EP downloaded. All five tracks are ready offline.");
  } catch (error) {
    progress.active = false; renderLatest();
    notify(error?.message || "The test download could not be completed.");
  }
}

async function downloadRelease(id) {
  if (songKey(id) === VIC_TEST_RELEASE_ID) {
    await downloadTestRelease(VIC_TEST_RELEASE);
    return;
  }
  notify("Real releases require Creator backend configuration.");
}

/* =========================================================
   11. OFFLINE MUSIC CACHE (REAL ENGINE)
   ========================================================= */
async function getMusicCache(song = null) {
  if (!("caches" in window)) return null;
  const cacheName = song?.isTestTrack ? VIC_TEST_CONFIG.cacheName : VIC_CONFIG.STORAGE.musicCache;
  return caches.open(cacheName);
}

async function getDownloadedSongs() {
  state.downloaded.clear();
  if (!("caches" in window)) return state.downloaded;
  for (const song of state.songs) {
    if (!song.audio) continue;
    try {
      const cache = await getMusicCache(song);
      const url = new URL(song.audio, location.href).href;
      if (cache && await cache.match(url)) state.downloaded.add(songKey(song.id));
    } catch {}
  }
  updateOfflineCount(); return state.downloaded;
}

function updateOfflineCount() {
  const count = byId("offlineCount"); const status = byId("offlineStatus");
  const message = byId("offlineMessage"); const card = byId("offlineCard");
  if (!count) return;

  const total = state.songs.filter(song => song.audio).length;
  const saved = state.downloaded.size;
  
  count.textContent = `${saved} of ${total}`;

  if (!total) { if (status) status.textContent = "Waiting for music"; if (message) message.textContent = "Music will appear here when it is published."; return; }

  const percent = Math.round(saved / total * 100);
  card?.style.setProperty("--offline-progress", `${percent}%`);
  card?.classList.toggle("is-complete", saved === total);
  card?.classList.toggle("is-preparing", saved > 0 && saved < total);

  if (saved === total) { 
    if (status) status.textContent = "Offline ready"; 
    if (message) message.textContent = "Your saved music is ready for offline listening."; 
  }
  else { 
    if (status) status.textContent = navigator.onLine ? "Offline music" : "Offline"; 
    if (message) message.textContent = navigator.onLine ? "Music can be saved for listening without internet." : "Reconnect to save more music for offline listening."; 
  }
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
        const cache = await getMusicCache(song);
        if (!cache) continue;
        const url = new URL(song.audio, location.href).href;
        if (await cache.match(url)) { state.downloaded.add(songKey(song.id)); continue; }
        try {
          const response = await fetch(url, { mode: "cors" });
          if (!response.ok) throw new Error("Audio request failed.");
          await cache.put(url, response.clone());
          state.downloaded.add(songKey(song.id));
        } catch (error) { console.warn("Could not cache", song.title, error); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(VIC_CONFIG.DOWNLOAD_WORKERS, pending.length) }, worker));
  } finally { state.downloadBusy = false; updateOfflineCount(); }
}

/* =========================================================
   12. PLAYBACK SOURCE AND QUEUE
   ========================================================= */
function makeQueue(songs, source) {
  state.queue = songs.map(song => ({ id: song.id, repeatTotal: 1, repeatsLeft: 1 }));
  state.queueIndex = 0;
  state.queueSource = source || { type: "catalogue", label: "Your Music" };
  renderQueue();
}

function currentQueueEntry() { return state.queue[state.queueIndex] || null; }

function setCurrentSong(song) {
  if (!song) return;
  state.currentId = song.id;
  updatePlayer(); renderHome(); updateLyrics(); updateMediaSession();
}

async function loadSong(song, shouldPlay = true, { keepQueue = false } = {}) {
  if (!song) return;
  if (!keepQueue) {
    const sourceSongs = state.queueSource?.type === "collection" ? collectionSongs(state.queueSource.id) : state.queueSource?.type === "category" ? filteredSongs() : state.queueSource?.type === "search" ? filteredSongs() : state.songs;
    const index = sourceSongs.findIndex(item => songKey(item.id) === songKey(song.id));
    if (index >= 0 && state.queue[index]) state.queueIndex = index;
  }

  setCurrentSong(song);
  const url = song.audio || "";
  if (!url) { notify("This song does not have an audio file yet."); return; }

  try {
    const cache = await getMusicCache(song);
    const cached = cache ? await cache.match(new URL(url, location.href).href) : null;
    if (cached) {
      const blob = await cached.blob();
      if (audio._objectURL) URL.revokeObjectURL(audio._objectURL);
      audio._objectURL = URL.createObjectURL(blob);
      audio.src = audio._objectURL;
    } else { audio.src = url; }
    audio.load();
    if (shouldPlay) await audio.play();
  } catch (error) {
    state.playing = false; notify("This song could not play. Check your connection or audio file.");
  }
  updatePlayer();
}

function playFromList(songs, index, source) {
  if (!songs.length) { notify("There are no songs in this list yet."); return; }
  const safeIndex = Math.max(0, Math.min(index, songs.length - 1));
  makeQueue(songs, source); state.queueIndex = safeIndex;
  loadSong(songs[safeIndex], true, { keepQueue: true });
}

function playSongById(id) {
  const list = filteredSongs();
  const index = list.findIndex(song => songKey(song.id) === songKey(id));
  if (index >= 0) {
    playFromList(list, index, { type: state.query ? "search" : state.category === "All" ? "catalogue" : "category", label: state.query ? "Search results" : state.category });
    return;
  }
  const song = state.songs.find(item => songKey(item.id) === songKey(id));
  if (song) playFromList([song], 0, { type: "single", label: song.title });
}

function playNextQueueEntry() {
  if (!state.queue.length) { pause(); return; }
  const entry = currentQueueEntry();
  if (entry && entry.repeatsLeft > 1) { entry.repeatsLeft -= 1; loadSong(getSong(entry.id), true, { keepQueue: true }); renderQueue(); return; }
  if (entry) { entry.repeatsLeft = entry.repeatTotal; }
  if (state.shuffle && state.queue.length > 1) {
    let nextIndex = state.queueIndex;
    while (nextIndex === state.queueIndex) { nextIndex = Math.floor(Math.random() * state.queue.length); }
    state.queueIndex = nextIndex; loadSong(getSong(state.queue[nextIndex].id), true, { keepQueue: true }); return;
  }
  if (state.queueIndex < state.queue.length - 1) { state.queueIndex += 1; loadSong(getSong(state.queue[state.queueIndex].id), true, { keepQueue: true }); return; }
  if (state.repeatMode === 1) { state.queueIndex = 0; loadSong(getSong(state.queue[0].id), true, { keepQueue: true }); } else { pause(); }
}

function getSong(id) { return state.songs.find(song => songKey(song.id) === songKey(id)) || null; }
function next() { playNextQueueEntry(); }
function prev() {
  if (audio.currentTime > 4) { recordDJReplayPreference(getCurrentSong()); audio.currentTime = 0; start(); return; }
  if (state.queueIndex > 0) {
    state.queueIndex -= 1; const entry = currentQueueEntry();
    if (entry) { entry.repeatsLeft = entry.repeatTotal; loadSong(getSong(entry.id), true, { keepQueue: true }); }
  } else if (state.repeatMode === 1 && state.queue.length) {
    state.queueIndex = state.queue.length - 1; loadSong(getSong(currentQueueEntry().id), true, { keepQueue: true });
  } else { audio.currentTime = 0; }
}

function start() { if (!getCurrentSong()) { const songs = filteredSongs(); if (songs.length) playFromList(songs, 0, { type: "catalogue", label: "Your Music" }); return; } audio.play().catch(() => notify("This song could not start.")); }
function pause() { audio.pause(); }
function toggle() { audio.paused ? start() : pause(); }

/* =========================================================
   13. PLAYER UI, MINI PLAYER AND MEDIA SESSION
   ========================================================= */
