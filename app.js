/* =========================================================
   VIC-SOUND LISTENER — APP.JS
   Supabase + offline music + player + collections
   ========================================================= */

/* ==================== 1. CONFIGURATION ==================== */

const VIC_CONFIG = {
  SUPABASE_URL: "https://gkfivuvtpfetzatzhnaq.supabase.co",

  // Add your Supabase publishable/anon key here.
  // NEVER put the service_role key in a browser file.
  SUPABASE_KEY: "PASTE_YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE",

  SONGS_TABLE: "songs",
  RELEASES_TABLE: "releases",

  MUSIC_BUCKET: "music",
  COVERS_BUCKET: "covers",

  OFFLINE_CACHE: "vic-sound-music-v1",

  // Download a small number at a time to avoid overwhelming
  // the phone or network.
  DOWNLOAD_WORKERS: 2
};


/* ==================== 2. APP STATE ==================== */

const state = {
  screen: "home",
  category: "All",
  query: "",

  songs: [],
  releases: [],

  currentId: null,
  playing: false,

  queue: [],
  queueIndex: 0,

  shuffle: false,
  repeatMode: 0, // 0 off, 1 repeat all, 2 repeat one

  favorites: new Set(),
  collections: [],

  player: false,
  queueOpen: false,
  dj: false,

  timerMode: "end",
  timerId: null,

  notifications: false,
  newRelease: false,

  downloading: false,
  downloaded: new Set(),

  currentCollection: null,
  lyricsOpen: false,

  backendConnected: false,
  backendError: null,

  anonymousId: null
};


/* ==================== 3. SELECTORS ==================== */

const $ = selector => document.querySelector(selector);

const $$ = selector => [...document.querySelectorAll(selector)];

const audio = $("#audio");

const SONG_STORAGE = "vicSoundSongs";
const COLLECTION_STORAGE = "vicSoundCollections";
const FAVORITE_STORAGE = "vicSoundFavorites";
const ANONYMOUS_STORAGE = "vicSoundAnonymousId";
const NOTIFICATION_STORAGE = "vicSoundNotifications";


/* ==================== 4. BASIC HELPERS ==================== */

function safeText(value) {
  return String(value ?? "");
}

function escapeHTML(value) {
  return safeText(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));

  return (
    Math.floor(value / 60) +
    ":" +
    String(value % 60).padStart(2, "0")
  );
}

function makeId() {
  return (
    crypto.randomUUID?.() ||
    "vic-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
}

function getCurrentSong() {
  return state.songs.find(song => song.id === state.currentId) || null;
}

function notify(message) {
  let box = $("#vicMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "vicMessage";

    Object.assign(box.style, {
      position: "fixed",
      bottom: "90px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      background: "#123c30",
      color: "#fff",
      padding: "12px 18px",
      borderRadius: "12px",
      maxWidth: "85%",
      textAlign: "center",
      fontSize: "14px"
    });

    document.body.appendChild(box);
  }

  box.textContent = message;
  box.style.display = "block";

  clearTimeout(box.hideTimer);

  box.hideTimer = setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}


/* ==================== 5. ANONYMOUS LISTENER ID ==================== */

function getAnonymousId() {
  try {
    let id = localStorage.getItem(ANONYMOUS_STORAGE);

    if (!id) {
      id = makeId();
      localStorage.setItem(ANONYMOUS_STORAGE, id);
    }

    state.anonymousId = id;

    return id;
  } catch {
    state.anonymousId = makeId();
    return state.anonymousId;
  }
}


/* ==================== 6. SUPABASE CONNECTION ==================== */

let supabaseClient = null;

function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) {
      resolve(window.supabase);
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = () => {
      if (window.supabase?.createClient) {
        resolve(window.supabase);
      } else {
        reject(new Error("Supabase library did not load."));
      }
    };

    script.onerror = () => {
      reject(new Error("Could not load Supabase library."));
    };

    document.head.appendChild(script);
  });
}

