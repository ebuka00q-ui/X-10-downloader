/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   ========================================================= */

/* =========================================================
   0. TEMPORARY TEST PACKAGE (TST) - REMOVABLE
   Everything for testing is isolated here. Deleting this block
   will not affect the rest of the application.
   ========================================================= */


const VIC_TEST_CONFIG = Object.freeze({
  enabled: true,
  queryFlag: "test",
  queryValue: "1",
  cacheName: "vic-sound-tst-audio-v2"
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
But we don ear a chorus
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

// The 5 Test Songs (Already in Home)
const VIC_TEST_SONGS = [
  { id: "vic-tst-1", title: "TST 01 — Sound Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: VIC_TEST_COVERS.one, cat: ["Pop", "Test"], mood: ["Calm", "Test"], duration: 180, isTestTrack: true, track_number: 1, release_id: "vic-tst-ep" },
  { id: "vic-tst-2", title: "TST 02 — Shuffle Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3", cover: VIC_TEST_COVERS.two, cat: ["Afrobeats", "Test"], mood: ["Party", "Test"], duration: 150, isTestTrack: true, track_number: 2, release_id: "vic-tst-ep" },
  { id: "vic-tst-3", title: "TST 03 — Bass Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: VIC_TEST_COVERS.one, cat: ["Rap", "Test"], mood: ["Bass", "Test"], duration: 190, isTestTrack: true, track_number: 3, release_id: "vic-tst-ep" },
  { id: "vic-tst-4", title: "TST 04 — Rhythm Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", cover: VIC_TEST_COVERS.two, cat: ["Hip-Hop", "Test"], mood: ["Rhythm", "Test"], duration: 200, isTestTrack: true, track_number: 4, release_id: "vic-tst-ep" },
  { id: "vic-tst-5", title: "TST 05 — Final Check", artist: "Vic-sound Test Music", album: "Temporary Test Tracks", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", cover: VIC_TEST_COVERS.one, cat: ["Trap", "Test"], mood: ["Final", "Test"], duration: 170, isTestTrack: true, track_number: 5, release_id: "vic-tst-ep" }
]);

// The Test Releases (In Latest)
const VIC_TEST_RELEASE_ID = "vic-tst-ep-five";
const VIC_TEST_RELEASE = {
  id: VIC_TEST_RELEASE_ID, title: "Vic-sound Test EP", type: "EP",
  release_date: "Testing", cover_url: VIC_TEST_COVERS.ep,
  tracks: VIC_TEST_SONGS.map(s => s.id), isTestRelease: true
};

const VIC_TEST_RELEASE_WILLIAMS_ID = "vic-tst-williams-ep";
const VIC_TEST_RELEASE_WILLIAMS = {
  id: VIC_TEST_RELEASE_WILLIAMS_ID, title: "Dear Mr Williams", type: "Single",
  release_date: "Testing", cover_url: "https://ccmixter.org/content/Loveshadow/ezgif-82cedba8bd1cbef693x94.gif",
  tracks: ["vic-tst-williams"], isTestRelease: true
};

// The Test Songs
const VIC_TEST_SONGS = [
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
];

// Add the Williams song to the global test pool so it can be found when downloaded


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
  shuffle: false, 
  repeatMode: 1, // DEFAULT: REPEAT ALL (GREEN)
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
  djIntroTimer: null
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

/* =========================================================
   4. NATIVE MODALS
   ========================================================= */
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
   5. LOCAL STORAGE & DATA
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
   6. BACKEND & API
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
  if (VIC_CONFIG.SERVICES.baseUrl) { try { const result = await serviceRequest(VIC_CONFIG.SERVICES.releases); const old = state.releases.length; state.releases = result?.releases || result || []; saveLocalData(); if (state.releases.length > old) state.newRelease = true; renderLatest(); updateDots(); return state.releases; } catch (error) {} }
  if (state.backendConnected && supabaseClient) { try { const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE.releasesTable).select("*").eq("published", true).order("created_at", { ascending: false }); if (error) throw error; const old = state.releases.length; state.releases = data || []; saveLocalData(); if (state.releases.length > old) state.newRelease = true; } catch (error) {} }
  renderLatest(); updateDots(); return state.releases;
}

/* =========================================================
   7. MONETIZATION & DJ PROFILE
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
   8. ROBUST DOWNLOAD ENGINE (IndexedDB + Cache API)
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
   9. LATEST & QUEUE
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
   10. HOME RENDERING
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

/* =========================================================
   11. PLAYBACK & QUEUE
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
   12. PLAYER UI
   ========================================================= */
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
  byId("playerOverlay")?.classList.toggle("playing", state.playing);

  updateModeButtons(); updateDJPlaybackControls();
  
  if (byId("lyricsPlayPause")) byId("lyricsPlayPause").textContent = state.playing ? "Ⅱ" : "▶";
  if (byId("lyricsProgress")) byId("lyricsProgress").value = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  if (byId("lyricsCurrentTime")) byId("lyricsCurrentTime").textContent = formatTime(audio.currentTime);
  if (byId("lyricsDuration")) byId("lyricsDuration").textContent = formatTime(audio.duration || song.duration);
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const song = getCurrentSong(); if (!song) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: song.title, artist: song.artist, album: song.album || "Vic-sound", artwork: song.cover ? [{ src: song.cover }] : [] });
    navigator.mediaSession.setActionHandler("play", start); navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", prev); navigator.mediaSession.setActionHandler("nexttrack", next);
  } catch (error) {}
}

