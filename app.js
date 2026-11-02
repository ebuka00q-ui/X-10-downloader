/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   Provider-independent Listener application
   Existing HTML/CSS interface is preserved.
   ========================================================= */

/* =========================================================
   0. TEMPORARY TEST MUSIC (TST)
   Keep these two test tracks while checking the Listener.
   To show them, open the app with ?test=1 at the end of its address.
   To remove them for public launch, change enabled to false.
   Test audio is stored in its own cache, separate from real releases.
   ========================================================= */
const VIC_TEST_CONFIG = Object.freeze({
  enabled: true,
  queryFlag: "test",
  queryValue: "1",
  cacheName: "vic-sound-tst-audio-v1"
});
const VIC_TEST_MODE = VIC_TEST_CONFIG.enabled &&
  new URLSearchParams(location.search).get(VIC_TEST_CONFIG.queryFlag) === VIC_TEST_CONFIG.queryValue;
const VIC_TEST_SONG = Object.freeze({
  id: "vic-tst-track-one",
  title: "TST 01 — Sound Check",
  artist: "Vic-sound Test Music",
  album: "Temporary Test Tracks",
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  cover: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#020807"/><stop offset="1" stop-color="#0b4937"/></linearGradient></defs><rect width="700" height="700" fill="url(#g)"/><circle cx="350" cy="350" r="205" fill="none" stroke="#00f5a0" stroke-width="8" opacity=".7"/><path d="M110 350h65l35-90 55 180 55-145 55 110 50-90 45 35h85" fill="none" stroke="#00f5a0" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><text x="350" y="610" fill="#f3fffb" font-size="42" text-anchor="middle" font-family="Arial">VIC-SOUND TST 01</text></svg>'),
  genre: ["Pop", "Test"],
  mood: ["Calm", "Test"],
  lyrics: "Temporary test track for playback checks.",
  isTestTrack: true
});
const VIC_TEST_SONG_TWO = Object.freeze({
  id: "vic-tst-track-two",
  title: "TST 02 — Shuffle Check",
  artist: "Vic-sound Test Music",
  album: "Temporary Test Tracks",
  audio: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80",
  genre: ["Afrobeats", "Pop", "Test"],
  mood: ["Party", "Upbeat", "Test"],
  lyrics: "Temporary second test track for shuffle and repeat checks.",
  isTestTrack: true
});
const VIC_TEST_SONGS = Object.freeze([VIC_TEST_SONG, VIC_TEST_SONG_TWO]);

/* =========================================================
   1. SERVICE CONNECTIONS
   Change providers on the server without rewriting this app.
   Never place private API keys or service-role keys here.
   ========================================================= */

const VIC_CONFIG = Object.freeze({
  // Supabase is the current data provider. Its public key is safe
  // only when Row Level Security is correctly configured.
  SUPABASE: {
    url: "https://gkfivuvtpfetzatzhnaq.supabase.co",
    publishableKey: "PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
    songsTable: "songs",
    releasesTable: "releases"
  },

  // Stable Vic-sound service endpoints. The server can change
  // its database, storage, AI or advertising provider independently.
  SERVICES: {
    baseUrl: "", // Paste the PUBLIC Vic-sound backend base URL here when ready. Example: https://api.your-domain.com
    catalogue: "/listener/catalogue",
    releases: "/listener/releases",
    djProfile: "/listener/dj-profile",
    djRecommend: "/listener/dj/recommend",
    djChat: "/listener/dj/chat",
    downloadPermission: "/listener/download-permission",
    playback: "/listener/playback",
    monetization: "/listener/monetization-config"
  },

  // Public media delivery URL only. Never put an R2 secret/access key here.
  // Leave blank when the catalogue already supplies complete audio/cover URLs.
  MEDIA: {
    publicDeliveryBaseUrl: ""
  },

  // Creator owns these settings. Listener reads the published settings;
  // provider-specific credentials stay on the backend/provider dashboard.
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

  // DJ image can be changed here for testing. In production,
  // the Creator catalogue should publish it through djProfile.
  DJ: {
    fallbackName: "Vic-sound DJ",
    fallbackSubtitle: "Your personal music companion",
    fallbackCover: "",
    autoSuggestionEvery: 10,
    repeatNoticeThreshold: 5,
    historyLimit: 100
  },

  STORAGE: {
    musicCache: "vic-sound-music-v2",
    state: "vic-sound-listener-state-v2",
    songs: "vic-sound-songs-v2",
    releases: "vic-sound-releases-v2",
    favorites: "vic-sound-favorites-v2",
    collections: "vic-sound-collections-v2",
    history: "vic-sound-listening-history-v2",
    anonymousId: "vic-sound-anonymous-id-v2",
    notifications: "vic-sound-notifications-v2"
  },

  DOWNLOAD_WORKERS: 1,
  REQUEST_TIMEOUT: 12000
});