async function connectBackend() {
  const key = VIC_CONFIG.SUPABASE_KEY;

  if (
    !key ||
    key.includes("PASTE_YOUR")
  ) {
    state.backendConnected = false;

    console.warn(
      "Supabase key is missing. Listener is using local mode."
    );

    return false;
  }

  try {
    const library = await loadSupabaseLibrary();

    supabaseClient = library.createClient(
      VIC_CONFIG.SUPABASE_URL,
      key,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    const { error } = await supabaseClient
      .from(VIC_CONFIG.SONGS_TABLE)
      .select("id")
      .limit(1);

    if (error) throw error;

    state.backendConnected = true;
    state.backendError = null;

    console.log("Vic-sound backend connected.");

    return true;

  } catch (error) {
    state.backendConnected = false;
    state.backendError = error.message;

    console.error("Backend connection failed:", error);

    return false;
  }
}


/* ==================== 7. NORMALISE BACKEND SONGS ==================== */

function normaliseSong(row) {
  return {
    id: row.id,

    title: row.title || "Untitled",
    artist: row.artist || "Unknown artist",
    album: row.album || "",

    audio:
      row.audio_url ||
      row.audio ||
      "",

    cover:
      row.cover_url ||
      row.cover ||
      "",

    duration: Number(row.duration || 0),

    cat: Array.isArray(row.genre)
      ? row.genre
      : String(row.genre || "")
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

    mood: Array.isArray(row.mood)
      ? row.mood
      : String(row.mood || "")
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

    lyrics: row.lyrics || "",

    lyrics_timed: row.lyrics_timed || null,

    release_date: row.release_date || "",

    release_id: row.release_id || null,

    published: row.published ?? true
  };
}


/* ==================== 8. LOAD SONGS ==================== */

async function loadSongs() {
  if (state.backendConnected) {
    try {
      const { data, error } = await supabaseClient
        .from(VIC_CONFIG.SONGS_TABLE)
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      state.songs = (data || []).map(normaliseSong);

      saveLocalSongs();

      renderHome();
      renderLatest();

      await prepareOfflineMusic();

      return state.songs;

    } catch (error) {
      console.error("Could not load songs:", error);
      notify("Could not load music from the server.");
    }
  }

  loadLocalSongs();

  renderHome();

  return state.songs;
}

function saveLocalSongs() {
  try {
    localStorage.setItem(
      SONG_STORAGE,
      JSON.stringify(state.songs)
    );
  } catch (error) {
    console.warn("Could not save song catalogue:", error);
  }
}

function loadLocalSongs() {
  try {
    const saved = localStorage.getItem(SONG_STORAGE);

    if (saved) {
      state.songs = JSON.parse(saved).map(normaliseSong);
    }
  } catch {
    state.songs = [];
  }
}


/* ==================== 9. RELEASES ==================== */

async function loadReleases() {
  if (!state.backendConnected) {
    state.releases = [];
    renderLatest();
    return [];
  }

  try {
    const { data, error } = await supabaseClient
      .from(VIC_CONFIG.RELEASES_TABLE)
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    state.releases = data || [];

    state.newRelease = state.releases.length > 0;

    renderLatest();
    updateDots();

    return state.releases;

  } catch (error) {
    console.error("Release loading failed:", error);
    return [];
  }
}

function renderLatest() {
  const box = $("#latestList");

  if (!box) return;

  if (!state.releases.length) {
    box.innerHTML = `
      <div class="empty-state">
        <b>No new releases yet</b>
        <span>New music will appear here.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = state.releases.map(release => {
    const cover = release.cover_url || release.cover || "";

    return `
      <article class="release-card">
        <img
          class="release-cover"
          src="${escapeHTML(cover)}"
          alt="${escapeHTML(release.title)}"
        >

        <div class="release-info">
          <h3>${escapeHTML(release.title)}</h3>
          <p>${escapeHTML(release.type || "Release")}</p>
          <p>${escapeHTML(release.release_date || "")}</p>

          <button
            class="release-action"
            data-release-download="${escapeHTML(release.id)}"
          >
            ⇩ Download
          </button>
        </div>

        <span>›</span>
      </article>
    `;
  }).join("");
}


/* ==================== 10. OFFLINE MUSIC ==================== */

async function getMusicCache() {
  if (!("caches" in window)) {
    return null;
  }

  return caches.open(VIC_CONFIG.OFFLINE_CACHE);
}

async function getDownloadedSongs() {
  state.downloaded.clear();

  const cache = await getMusicCache();

  if (!cache) return state.downloaded;

  const requests = await cache.keys();

  const savedURLs = new Set(
    requests.map(request => request.url)
  );

  state.songs.forEach(song => {
    if (
      song.audio &&
      savedURLs.has(new URL(song.audio, location.href).href)
    ) {
      state.downloaded.add(String(song.id));
    }
  });

  return state.downloaded;
}

function updateOfflineCount() {
  const count = $("#offlineCount");
  const status = $("#offlineStatus");
  const message = $("#offlineMessage");
  const card = $("#offlineCard");

  if (!count) return;

  const total = state.songs.filter(song => song.audio).length;
  const saved = state.downloaded.size;

  count.textContent = `${saved} of ${total} songs`;

  if (total === 0) {
    if (status) status.textContent = "Waiting for music";

    if (message) {
      message.textContent =
        "Music will appear here when it is published.";
    }

    return;
  }

  const percent = Math.round((saved / total) * 100);

  if (card) {
    card.style.setProperty(
      "--offline-progress",
      `${percent}%`
    );

    card.classList.toggle(
      "is-complete",
      saved === total
    );

    card.classList.toggle(
      "is-preparing",
      saved > 0 && saved < total
    );
  }

  if (saved === total) {
    if (status) status.textContent = "Offline";

    if (message) {
      message.textContent =
        "Your available music is ready for offline listening.";
    }
  } else {
    if (status) status.textContent = "Preparing offline music";

    if (message) {
      message.textContent =
        navigator.onLine
          ? "Music is being saved. Keep the app online."
          : "Reconnect to continue preparing your music.";
    }
  }
}

async function saveAudioFile(song) {
  if (!song.audio) return false;

  const cache = await getMusicCache();

  if (!cache) return false;

  const url = new URL(song.audio, location.href).href;

  const existing = await cache.match(url);

  if (existing) {
    state.downloaded.add(String(song.id));
    return true;
  }

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Audio download failed.");
    }

    const type = response.headers.get("content-type") || "";

    if (
      type.includes("text/html") ||
      type.includes("application/json")
    ) {
      throw new Error("The audio URL did not return an audio file.");
    }

    await cache.put(url, response.clone());

    state.downloaded.add(String(song.id));

    updateOfflineCount();

    return true;

  } catch (error) {
    console.warn("Offline download failed:", song.title, error);
    return false;
  }
}

async function prepareOfflineMusic() {
  if (
    !navigator.onLine ||
    state.downloading
  ) {
    return;
  }

  state.downloading = true;

  try {
    await getDownloadedSongs();

    const pending = state.songs.filter(song =>
      song.audio &&
      !state.downloaded.has(String(song.id))
    );

    let nextIndex = 0;

    async function worker() {
      while (nextIndex < pending.length && navigator.onLine) {
        const song = pending[nextIndex++];

        await saveAudioFile(song);
      }
    }

    const workers = Array.from(
      {
        length: Math.min(
          VIC_CONFIG.DOWNLOAD_WORKERS,
          pending.length
        )
      },
      () => worker()
    );

    await Promise.all(workers);

  } finally {
    state.downloading = false;
    updateOfflineCount();
  }
}

window.addEventListener("online", () => {
  prepareOfflineMusic();
});

window.addEventListener("offline", () => {
  updateOfflineCount();
});


/* ==================== 11. PLAYBACK ==================== */

function songURL(song) {
  if (!song) return "";

  return song.audio || "";
}

function setCurrentSong(song) {
  if (!song) return;

  state.currentId = song.id;

  if (!state.queue.includes(song.id)) {
    state.queue.push(song.id);
  }

  state.queueIndex = state.queue.indexOf(song.id);

  updatePlayer();
  renderQueue();
  renderHome();
  updateLyrics();
}

async function loadSong(song, shouldPlay = true) {
  if (!song) return;

  setCurrentSong(song);

  const url = songURL(song);

  if (!url) {
    notify("This song has no audio file yet.");
    return;
  }

  try {
    const cache = await getMusicCache();

    const cached = cache
      ? await cache.match(new URL(url, location.href).href)
      : null;

    if (cached) {
      const blob = await cached.blob();

      audio.src = URL.createObjectURL(blob);

    } else {
      audio.src = url;
    }

    audio.load();

    if (shouldPlay) {
      await audio.play();
    }

  } catch (error) {
    console.error("Playback failed:", error);

    state.playing = false;

    notify("Could not play this song. Check the audio file.");
  }

  updatePlayer();
}

function playSongById(id) {
  const song = state.songs.find(item => String(item.id) === String(id));

  if (song) {
    loadSong(song, true);
  }
}

function start() {
  if (!getCurrentSong()) {
    if (state.songs.length) {
      loadSong(state.songs[0], true);
    }

    return;
  }

  audio.play().catch(() => {
    notify("This song could not start.");
  });
}

function pause() {
  audio.pause();
}

function toggle() {
  if (audio.paused) {
    start();
  } else {
    pause();
  }
}

function updatePlayer() {
  const song = getCurrentSong();

  if (!song) return;

  $("#playerTitle").textContent = song.title;
  $("#playerArtist").textContent = song.artist;

  $("#miniTitle").textContent = song.title;
  $("#miniArtist").textContent = song.artist;

  $("#queueTitle").textContent = song.title;
  $("#queueArtist").textContent = song.artist;

  if ($("#playerCover")) $("#playerCover").src = song.cover;
  if ($("#miniCover")) $("#miniCover").src = song.cover;
  if ($("#queueCover")) $("#queueCover").src = song.cover;

  $("#playPause").textContent = state.playing ? "Ⅱ" : "▶";
  $("#miniPlay").textContent = state.playing ? "Ⅱ" : "▶";

  $("#playerFav").textContent =
    isSongFavorite(song.id) ? "♥" : "♡";

  $("#playerFav").classList.toggle(
    "active",
    isSongFavorite(song.id)
  );

  $("#currentTime").textContent =
    formatTime(audio.currentTime);

  $("#duration").textContent =
    formatTime(audio.duration || song.duration);

  if (audio.duration) {
    $("#progress").value =
      (audio.currentTime / audio.duration) * 100;
  } else {
    $("#progress").value = 0;
  }

  $("#miniPlayer").classList.toggle(
    "visible",
    Boolean(state.currentId)
  );

  $("#miniPlayer").setAttribute("aria-hidden", "false");

  $("#playerOverlay").classList.toggle(
    "playing",
    state.playing
  );
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

  console.error("Audio element error:", audio.error);
});

audio.addEventListener("ended", () => {
  if (state.repeatMode === 2) {
    audio.currentTime = 0;
    start();
    return;
  }

  next();
});


/* ==================== 12. NEXT / PREVIOUS ==================== */

function next() {
  if (!state.queue.length) {
    state.queue = state.songs.map(song => song.id);
  }

  if (state.shuffle) {
    const choices = state.queue.filter(id => id !== state.currentId);

    if (!choices.length) {
      if (state.repeatMode === 1) {
        audio.currentTime = 0;
        start();
      }

      return;
    }

    const id = choices[Math.floor(Math.random() * choices.length)];

    playSongById(id);

    return;
  }

  if (state.queueIndex < state.queue.length - 1) {
    state.queueIndex++;
    playSongById(state.queue[state.queueIndex]);
    return;
  }

  if (state.repeatMode === 1 && state.queue.length) {
    state.queueIndex = 0;
    playSongById(state.queue[0]);
    return;
  }

  pause();
}

function prev() {
  if (audio.currentTime > 4) {
    audio.currentTime = 0;
    return;
  }

  if (state.queueIndex > 0) {
    state.queueIndex--;
    playSongById(state.queue[state.queueIndex]);
    return;
  }

  if (state.repeatMode === 1 && state.queue.length) {
    state.queueIndex = state.queue.length - 1;
    playSongById(state.queue[state.queueIndex]);
  } else {
    audio.currentTime = 0;
  }
}


/* ==================== 13. MEDIA SESSION ==================== */

function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;

  const song = getCurrentSong();

  if (!song) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album || "Vic-sound",
      artwork: song.cover
        ? [{ src: song.cover }]
        : []
    });

    navigator.mediaSession.setActionHandler("play", start);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);

  } catch (error) {
    console.warn("Media Session unavailable:", error);
  }
}


/* ==================== 14. PLAYER OVERLAY ==================== */

function openPlayer() {
  $("#playerOverlay").classList.add("open");
  $("#playerOverlay").setAttribute("aria-hidden", "false");

  state.player = true;

  updatePlayer();
}

function closePlayer() {
  $("#playerOverlay").classList.remove("open");
  $("#playerOverlay").setAttribute("aria-hidden", "true");

  state.player = false;
}

/* ==================== 15. QUEUE ==================== */

function openQueue() {
  $("#queueOverlay").classList.add("open");
  $("#queueOverlay").setAttribute("aria-hidden", "false");

  state.queueOpen = true;

  renderQueue();
}

function closeQueue() {
  $("#queueOverlay").classList.remove("open");
  $("#queueOverlay").setAttribute("aria-hidden", "true");

  state.queueOpen = false;
}

function renderQueue() {
  const box = $("#queueList");

  if (!box) return;

  const list = state.queue
    .map(id => state.songs.find(song => song.id === id))
    .filter(Boolean);

  $("#queueCount").textContent = `${list.length} songs`;

  box.innerHTML = list.map((song, index) => `
    <article
      class="queue-row ${song.id === state.currentId ? "current" : ""}"
      data-queue-row="${index}"
    >
      <span class="queue-num">${index + 1}</span>

      <img src="${escapeHTML(song.cover)}" alt="">

      <button class="queue-song" data-queue-play="${escapeHTML(song.id)}">
        <b>${escapeHTML(song.title)}</b>
        <small>${escapeHTML(song.artist)}</small>
      </button>

      <button
        class="favorite-toggle ${isSongFavorite(song.id) ? "active" : ""}"
        data-fav="${escapeHTML(song.id)}"
      >
        ${isSongFavorite(song.id) ? "♥" : "♡"}
      </button>

      <button
        class="row-more"
        data-queue-remove="${index}"
        aria-label="Remove from queue"
      >
        ×
      </button>
    </article>
  `).join("");
}

function removeQueueSong(index) {
  const id = state.queue[index];

  if (id === undefined) return;

  state.queue.splice(index, 1);

  if (index < state.queueIndex) {
    state.queueIndex--;
  }

  // If the currently playing song is removed, it continues.
  // It simply won't be selected again after it finishes.
  renderQueue();
}

$("#queueList").addEventListener("click", event => {
  const favorite = event.target.closest("[data-fav]");

  if (favorite) {
    toggleFavorite(favorite.dataset.fav);
    return;
  }

  const play = event.target.closest("[data-queue-play]");

  if (play) {
    playSongById(play.dataset.queuePlay);
    return;
  }

  const remove = event.target.closest("[data-queue-remove]");

  if (remove) {
    removeQueueSong(Number(remove.dataset.queueRemove));
  }
});


/* ==================== 16. SHUFFLE / REPEAT ==================== */

function toggleShuffle() {
  state.shuffle = !state.shuffle;

  $("#shuffle").classList.toggle("active", state.shuffle);
}

function cycleRepeat() {
  state.repeatMode = (state.repeatMode + 1) % 3;

  const label = [
    "Repeat off",
    "Repeat all",
    "Repeat one"
  ][state.repeatMode];

  ["#repeat", "#playerRepeatTop"].forEach(selector => {
    const button = $(selector);

    if (!button) return;

    button.classList.toggle(
      "active",
      state.repeatMode !== 0
    );

    button.setAttribute("aria-label", label);
  });

  notify(label);
}


/* ==================== 17. FAVORITES AND COLLECTIONS ==================== */

function loadFavorites() {
  try {
    state.favorites = new Set(
      JSON.parse(localStorage.getItem(FAVORITE_STORAGE) || "[]")
        .map(String)
    );

    state.collections = JSON.parse(
      localStorage.getItem(COLLECTION_STORAGE) || "[]"
    );

  } catch {
    state.favorites = new Set();
    state.collections = [];
  }
}

function saveFavorites() {
  localStorage.setItem(
    FAVORITE_STORAGE,
    JSON.stringify([...state.favorites])
  );

  localStorage.setItem(
    COLLECTION_STORAGE,
    JSON.stringify(state.collections)
  );
}

function isSongFavorite(id) {
  return state.favorites.has(String(id)) ||
    state.collections.some(collection =>
      collection.songs.some(songId => String(songId) === String(id))
    );
}

function toggleFavorite(id) {
  const key = String(id);

  if (isSongFavorite(key)) {
    state.favorites.delete(key);

    state.collections.forEach(collection => {
      collection.songs = collection.songs.filter(
        songId => String(songId) !== key
      );
    });

    saveFavorites();
    renderHome();
    renderFavorites();
    updatePlayer();

    return;
  }

  showCollectionPicker(key);
}

function showCollectionPicker(songId) {
  const existing = state.collections;

  const name = prompt(
    existing.length
      ? "Enter a collection name, or enter a new name:"
      : "Create your first collection:"
  );

  if (!name || !name.trim()) return;

  let collection = existing.find(
    item => item.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (!collection) {
    collection = {
      id: makeId(),
      name: name.trim(),
      songs: []
    };

    state.collections.push(collection);
  }

  if (!collection.songs.includes(songId)) {
    collection.songs.push(songId);
  }

  saveFavorites();

  renderFavorites();
  renderHome();
  updatePlayer();
}

function renderFavorites() {
  const box = $("#favoriteGrid");

  if (!box) return;

  if (!state.collections.length) {
    box.innerHTML = `
      <div class="empty-state">
        <b>No collections yet</b>
        <span>Tap a song's heart to create your first collection.</span>
      </div>
    `;

    $("#favoriteCount").textContent = "0 collections";

    return;
  }

  $("#favoriteCount").textContent =
    `${state.collections.length} collections`;

  box.innerHTML = state.collections.map(collection => {
    const firstSong = state.songs.find(
      song => String(song.id) === String(collection.songs[0])
    );

    return `
      <article class="collection-card">
        <button
          class="collection-open"
          data-collection-open="${escapeHTML(collection.id)}"
        >
          <img
            src="${escapeHTML(firstSong?.cover || "")}"
            alt=""
          >

          <b>${escapeHTML(collection.name)}</b>

          <small>(${collection.songs.length})</small>
        </button>

        <button
          class="collection-menu"
          data-collection-menu="${escapeHTML(collection.id)}"
        >
          ⋮
        </button>
      </article>
    `;
  }).join("");
}

function openCollection(id) {
  const collection = state.collections.find(
    item => String(item.id) === String(id)
  );

  if (!collection) return;

  state.currentCollection = collection.id;

  const songs = collection.songs
    .map(songId =>
      state.songs.find(song => String(song.id) === String(songId))
    )
    .filter(Boolean);

  showCollectionSongs(collection, songs);
}

function showCollectionSongs(collection, songs) {
  let sheet = $("#collectionSheet");

  if (!sheet) {
    sheet = document.createElement("section");
    sheet.id = "collectionSheet";
    sheet.className = "bottom-sheet";

    document.querySelector(".app-shell").appendChild(sheet);
  }

  sheet.classList.add("open");

  sheet.innerHTML = `
    <div class="handle"></div>

    <div class="sheet-title">
      <h2>${escapeHTML(collection.name)}</h2>
      <button id="collectionClose">×</button>
    </div>

    <div class="collection-song-select">
      ${songs.map(song => `
        <article class="music-row">
          <img class="cover" src="${escapeHTML(song.cover)}" alt="">

          <button
            class="music-main"
            data-collection-play="${escapeHTML(song.id)}"
          >
            <b>${escapeHTML(song.title)}</b>
            <small>${escapeHTML(song.artist)}</small>
          </button>

          <input
            type="checkbox"
            data-collection-remove="${escapeHTML(song.id)}"
          >
        </article>
      `).join("")}
    </div>

    <button id="collectionRemoveSelected">
      Remove selected songs
    </button>
  `;

  $("#collectionClose").onclick = () => sheet.classList.remove("open");

  $("#collectionRemoveSelected").onclick = () => {
    const selected = $$("[data-collection-remove]:checked")
      .map(input => input.dataset.collectionRemove);

    collection.songs = collection.songs.filter(
      id => !selected.includes(String(id))
    );

    saveFavorites();
    renderFavorites();
    openCollection(collection.id);
  };

  sheet.addEventListener("click", event => {
    const play = event.target.closest("[data-collection-play]");

    if (play) {
      playSongById(play.dataset.collectionPlay);
    }
  });
}

function collectionMenu(id) {
  const collection = state.collections.find(
    item => String(item.id) === String(id)
  );

  if (!collection) return;

  const choice = prompt(
    "Choose: 1 Rename, 2 Add songs, 3 Remove collection"
  );

  if (choice === "1") {
    const name = prompt("New collection name:");

    if (name?.trim()) {
      collection.name = name.trim();
    }

  } else if (choice === "2") {
    const name = prompt(
      "Enter the song IDs to add, separated by commas:"
    );

    if (name) {
      name.split(",").forEach(value => {
        const id = value.trim();

        if (
          state.songs.some(song => String(song.id) === id) &&
          !collection.songs.includes(id)
        ) {
          collection.songs.push(id);
        }
      });
    }

  } else if (choice === "3") {
    if (confirm("Remove this collection?")) {
      state.collections = state.collections.filter(
        item => String(item.id) !== String(id)
      );
    }
  }

  saveFavorites();
  renderFavorites();
                                        }