function openPlayer() { byId("playerOverlay")?.classList.add("open"); byId("playerOverlay")?.setAttribute("aria-hidden", "false"); state.player = true; updatePlayer(); }
function closePlayer() { byId("playerOverlay")?.classList.remove("open"); byId("playerOverlay")?.setAttribute("aria-hidden", "true"); state.player = false; }

function setupPlayerSwipe() {
  const overlay = byId("playerOverlay"); if (!overlay || overlay.dataset.swipeReady === "true") return;
  overlay.dataset.swipeReady = "true";
  let startPoint = null;
  const ignoredGestureTarget = target => Boolean(target?.closest("button, input, textarea, select, a, .progress, .player-actions, .main-controls, [role='slider']"));

  overlay.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || !state.player || !overlay.classList.contains("open") || state.queueSource?.type === "dj" || ignoredGestureTarget(event.target)) { startPoint = null; return; }
    startPoint = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  }, { passive: true });

  overlay.addEventListener("pointerup", event => {
    if (!startPoint || event.pointerId !== startPoint.pointerId) return;
    const dx = event.clientX - startPoint.x; const dy = event.clientY - startPoint.y; startPoint = null;
    if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    if (!state.player || !overlay.classList.contains("open") || state.queueSource?.type === "dj" || ignoredGestureTarget(event.target)) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });
  overlay.addEventListener("pointercancel", () => { startPoint = null; }, { passive: true });
}

audio.addEventListener("play", () => { state.playing = true; updatePlayer(); renderHome(); updateMediaSession(); });
audio.addEventListener("pause", () => { state.playing = false; updatePlayer(); renderHome(); });
audio.addEventListener("timeupdate", () => { updatePlayer(); syncLyrics(); });
audio.addEventListener("loadedmetadata", updatePlayer);
audio.addEventListener("error", () => { state.playing = false; updatePlayer(); });
audio.addEventListener("ended", () => { recordCompletedPlay(); if (state.repeatMode === 2) { audio.currentTime = 0; start(); return; } playNextQueueEntry(); });

/* =========================================================
   13. QUEUE UI
   ========================================================= */
function renderQueue() {
  const box = byId("queueList"); if (!box) return;
  const count = byId("queueCount"); if (count) count.textContent = `${state.queue.length} songs`;
  box.innerHTML = state.queue.map((entry, index) => {
    const song = getSong(entry.id); if (!song) return "";
    const current = index === state.queueIndex;
    return `<article class="queue-row ${current ? "current" : ""}" data-queue-index="${index}" draggable="true">
        <span class="queue-num">${index + 1}</span><img src="${escapeHTML(song.cover)}" alt="">
        <button class="queue-song" data-queue-play="${escapeHTML(song.id)}"><b>${escapeHTML(song.title)}</b><small>${escapeHTML(song.artist)}</small></button>
        <button class="repeat-badge" data-queue-repeat="${index}" aria-label="Double-tap to increase repeat count, currently ${entry.repeatTotal} times">×${entry.repeatTotal}</button>
        <button class="row-more" data-queue-remove="${index}" aria-label="Remove from queue">×</button></article>`;
  }).join("");
  updateModeButtons();
}

function setQueueRepeat(index, count) { const entry = state.queue[index]; if (!entry) return; entry.repeatTotal = Math.max(1, Math.min(5, count)); entry.repeatsLeft = entry.repeatTotal; renderQueue(); notify(`This song will play ${entry.repeatTotal} time${entry.repeatTotal === 1 ? "" : "s"}.`); }
function removeQueueSong(index) {
  if (!state.queue[index]) return; const removedCurrent = index === state.queueIndex; state.queue.splice(index, 1);
  if (index < state.queueIndex) state.queueIndex -= 1;
  else if (removedCurrent && state.queue.length) { state.queueIndex = Math.min(index, state.queue.length - 1); const entry = currentQueueEntry(); loadSong(getSong(entry.id), true, { keepQueue: true }); }
  else if (!state.queue.length) { state.queueIndex = 0; pause(); } renderQueue();
}
function openQueue() { byId("queueOverlay")?.classList.add("open"); byId("queueOverlay")?.setAttribute("aria-hidden", "false"); state.queueOpen = true; renderQueue(); }
function closeQueue() { byId("queueOverlay")?.classList.remove("open"); byId("queueOverlay")?.setAttribute("aria-hidden", "true"); state.queueOpen = false; }

/* =========================================================
   14. SHUFFLE AND REPEAT (Default: Repeat All)
   ========================================================= */