/* =========================================================
   2. APP STATE
   ========================================================= */

const state = {
  screen: "home",
  category: "All",
  query: "",
  songs: [],
  releases: [],
  currentId: null,
  playing: false,

  // Queue entries have their own remaining repeat count.
  // Each item: { id, repeatsLeft, repeatTotal }
  queue: [],
  queueIndex: 0,
  queueSource: { type: "catalogue", label: "Your Music" },

  shuffle: false,
  repeatMode: 0, // 0 off, 1 repeat all, 2 repeat one

  // A song can belong to multiple collections.
  collections: [],
  favorites: new Set(),

  player: false,
  queueOpen: false,
  djOpen: false,
  lyricsOpen: false,

  timerMode: "end",
  timerId: null,

  notifications: false,
  newRelease: false,

  downloaded: new Set(),
  downloadBusy: false,

  anonymousId: null,
  backendConnected: false,
  backendError: null,
  monetization: { ...VIC_CONFIG.MONETIZATION },
  monetizationReady: false,

  djProfile: {
    name: VIC_CONFIG.DJ.fallbackName,
    subtitle: VIC_CONFIG.DJ.fallbackSubtitle,
    cover: VIC_CONFIG.DJ.fallbackCover
  },
  djOnline: false,
  djBusy: false,
  djCompletedSinceSuggestion: 0,
  djLastSuggestedId: null,
  djHistory: [],
  skippedSongs: {},
  playedSongs: {},
  lastAutoDJMessageAt: 0,

  collectionBeingEdited: null,
  modalOpen: false
};

/* =========================================================
   3. DOM HELPERS
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const audio = $("#audio");

const safe = value => String(value ?? "");
const songKey = id => String(id);

function escapeHTML(value) {
  return safe(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatTime(seconds) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ||
    `vic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCurrentSong() {
  return state.songs.find(song => songKey(song.id) === songKey(state.currentId)) || null;
}

function byId(id) {
  return document.getElementById(id);
}

function notify(message) {
  let toast = byId("vicMessage");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "vicMessage";
    toast.className = "vic-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

/* =========================================================
   4. VIC-SOUND NATIVE MODALS
   No browser prompt(), alert() or confirm() popups.
   ========================================================= */

function injectVicEnhancementStyles() {
  if (byId("vicEnhancementStyles")) return;
  const style = document.createElement("style");
  style.id = "vicEnhancementStyles";
  style.textContent = `
    .vic-toast{position:fixed;left:50%;bottom:calc(var(--nav,68px) + 78px);z-index:260;max-width:88%;padding:12px 17px;border:1px solid rgba(0,245,160,.35);border-radius:14px;background:#09221c;color:#f3fffb;text-align:center;font-size:13px;opacity:0;transform:translate(-50%,12px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
    .vic-toast.show{opacity:1;transform:translate(-50%,0)}
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
    .queue-row{grid-template-columns:28px 45px minmax(0,1fr) auto auto}
    .queue-row .queue-song{min-width:0}
    .queue-row .repeat-badge{white-space:nowrap}
    .queue-row .row-more{min-width:30px}
    .favorite-dj-card{position:sticky;top:82px}
    .favorite-dj-card .dj-cover-small.has-dj-cover,.dj-cover-large.has-dj-cover{background-repeat:no-repeat;background-size:cover;background-position:center}
    .favorite-dj-card .dj-cover-small.has-dj-cover span,.dj-cover-large.has-dj-cover span{opacity:0}
    @media(prefers-reduced-motion:reduce){.vic-toast{transition:none}}
  `;
  document.head.appendChild(style);
}

function ensureModal() {
  let modal = byId("vicNativeModal");
  if (modal) return modal;

  modal = document.createElement("section");
  modal.id = "vicNativeModal";
  modal.className = "modal hidden";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `<div class="confirm" role="dialog" aria-modal="true"></div>`;
  document.querySelector(".app-shell")?.appendChild(modal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  return modal;
}

function openModal({ title, body = "", buttons = [], onOpen = null }) {
  const modal = ensureModal();
  const panel = $(".confirm", modal);
  panel.innerHTML = `
    <h2>${escapeHTML(title)}</h2>
    <div class="vic-modal-body">${body}</div>
    <div class="vic-modal-actions">
      ${buttons.map((button, index) => `
        <button type="button" data-modal-action="${index}"
          class="${button.danger ? "danger" : ""}">
          ${escapeHTML(button.label)}
        </button>
      `).join("")}
    </div>
  `;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  state.modalOpen = true;

  buttons.forEach((button, index) => {
    $(`[data-modal-action="${index}"]`, panel)?.addEventListener("click", () => {
      if (button.keepOpen !== true) closeModal();
      if (button.action) button.action();
    });
  });
  onOpen?.(panel);
  const firstInput = $("input:not([type=checkbox]), textarea", panel);
  firstInput?.focus();
  return panel;
}

function closeModal() {
  const modal = byId("vicNativeModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  state.modalOpen = false;
}

function askText(title, label, initialValue, onDone) {
  openModal({
    title,
    body: `
      <label class="vic-field">
        <span>${escapeHTML(label)}</span>
        <input id="vicModalText" type="text" maxlength="50"
          value="${escapeHTML(initialValue || "")}"
          placeholder="Enter a name">
      </label>
    `,
    buttons: [
      { label: "Cancel" },
      {
        label: "Save",
        action: () => {
          const value = $("#vicModalText")?.value.trim();
          if (!value) {
            notify("Please enter a name.");
            return;
          }
          onDone(value);
        }
      }
    ]
  });
}

/* =========================================================
   5. LOCAL STORAGE AND ANONYMOUS LISTENER
   ========================================================= */

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Local save failed:", error);
    return false;
  }
}

