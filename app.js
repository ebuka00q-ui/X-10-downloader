/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   Supabase + offline music + player + collections
   ========================================================= */


/* =========================================================
   1. CONNECTION SETTINGS
   ========================================================= */

const VIC_CONFIG = {

  /* SUPABASE PUBLIC CONNECTION */

  SUPABASE_URL: "https://gkfivuvtpfetzatzhnaq.supabase.co",

  SUPABASE_PUBLIC_KEY: "PASTE_YOUR_SUPABASE_PUBLIC_KEY_HERE",

  SUPABASE_SONGS_TABLE: "songs",

  SUPABASE_RELEASES_TABLE: "releases",


  /* CREATOR BACKEND CONNECTION */

  CREATOR_API_BASE_URL: "",

  API_ROUTES: {
    catalogue: "/listener/catalogue",
    releases: "/listener/releases",
    downloadPermission: "/listener/download-permission",
    monetizationStatus: "/listener/monetization",
    recordPlayback: "/listener/playback"
  },


  /* CLOUDFLARE R2 */

  R2_PUBLIC_DELIVERY_BASE: "",


  /* ADVERTISING */

  GOOGLE_AD_MANAGER_NETWORK_CODE: "",

  BOTTOM_AD_UNIT_PATH: "",

  REWARDED_AD_UNIT_PATH: "",


  /* OPTIONAL DJ AI CONNECTION */

  DJ_AI_ENDPOINT: "",


  /* LOCAL STORAGE AND MUSIC CACHE */

  MUSIC_CACHE_NAME: "vic-sound-music-v1",

  COVER_CACHE_NAME: "vic-sound-covers-v1",

  TEST_CACHE_NAME: "vic-sound-test-only-v1",

  LOCAL_STATE_KEY: "vic-sound-listener-state-v1",

  CATALOGUE_SNAPSHOT_KEY: "vic-sound-catalogue-snapshot-v1",


  /* DOWNLOAD SETTINGS */

  DOWNLOAD_WORKERS: 2,

  MAX_AUTO_DOWNLOADS_PER_RUN: 50,


  /* REGULAR AD SETTINGS */

  REGULAR_AD_AFTER_COMPLETED_SONGS: 10,

  REGULAR_AD_COOLDOWN_MS: 15 * 60 * 1000

};


/* =========================================================
   2. TEMPORARY PLAYER TEST
   REMOVE BEFORE PUBLIC RELEASE
   ========================================================= */

const VIC_TEST_MODE =
  new URLSearchParams(window.location.search).get("test") === "1";


const VIC_TEST_SONG = {

  id: "vic-sound-temporary-test-song",

  title: "Vic-sound Test Track",

  artist: "Temporary Demo",

  album: "Player Test",

  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",

  cover: "",

  duration: 0,

  cat: ["Test"],

  mood: ["Test"],

  tags: ["Temporary"],

  lyrics: "Temporary player test track.",

  lyrics_timed: null,

  release_date: "",

  release_id: null,

  published: true,

  isTestTrack: true

};


/* =========================================================
   3. APP STATE
   ========================================================= */

const state = {

  /* CURRENT SCREEN */

  screen: "home",

  category: "All",

  query: "",


  /* MUSIC */

  songs: [],

  releases: [],

  currentId: null,

  playing: false,


  /* PLAYER AND QUEUE */

  queue: [],

  queueIndex: 0,

  shuffle: false,

  repeatMode: 0,

  playerOpen: false,

  queueOpen: false,


  /* FAVORITES AND COLLECTIONS */

  favorites: new Set(),

  collections: [],

  currentCollection: null,


  /* OTHER SCREENS */

  djOpen: false,

  lyricsOpen: false,

  timerId: null,

  timerMode: "off",


  /* DOWNLOADS AND OFFLINE MUSIC */

  downloading: false,

  downloaded: new Set(),

  backendConnected: false,

  backendError: null,

  supabase: null,


  /* MONETIZATION */

  monetizationEnabled: true,

  monetizationKnown: false,

  completedOnlineSongs: 0,

  lastRegularAdAt: 0,

  regularAdPending: false,


  /* TEST TRACK */

  testSongActive: false,


  /* PLAYER ANIMATION */

  firstMiniPlayerEntrance: true,


  /* AUDIO AND LISTENER */

  objectAudioUrl: null,

  anonymousId: null,


  /* NOTIFICATIONS */

  notifications: false,

  newRelease: false

};


/* =========================================================
   4. BASIC DOM HELPERS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => [...document.querySelectorAll(selector)];


const audio = $("#audio");


function has(selector) {

  return Boolean($(selector));

}


function on(selector, event, handler) {

  const element = $(selector);

  if (element) {

    element.addEventListener(event, handler);

  }

}


/* =========================================================
   5. GENERAL HELPERS
   ========================================================= */