function updateModeButtons() {
  const shuffleButtons = [byId("shuffle"), byId("queueShuffle")].filter(Boolean);
  const repeatButtons = [byId("repeat"), byId("playerRepeatTop"), byId("queueRepeat")].filter(Boolean);
  shuffleButtons.forEach(button => { button.textContent = "⤨"; button.classList.toggle("active", state.shuffle); button.setAttribute("aria-pressed", String(state.shuffle)); });
  const repeatSymbol = state.repeatMode === 2 ? "↻¹" : "↻";
  repeatButtons.forEach(button => { button.textContent = repeatSymbol; button.classList.toggle("active", state.repeatMode !== 0); button.dataset.mode = String(state.repeatMode); button.setAttribute("aria-label", ["Repeat off", "Repeat all", "Repeat one"][state.repeatMode]); button.setAttribute("aria-pressed", String(state.repeatMode !== 0)); });
}
function toggleShuffle() { state.shuffle = !state.shuffle; updateModeButtons(); notify(state.shuffle ? "Shuffle is on." : "Shuffle is off."); }
function cycleRepeat() { state.repeatMode = (state.repeatMode + 1) % 3; updateModeButtons(); notify(["Repeat is off.", "Repeat all is on.", " one is on."][state.repeatMode]); }

/* =========================================================
   15. FAVORITES AND COLLECTIONS
   ========================================================= */
function collectionContains(collection, id) { return collection.songs.some(songId => songKey(songId) === songKey(id)); }
function isSongFavorite(id) { return state.collections.some(collection => collectionContains(collection, id)); }
function saveCollections() { writeJSON(VIC_CONFIG.STORAGE.collections, state.collections); renderFavorites(); renderHome(); updatePlayer(); }

function toggleFavorite(id) {
  const key = songKey(id); const memberships = state.collections.filter(collection => collectionContains(collection, key));
  if (memberships.length) { openCollectionPicker(key, memberships.map(item => item.id)); }
  else if (!state.collections.length) { createCollectionForSong(key); }
  else { openCollectionPicker(key, []); }
}

function createCollectionForSong(songId) {
  askText("Name your collection", "Collection name", "", name => {
    const collection = { id: makeId(), name, songs: [songKey(songId)] };
    state.collections.push(collection); saveCollections(); closeModal(); notify(`"${name}" has been created.`);
  });
}

function openCollectionPicker(songId, selectedIds = []) {
  const selected = new Set(selectedIds.map(songKey)); const song = getSong(songId);
  const body = `<p class="vic-modal-note">Choose the collections where this song should appear.</p>
    <div class="vic-check-list">
      ${state.collections.map(collection => `<label class="vic-check-row"><input type="checkbox" value="${escapeHTML(collection.id)}" ${selected.has(songKey(collection.id)) ? "checked" : ""}><span>${escapeHTML(collection.name)}</span><small>${collection.songs.length} sounds</small></label>`).join("")}
    </div><button type="button" class="vic-secondary-action" id="vicCreateCollectionFromPicker">+ Create a new collection</button>`;

  openModal({
    title: song ? `Save ${song.title}` : "Choose collections", body,
    buttons: [
      { label: "Cancel" },
      { label: "Done", action: () => {
          const checked = $$(".vic-check-list input:checked").map(input => input.value);
          state.collections.forEach(collection => {
            const has = collectionContains(collection, songId); const wants = checked.includes(songKey(collection.id));
            if (wants && !has) collection.songs.push(songKey(songId));
            if (!wants && has) { collection.songs = collection.songs.filter(id => songKey(id) !== songKey(songId)); }
          });
          saveCollections(); closeModal();
        }
      }
    ],
    onOpen: panel => {
      $("#vicCreateCollectionFromPicker", panel)?.addEventListener("click", () => {
        askText("Name your collection", "Collection name", "", name => {
          state.collections.push({ id: makeId(), name, songs: [songKey(songId)] }); saveCollections(); closeModal();
          openCollectionPicker(songId, [state.collections.at(-1).id]);
        });
      });
    }
  });
}

function renderFavorites() {
  const box = byId("favoriteGrid"); if (!box) return;
  const count = byId("favoriteCount"); if (count) count.textContent = `${state.collections.length} collection${state.collections.length === 1 ? "" : "s"}`;
  
  if (!state.collections.length) { box.innerHTML = `<div class="empty-state"><b>No collections yet</b><span>Tap a song's heart to create your first collection.</span></div>`; return; }
  
  const emptyCover = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="18" fill="#04130f"/><circle cx="80" cy="80" r="53" fill="none" stroke="#00f5a0" stroke-width="3"/><text x="80" y="100" text-anchor="middle" font-size="58" fill="#00f5a0">🎵</text></svg>');

  box.innerHTML = state.collections.map(collection => {
    const firstSong = collectionSongs(collection.id)[0];
    const songCount = collection.songs.length;
    return `<article class="collection-card">
        <button class="collection-open" data-collection-open="${escapeHTML(collection.id)}" aria-label="Open ${escapeHTML(collection.name)}">
          <img src="${escapeHTML(firstSong?.cover || emptyCover)}" alt="">
          <div class="collection-card-info">
            <b>${escapeHTML(collection.name)}</b>
            <small>${songCount} sound${songCount === 1 ? "" : "s"}</small>
          </div>
        </button>
        <button class="collection-card-more" data-collection-menu="${escapeHTML(collection.id)}" aria-label="Collection options">⋮</button>
      </article>`;
  }).join("");
}