function getAnonymousId() {
  let id = "";
  try {
    id = localStorage.getItem(VIC_CONFIG.STORAGE.anonymousId) || "";
    if (!id) {
      id = makeId();
      localStorage.setItem(VIC_CONFIG.STORAGE.anonymousId, id);
    }
  } catch {
    id = makeId();
  }
  state.anonymousId = id;
  return id;
}

function loadLocalData() {
  state.songs = readJSON(VIC_CONFIG.STORAGE.songs, []).map(normaliseSong);
  state.releases = readJSON(VIC_CONFIG.STORAGE.releases, []);
  state.collections = readJSON(VIC_CONFIG.STORAGE.collections, [])
    .filter(item => item && Array.isArray(item.songs))
    .map(item => ({
      id: safe(item.id || makeId()),
      name: safe(item.name || "My Collection"),
      songs: [...new Set(item.songs.map(songKey))]
    }))
    .filter(item => item.songs.length > 0);

  state.favorites = new Set(
    readJSON(VIC_CONFIG.STORAGE.favorites, []).map(songKey)
  );

  const history = readJSON(VIC_CONFIG.STORAGE.history, {});
  state.djHistory = Array.isArray(history.history) ? history.history : [];
  state.skippedSongs = history.skipped || {};
  state.playedSongs = history.played || {};

  state.notifications =
    localStorage.getItem(VIC_CONFIG.STORAGE.notifications) === "true";
  if (byId("notificationSwitch")) {
    byId("notificationSwitch").checked = state.notifications;
  }
}

function saveLocalData() {
  writeJSON(VIC_CONFIG.STORAGE.songs, state.songs.filter(song => !song.isTestTrack));
  writeJSON(VIC_CONFIG.STORAGE.releases, state.releases);
  writeJSON(VIC_CONFIG.STORAGE.collections, state.collections);
  writeJSON(VIC_CONFIG.STORAGE.favorites, [...state.favorites]);
  writeJSON(VIC_CONFIG.STORAGE.history, {
    history: state.djHistory.slice(-VIC_CONFIG.DJ.historyLimit),
    skipped: state.skippedSongs,
    played: state.playedSongs
  });
}

/* =========================================================
   6. PROVIDER-NEUTRAL REQUEST LAYER
   Swap providers behind these stable service routes.
   ========================================================= */

function serviceURL(path) {
  const base = VIC_CONFIG.SERVICES.baseUrl.replace(/\/$/, "");
  return `${base}${path}`;
}

async function serviceRequest(path, options = {}) {
  if (!VIC_CONFIG.SERVICES.baseUrl) {
    throw new Error("Vic-sound service endpoint is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    VIC_CONFIG.REQUEST_TIMEOUT
  );

  try {
    const response = await fetch(serviceURL(path), {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Vic-Listener-ID": state.anonymousId || getAnonymousId(),
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`Service request failed (${response.status}).`);
    }
    return response.status === 204 ? null : response.json();
  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================================
   7. SUPABASE CONNECTION (CURRENT CATALOGUE ADAPTER)
   Supabase may later be replaced behind the service routes.
   ========================================================= */

let supabaseClient = null;

function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => window.supabase?.createClient
      ? resolve(window.supabase)
      : reject(new Error("Supabase library did not load."));
    script.onerror = () => reject(new Error("Could not load Supabase library."));
    document.head.appendChild(script);
  });
}

async function connectBackend() {
  const { url, publishableKey } = VIC_CONFIG.SUPABASE;
  if (!publishableKey || publishableKey.includes("PASTE_")) {
    state.backendConnected = false;
    return false;
  }

  try {
    const library = await loadSupabaseLibrary();
    supabaseClient = library.createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const { error } = await supabaseClient
      .from(VIC_CONFIG.SUPABASE.songsTable)
      .select("id")
      .limit(1);
    if (error) throw error;
    state.backendConnected = true;
    state.backendError = null;
    return true;
  } catch (error) {
    state.backendConnected = false;
    state.backendError = error.message;
    console.warn("Catalogue backend unavailable:", error);
    return false;
  }
}

