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

// The 5 Test Songs (Already in Home)
const VIC_TEST_SONGS = Object.freeze([
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

const VIC_TEST_SONG_WILLIAMS = {
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
};

// Add the Williams song to the global test pool so it can be found when downloaded
VIC_TEST_SONGS.push(VIC_TEST_SONG_WILLIAMS);

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

  cons