function collectionSongs(id) { const collection = state.collections.find(item => songKey(item.id) === songKey(id)); return collection ? collection.songs.map(getSong).filter(Boolean) : []; }

function openCollection(id) {
  const collection = state.collections.find(item => songKey(item.id) === songKey(id));
  if (!collection) return;
  state.currentCollection = collection.id;

  let view = byId("vicCollectionView");
  if (!view) {
    view = document.createElement("section");
    view.id = "vicCollectionView";
    view.innerHTML = `
      <div class="vic-col-header">
        <button class="back-button" id="vicColBack" style="width:40px; height:40px; background:transparent; border:0; color:var(--text); font-size:28px; transform:rotate(90deg); cursor:pointer;">⌄</button>
        <h2 id="vicColTitle" style="margin:0; font-size:20px; color:var(--text);">Collection</h2>
      </div>
      <div class="vic-col-hero">
        <img id="vicColCover" src="" alt="">
      </div>
      <div class="vic-col-tracks" id="vicColTracks"></div>
    `;
    document.body.appendChild(view);
    
    byId("vicColBack").addEventListener("click", () => {
      view.classList.remove("open");
      state.currentCollection = null;
    });

    view.addEventListener("click", event => {
      const trackItem = event.target.closest(".vic-track-item");
      if (trackItem && !event.target.closest(".vic-track-fav")) {
        const songId = trackItem.dataset.songId;
        const songs = collectionSongs(state.currentCollection);
        playFromList(songs, songs.findIndex(s => songKey(s.id) === songKey(songId)), { type: "collection", id: state.currentCollection, label: collection.name });
        return;
      }

      const favBtn = event.target.closest("[data-vic-track-fav]");
      if (favBtn) {
        const songId = favBtn.dataset.vicTrackFav;
        const col = state.collections.find(c => songKey(c.id) === songKey(state.currentCollection));
        if (col) {
           col.songs = col.songs.filter(s => songKey(s) !== songKey(songId));
           saveCollections();
           openCollection(state.currentCollection); // Re-render view
        }
      }
    });
  }

  const songs = collectionSongs(id);
  const emptyCover = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="18" fill="#04130f"/><circle cx="80" cy="80" r="53" fill="none" stroke="#00f5a0" stroke-width="3"/><text x="80" y="100" text-anchor="middle" font-size="58" fill="#00f5a0">🎵</text></svg>');

  byId("vicColTitle").textContent = collection.name;
  byId("vicColCover").src = songs[0]?.cover || emptyCover;
  byId("vicColTracks").innerHTML = songs.length ? songs.map(song => `
    <div class="vic-track-item" data-song-id="${escapeHTML(song.id)}">
      <img src="${escapeHTML(song.cover)}" alt="">
      <div class="vic-track-info">
        <b>${escapeHTML(song.title)}</b>
        <small>${escapeHTML(song.artist)}</small>
      </div>
      <button class="vic-track-fav active" data-vic-track-fav="${escapeHTML(song.id)}">♥</button>
    </div>
  `).join("") : `<p style="color:var(--muted); text-align:center; margin-top:20px;">No songs in this collection.</p>`;

  view.classList.add("open");
}

function collectionMenu(id) {
  const collection = state.collections.find(item => songKey(item.id) === songKey(id)); if (!collection) return;
  openModal({
    title: collection.name, body: `<p class="vic-modal-note">Manage this collection.</p>`,
    buttons: [
      { label: "Cancel" },
      { label: "Add songs", action: () => { closeModal(); openAddSongs(collection.id); } },
      { label: "Remove songs", action: () => { closeModal(); openCollection(collection.id); } }, 
      { label: "Rename", action: () => { closeModal(); askText("Rename collection", "New collection name", collection.name, name => { collection.name = name; saveCollections(); closeModal(); }); } },
      { label: "Remove collection", danger: true, action: () => { state.collections = state.collections.filter(item => songKey(item.id) !== songKey(id)); saveCollections(); closeModal(); notify("Collection removed. Your music is safe."); } }
    ]
  });
}

function openAddSongs(collectionId) {
  const collection = state.collections.find(item => songKey(item.id) === songKey(collectionId)); if (!collection) return;
  const body = `<p class="vic-modal-note">Select one or more songs, then press Done.</p><div class="vic-collection-track-list">${state.songs.map(song => `<label class="vic-track-choice"><input type="checkbox" value="${escapeHTML(song.id)}" ${collectionContains(collection, song.id) ? "checked" : ""}><img src="${escapeHTML(song.cover)}" alt=""><span><b>${escapeHTML(song.title)}</b><small>${escapeHTML(song.artist)}</small></span></label>`).join("")}</div>`;
  openModal({
    title: `Add to ${collection.name}`, body,
    buttons: [
      { label: "Cancel" },
      { label: "Done", action: () => {
          const selected = $$(".vic-collection-track-list input:checked").map(input => songKey(input.value));
          collection.songs = [...new Set(selected)]; saveCollections(); closeModal(); notify("Collection updated.");
        }
      }
    ]
  });
}

/* =========================================================
   16. LYRICS
   ========================================================= */
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

