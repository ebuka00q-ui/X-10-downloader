/* =========================================================
   VIC-SOUND LISTENER
   Main application JavaScript

   Core features:
   - Music catalogue
   - Audio player and background controls
   - Queue, shuffle and repeat
   - Offline audio downloads
   - Search and categories
   - Favorites and custom collections
   - Rule-based DJ (no AI required)
   - Lyrics display and timed lyrics
   - Sleep timer
   - Local notification preference
   - Playback activity tracking
   - Optional Supabase connection

   IMPORTANT:
   Real rewarded ads, push notifications and trusted
   stream verification require backend integration.
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     1. CONFIGURATION
     ======================================================= */

  const CONFIG = {
    SUPABASE_URL: "https://gkfivuvtpfetzatzhnaq.supabase.co",

    // Add the Supabase publishable/anon key here when ready.
    SUPABASE_KEY: "",

    SONGS_TABLE: "songs",

    OFFLINE_CACHE: "vic-sound-music-v1",

    STORAGE_KEY: "vic-sound-listener-v1",

    DOWNLOAD_CONCURRENCY: 2,

    VALID_STREAM_SECONDS: 60,

    DJ_VOICE_LANGUAGE: "en-NG"
  };


  /* =======================================================
     2. ELEMENTS
     ======================================================= */

  const $ = (id) => document.getElementById(id);

  const audio = $("audio");

  if (!audio) {
    console.error("Vic-sound: audio element was not found.");
    return;
  }

  const el = {
    homeScreen: $("homeScreen"),
    favoritesScreen: $("favoritesScreen"),
    latestScreen: $("latestScreen"),

    homeMusicList: $("homeMusicList"),
    favoriteGrid: $("favoriteGrid"),
    latestList: $("latestList"),

    offlineCard: $("offlineCard"),
    offlineStatus: $("offlineStatus"),
    offlineCount: $("offlineCount"),
    offlineMessage: $("offlineMessage"),

    miniPlayer: $("miniPlayer"),
    miniCover: $("miniCover"),
    miniTitle: $("miniTitle"),
    miniArtist: $("miniArtist"),
    miniPlay: $("miniPlay"),

    playerOverlay: $("playerOverlay"),
    playerCover: $("playerCover"),
    playerTitle: $("playerTitle"),
    playerArtist: $("playerArtist"),
    playPause: $("playPause"),

    progress: $("progress"),
    currentTime: $("currentTime"),
    duration: $("duration"),

    queueOverlay: $("queueOverlay"),
    queueList: $("queueList"),
    queueCount: $("queueCount"),
    queueCover: $("queueCover"),
    queueTitle: $("queueTitle"),
    queueArtist: $("queueArtist"),

    lyricsSheet: $("lyricsSheet"),
    lyricsContent: $("lyricsContent"),
    lyricsSongTitle: $("lyricsSongTitle"),

    timerSheet: $("timerSheet"),

    djOverlay: $("djOverlay"),
    djReply: $("djReply"),
    djInput: $("djInput"),
    djMic: $("djMic"),
    djCoverLarge: $("djCoverLarge"),
    favoriteDjCover: $("favoriteDjCover"),

    searchPanel: $("searchPanel"),
    searchInput: $("searchInput"),

    notificationPopover: $("notificationPopover"),
    notificationSwitch: $("notificationSwitch"),

    exitModal: $("exitModal")
  };


  /* =======================================================
     3. APPLICATION STATE
     ======================================================= */

  const state = {
    songs: [],
    latest: [],

    currentSong: null,

    queue: [],
    currentQueueIndex: -1,

    shuffle: false,
    repeat: "off",

    currentScreen: "home",

    favorites: [],
    collections: [],

    search: "",
    category: "All",

    downloadRunning: false,
    downloadQueue: [],

    timerMode: "end",
    timerTimeout: null,
    timerEndAt: null,

    recognition: null,
    speechAvailable: false,

    playbackSession: null,

    sessionEvents: [],

    lastNavigation: "home",

    djHistory: [],

    djLastSuggestions: [],

    isSeeking: false
  };


  /* =======================================================
     4. BASIC HELPERS
     ======================================================= */

  function safeText(value) {
    return String(value ?? "");
  }

  function escapeHTML(value) {
    return safeText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function unique(values) {
    return [...new Set(values)];
  }

  function normalizeWords(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getPlaceholderCover() {
    return "";
  }

  function getSongById(id) {
    return state.songs.find(song => String(song.id) === String(id));
  }

  function saveLocalState() {
    const data = {
      favorites: state.favorites,
      collections: state.collections,

      shuffle: state.shuffle,
      repeat: state.repeat,

      djHistory: state.djHistory.slice(-40),

      lastSuggestions: state.djLastSuggestions
    };

    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn("Could not save local preferences:", error);
    }
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);

      if (!raw) return;

      const data = JSON.parse(raw);

      state.favorites = Array.isArray(data.favorites)
        ? data.favorites
        : [];

      state.collections = Array.isArray(data.collections)
        ? data.collections
        : [];

      state.shuffle = Boolean(data.shuffle);

      state.repeat = ["off", "all", "one"].includes(data.repeat)
        ? data.repeat
        : "off";

      state.djHistory = Array.isArray(data.djHistory)
        ? data.djHistory
        : [];

      state.djLastSuggestions = Array.isArray(data.lastSuggestions)
        ? data.lastSuggestions
        : [];

    } catch (error) {
      console.warn("Saved preferences could not be loaded:", error);
    }
  }


  /* =======================================================
     5. OPTIONAL SUPABASE CONNECTION
     ======================================================= */

  let supabase = null;

  async function connectSupabase() {
    if (!CONFIG.SUPABASE_KEY) {
      console.info(
        "Vic-sound is running without Supabase configuration."
      );
      return false;
    }

    try {
      if (!window.supabase) {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        );
      }

      if (!window.supabase?.createClient) {
        throw new Error("Supabase library did not load.");
      }

      supabase = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_KEY
      );

      return true;

    } catch (error) {
      console.error("Supabase connection failed:", error);
      return false;
    }
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = url;
      script.async = true;

      script.onload = resolve;

      script.onerror = () => {
        reject(new Error("Could not load external script."));
      };

      document.head.appendChild(script);
    });
  }


  /* =======================================================
     6. SONG DATA NORMALIZATION
     ======================================================= */

  function normalizeSong(raw) {
    const song = {
      id: String(raw.id ?? crypto.randomUUID()),

      title: safeText(raw.title || "Untitled song"),

      artist: safeText(raw.artist || "Unknown artist"),

      album: safeText(raw.album || ""),

      audioUrl: safeText(
        raw.audio_url || raw.audioUrl || ""
      ),

      coverUrl: safeText(
        raw.cover_url || raw.coverUrl || ""
      ),

      djCoverUrl: safeText(
        raw.dj_cover_url || raw.djCoverUrl || ""
      ),

      duration: Number(raw.duration || 0),

      genre: Array.isArray(raw.genre)
        ? raw.genre
        : safeText(raw.genre).split(","),

      mood: Array.isArray(raw.mood)
        ? raw.mood
        : safeText(raw.mood).split(","),

      tags: Array.isArray(raw.tags)
        ? raw.tags
        : safeText(raw.tags).split(","),

      lyrics: safeText(raw.lyrics || ""),

      timedLyrics: raw.lyrics_timed || raw.timed_lyrics || null,

      releaseDate: raw.release_date || null,

      releaseId: raw.release_id || null,

      releaseType: safeText(raw.release_type || "single"),

      published: raw.published !== false,

      destination: safeText(
        raw.destination || raw.publish_to || "home"
      ).toLowerCase(),

      energy: Number(raw.energy ?? 5),

      createdAt: raw.created_at || null
    };

    song.genre = song.genre
      .map(value => safeText(value).trim())
      .filter(Boolean);

    song.mood = song.mood
      .map(value => safeText(value).trim())
      .filter(Boolean);

    song.tags = song.tags
      .map(value => safeText(value).trim())
      .filter(Boolean);

    return song;
  }


  /* =======================================================
     7. LOAD MUSIC CATALOGUE
     ======================================================= */

  async function loadCatalogue() {
    if (!supabase) {
      renderEverything();
      updateOfflineStatus();
      return;
    }

    try {
      const { data, error } = await supabase
        .from(CONFIG.SONGS_TABLE)
        .select("*");

      if (error) throw error;

      const songs = (data || [])
        .map(normalizeSong)
        .filter(song => song.audioUrl && song.published);

      state.songs = songs;

      state.latest = songs.filter(song =>
        song.destination.includes("latest") ||
        song.releaseId
      );

      renderEverything();

      startOfflineDownloads();

      updateOfflineStatus();

    } catch (error) {
      console.error("Catalogue loading failed:", error);

      renderEverything();

      updateOfflineStatus();
    }
  }


  /* =======================================================
     8. OFFLINE AUDIO STORAGE
     ======================================================= */

  async function openMusicCache() {
    if (!("caches" in window)) {
      return null;
    }

    try {
      return await caches.open(CONFIG.OFFLINE_CACHE);
    } catch (error) {
      console.error("Music cache unavailable:", error);
      return null;
    }
  }

  function cacheKey(song) {
    return new URL(
      `./__vic_sound_audio__/${encodeURIComponent(song.id)}`,
      location.href
    ).href;
  }

  async function isSongDownloaded(song) {
    const cache = await openMusicCache();

    if (!cache) return false;

    try {
      return Boolean(await cache.match(cacheKey(song)));
    } catch {
      return false;
    }
  }

  async function getOfflineAudio(song) {
    const cache = await openMusicCache();

    if (!cache) return null;

    try {
      return await cache.match(cacheKey(song));
    } catch {
      return null;
    }
  }

  async function downloadSong(song) {
    if (!song.audioUrl) return false;

    const cache = await openMusicCache();

    if (!cache) return false;

    const existing = await cache.match(cacheKey(song));

    if (existing) return true;

    try {
      const response = await fetch(song.audioUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit"
      });

      if (!response.ok || response.type === "opaque") {
        throw new Error("Audio could not be saved.");
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The downloaded audio file is empty.");
      }

      const savedResponse = new Response(blob, {
        status: 200,
        headers: {
          "Content-Type": blob.type || "audio/mpeg",
          "Content-Length": String(blob.size)
        }
      });

      await cache.put(cacheKey(song), savedResponse);

      return true;

    } catch (error) {
      console.warn(
        `Offline download failed for ${song.title}:`,
        error
      );

      return false;
    }
  }

  async function countDownloadedSongs() {
    let count = 0;

    for (const song of state.songs) {
      if (await isSongDownloaded(song)) {
        count++;
      }
    }

    return count;
  }

  async function updateOfflineStatus() {
    const total = state.songs.length;

    const count = await countDownloadedSongs();

    const progress = total
      ? Math.round((count / total) * 100)
      : 0;

    if (el.offlineCount) {
      el.offlineCount.textContent = `${count} songs saved`;
    }

    if (el.offlineCard) {
      el.offlineCard.style.setProperty(
        "--offline-progress",
        `${progress}%`
      );

      el.offlineCard.classList.toggle(
        "is-complete",
        total > 0 && count === total
      );

      el.offlineCard.classList.toggle(
        "is-preparing",
        count < total
      );
    }

    if (el.offlineStatus) {
      el.offlineStatus.textContent =
        navigator.onLine ? "Offline ready" : "Offline";
    }

    if (el.offlineMessage) {
      if (!total || count === total) {
        el.offlineMessage.textContent = "";
      } else if (!navigator.onLine) {
        el.offlineMessage.textContent =
          "Connect to the internet to prepare new music.";
      } else {
        el.offlineMessage.textContent =
          "Stay online to prepare your music for offline listening.";
      }
    }
  }

  async function startOfflineDownloads() {
    if (state.downloadRunning || !navigator.onLine) return;

    state.downloadRunning = true;

    try {
      const missing = [];

      for (const song of state.songs) {
        if (!(await isSongDownloaded(song))) {
          missing.push(song);
        }
      }

      state.downloadQueue = missing;

      let nextIndex = 0;

      async function worker() {
        while (nextIndex < missing.length) {
          const song = missing[nextIndex++];

          await downloadSong(song);

          await updateOfflineStatus();
        }
      }

      const workers = [];

      const numberOfWorkers = Math.min(
        CONFIG.DOWNLOAD_CONCURRENCY,
        missing.length
      );

      for (let i = 0; i < numberOfWorkers; i++) {
        workers.push(worker());
      }

      await Promise.all(workers);

    } finally {
      state.downloadRunning = false;

      await updateOfflineStatus();
    }
  }

  window.addEventListener("online", () => {
    updateOfflineStatus();
    startOfflineDownloads();
  });

  window.addEventListener("offline", updateOfflineStatus);


  /* =======================================================
     9. SONG SOURCE FOR PLAYBACK
     ======================================================= */

  let currentObjectUrl = null;

  async function getPlayableUrl(song) {
    const cached = await getOfflineAudio(song);

    if (cached) {
      const blob = await cached.blob();

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }

      currentObjectUrl = URL.createObjectURL(blob);

      return {
        url: currentObjectUrl,
        offline: true
      };
    }

    return {
      url: song.audioUrl,
      offline: false
    };
  }


  /* =======================================================
     10. RENDER SONG LIST
     ======================================================= */

  function songMatchesCategory(song, category) {
    if (category === "All") return true;

    const values = [
      ...song.genre,
      ...song.mood,
      ...song.tags
    ].map(normalizeWords);

    if (category === "New") {
      const known = [
        "rap", "pop", "hip-hop", "trap",
        "afrobeats", "calm", "sad",
        "moody", "love"
      ];

      return !values.some(value =>
        known.some(item => value.includes(item))
      );
    }

    return values.some(value =>
      value.includes(normalizeWords(category))
    );
  }

  function songMatchesSearch(song, search) {
    if (!search) return true;

    const text = normalizeWords([
      song.title,
      song.artist,
      song.album,
      ...song.genre,
      ...song.mood,
      ...song.tags
    ].join(" "));

    return text.includes(normalizeWords(search));
  }

  function isFavorite(id) {
    return state.favorites.includes(String(id));
  }

  function renderSongRow(song) {
    const playing = state.currentSong?.id === song.id;

    return `
      <article class="music-row ${playing ? "playing" : ""}"
        data-song-id="${escapeHTML(song.id)}">

        <img class="cover"
          src="${escapeHTML(song.coverUrl)}"
          alt=""
          loading="lazy">

        <button class="music-main" data-play-song="${escapeHTML(song.id)}">
          <b>${escapeHTML(song.title)}</b>
          <small>${escapeHTML(song.artist)}</small>
        </button>

        <span class="playing-bars">▮▮▮</span>

        <button
          class="favorite-toggle ${isFavorite(song.id) ? "active" : ""}"
          data-favorite="${escapeHTML(song.id)}"
          aria-label="Add to favorites">
          ${isFavorite(song.id) ? "♥" : "♡"}
        </button>

        <button class="row-more"
          data-song-menu="${escapeHTML(song.id)}"
          aria-label="Song options">⋮</button>
      </article>
    `;
  }

  function renderHome() {
    if (!el.homeMusicList) return;

    const songs = state.songs.filter(song =>
      song.destination !== "latest" &&
      songMatchesCategory(song, state.category) &&
      songMatchesSearch(song, state.search)
    );

    if (!songs.length) {
      el.homeMusicList.innerHTML = `
        <div class="empty-state">
          <b>No music found</b>
          <span>New songs will appear here when available.</span>
        </div>
      `;

      return;
    }

    el.homeMusicList.innerHTML = songs
      .map(renderSongRow)
      .join("");
  }


  /* =======================================================
     11. FAVORITES AND COLLECTIONS
     ======================================================= */

  function toggleFavorite(id) {
    id = String(id);

    if (isFavorite(id)) {
      state.favorites = state.favorites.filter(item => item !== id);
    } else {
      state.favorites.push(id);
    }

    saveLocalState();

    renderFavorites();
    renderHome();
  }

  function createCollection() {
    const name = prompt("Enter your collection name:");

    if (!name || !name.trim()) return;

    state.collections.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      songs: []
    });

    saveLocalState();

    renderFavorites();
  }

  function renameCollection(id) {
    const collection = state.collections.find(item => item.id === id);

    if (!collection) return;

    const name = prompt(
      "Enter the new collection name:",
      collection.name
    );

    if (!name || !name.trim()) return;

    collection.name = name.trim();

    saveLocalState();

    renderFavorites();
  }

  function deleteCollection(id) {
    const collection = state.collections.find(item => item.id === id);

    if (!collection) return;

    if (!confirm(`Remove "${collection.name}"?`)) return;

    state.collections = state.collections.filter(item => item.id !== id);

    saveLocalState();

    renderFavorites();
  }

  function collectionCover(collection) {
    const song = getSongById(collection.songs[0]);

    return song?.coverUrl || "";
  }

  function renderFavorites() {
    if (!el.favoriteGrid) return;

    const favoriteSongs = state.favorites
      .map(getSongById)
      .filter(Boolean);

    const collectionHTML = state.collections.map(collection => `
      <article class="collection-card">

        <button class="favorite-card-open"
          data-open-collection="${escapeHTML(collection.id)}">

          <img
            src="${escapeHTML(collectionCover(collection))}"
            alt=""
            loading="lazy">

          <div class="collection-card-info">
            <b>${escapeHTML(collection.name)}</b>
            <small>(${collection.songs.length}) songs</small>
          </div>
        </button>

        <button class="collection-card-more"
          data-collection-menu="${escapeHTML(collection.id)}">
          ⋮
        </button>
      </article>
    `).join("");

    const favoriteHTML = favoriteSongs.map(song => `
      <article class="favorite-card">

        <button class="favorite-card-open"
          data-play-song="${escapeHTML(song.id)}">

          <img src="${escapeHTML(song.coverUrl)}" alt="">

          <div class="favorite-card-info">
            <b>${escapeHTML(song.title)}</b>
            <small>${escapeHTML(song.artist)}</small>
          </div>
        </button>

        <button class="favorite-card-more"
          data-song-menu="${escapeHTML(song.id)}">
          ⋮
        </button>
      </article>
    `).join("");

    el.favoriteGrid.innerHTML = `
      <div class="collection-grid">
        ${collectionHTML}
      </div>

      <div class="section-heading">
        <h2>Liked Songs</h2>
        <button id="createCollectionButton">＋</button>
      </div>

      <div class="favorite-grid">
        ${favoriteHTML}
      </div>

      ${!favoriteHTML && !collectionHTML ? `
        <div class="empty-state">
          <b>Your music space is empty</b>
          <span>Like songs or create your own collection.</span>
        </div>
      ` : ""}
    `;

    const count = $("favoriteCount");

    if (count) {
      count.textContent = `${favoriteSongs.length} songs`;
    }

    $("createCollectionButton")?.addEventListener(
      "click",
      createCollection
    );
  }

  function openCollection(id) {
    const collection = state.collections.find(item => item.id === id);

    if (!collection) return;

    const songs = collection.songs
      .map(getSongById)
      .filter(Boolean);

    const choices = songs.map(song =>
      `${song.title} — ${song.artist}`
    );

    const selected = prompt(
      `Collection: ${collection.name}\n\n` +
      choices.map((item, index) => `${index + 1}. ${item}`).join("\n") +
      "\n\nType a song number to play:"
    );

    if (!selected) return;

    const index = Number(selected) - 1;

    if (songs[index]) {
      playSong(songs[index], songs);
    }
  }

  function showCollectionMenu(id) {
    const collection = state.collections.find(item => item.id === id);

    if (!collection) return;

    const choice = prompt(
      `${collection.name}\n\n` +
      "1. Add songs\n" +
      "2. Rename\n" +
      "3. Remove collection"
    );

    if (choice === "1") {
      addSongsToCollection(id);
    }

    if (choice === "2") {
      renameCollection(id);
    }

    if (choice === "3") {
      deleteCollection(id);
    }
  }

  function addSongsToCollection(id) {
    const collection = state.collections.find(item => item.id === id);

    if (!collection) return;

    const available = state.songs.filter(song =>
      !collection.songs.includes(song.id)
    );

    if (!available.length) {
      alert("There are no more songs to add.");
      return;
    }

    const list = available.map((song, index) =>
      `${index + 1}. ${song.title} — ${song.artist}`
    ).join("\n");

    const answer = prompt(
      "Enter song numbers separated by commas:\n\n" + list
    );

    if (!answer) return;

    answer.split(",").forEach(value => {
      const index = Number(value.trim()) - 1;

      if (available[index]) {
        collection.songs.push(available[index].id);
      }
    });

    collection.songs = unique(collection.songs);

    saveLocalState();

    renderFavorites();
  }

 /* =======================================================
     12. LATEST RELEASES
     ======================================================= */

  function renderLatest() {
    if (!el.latestList) return;

    const releases = state.latest.length
      ? state.latest
      : state.songs.filter(song =>
          song.destination === "latest" || song.releaseId
        );

    if (!releases.length) {
      el.latestList.innerHTML = `
        <div class="empty-state">
          <b>No latest releases yet</b>
          <span>New releases will appear here.</span>
        </div>
      `;

      return;
    }

    el.latestList.innerHTML = releases.map(song => `
      <article class="release-card">

        <img class="release-cover"
          src="${escapeHTML(song.coverUrl)}"
          alt="">

        <div class="release-info">
          <h3>${escapeHTML(song.title)}</h3>
          <p>${escapeHTML(song.artist)}</p>
          <p>${escapeHTML(song.releaseType)}</p>
        </div>

        <button class="release-action"
          data-latest-download="${escapeHTML(song.id)}">
          Download
        </button>

      </article>
    `).join("");
  }


  /* =======================================================
     13. MAIN RENDER
     ======================================================= */

  function renderEverything() {
    renderHome();
    renderFavorites();
    renderLatest();
    updatePlayerDisplay();
    renderQueue();
  }


  /* =======================================================
     14. SCREEN NAVIGATION
     ======================================================= */

  function showScreen(name) {
    const screens = {
      home: el.homeScreen,
      favorites: el.favoritesScreen,
      latest: el.latestScreen
    };

    if (!screens[name]) return;

    Object.values(screens).forEach(screen => {
      screen?.classList.remove("active");
    });

    screens[name].classList.add("active");

    state.currentScreen = name;

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.screen === name
      );
    });

    if (el.searchPanel) {
      el.searchPanel.classList.remove("open");
    }
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.screen);
    });
  });

 
