/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   Provider-independent Listener application
   Existing HTML/CSS interface is preserved.
   ========================================================= */

/* =========================================================
   0. TEMPORARY TEST MUSIC (TST)
   Keep these two test tracks while checking the Listener.
   They are included automatically while enabled is true.
   To hide them, change enabled to false or use ?test=0 temporarily.
   Test audio is stored in its own cache, separate from real releases.
   ========================================================= */
const VIC_TEST_CONFIG = Object.freeze({
  enabled: true,
  queryFlag: "test",
  queryValue: "1",
  cacheName: "vic-sound-tst-audio-v1"
});
// Test tracks are visible automatically while enabled. ?test=0 hides them.
const VIC_TEST_MODE = VIC_TEST_CONFIG.enabled &&
  new URLSearchParams(location.search).get(VIC_TEST_CONFIG.queryFlag) !== "0";
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
    .vic-dj-playback{display:flex;align-items:center;justify-content:center;gap:18px;margin:18px auto 10px}
    .vic-dj-playback button{width:52px;height:52px;border:1px solid rgba(0,245,160,.42);border-radius:50%;background:#09221c;color:#00f5a0;font-size:21px;display:grid;place-items:center;box-shadow:0 0 16px rgba(0,245,160,.08)}
    .vic-dj-playback button.vic-dj-main-play{width:64px;height:64px;background:#00f5a0;color:#00140e;font-size:25px}
    .vic-dj-playback button:disabled{opacity:.35;box-shadow:none}
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
  const base = VIC_CONFIG.MEDIA.publicDeliveryBaseUrl.replace(/\