function resolveMediaURL(value) {
  const raw = safe(value).trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const base = VIC_CONFIG.MEDIA.publicDeliveryBaseUrl.replace(/\/$/, "");
  return base ? `${base}/${raw.replace(/^\/+/, "")}` : raw;
}

function normaliseSong(row = {}) {
  const genres = Array.isArray(row.genre) ? row.genre :
    safe(row.genre || row.cat).split(",").map(x => x.trim()).filter(Boolean);
  const moods = Array.isArray(row.mood) ? row.mood :
    safe(row.mood).split(",").map(x => x.trim()).filter(Boolean);

  return {
    id: row.id ?? makeId(),
    title: safe(row.title || "Untitled"),
    artist: safe(row.artist || "Unknown artist"),
    album: safe(row.album),
    audio: resolveMediaURL(row.audio_url || row.audio || row.music_url),
    cover: resolveMediaURL(row.cover_url || row.cover),
    duration: Number(row.duration || 0),
    cat: genres,
    mood: moods,
    lyrics: safe(row.lyrics),
    lyrics_timed: row.lyrics_timed || null,
    release_date: safe(row.release_date),
    release_id: row.release_id || null,
    published: row.published ?? true,
    isTestTrack: Boolean(row.isTestTrack || row.is_test_track)
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
  // Prefer the stable Listener API when configured.
  if (VIC_CONFIG.SERVICES.baseUrl) {
    try {
      const result = await serviceRequest(VIC_CONFIG.SERVICES.catalogue);
      state.songs = (result?.songs || result || []).map(normaliseSong);
      applyTestMusic();
      saveLocalData();
      renderHome();
      return state.songs;
    } catch (error) {
      console.warn("Listener catalogue API unavailable:", error);
    }
  }

  if (state.backendConnected && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from(VIC_CONFIG.SUPABASE.songsTable)
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      state.songs = (data || []).map(normaliseSong);
      applyTestMusic();
      saveLocalData();
      renderHome();
      return state.songs;
    } catch (error) {
      console.warn("Could not load remote songs:", error);
    }
  }

  renderHome();
  return state.songs;
}

async function loadReleases() {
  if (VIC_CONFIG.SERVICES.baseUrl) {
    try {
      const result = await serviceRequest(VIC_CONFIG.SERVICES.releases);
      state.releases = result?.releases || result || [];
      saveLocalData();
      state.newRelease = state.releases.length > 0;
      renderLatest();
      updateDots();
      return state.releases;
    } catch (error) {
      console.warn("Release service unavailable:", error);
    }
  }

  if (state.backendConnected && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from(VIC_CONFIG.SUPABASE.releasesTable)
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      state.releases = data || [];
      saveLocalData();
    } catch (error) {
      console.warn("Release loading failed:", error);
    }
  }
  state.newRelease = state.releases.length > 0;
  renderLatest();
  updateDots();
  return state.releases;
}

/* =========================================================
   8. CREATOR-CONTROLLED MONETIZATION SETTINGS
   Creator publishes settings to the backend. Listener applies layout
   values here and delegates actual ads to an installed provider adapter.
   A provider is never faked when its adapter is missing.
   ========================================================= */
function safeCssLength(value, fallback = "0px") {
  const textValue = String(value ?? "").trim();
  return /^(\d+(\.\d+)?(px|rem|em|vh|vw|%)|0)$/.test(textValue)
    ? (textValue === "0" ? "0px" : textValue)
    : fallback;
}

