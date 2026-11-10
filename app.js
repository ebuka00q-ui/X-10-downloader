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