function text(value) {

  return String(value ?? "");

}


function escapeHTML(value) {

  return text(value).replace(/[&<>"']/g, character => ({

    "&": "&amp;",

    "<": "&lt;",

    ">": "&gt;",

    '"': "&quot;",

    "'": "&#039;"

  })[character]);

}


function songKey(id) {

  return String(id);

}


function formatTime(seconds) {

  const total = Math.max(0, Math.floor(Number(seconds) || 0));

  const minutes = Math.floor(total / 60);

  const remainingSeconds = String(total % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;

}


function makeId() {

  return globalThis.crypto?.randomUUID?.() ||

    `vic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

}


function normaliseList(value) {

  if (Array.isArray(value)) {

    return value
      .map(text)
      .map(item => item.trim())
      .filter(Boolean);

  }

  return text(value)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

}


/* =========================================================
   6. SONG DATA HELPER
   ========================================================= */

function normaliseSong(row = {}) {

  return {

    id: text(row.id || makeId()),

    title: text(row.title || "Untitled song"),

    artist: text(row.artist || "Unknown artist"),

    album: text(row.album || ""),

    audio: text(
      row.audio_url ||
      row.audio ||
      row.audioUrl ||
      ""
    ),

    cover: text(
      row.cover_url ||
      row.cover ||
      row.coverUrl ||
      ""
    ),

    duration: Number(row.duration || 0),

    cat: normaliseList(row.genre || row.cat),

    mood: normaliseList(row.mood),

    tags: normaliseList(row.tags),

    lyrics: text(row.lyrics || ""),

    lyrics_timed:
      row.lyrics_timed ||
      row.timed_lyrics ||
      row.lyricsTimed ||
      null,

    release_date: text(
      row.release_date ||
      row.releaseDate ||
      ""
    ),

    release_id:
      row.release_id ||
      row.releaseId ||
      null,

    release_type: text(
      row.release_type ||
      row.releaseType ||
      "single"
    ),

    published: row.published ?? true,

    isTestTrack: Boolean(row.isTestTrack)

  };

}


/* =========================================================
   7. CURRENT SONG HELPER
   ========================================================= */

function currentSong() {

  return state.songs.find(song =>

    songKey(song.id) === songKey(state.currentId)

  ) || null;

}


/* =========================================================
   8. NOTIFICATION MESSAGE
   ========================================================= */

function notify(message, duration = 2800) {

  let box = $("#vicMessage");

  if (!box) {

    box = document.createElement("div");

    box.id = "vicMessage";

    box.setAttribute("role", "status");

    Object.assign(box.style, {

      position: "fixed",

      left: "50%",

      bottom: "105px",

      transform: "translateX(-50%)",

      zIndex: "100000",

      background: "#123c30",

      color: "white",

      padding: "12px 18px",

      borderRadius: "14px",

      maxWidth: "88%",

      textAlign: "center",

      fontSize: "14px",

      boxShadow: "0 10px 35px #0008",

      opacity: "0",

      transition: "opacity .2s"

    });

    document.body.appendChild(box);

  }

  box.textContent = message;

  box.style.display = "block";

  requestAnimationFrame(() => {

    box.style.opacity = "1";

  });

  clearTimeout(box._hideTimer);

  box._hideTimer = setTimeout(() => {

    box.style.opacity = "0";

    setTimeout(() => {

      box.style.display = "none";

    }, 220);

  }, duration);

}


/* =========================================================
   9. ANONYMOUS LISTENER ID
   ========================================================= */

function getAnonymousId() {

  try {

    let id = localStorage.getItem("vic-sound-anonymous-id");

    if (!id) {

      id = makeId();

      localStorage.setItem("vic-sound-anonymous-id", id);

    }

    state.anonymousId = id;

  } catch {

    state.anonymousId = makeId();

  }

  return state.anonymousId;

}


/* =========================================================
   END OF PART 1
   ========================================================= */

/* =========================================================
   10. SAVE AND RESTORE LISTENER SETTINGS
   ========================================================= */

function saveListenerState() {

  const savedState = {
    favorites: [...state.favorites],
    collections: state.collections,
    shuffle: state.shuffle,
    repeatMode: state.repeatMode
  };

  try {

    localStorage.setItem(
      VIC_CONFIG.LOCAL_STATE_KEY,
      JSON.stringify(savedState)
    );

  } catch (error) {

    console.warn("Could not save Listener settings:", error);

  }

}


function restoreListenerState() {

  try {

    const saved = localStorage.getItem(
      VIC_CONFIG.LOCAL_STATE_KEY
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    state.favorites = new Set(
      Array.isArray(data.favorites)
        ? data.favorites.map(String)
        : []
    );

    state.collections = Array.isArray(data.collections)
      ? data.collections
      : [];

    state.shuffle = Boolean(data.shuffle);

    state.repeatMode = [0, 1, 2].includes(
      Number(data.repeatMode)
    )
      ? Number(data.repeatMode)
      : 0;

  } catch (error) {

    console.warn("Could not restore Listener settings:", error);

  }

}


/* =========================================================
   11. CHECK BROWSER OFFLINE SUPPORT
   ========================================================= */

function supportsOfflineStorage() {

  return (
    "caches" in window &&
    "serviceWorker" in navigator
  );

}


function isOnline() {

  return navigator.onLine === true;

}


/* =========================================================
   12. OPEN MUSIC CACHE
   ========================================================= */

async function openMusicCache() {

  if (!("caches" in window)) {

    throw new Error("This browser does not support music caching.");

  }

  return caches.open(VIC_CONFIG.MUSIC_CACHE_NAME);

}


async function openCoverCache() {

  if (!("caches" in window)) {

    throw new Error("This browser does not support cover caching.");

  }

  return caches.open(VIC_CONFIG.COVER_CACHE_NAME);

}


async function openTestCache() {

  if (!("caches" in window)) {

    throw new Error("This browser does not support test-track caching.");

  }

  return caches.open(VIC_CONFIG.TEST_CACHE_NAME);

}


/* =========================================================
   13. CHECK WHETHER A SONG IS DOWNLOADED
   ========================================================= */

async function isSongDownloaded(song) {

  if (!song || !song.audio) return false;

  try {

    const cache = song.isTestTrack
      ? await openTestCache()
      : await openMusicCache();

    const savedFile = await cache.match(song.audio);

    return Boolean(savedFile);

  } catch (error) {

    console.warn("Could not check downloaded song:", error);

    return false;

  }

}


/* =========================================================
   14. GET DOWNLOADED MUSIC COUNT
   ========================================================= */

async function getDownloadedMusicCount() {

  try {

    const cache = await openMusicCache();

    const requests = await cache.keys();

    return requests.length;

  } catch (error) {

    console.warn("Could not count downloaded music:", error);

    return 0;

  }

}


/* =========================================================
   15. SAVE A SONG FOR OFFLINE PLAYBACK
   ========================================================= */

async function cacheSong(song) {

  if (!song || !song.audio) {

    throw new Error("This song has no audio file.");

  }

  if (!isOnline()) {

    throw new Error("Connect to the internet before downloading.");

  }

  const cache = song.isTestTrack
    ? await openTestCache()
    : await openMusicCache();

  const existingFile = await cache.match(song.audio);

  if (existingFile) {

    return true;

  }

  const response = await fetch(song.audio, {
    method: "GET",
    mode: "cors",
    credentials: "omit"
  });

  if (!response.ok) {

    throw new Error(
      `Music download failed. Server response: ${response.status}`
    );

  }

  const contentType = response.headers.get("content-type") || "";

  if (
    contentType &&
    !contentType.toLowerCase().startsWith("audio/") &&
    !contentType.toLowerCase().includes("octet-stream")
  ) {

    throw new Error("The address did not return an audio file.");

  }

  await cache.put(song.audio, response.clone());

  return true;

}


/* =========================================================
   16. REMOVE A DOWNLOADED SONG
   ========================================================= */

async function removeDownloadedSong(song) {

  if (!song || !song.audio) return false;

  try {

    const cache = song.isTestTrack
      ? await openTestCache()
      : await openMusicCache();

    const removed = await cache.delete(song.audio);

    return removed;

  } catch (error) {

    console.warn("Could not remove downloaded song:", error);

    return false;

  }

}


/* =========================================================
   17. CACHE A SONG COVER
   ========================================================= */

async function cacheSongCover(song) {

  if (!song || !song.cover || !isOnline()) return false;

  try {

    const cache = await openCoverCache();

    const existing = await cache.match(song.cover);

    if (existing) return true;

    const response = await fetch(song.cover, {
      method: "GET",
      mode: "cors",
      credentials: "omit"
    });

    if (!response.ok) return false;

    const type = response.headers.get("content-type") || "";

    if (type && !type.startsWith("image/")) return false;

    await cache.put(song.cover, response.clone());

    return true;

  } catch (error) {

    console.warn("Could not cache song cover:", error);

    return false;

  }

}


/* =========================================================
   END OF PART 2
   ========================================================= */

/* =========================================================
   18. CHECK SUPABASE CONNECTION SETTINGS
   ========================================================= */

function hasSupabaseSettings() {

  return Boolean(
    VIC_CONFIG.SUPABASE_URL &&
    VIC_CONFIG.SUPABASE_PUBLIC_KEY &&
    VIC_CONFIG.SUPABASE_PUBLIC_KEY !==
      "PASTE_YOUR_SUPABASE_PUBLIC_KEY_HERE"
  );

}


/* =========================================================
   19. CONNECT TO SUPABASE
   ========================================================= */

function connectSupabase() {

  if (!hasSupabaseSettings()) {

    state.backendConnected = false;

    state.backendError = "Supabase connection settings are missing.";

    console.warn(state.backendError);

    return false;

  }

  if (!window.supabase?.createClient) {

    state.backendConnected = false;

    state.backendError = "Supabase library is not loaded.";

    console.error(state.backendError);

    return false;

  }

  try {

    state.supabase = window.supabase.createClient(
      VIC_CONFIG.SUPABASE_URL,
      VIC_CONFIG.SUPABASE_PUBLIC_KEY
    );

    state.backendConnected = true;

    state.backendError = null;

    return true;

  } catch (error) {

    state.backendConnected = false;

    state.backendError = error.message || "Supabase connection failed.";

    console.error("Supabase connection failed:", error);

    return false;

  }

}


/* =========================================================
   20. LOAD SONGS FROM SUPABASE
   ========================================================= */

async function loadSongsFromSupabase() {

  if (!state.supabase) {

    throw new Error("Supabase is not connected.");

  }

  const { data, error } = await state.supabase
    .from(VIC_CONFIG.SUPABASE_SONGS_TABLE)
    .select(
      "id, title, artist, cover_url, audio_url, genre, mood, lyrics, release_date"
    )
    .order("release_date", {
      ascending: false,
      nullsFirst: false
    });

  if (error) {

    throw new Error(error.message);

  }

  if (!Array.isArray(data)) {

    throw new Error("Supabase returned an unexpected song list.");

  }

  return data
    .map(row => normaliseSong(row))
    .filter(song => song.id && song.audio);

}


/* =========================================================
   21. LOAD THE SONG CATALOGUE
   ========================================================= */

async function loadCatalogue() {

  if (!isOnline()) {

    notify("You are offline. Showing saved music.");

    return loadSavedCatalogue();

  }

  if (!state.supabase) {

    const connected = connectSupabase();

    if (!connected) {

      notify("Music service is not connected.");

      return loadSavedCatalogue();

    }

  }

  try {

    const songs = await loadSongsFromSupabase();

    state.songs = songs;

    state.backendConnected = true;

    state.backendError = null;

    saveCatalogueSnapshot();

    if (VIC_TEST_MODE) {

      state.songs = [
        VIC_TEST_SONG,
        ...state.songs.filter(song => !song.isTestTrack)
      ];

    }

    return state.songs;

  } catch (error) {

    state.backendConnected = false;

    state.backendError = error.message || "Could not load the catalogue.";

    console.error("Catalogue loading failed:", error);

    notify("Could not load music. Trying saved catalogue.");

    return loadSavedCatalogue();

  }

}


/* =========================================================
   22. SAVE A LOCAL CATALOGUE SNAPSHOT
   ========================================================= */

function saveCatalogueSnapshot() {

  const realSongs = state.songs.filter(song => !song.isTestTrack);

  try {

    localStorage.setItem(
      VIC_CONFIG.CATALOGUE_SNAPSHOT_KEY,
      JSON.stringify(realSongs)
    );

  } catch (error) {

    console.warn("Could not save catalogue snapshot:", error);

  }

}


/* =========================================================
   23. LOAD THE SAVED CATALOGUE
   ========================================================= */

function loadSavedCatalogue() {

  try {

    const saved = localStorage.getItem(
      VIC_CONFIG.CATALOGUE_SNAPSHOT_KEY
    );

    if (!saved) {

      state.songs = VIC_TEST_MODE
        ? [VIC_TEST_SONG]
        : [];

      return state.songs;

    }

    const songs = JSON.parse(saved);

    if (!Array.isArray(songs)) {

      throw new Error("Saved catalogue is not a valid list.");

    }

    state.songs = songs
      .map(song => normaliseSong(song))
      .filter(song => song.id && song.audio && !song.isTestTrack);

    if (VIC_TEST_MODE) {

      state.songs.unshift(VIC_TEST_SONG);

    }

    return state.songs;

  } catch (error) {

    console.warn("Could not load saved catalogue:", error);

    state.songs = VIC_TEST_MODE
      ? [VIC_TEST_SONG]
      : [];

    return state.songs;

  }

}


/* =========================================================
   END OF PART 3
   ========================================================= */
