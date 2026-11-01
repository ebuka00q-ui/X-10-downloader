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