function applyMonetizationSettings(settings = {}) {
  const incoming = settings.display || settings;
  const allowedPlacements = ["bottom", "home-top", "favorites-top", "latest-top"];
  const placement = allowedPlacements.includes(incoming.placement)
    ? incoming.placement : "bottom";
  state.monetization = {
    enabled: settings.enabled === true,
    provider: safe(settings.provider || "none").toLowerCase(),
    format: safe(settings.format || "banner").toLowerCase(),
    placement,
    refreshSeconds: Math.max(0, Math.min(3600, Number(settings.refreshSeconds ?? 0))),
    bannerHeight: safeCssLength(incoming.height ?? settings.bannerHeight, "0px"),
    maxWidth: /^(100%|\d+(\.\d+)?(px|rem|vw))$/.test(String(incoming.maxWidth || "100%")) ? String(incoming.maxWidth || "100%") : "100%",
    gap: safeCssLength(incoming.gap ?? settings.gap, "0px"),
    borderRadius: safeCssLength(incoming.borderRadius ?? settings.borderRadius, "0px")
  };
  const slot = byId("bottomAdPlacement");
  if (slot) {
    const targets = {
      "bottom": document.body,
      "home-top": byId("homeScreen"),
      "favorites-top": byId("favoritesScreen"),
      "latest-top": byId("latestScreen")
    };
    const target = targets[placement] || document.body;
    if (placement === "bottom") {
      document.body.appendChild(slot);
      slot.classList.remove("ad-inline");
      slot.style.position = "fixed";
      slot.style.left = "50%";
      slot.style.bottom = "calc(var(--nav) + env(safe-area-inset-bottom))";
      slot.style.transform = "translateX(-50%)";
      slot.style.width = "min(100%,520px)";
    } else if (target) {
      const anchor = placement === "home-top" ? byId("offlineCard") :
        placement === "favorites-top" ? $(".favorite-dj-card", target) : $(".latest-heading", target);
      if (anchor) target.insertBefore(slot, anchor);
      else target.prepend(slot);
      slot.classList.add("ad-inline");
      slot.style.position = "relative";
      slot.style.left = "auto";
      slot.style.bottom = "auto";
      slot.style.transform = "none";
      slot.style.width = "100%";
    }
    slot.dataset.provider = state.monetization.provider;
    slot.dataset.format = state.monetization.format;
    slot.dataset.configuredPlacement = placement;
    slot.style.height = state.monetization.bannerHeight;
    slot.style.minHeight = "0px";
    slot.style.maxWidth = state.monetization.maxWidth;
    slot.style.margin = `${state.monetization.gap} auto`;
    slot.style.borderRadius = state.monetization.borderRadius;
    slot.hidden = true;
    document.body.classList.remove("has-ad");
  }
  state.monetizationReady = true;

  // The actual provider adapter is optional until the Creator/backend stage.
  // It must report a real creative; no placeholder ad is displayed.
  const adapters = window.VicSoundAdProviders || {};
  const adapter = adapters[state.monetization.provider];
  if (state.monetization.enabled && state.monetization.format === "banner" && adapter?.mountBanner && slot) {
    Promise.resolve(adapter.mountBanner({ container: slot, settings: state.monetization }))
      .then(result => {
        const filled = result === true || result?.filled === true;
        slot.hidden = !filled;
        if (filled && placement === "bottom") {
          document.documentElement.style.setProperty("--ad-height", state.monetization.bannerHeight || "54px");
          document.body.classList.add("has-ad");
        }
      })
      .catch(error => {
        slot.hidden = true;
        console.warn("Ad provider banner could not load:", error);
      });
  }
  return state.monetization;
}

async function loadMonetizationSettings() {
  if (!VIC_CONFIG.SERVICES.baseUrl) {
    applyMonetizationSettings(VIC_CONFIG.MONETIZATION);
    return state.monetization;
  }
  try {
    const settings = await serviceRequest(VIC_CONFIG.SERVICES.monetization);
    applyMonetizationSettings(settings || VIC_CONFIG.MONETIZATION);
  } catch (error) {
    console.info("Creator monetization settings are not available yet; ads remain off.");
    applyMonetizationSettings(VIC_CONFIG.MONETIZATION);
  }
  return state.monetization;
}