/* =======================================================
     15. PLAYER
     ======================================================= */

  async function playSong(song, list = state.songs) {
    if (!song) return;

    state.currentSong = song;

    if (Array.isArray(list) && list.length) {
      state.queue = list.slice();

      state.currentQueueIndex = state.queue.findIndex(
        item => item.id === song.id
      );
    }

    state.playbackSession = {
      id: crypto.randomUUID(),
      songId: song.id,
      startedAt: Date.now(),
      lastTime: 0,
      listenedSeconds: 0,
      qualified: false,
      completed: false,
      skipped: false,
      offline: false
    };

    try {
      const source = await getPlayableUrl(song);

      state.playbackSession.offline = source.offline;

      audio.src = source.url;

      audio.load();

      await audio.play();

      updatePlayerDisplay();

      openPlayerMetadata(song);

      renderQueue();

      renderHome();

      renderFavorites();

      recordLocalEvent("play_started", {
        songId: song.id,
        offline: source.offline
      });

    } catch (error) {
      console.error("Playback failed:", error);

      alert(
        "This song could not be played. Check your connection or audio file."
      );
    }
  }

  function openPlayerMetadata(song) {
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || "Vic-sound",
        artwork: song.coverUrl
          ? [{ src: song.coverUrl }]
          : []
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audio.play();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        audio.pause();
      });

      navigator.mediaSession.setActionHandler("previoustrack", previousSong);

      navigator.mediaSession.setActionHandler("nexttrack", nextSong);

      navigator.mediaSession.setActionHandler("seekto", details => {
        if (Number.isFinite(details.seekTime)) {
          audio.currentTime = details.seekTime;
        }
      });

    } catch (error) {
      console.warn("Media Session unavailable:", error);
    }
  }

  function updatePlayerDisplay() {
    const song = state.currentSong;

    if (!song) return;

    const cover = song.coverUrl;

    [
      el.miniCover,
      el.playerCover,
      el.queueCover
    ].forEach(image => {
      if (image) image.src = cover;
    });

    [
      el.miniTitle,
      el.playerTitle,
      el.queueTitle
    ].forEach(node => {
      if (node) node.textContent = song.title;
    });

    [
      el.miniArtist,
      el.playerArtist,
      el.queueArtist
    ].forEach(node => {
      if (node) node.textContent = song.artist;
    });

    el.miniPlayer?.classList.add("visible");

    el.miniPlayer?.setAttribute("aria-hidden", "false");

    updatePlayButtons();
  }

  function updatePlayButtons() {
    const playing = !audio.paused;

    if (el.playPause) {
      el.playPause.textContent = playing ? "Ⅱ" : "▶";
    }

    if (el.miniPlay) {
      el.miniPlay.textContent = playing ? "Ⅱ" : "▶";
    }

    el.playerOverlay?.classList.toggle("playing", playing);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState =
        playing ? "playing" : "paused";
    }
  }

  function togglePlayback() {
    if (!state.currentSong) {
      if (state.songs.length) {
        playSong(state.songs[0]);
      }

      return;
    }

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }

  function openPlayer() {
    el.playerOverlay?.classList.add("open");
    el.playerOverlay?.setAttribute("aria-hidden", "false");
  }

  function closePlayer() {
    el.playerOverlay?.classList.remove("open");
    el.playerOverlay?.setAttribute("aria-hidden", "true");
  }

  $("miniOpen")?.addEventListener("click", openPlayer);

  $("playPause")?.addEventListener("click", togglePlayback);

  $("miniPlay")?.addEventListener("click", togglePlayback);

  $("miniPrev")?.addEventListener("click", previousSong);

  $("miniNext")?.addEventListener("click", nextSong);

  $("playerBack")?.addEventListener("click", closePlayer);

  audio.addEventListener("play", updatePlayButtons);

  audio.addEventListener("pause", updatePlayButtons);

  audio.addEventListener("loadedmetadata", () => {
    if (el.duration) {
      el.duration.textContent = formatTime(audio.duration);
    }

    updateLyrics();
  });

  audio.addEventListener("timeupdate", () => {
    if (!state.isSeeking && el.progress && Number.isFinite(audio.duration)) {
      el.progress.value = audio.duration
        ? (audio.currentTime / audio.duration) * 100
        : 0;
    }

    if (el.currentTime) {
      el.currentTime.textContent = formatTime(audio.currentTime);
    }

    if (el.duration && Number.isFinite(audio.duration)) {
      el.duration.textContent = formatTime(audio.duration);
    }

    trackListeningTime();

    updateLyrics();

    checkTimer();
  });

  el.progress?.addEventListener("input", () => {
    state.isSeeking = true;

    if (Number.isFinite(audio.duration)) {
      audio.currentTime =
        (Number(el.progress.value) / 100) * audio.duration;
    }
  });

  el.progress?.addEventListener("change", () => {
    state.isSeeking = false;
  });

 /* =======================================================
     16. QUEUE
     ======================================================= */

  function renderQueue() {
    if (!el.queueList) return;

    const remaining = state.queue
      .map((song, index) => ({ song, index }))
      .filter(item => item.index !== state.currentQueueIndex);

    if (el.queueCount) {
      el.queueCount.textContent =
        `${state.queue.length} songs`;
    }

    el.queueList.innerHTML = remaining.map(item => `
      <article class="queue-row"
        draggable="true"
        data-queue-index="${item.index}">

        <span class="queue-num">${item.index + 1}</span>

        <img src="${escapeHTML(item.song.coverUrl)}" alt="">

        <button class="queue-song"
          data-play-queue="${item.index}">
          <b>${escapeHTML(item.song.title)}</b>
          <small>${escapeHTML(item.song.artist)}</small>
        </button>

        <span class="repeat-badge">
          ${item.index === state.currentQueueIndex ? "Playing" : ""}
        </span>

        <button data-remove-queue="${item.index}">×</button>

      </article>
    `).join("");
  }

  function openQueue() {
    el.queueOverlay?.classList.add("open");
    el.queueOverlay?.setAttribute("aria-hidden", "false");
    renderQueue();
  }

  function closeQueue() {
    el.queueOverlay?.classList.remove("open");
    el.queueOverlay?.setAttribute("aria-hidden", "true");
  }

  $("openQueueFromPlayer")?.addEventListener("click", openQueue);

  $("queueBack")?.addEventListener("click", closeQueue);

  $("queueClose")?.addEventListener("click", closeQueue);

  function removeQueueItem(index) {
    if (index < 0 || index >= state.queue.length) return;

    const removedCurrent = index === state.currentQueueIndex;

    state.queue.splice(index, 1);

    if (removedCurrent) {
      state.currentQueueIndex = -1;
    } else if (index < state.currentQueueIndex) {
      state.currentQueueIndex--;
    }

    renderQueue();
  }

  function moveQueueItem(from, to) {
    if (from === to) return;

    if (
      from < 0 ||
      to < 0 ||
      from >= state.queue.length ||
      to >= state.queue.length
    ) return;

    const [song] = state.queue.splice(from, 1);

    state.queue.splice(to, 0, song);

    if (state.currentQueueIndex === from) {
      state.currentQueueIndex = to;
    } else if (
      from < state.currentQueueIndex &&
      to >= state.currentQueueIndex
    ) {
      state.currentQueueIndex--;
    } else if (
      from > state.currentQueueIndex &&
      to <= state.currentQueueIndex
    ) {
      state.currentQueueIndex++;
    }

    renderQueue();
  }

  let draggingIndex = null;

  el.queueList?.addEventListener("dragstart", event => {
    const row = event.target.closest("[data-queue-index]");

    if (!row) return;

    draggingIndex = Number(row.dataset.queueIndex);

    row.classList.add("dragging");
  });

  el.queueList?.addEventListener("dragover", event => {
    event.preventDefault();
  });

  el.queueList?.addEventListener("drop", event => {
    event.preventDefault();

    const row = event.target.closest("[data-queue-index]");

    if (!row || draggingIndex === null) return;

    moveQueueItem(
      draggingIndex,
      Number(row.dataset.queueIndex)
    );

    draggingIndex = null;
  });

  el.queueList?.addEventListener("dragend", () => {
    draggingIndex = null;

    el.queueList
      ?.querySelectorAll(".dragging")
      .forEach(row => row.classList.remove("dragging"));
  });

                                    