/* =========================================================
   17. DJ ENGINE (Offline/Online)
   ========================================================= */
function recordCompletedPlay() {
  const song = getCurrentSong(); if (!song) return;
  const key = songKey(song.id); state.playedSongs[key] = (state.playedSongs[key] || 0) + 1;
  state.djHistory.push({ id: key, title: song.title, artist: song.artist, genres: song.cat, moods: song.mood, at: Date.now(), completed: true });
  state.djHistory = state.djHistory.slice(-VIC_CONFIG.DJ.historyLimit); state.djCompletedSinceSuggestion += 1; saveLocalData();
  if (state.djCompletedSinceSuggestion >= VIC_CONFIG.DJ.autoSuggestionEvery) { state.djCompletedSinceSuggestion = 0; autoDJRecommendation(); }
}

function recordSkip(song = getCurrentSong()) { if (!song) return; const key = songKey(song.id); state.skippedSongs[key] = (state.skippedSongs[key] || 0) + 1; saveLocalData(); }
function recordDJReplayPreference(song = getCurrentSong()) {
  if (!song) return; const key = songKey(song.id); state.playedSongs[key] = (state.playedSongs[key] || 0) + 1;
  state.djHistory.push({ id: key, title: song.title, artist: song.artist, genres: song.cat, moods: song.mood, at: Date.now(), replayed: true });
  state.djHistory = state.djHistory.slice(-VIC_CONFIG.DJ.historyLimit); saveLocalData();
}

function scoreSongForDJ(song, request = "") {
  const query = request.toLowerCase(); const tokens = query.split(/\s+/).filter(word => word.length > 2);
  const tags = [song.title, song.artist, song.album, ...(song.cat || []), ...(song.mood || [])].join(" ").toLowerCase();
  let score = 0; tokens.forEach(token => { if (tags.includes(token)) score += 3; });
  const key = songKey(song.id); score += Math.min(5, (state.playedSongs[key] || 0) * 0.5); score -= Math.min(8, (state.skippedSongs[key] || 0) * 1.5);
  const recentlyPlayed = state.djHistory.slice(-8).some(item => item.id === key); if (recentlyPlayed) score -= 4;
  if (state.favorites.has(key) || isSongFavorite(key)) score += 2; return score;
}

function localDJPick(request = "", limit = 8) { return [...state.songs].filter(song => song.audio).map(song => ({ song, score: scoreSongForDJ(song, request) })).sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.song); }

function detectMoodWords(text) {
  const value = text.toLowerCase();
  const map = [
    { words: ["sad", "down", "heartbroken", "cry", "lonely"], tags: ["sad", "calm", "moody"] },
    { words: ["happy", "party", "dance", "energy", "energetic"], tags: ["party", "upbeat", "afrobeats"] },
    { words: ["love", "romantic", "girlfriend", "boyfriend"], tags: ["love", "romantic"] },
    { words: ["sleep", "relax", "calm", "quiet"], tags: ["calm", "soft"] },
    { words: ["rap", "bars", "flow"], tags: ["rap", "hip-hop"] }
  ];
  return map.find(item => item.words.some(word => value.includes(word)))?.tags || [];
}

function localDJReply(text) {
  const moodTags = detectMoodWords(text); const request = `${text} ${moodTags.join(" ")}`; const picks = localDJPick(request, 8);
  if (!picks.length) { return { message: navigator.onLine ? "I'm still getting to know your music taste. Try asking for a genre, mood or artist." : "I'd love to find the right music for you. Reconnect when you can for a more personal DJ experience. I can still use your saved listening history while you're offline.", songs: [] }; }
  const first = picks[0]; const gentle = moodTags.includes("sad") ? "I hear you. Let's find something that fits the moment." : "Alright, I've got a few songs in mind for you.";
  return { message: `${gentle} I'm starting with "${first.title}" by ${first.artist}.`, songs: picks };
}

async function requestOnlineDJ(text) {
  if (!navigator.onLine || !VIC_CONFIG.SERVICES.baseUrl) throw new Error("DJ online service is unavailable.");
  return serviceRequest(VIC_CONFIG.SERVICES.djChat, { method: "POST", body: JSON.stringify({ message: text, currentSong: getCurrentSong(), listeningHistory: state.djHistory.slice(-20), skippedSongs: state.skippedSongs, favoriteIds: [...state.favorites], collections: state.collections.map(item => ({ name: item.name, songIds: item.songs })) }) });
}

async function command(text) {
  const value = safe(text).trim(); if (!value || state.djBusy) return;
  state.djBusy = true; if (byId("djSend")) byId("djSend").disabled = true;
  try {
    let result = null;
    if (navigator.onLine && VIC_CONFIG.SERVICES.baseUrl) { try { result = await requestOnlineDJ(value); state.djOnline = true; } catch (error) {} }
    if (!result) { state.djOnline = false; result = localDJReply(value); if (!navigator.onLine) result.message += " Reconnect to enjoy the DJ's full personalised experience."; }
    if (byId("djReply")) byId("djReply").textContent = result.message || "I've found something for you.";
    if (Array.isArray(result.songs) && result.songs.length) {
      const songs = result.songs.map(item => typeof item === "object" ? getSong(item.id) || normaliseSong(item) : getSong(item)).filter(Boolean);
      if (songs.length) { playFromList(songs, 0, { type: "dj", label: "Vic-sound DJ" }); state.djLastSuggestedId = songs[0].id; }
    }
  } finally { state.djBusy = false; if (byId("djSend")) byId("djSend").disabled = false; }
}