async function requestVerifiedReward(release) {
  const adapter = (window.VicSoundAdProviders || {})[state.monetization.provider];
  if (!state.monetization.enabled || !adapter?.showRewarded) {
    notify("Rewarded advertising is not connected yet.");
    return false;
  }
  try {
    const rewardEvent = await adapter.showRewarded({ release });
    if (!rewardEvent?.eventId) throw new Error("The ad did not return a reward event.");
    const permission = await serviceRequest(VIC_CONFIG.SERVICES.downloadPermission, {
      method: "POST",
      body: JSON.stringify({ releaseId: release.id, provider: state.monetization.provider, rewardEventId: rewardEvent.eventId })
    });
    if (!permission?.downloadUrl) throw new Error("The server has not verified the reward yet.");
    const response = await fetch(permission.downloadUrl);
    if (!response.ok) throw new Error("The authorised download could not be retrieved.");
    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = safe(permission.filename || `${release.title || "vic-sound-release"}.mp3`).replace(/[\\/:*?"<>|]/g, "-");
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(objectURL), 30000);
    return true;
  } catch (error) {
    console.warn("Rewarded download was not completed:", error);
    notify(error.message || "The rewarded download is not ready.");
    return false;
  }
}

/* =========================================================
   8. DJ PROFILE — COVER IS OWNED BY CREATOR CATALOGUE
   Creator publishes the DJ image; Listener only reads it.
   ========================================================= */

function applyDJProfile(profile = {}) {
  state.djProfile = {
    name: safe(profile.name || VIC_CONFIG.DJ.fallbackName),
    subtitle: safe(profile.subtitle || VIC_CONFIG.DJ.fallbackSubtitle),
    cover: safe(profile.cover_url || profile.cover || VIC_CONFIG.DJ.fallbackCover)
  };

  const small = byId("favoriteDjCover");
  const large = byId("djCoverLarge");

  [small, large].forEach(element => {
    if (!element) return;
    element.style.backgroundImage = state.djProfile.cover
      ? `linear-gradient(0deg,rgba(0,0,0,.12),rgba(0,0,0,.12)),url("${state.djProfile.cover.replace(/["\\]/g, "")}")`
      : "";
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.classList.toggle("has-dj-cover", Boolean(state.djProfile.cover));
  });

  const cardTitle = $(".favorite-dj-card h2");
  const cardSubtitle = $(".favorite-dj-card p");
  if (cardTitle) cardTitle.textContent = state.djProfile.name;
  if (cardSubtitle) cardSubtitle.textContent = state.djProfile.subtitle;

  const djTitle = $("#djOverlay .overlay-head b");
  const djSubtitle = $("#djOverlay .overlay-head small");
  if (djTitle) djTitle.textContent = state.djProfile.name;
  if (djSubtitle) djSubtitle.textContent = state.djProfile.subtitle;
}

async function loadDJProfile() {
  if (!VIC_CONFIG.SERVICES.baseUrl) {
    applyDJProfile();
    return;
  }
  try {
    const profile = await serviceRequest(VIC_CONFIG.SERVICES.djProfile);
    applyDJProfile(profile || {});
  } catch (error) {
    console.info("Using the saved DJ artwork until Creator profile is available.");
    applyDJProfile();
  }
}

/* =========================================================
   9. HOME, CATEGORY AND SEARCH
   A playback queue is built from the exact list the user chose.
   ========================================================= */

function filteredSongs() {
  const query = state.query.trim().toLowerCase();
  return state.songs.filter(song => {
    const tags = [...song.cat, ...song.mood].map(x => safe(x).toLowerCase());
    const categoryMatch = state.category === "All" ||
      tags.includes(state.category.toLowerCase());
    const searchMatch = !query ||
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
}

function renderHome() {
  const box = byId("homeMusicList");
  if (!box) return;
  const songs = filteredSongs();

  if (!songs.length) {
    box.innerHTML = `<div class="empty-state"><b>No music found</b><span>Try another search or category.</span></div>`;
    return;
  }

  box.innerHTML = songs.map(song => `
    <article class="music-row ${songKey(song.id) === songKey(state.currentId) ? "playing" : ""}">
      <button class="music-main" data-play="${escapeHTML(song.id)}" aria-label="Play ${escapeHTML(song.title)}">
        <img class="cover" src="${escapeHTML(song.cover)}" alt="">
      </button>
      <button class="music-main" data-play="${escapeHTML(song.id)}">
        <b>${escapeHTML(song.title)}</b>
        <small>${escapeHTML(song.artist)}</small>
      </button>
      <span class="playing-bars">▮▮▮</span>
      <button class="favorite-toggle ${isSongFavorite(song.id) ? "active" : ""}"
        data-fav="${escapeHTML(song.id)}"
        aria-label="${isSongFavorite(song.id) ? "In favorites" : "Add to favorites"}">
        ${isSongFavorite(song.id) ? "♥" : "♡"}
      </button>
    </article>
  `).join("");
}


/* =========================================================
   11. OFFLINE MUSIC CACHE
   Automatic offline preparation is separate from rewarded downloads.
   ========================================================= */

async function getMusicCache(song = null) {
  if (!("caches" in window)) return null;
  const cacheName = song?.isTestTrack
    ? VIC_TEST_CONFIG.cacheName
    : VIC_CONFIG.STORAGE.musicCache;
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
  updateOfflineCount();
  return state.downloaded;
}

function updateOfflineCount() {
  const count = byId("offlineCount");
  const status = byId("offlineStatus");
  const message = byId("offlineMessage");
  const card = byId("offlineCard");
  if (!count) return;

  const total = state.songs.filter(song => song.audio).length;
  const saved = state.downloaded.size;
  count.textContent = `${saved} of ${total} songs`;

  if (!total) {
    if (status) status.textContent = "Waiting for music";
    if (message) message.textContent = "Music will appear here when it is published.";
    return;
  }

  const percent = Math.round(saved / total * 100);
  card?.style.setProperty("--offline-progress", `${percent}%`);
  card?.classList.toggle("is-complete", saved === total);
  card?.classList.toggle("is-preparing", saved > 0 && saved < total);

  if (saved === total) {
    if (status) status.textContent = "Offline ready";
    if (message) message.textContent = "Your saved music is ready for offline listening.";
  } else {
    if (status) status.textContent = navigator.onLine ? "Offline music" : "Offline";
    if (message) message.textContent = navigator.onLine
      ? "Music can be saved for listening without internet."
      : "Reconnect to save more music for offline listening.";
  }
}

async function saveAudioFile(song) {
  if (!song?.audio) return false;
  const cache = await getMusicCache(song);
  if (!cache) return false;

  const url = new URL(song.audio, location.href).href;
  if (await cache.match(url)) {
    state.downloaded.add(songKey(song.id));
    return true;
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Audio request failed.");
    const type = response.headers.get("content-type") || "";
    if (type.includes("text/html") || type.includes("application/json")) {
      throw new Error("The address did not return an audio file.");
    }
    await cache.put(url, response.clone());
    state.downloaded.add(songKey(song.id));
    return true;
  } catch (error) {
    console.warn("Could not cache", song.title, error);
    return false;
  }
}

async function prepareOfflineMusic() {
  if (!navigator.onLine || state.downloadBusy) return;
  state.downloadBusy = true;
  try {
    await getDownloadedSongs();
    const pending = state.songs.filter(song =>
      song.audio && !state.downloaded.has(songKey(song.id))
    );
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length && navigator.onLine) {
        const song = pending[cursor++];
        await saveAudioFile(song);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(VIC_CONFIG.DOWNLOAD_WORKERS, pending.length) }, worker)
    );
  } finally {
    state.downloadBusy = false;
    updateOfflineCount();
  }
}