/* =======================================================
     17. NEXT AND PREVIOUS
     ======================================================= */

  function nextSong() {
    if (!state.queue.length) return;

    if (state.repeat === "one") {
      audio.currentTime = 0;
      audio.play();
      return;
    }

    let nextIndex;

    if (state.shuffle && state.queue.length > 1) {
      const choices = state.queue
        .map((_, index) => index)
        .filter(index => index !== state.currentQueueIndex);

      nextIndex = choices[
        Math.floor(Math.random() * choices.length)
      ];

    } else {
      nextIndex = state.currentQueueIndex + 1;
    }

    if (nextIndex >= state.queue.length) {
      if (state.repeat === "all") {
        nextIndex = 0;
      } else {
        audio.pause();
        return;
      }
    }

    state.currentQueueIndex = nextIndex;

    playSong(
      state.queue[nextIndex],
      state.queue
    );
  }

  function previousSong() {
    if (!state.queue.length) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    let index = state.currentQueueIndex - 1;

    if (index < 0) {
      if (state.repeat === "all") {
        index = state.queue.length - 1;
      } else {
        index = 0;
      }
    }

    state.currentQueueIndex = index;

    playSong(state.queue[index], state.queue);
  }

  $("next")?.addEventListener("click", nextSong);

  $("prev")?.addEventListener("click", previousSong);

  audio.addEventListener("ended", () => {
    if (state.playbackSession) {
      state.playbackSession.completed = true;

      recordLocalEvent("play_completed", {
        songId: state.playbackSession.songId
      });
    }

    if (state.repeat === "one") {
      audio.currentTime = 0;
      audio.play();
      return;
    }

    nextSong();
  });


  /* =======================================================
     18. SHUFFLE AND REPEAT
     ======================================================= */

  function updatePlaybackModes() {
    $("shuffle")?.classList.toggle("active", state.shuffle);

    $("repeat")?.classList.toggle(
      "active",
      state.repeat !== "off"
    );

    $("playerRepeatTop")?.classList.toggle(
      "active",
      state.repeat !== "off"
    );

    const queueButtons = document.querySelectorAll(
      ".queue-controls button"
    );

    queueButtons[0]?.classList.toggle("selected", state.shuffle);

    queueButtons[4]?.classList.toggle(
      "selected",
      state.repeat !== "off"
    );

    saveLocalState();
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    updatePlaybackModes();
  }

  function toggleRepeat() {
    const modes = ["off", "all", "one"];

    const index = modes.indexOf(state.repeat);

    state.repeat = modes[(index + 1) % modes.length];

    updatePlaybackModes();
  }

  $("shuffle")?.addEventListener("click", toggleShuffle);

  $("repeat")?.addEventListener("click", toggleRepeat);

  $("playerRepeatTop")?.addEventListener("click", toggleRepeat);

  document.querySelector(".queue-controls button:first-child")
    ?.addEventListener("click", toggleShuffle);

  document.querySelector(".queue-controls button:last-child")
    ?.addEventListener("click", toggleRepeat);


  /* =======================================================
     19. LYRICS
     ======================================================= */

  function openLyrics() {
    if (!state.currentSong) return;

    el.lyricsSheet?.classList.add("open");

    el.lyricsSheet?.setAttribute("aria-hidden", "false");

    if (el.lyricsSongTitle) {
      el.lyricsSongTitle.textContent =
        state.currentSong.title;
    }

    renderLyrics();
  }

  function closeLyrics() {
    el.lyricsSheet?.classList.remove("open");

    el.lyricsSheet?.setAttribute("aria-hidden", "true");
  }

  $("lyricsButton")?.addEventListener("click", openLyrics);

  function parseTimedLyrics(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.map(item => ({
        time: Number(item.time ?? item.seconds ?? 0),
        text: safeText(item.text ?? item.lyric ?? "")
      }));
    }

    return [];
  }

  function renderLyrics() {
    if (!el.lyricsContent || !state.currentSong) return;

    const song = state.currentSong;

    const timed = parseTimedLyrics(song.timedLyrics);

    if (timed.length) {
      el.lyricsContent.innerHTML = timed.map((line, index) => `
        <p class="upcoming-line"
          data-lyric-index="${index}">
          ${escapeHTML(line.text)}
        </p>
      `).join("");

      updateLyrics();

      return;
    }

    if (song.lyrics.trim()) {
      el.lyricsContent.textContent = song.lyrics;
    } else {
      el.lyricsContent.textContent = "No lyrics to this song.";
    }
  }

  function updateLyrics() {
    if (!el.lyricsContent || !state.currentSong) return;

    const timed = parseTimedLyrics(state.currentSong.timedLyrics);

    if (!timed.length) return;

    let currentIndex = -1;

    timed.forEach((line, index) => {
      if (audio.currentTime >= line.time) {
        currentIndex = index;
      }
    });

    const lines = el.lyricsContent.querySelectorAll(
      "[data-lyric-index]"
    );

    lines.forEach((line, index) => {
      line.classList.remove(
        "current-line",
        "past-line",
        "upcoming-line"
      );

      if (index === currentIndex) {
        line.classList.add("current-line");
      } else if (index < currentIndex) {
        line.classList.add("past-line");
      } else {
        line.classList.add("upcoming-line");
      }
    });

    const active = el.lyricsContent.querySelector(".current-line");

    active?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

      /* =======================================================
     20. SLEEP TIMER
     ======================================================= */

  function openTimer() {
    el.timerSheet?.classList.add("open");

    el.timerSheet?.setAttribute("aria-hidden", "false");
  }

  function closeTimer() {
    el.timerSheet?.classList.remove("open");

    el.timerSheet?.setAttribute("aria-hidden", "true");
  }

  $("queueTimer")?.addEventListener("click", openTimer);

  function clearTimer() {
    clearTimeout(state.timerTimeout);

    state.timerTimeout = null;

    state.timerEndAt = null;
  }

  function setTimer(minutes) {
    clearTimer();

    state.timerMode = "minutes";

    state.timerEndAt = Date.now() + minutes * 60 * 1000;

    document.querySelectorAll("[data-min]").forEach(button => {
      button.classList.toggle(
        "selected",
        Number(button.dataset.min) === minutes
      );
    });

    $("endTrack")?.classList.remove("selected");

    $("timerOff")?.classList.remove("selected");
  }

  document.querySelectorAll("[data-min]").forEach(button => {
    button.addEventListener("click", () => {
      setTimer(Number(button.dataset.min));
    });
  });

  $("endTrack")?.addEventListener("click", () => {
    clearTimer();

    state.timerMode = "end";

    document.querySelectorAll("[data-min]").forEach(button => {
      button.classList.remove("selected");
    });

    $("endTrack")?.classList.add("selected");

    $("timerOff")?.classList.remove("selected");
  });

  $("timerOff")?.addEventListener("click", () => {
    clearTimer();

    state.timerMode = "off";

    document.querySelectorAll("[data-min]").forEach(button => {
      button.classList.remove("selected");
    });

    $("endTrack")?.classList.remove("selected");

    $("timerOff")?.classList.add("selected");
  });

  function checkTimer() {
    if (!state.timerEndAt) return;

    if (Date.now() >= state.timerEndAt) {
      clearTimer();

      audio.pause();

      state.timerMode = "off";

      closeTimer();
    }
  }

/* =======================================================
     21. DJ — NO AI REQUIRED
     ======================================================= */

  const DJ_RULES = {
    calm: [
      "calm", "quiet", "peaceful", "soft", "relax",
      "relaxing", "sleep", "sleeping", "rest"
    ],

    sad: [
      "sad", "heartbroken", "cry", "crying",
      "emotional", "pain"
    ],

    love: [
      "love", "romantic", "romance", "relationship",
      "girlfriend", "boyfriend"
    ],

    rap: [
      "rap", "rapper", "bars", "hip hop", "hip-hop"
    ],

    party: [
      "party", "dance", "dancing", "energy",
      "hype", "turn up"
    ],

    afrobeats: [
      "afrobeats", "afrobeat", "afro"
    ],

    moody: [
      "moody", "dark", "late night", "night"
    ],

    pop: [
      "pop", "catchy", "melodic"
    ]
  };

  function detectDJIntent(message) {
    const text = normalizeWords(message);

    const found = [];

    for (const [mood, words] of Object.entries(DJ_RULES)) {
      if (words.some(word => text.includes(word))) {
        found.push(mood);
      }
    }

    return found;
  }

  function scoreSongForDJ(song, intents) {
    let score = 0;

    const values = [
      ...song.genre,
      ...song.mood,
      ...song.tags
    ].map(normalizeWords);

    for (const intent of intents) {
      if (values.some(value => value.includes(intent))) {
        score += 10;
      }
    }

    if (isFavorite(song.id)) {
      score += 2;
    }

    const history = state.djHistory
      .slice(-12)
      .filter(item => item.songId === song.id).length;

    score -= history * 3;

    if (state.djLastSuggestions.includes(song.id)) {
      score -= 8;
    }

    if (song.energy >= 1 && song.energy <= 10) {
      if (intents.includes("calm") && song.energy <= 4) {
        score += 4;
      }

      if (intents.includes("party") && song.energy >= 7) {
        score += 4;
      }
    }

    return score;
  }

  function getDJSuggestions(message) {
    const intents = detectDJIntent(message);

    let songs = state.songs.slice();

    if (!songs.length) return [];

    if (intents.length) {
      songs.sort((a, b) =>
        scoreSongForDJ(b, intents) -
        scoreSongForDJ(a, intents)
      );

      const bestScore = scoreSongForDJ(songs[0], intents);

      if (bestScore <= 0) {
        return [];
      }

      songs = songs.filter(song =>
        scoreSongForDJ(song, intents) > 0
      );

    } else {
      songs.sort((a, b) =>
        scoreSongForDJ(b, []) -
        scoreSongForDJ(a, [])
      );
    }

    return songs.slice(0, 5);
  }

  function speakDJ(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const message = new SpeechSynthesisUtterance(text);

    message.lang = CONFIG.DJ_VOICE_LANGUAGE;

    message.rate = 0.95;

    window.speechSynthesis.speak(message);
  }

  function replyDJ(message) {
    const suggestions = getDJSuggestions(message);

    if (!suggestions.length) {
      const reply =
        "I couldn't find a close match in the available music yet. " +
        "Try asking for rap, love, calm, sad or Afrobeats.";

      if (el.djReply) el.djReply.textContent = reply;

      speakDJ(reply);

      return;
    }

    const intent = detectDJIntent(message);

    let reply = intent.length
      ? `I found music that matches ${intent.join(", ")}.`
      : "Here are some songs you might enjoy.";

    reply += " Choose one and I'll play it.";

    if (el.djReply) {
      el.djReply.textContent = reply;
    }

    state.djLastSuggestions = suggestions.map(song => song.id);

    suggestions.forEach(song => {
      state.djHistory.push({
        songId: song.id,
        time: Date.now()
      });
    });

    saveLocalState();

    const suggestionHTML = suggestions.map((song, index) => `
      <button
        class="dj-suggestion"
        data-dj-play="${escapeHTML(song.id)}">

        ${index + 1}. ${escapeHTML(song.title)}
        — ${escapeHTML(song.artist)}

      </button>
    `).join("");

    if (el.djReply) {
      el.djReply.innerHTML = `
        <p>${escapeHTML(reply)}</p>
        <div class="dj-suggestions">
          ${suggestionHTML}
        </div>
      `;
    }

    speakDJ(reply);
  }

  $("favoriteDjPlay")?.addEventListener("click", () => {
    openDJ();
  });

  el.favoriteDjCover?.addEventListener("click", openDJ);

  function openDJ() {
    el.djOverlay?.classList.add("open");

    el.djOverlay?.setAttribute("aria-hidden", "false");

    updateDJArtwork();
  }

  function closeDJ() {
    el.djOverlay?.classList.remove("open");

    el.djOverlay?.setAttribute("aria-hidden", "true");

    stopDJListening();
  }

  $("djBack")?.addEventListener("click", closeDJ);

  function updateDJArtwork() {
    const artwork = state.songs.find(song => song.djCoverUrl)
      ?.djCoverUrl;

    if (!artwork) return;

    [el.djCoverLarge, el.favoriteDjCover].forEach(node => {
      if (!node) return;

      node.style.backgroundImage = `url("${artwork}")`;

      node.style.backgroundSize = "cover";

      node.style.backgroundPosition = "center";

      node.classList.remove("placeholder-dj");
    });
  }

  function sendDJMessage() {
    const message = el.djInput?.value.trim();

    if (!message) return;

    el.djInput.value = "";

    replyDJ(message);
  }

  $("djSend")?.addEventListener("click", sendDJMessage);

  el.djInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      sendDJMessage();
    }
  });

 /* =======================================================
     22. DJ VOICE INPUT
     ======================================================= */

  function startDJListening() {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "Voice input is not supported by this browser. You can type instead."
      );

      return;
    }

    stopDJListening();

    const recognition = new Recognition();

    state.recognition = recognition;

    recognition.lang = CONFIG.DJ_VOICE_LANGUAGE;

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      el.djMic?.classList.add("listening");

      el.djOverlay?.classList.add("listening");
    };

    recognition.onresult = event => {
      const text = event.results[0][0].transcript;

      if (el.djInput) {
        el.djInput.value = text;
      }

      sendDJMessage();
    };

    recognition.onerror = error => {
      console.warn("DJ voice input error:", error);
    };

    recognition.onend = () => {
      el.djMic?.classList.remove("listening");

      el.djOverlay?.classList.remove("listening");

      state.recognition = null;
    };

    recognition.start();

    setTimeout(() => {
      if (state.recognition) {
        stopDJListening();
      }
    }, 30000);
  }

  function stopDJListening() {
    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch {}
    }

    state.recognition = null;

    el.djMic?.classList.remove("listening");

    el.djOverlay?.classList.remove("listening");
  }

  el.djMic?.addEventListener("click", () => {
    if (state.recognition) {
      stopDJListening();
    } else {
      startDJListening();
    }
  });


  /* =======================================================
     23. SEARCH
     ======================================================= */

  $("searchToggle")?.addEventListener("click", () => {
    el.searchPanel?.classList.add("open");

    el.searchPanel?.setAttribute("aria-hidden", "false");

    el.searchInput?.focus();
  });

  $("searchClose")?.addEventListener("click", () => {
    el.searchPanel?.classList.remove("open");

    el.searchPanel?.setAttribute("aria-hidden", "true");

    state.search = "";

    if (el.searchInput) {
      el.searchInput.value = "";
    }

    renderHome();
  });

  el.searchInput?.addEventListener("input", () => {
    state.search = el.searchInput.value;

    renderHome();
  });


  /* =======================================================
     24. CATEGORY FILTER
     ======================================================= */

  $("categoryRow")?.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");

    if (!button) return;

    state.category = button.dataset.category;

    document.querySelectorAll(".category").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderHome();
  });