async function autoDJRecommendation() {
  const picks = localDJPick("", 8); if (!picks.length) return;
  const repeated = Object.entries(state.playedSongs).sort((a, b) => b[1] - a[1])[0]; const repeatedSong = repeated ? getSong(repeated[0]) : null;
  let message = "I'm switching things up with a fresh selection for you.";
  if (repeatedSong && (state.playedSongs[songKey(repeatedSong.id)] || 0) >= VIC_CONFIG.DJ.repeatNoticeThreshold) { message = `You've played "${repeatedSong.title}" a lot. Let me bring in something different you may enjoy.`; }
  else { message = `I've picked something new for you. Let's try "${picks[0].title}".`; }
  state.lastAutoDJMessageAt = Date.now(); if (state.djOpen && byId("djReply")) byId("djReply").textContent = message;
  const protectedSource = ["collection", "category", "search"].includes(state.queueSource?.type);
  if (!protectedSource && picks[0].id !== state.djLastSuggestedId) {
    const current = getCurrentSong(); const nextSongs = [...(current ? [current] : []), ...picks.filter(song => songKey(song.id) !== songKey(state.currentId))];
    if (nextSongs.length > 1) { makeQueue(nextSongs, { type: "dj", label: "Vic-sound DJ" }); state.queueIndex = 0; state.djLastSuggestedId = nextSongs[1].id; }
  }
}

/* =========================================================
   18. DJ SCREEN AND VOICE
   ========================================================= */
function ensureDJPlaybackControls() {
  const overlay = byId("djOverlay"); if (!overlay) return;
  let controls = byId("vicDJPlaybackControls");
  if (!controls) {
    controls = document.createElement("div"); controls.id = "vicDJPlaybackControls"; controls.className = "vic-dj-playback"; controls.setAttribute("aria-label", "DJ music controls");
    controls.innerHTML = `<button type="button" id="vicDJPrevious" aria-label="Play previous DJ song" title="Previous song">⏮</button><button type="button" id="vicDJPlayPause" class="vic-dj-main-play" aria-label="Play music" title="Play or pause">▶</button><button type="button" id="vicDJNext" aria-label="Skip this DJ song and choose another" title="Next DJ song">⏭</button>`;
    const anchor = byId("djWave") || byId("djReply") || overlay.querySelector(".overlay-head");
    if (anchor?.parentNode) anchor.parentNode.insertBefore(controls, anchor.nextSibling); else overlay.appendChild(controls);
    byId("vicDJPrevious").addEventListener("click", playPreviousDJSong); byId("vicDJPlayPause").addEventListener("click", toggle); byId("vicDJNext").addEventListener("click", playNextDJSong);
  }
  updateDJPlaybackControls();
}

function updateDJPlaybackControls() {
  const playButton = byId("vicDJPlayPause"); const previousButton = byId("vicDJPrevious"); const nextButton = byId("vicDJNext");
  if (playButton) { playButton.textContent = state.playing ? "Ⅱ" : "▶"; playButton.setAttribute("aria-label", state.playing ? "Pause music" : "Play music"); }
  if (previousButton) { previousButton.disabled = !(state.queueSource?.type === "dj" && state.queueIndex > 0); }
  if (nextButton) { nextButton.disabled = !state.songs.some(song => song.audio && songKey(song.id) !== songKey(state.currentId)); }
}

function playNextDJSong() {
  const current = getCurrentSong(); if (!current) { playDJNow(); return; }
  recordSkip(current);
  const alternatives = localDJPick("", Math.max(12, state.songs.length)).filter(song => song.audio && songKey(song.id) !== songKey(current.id));
  if (!alternatives.length) { notify("There isn't another playable song in the DJ catalogue yet."); updateDJPlaybackControls(); return; }
  makeQueue([current, ...alternatives], { type: "dj", label: "Vic-sound DJ" }); state.queueIndex = 1; state.djLastSuggestedId = alternatives[0].id;
  if (byId("djReply")) { byId("djReply").textContent = `Let's try something different: "${alternatives[0].title}".`; }
  loadSong(alternatives[0], true, { keepQueue: true }); updateDJPlaybackControls();
}

function playPreviousDJSong() {
  if (state.queueSource?.type !== "dj" || state.queueIndex <= 0) { notify("There is no previous DJ song yet."); return; }
  state.queueIndex -= 1; const entry = currentQueueEntry(); if (!entry) return;
  entry.repeatsLeft = entry.repeatTotal; loadSong(getSong(entry.id), true, { keepQueue: true }); updateDJPlaybackControls();
}

function openDJ() { ensureDJPlaybackControls(); byId("djOverlay")?.classList.add("open"); byId("djOverlay")?.setAttribute("aria-hidden", "false"); state.djOpen = true; }
function closeDJ() { stopVoice(); clearTimeout(state.djIntroTimer); byId("djOverlay")?.classList.remove("open"); byId("djOverlay")?.setAttribute("aria-hidden", "true"); state.djOpen = false; }