/* =========================================================
   12. PLAYBACK SOURCE AND QUEUE
   ========================================================= */

function makeQueue(songs, source) {
  state.queue = songs.map(song => ({
    id: song.id,
    repeatTotal: 1,
    repeatsLeft: 1
  }));
  state.queueIndex = 0;
  state.queueSource = source || { type: "catalogue", label: "Your Music" };
  renderQueue();
}

function currentQueueEntry() {
  return state.queue[state.queueIndex] || null;
}

function setCurrentSong(song) {
  if (!song) return;
  state.currentId = song.id;
  updatePlayer();
  renderHome();
  updateLyrics();
  updateMediaSession();
}

function songURL(song) {
  return song?.audio || "";
}

async function loadSong(song, shouldPlay = true, { keepQueue = false } = {}) {
  if (!song) return;
  if (!keepQueue) {
    const sourceSongs = state.queueSource?.type === "collection"
      ? collectionSongs(state.queueSource.id)
      : state.queueSource?.type === "category"
        ? filteredSongs()
        : state.queueSource?.type === "search"
          ? filteredSongs()
          : state.songs;
    const index = sourceSongs.findIndex(item => songKey(item.id) === songKey(song.id));
    if (index >= 0 && state.queue[index]) state.queueIndex = index;
  }

  setCurrentSong(song);
  const url = songURL(song);
  if (!url) {
    notify("This song does not have an audio file yet.");
    return;
  }

  try {
    const cache = await getMusicCache(song);
    const cached = cache ? await cache.match(new URL(url, location.href).href) : null;
    if (cached) {
      const blob = await cached.blob();
      if (audio._objectURL) URL.revokeObjectURL(audio._objectURL);
      audio._objectURL = URL.createObjectURL(blob);
      audio.src = audio._objectURL;
    } else {
      audio.src = url;
    }
    audio.load();
    if (shouldPlay) await audio.play();
  } catch (error) {
    console.error("Playback error:", error);
    state.playing = false;
    notify("This song could not play. Check your connection or audio file.");
  }
  updatePlayer();
}

function playFromList(songs, index, source) {
  if (!songs.length) {
    notify("There are no songs in this list yet.");
    return;
  }
  const safeIndex = Math.max(0, Math.min(index, songs.length - 1));
  makeQueue(songs, source);
  state.queueIndex = safeIndex;
  loadSong(songs[safeIndex], true, { keepQueue: true });
}

function playSongById(id) {
  const list = filteredSongs();
  const index = list.findIndex(song => songKey(song.id) === songKey(id));
  if (index >= 0) {
    playFromList(list, index, {
      type: state.query ? "search" : state.category === "All" ? "catalogue" : "category",
      label: state.query ? "Search results" : state.category
    });
    return;
  }
  const song = state.songs.find(item => songKey(item.id) === songKey(id));
  if (song) playFromList([song], 0, { type: "single", label: song.title });
}

function playNextQueueEntry() {
  if (!state.queue.length) {
    pause();
    return;
  }

  const entry = currentQueueEntry();
  if (entry && entry.repeatsLeft > 1) {
    entry.repeatsLeft -= 1;
    loadSong(getSong(entry.id), true, { keepQueue: true });
    renderQueue();
    return;
  }

  if (entry) {
    entry.repeatsLeft = entry.repeatTotal;
  }

  if (state.shuffle && state.queue.length > 1) {
    let nextIndex = state.queueIndex;
    while (nextIndex === state.queueIndex) {
      nextIndex = Math.floor(Math.random() * state.queue.length);
    }
    state.queueIndex = nextIndex;
    loadSong(getSong(state.queue[nextIndex].id), true, { keepQueue: true });
    return;
  }

  if (state.queueIndex < state.queue.length - 1) {
    state.queueIndex += 1;
    loadSong(getSong(state.queue[state.queueIndex].id), true, { keepQueue: true });
    return;
  }

  if (state.repeatMode === 1) {
    state.queueIndex = 0;
    loadSong(getSong(state.queue[0].id), true, { keepQueue: true });
  } else {
    pause();
  }
}

function getSong(id) {
  return state.songs.find(song => songKey(song.id) === songKey(id)) || null;
}

function next() {
  playNextQueueEntry();
}

function prev() {
  if (audio.currentTime > 4) {
    audio.currentTime = 0;
    return;
  }
  if (state.queueIndex > 0) {
    state.queueIndex -= 1;
    const entry = currentQueueEntry();
    if (entry) {
      entry.repeatsLeft = entry.repeatTotal;
      loadSong(getSong(entry.id), true, { keepQueue: true });
    }
  } else if (state.repeatMode === 1 && state.queue.length) {
    state.queueIndex = state.queue.length - 1;
    loadSong(getSong(currentQueueEntry().id), true, { keepQueue: true });
  } else {
    audio.currentTime = 0;
  }
}

function start() {
  if (!getCurrentSong()) {
    const songs = filteredSongs();
    if (songs.length) playFromList(songs, 0, { type: "catalogue", label: "Your Music" });
    return;
  }
  audio.play().catch(() => notify("This song could not start."));
}

function pause() {
  audio.pause();
}

function toggle() {
  audio.paused ? start() : pause();
}

/* =========================================================
   13. PLAYER UI, MINI PLAYER AND MEDIA SESSION
   ========================================================= */

function updatePlayer() {
  const song = getCurrentSong();
  if (!song) return;

  ["playerTitle", "miniTitle", "queueTitle"].forEach(id => {
    if (byId(id)) byId(id).textContent = song.title;
  });
  ["playerArtist", "miniArtist", "queueArtist"].forEach(id => {
    if (byId(id)) byId(id).textContent = song.artist;
  });
  ["playerCover", "miniCover", "queueCover"].forEach(id => {
    if (byId(id)) byId(id).src = song.cover || "";
  });

  if (byId("playPause")) byId("playPause").textContent = state.playing ? "Ⅱ" : "▶";
  if (byId("miniPlay")) byId("miniPlay").textContent = state.playing ? "Ⅱ" : "▶";

  const favorite = isSongFavorite(song.id);
  const favButton = byId("playerFav");
  if (favButton) {
    favButton.textContent = favorite ? "♥" : "♡";
    favButton.classList.toggle("active", favorite);
  }

  if (byId("currentTime")) byId("currentTime").textContent = formatTime(audio.currentTime);
  if (byId("duration")) byId("duration").textContent =
    formatTime(audio.duration || song.duration);
  if (byId("progress")) byId("progress").value =
    audio.duration ? audio.currentTime / audio.duration * 100 : 0;

  const mini = byId("miniPlayer");
  mini?.classList.toggle("visible", Boolean(state.currentId));
  mini?.setAttribute("aria-hidden", state.currentId ? "false" : "true");
  byId("playerOverlay")?.classList.toggle("playing", state.playing);

  updateModeButtons();
}

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const song = getCurrentSong();
  if (!song) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || "Vic-sound",
      artwork: song.cover ? [{ src: song.cover }] : []
    });
    navigator.mediaSession.setActionHandler("play", start);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);
  } catch (error) {
    console.info("Media Session is unavailable:", error);
  }
}

function openPlayer() {
  byId("playerOverlay")?.classList.add("open");
  byId("playerOverlay")?.setAttribute("aria-hidden", "false");
  state.player = true;
  updatePlayer();
}

function closePlayer() {
  byId("playerOverlay")?.classList.remove("open");
  byId("playerOverlay")?.setAttribute("aria-hidden", "true");
  state.player = false;
}

audio.addEventListener("play", () => {
  state.playing = true;
  updatePlayer();
  renderHome();
  updateMediaSession();
});

audio.addEventListener("pause", () => {
  state.playing = false;
  updatePlayer();
  renderHome();
});

audio.addEventListener("timeupdate", () => {
  updatePlayer();
  syncLyrics();
});

audio.addEventListener("loadedmetadata", updatePlayer);
audio.addEventListener("error", () => {
  state.playing = false;
  updatePlayer();
  console.warn("Audio playback error:", audio.error);
});

audio.addEventListener("ended", () => {
  recordCompletedPlay();
  if (state.repeatMode === 2) {
    audio.currentTime = 0;
    start();
    return;
  }
  playNextQueueEntry();
});

/* =========================================================
   14. QUEUE, PER-SONG REPEAT ×1–×5 AND QUEUE REORDER
   Tap the small repeat control on a queue row to increase it.
   ========================================================= */

function renderQueue() {
  const box = byId("queueList");
  if (!box) return;

  const count = byId("queueCount");
  if (count) count.textContent = `${state.queue.length} songs`;

  box.innerHTML = state.queue.map((entry, index