function speakDJIntro() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance("I see you. What kind of vibe are we feeling today?");
  const voices = window.speechSynthesis.getVoices();
  const ukVoice = voices.find(v => v.lang.includes("en-GB") || v.lang.includes("en_GB"));
  if (ukVoice) utterance.voice = ukVoice;
  utterance.rate = 0.95; utterance.pitch = 0.8;
  
  window.speechSynthesis.speak(utterance);
  
  clearTimeout(state.djIntroTimer);
  state.djIntroTimer = setTimeout(() => {
    if (state.djOpen && !state.playing) {
      const fallback = new SpeechSynthesisUtterance("No worries. I'll take the lead and find something you might like.");
      if (ukVoice) fallback.voice = ukVoice;
      fallback.rate = 0.95; fallback.pitch = 0.8;
      window.speechSynthesis.speak(fallback);
      playDJNow();
    }
  }, 4000); // 4 seconds
}

function playDJNow() {
  openDJ();
  const picks = localDJPick("", 12);
  if (!picks.length) { if (byId("djReply")) byId("djReply").textContent = "Your music will appear here when the catalogue is available."; return; }
  if (byId("djReply")) byId("djReply").textContent = `Okay, I'm putting together a selection for you. Starting with "${picks[0].title}".`;
  playFromList(picks, 0, { type: "dj", label: "Vic-sound DJ" });
}

let recognition = null; let voiceTimer = null;
function setupVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) return;
  recognition = new SpeechRecognition(); recognition.lang = "en-NG"; recognition.continuous = false; recognition.interimResults = true;
  recognition.onstart = () => { byId("djMic")?.classList.add("listening"); byId("djOverlay")?.classList.add("listening"); };
  recognition.onresult = event => { let transcript = ""; for (let i = event.resultIndex; i < event.results.length; i++) { transcript += event.results[i][0].transcript; } if (byId("djInput")) byId("djInput").value = transcript; };
  recognition.onend = () => { byId("djMic")?.classList.remove("listening"); byId("djOverlay")?.classList.remove("listening"); };
}

function startVoice() {
  if (!recognition) { notify("Voice input is not supported in this browser."); return; }
  try { recognition.start(); } catch { return; }
  clearTimeout(voiceTimer); voiceTimer = setTimeout(stopVoice, 30000);
}

function stopVoice() { clearTimeout(voiceTimer); try { recognition?.stop(); } catch {} byId("djMic")?.classList.remove("listening"); byId("djOverlay")?.classList.remove("listening"); }

/* =========================================================
   19. TIMER & NOTIFICATIONS
   ========================================================= */
function openTimer() { byId("timerSheet")?.classList.add("open"); byId("timerSheet")?.setAttribute("aria-hidden", "false"); }
function closeTimer() { byId("timerSheet")?.classList.remove("open"); byId("timerSheet")?.setAttribute("aria-hidden", "true"); }
function clearPlaybackTimer() { clearTimeout(state.timerId); state.timerId = null; }
function setTimer(minutes) {
  clearPlaybackTimer(); state.timerMode = "minutes";
  state.timerId = setTimeout(() => { pause(); state.timerMode = "off"; closeTimer(); notify("Your playback timer has finished."); }, minutes * 60000);
  $$(".timer-options button").forEach(button => button.classList.toggle("selected", Number(button.dataset.min) === minutes));
  byId("endTrack")?.classList.remove("selected"); byId("timerOff")?.classList.remove("selected"); closeTimer();
}
function setEndTrackTimer() { clearPlaybackTimer(); state.timerMode = "end"; $$(".timer-options button").forEach(button => button.classList.remove("selected")); byId("endTrack")?.classList.add("selected"); byId("timerOff")?.classList.remove("selected"); closeTimer(); }
function offTimer() { clearPlaybackTimer(); state.timerMode = "off"; $$(".timer-options button").forEach(button => button.classList.remove("selected")); byId("endTrack")?.classList.remove("selected"); byId("timerOff")?.classList.add("selected"); closeTimer(); }

async function setNotifications(enabled) {
  if (!enabled) { state.notifications = false; localStorage.setItem(VIC_CONFIG.STORAGE.notifications, "false"); notify("Release notifications turned off."); return; }
  if (!("Notification" in window)) { if (byId("notificationSwitch")) byId("notificationSwitch").checked = false; notify("This browser does not support notifications."); return; }
  const permission = await Notification.requestPermission();
  state.notifications = permission === "granted"; localStorage.setItem(VIC_CONFIG.STORAGE.notifications, String(state.notifications));
  if (!state.notifications && byId("notificationSwitch")) { byId("notificationSwitch").checked = false; }
  notify(state.notifications ? "Release notifications enabled." : "Notification permission was not granted.");
}
function updateDots() { ["latestDot", "navDot", "headerDot"].forEach(id => { byId(id)?.classList.toggle("show", Boolean(state.newRelease)); }); }

/* =========================================================
   20. NAVIGATION, SEARCH, BACK
   ========================================================= */
function go(screen) {
  state.screen = screen;
  byId("homeScreen")?.classList.toggle("active", screen === "home");
  byId("favoritesScreen")?.classList.toggle("active", screen === "favorites");
  byId("latestScreen")?.classList.toggle("active", screen === "latest");
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.screen === screen));
  const searchToggle = byId("searchToggle"); if (searchToggle) searchToggle.style.visibility = screen === "home" ? "visible" : "hidden";
  if (screen === "latest") { state.newRelease = false; updateDots(); }
  renderHome(); renderFavorites(); renderLatest();
}

function openSearch() { if (state.screen !== "home") return; byId("searchPanel")?.classList.add("open"); byId("searchPanel")?.setAttribute("aria-hidden", "false"); setTimeout(() => byId("searchInput")?.focus(), 50); }
function closeSearch() { state.query = ""; if (byId("searchInput")) byId("searchInput").value = ""; byId("searchPanel")?.classList.remove("open"); byId("searchPanel")?.setAttribute("aria-hidden", "true"); renderHome(); }
function closePopups() { byId("notificationPopover")?.classList.add("hidden"); }

function back() {
  if (byId("vicCollectionView")?.classList.contains("open")) {
    byId("vicCollectionView").classList.remove("open");
    state.currentCollection = null;
    return;
  }
  if (state.modalOpen) { closeModal(); return; }
  if (byId("notificationPopover") && !byId("notificationPopover").classList.contains("hidden")) { closePopups(); return; }
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

/* =========================================================
   21. EVENT LISTENERS
   ========================================================= */
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
  setupPlayerSwipe();
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
  byId("queueList")?.addEventListener("click", event => {
    const fav = event.target.closest("[data-fav]"); if (fav) { toggleFavorite(fav.dataset.fav); return; }
    const play = event.target.closest("[data-queue-play]"); if (play) { const index = state.queue.findIndex(item => songKey(item.id) === songKey(play.dataset.queuePlay)); if (index >= 0) { state.queueIndex = index; const entry = currentQueueEntry(); if (entry) entry.repeatsLeft = entry.repeatTotal; loadSong(getSong(play.dataset.queuePlay), true, { keepQueue: true }); } return; }
    const repeat = event.target.closest("[data-queue-repeat]"); if (repeat) { const now = Date.now(); const lastTap = Number(repeat.dataset.lastTap || 0); repeat.dataset.lastTap = String(now); if (now - lastTap <= 350) { const index = Number(repeat.dataset.queueRepeat); const entry = state.queue[index]; if (entry && entry.repeatTotal < 5) setQueueRepeat(index, entry.repeatTotal + 1); } return; }
    const remove = event.target.closest("[data-queue-remove]"); if (remove) removeQueueSong(Number(remove.dataset.queueRemove));
  });
  const queueShuffleButton = $('[aria-label="Shuffle queue"]'); if (queueShuffleButton) { queueShuffleButton.id = "queueShuffle"; queueShuffleButton.addEventListener("click", toggleShuffle); }
  const queueRepeatButton = $('[aria-label="Repeat queue"]'); if (queueRepeatButton) { queueRepeatButton.id = "queueRepeat"; queueRepeatButton.addEventListener("click", cycleRepeat); }
  $$(".timer-options button").forEach(button => button.addEventListener("click", () => setTimer(Number(button.dataset.min))));
  byId("endTrack")?.addEventListener("click", setEndTrackTimer);
  byId("timerOff")?.addEventListener("click", offTimer);
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

/* =========================================================
   22. INITIALISE
   ========================================================= */
async function init() {
  getAnonymousId(); loadLocalData(); applyTestMusic(); setupVoice(); bindEvents();
  renderHome(); renderFavorites(); renderLatest(); updateDots(); updateModeButtons();
  await getDownloadedSongs(); updateOfflineCount(); applyDJProfile(); await loadDJProfile();
  if (state.songs.length) { makeQueue(state.songs, { type: "catalogue", label: "Your Music" }); setCurrentSong(state.songs[0]); }
  await connectBackend(); await loadSongs(); await loadReleases(); await loadMonetizationSettings();
  if (state.songs.length && !state.currentId) { makeQueue(state.songs, { type: "catalogue", label: "Your Music" }); setCurrentSong(state.songs[0]); }
  if (navigator.onLine) prepareOfflineMusic();
  if ("storage" in navigator && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  window.addEventListener("online", () => { loadSongs(); loadReleases(); loadDJProfile(); loadMonetizationSettings(); prepareOfflineMusic(); });
  window.addEventListener("offline", updateOfflineCount);
  setupBackNavigation();
}

window.VicSoundListener = {
  connectBackend, loadSongs, loadReleases, loadDJProfile, loadMonetizationSettings,
  applyMonetizationSettings, applyDJProfile, playSongById, playDJNow,
  toggleFavorite, openCollection, getState: () => state, testMode: VIC_TEST_MODE,
  clearTestCache: async () => { if ("caches" in window) await caches.delete(VIC_TEST_CONFIG.cacheName); state.downloaded = new Set([...state.downloaded].filter(id => !String(id).startsWith("vic-tst-"))); updateOfflineCount(); }
};

init();
