/* Vic-sound — app.js */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const STORAGE = {
    library: "vicsound_library_v1",
    favorites: "vicsound_favorites_v1",
    collections: "vicsound_collections_v1",
    latestSeen: "vicsound_latest_seen_v1",
    repeat: "vicsound_repeat_v1",
    shuffle: "vicsound_shuffle_v1"
  };

  const demoSongs = [
    {id:"lost-thoughts", title:"Lost in Thoughts", artist:"Jay Nova", categories:["calm","moody"], latest:true, cover:""},
    {id:"better-days", title:"Better Days", artist:"Kendrick Vibes", categories:["rap","sad"], cover:""},
    {id:"neon-dreams", title:"Neon Dreams", artist:"The Vibe Collective", categories:["pop","hip-hop"], cover:""},
    {id:"midnight-call", title:"Midnight Call", artist:"Zara Lane", categories:["love","moody"], cover:""},
    {id:"real-ones", title:"Real Ones", artist:"Teezy & Nova", categories:["rap","hip-hop"], cover:""},
    {id:"dreams-never-end", title:"Dreams Never End", artist:"Vic-sound • Asake", categories:["rap","new"], cover:""},
    {id:"sunset-vibes", title:"Sunset Vibes", artist:"The Weeknd", categories:["pop","love"], cover:""},
    {id:"calm-before-storm", title:"Calm Before Storm", artist:"SZA", categories:["calm","sad"], cover:""},
    {id:"midnight-drive", title:"Midnight Drive", artist:"Frank Ocean", categories:["calm","moody"], cover:""}
  ];

  const state = {
    songs: loadSongs(),
    currentSongId: null,
    currentScreen: "home",
    playerOpen: false,
    djOpen: false,
    queueOpen: false,
    lyricsOpen: false,
    timer: null,
    timerMode: "end",
    repeatMode: 0, // 0 = once/stop, 1 = loop queue, 2 = repeat current
    shuffle: false,
    backGuardInstalled: false,
    lastBackAt: 0,
    pendingFavoriteSongId: null,
    latestNew: true,
    djSpeaking: false,
    speechSupported: "speechSynthesis" in window,
    recognition: null,
    queue: [],
    queueSource: "home"
  };

  function loadSongs() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE.library) || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return demoSongs.map(s => ({...s}));
  }

  function saveSongs() {
    localStorage.setItem(STORAGE.library, JSON.stringify(state.songs));
  }

  function getSong(id) {
    return state.songs.find(s => s.id === id) || null;
  }

  function getFavorites() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE.favorites) || "[]");
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }

  function setFavorites(ids) {
    localStorage.setItem(STORAGE.favorites, JSON.stringify(ids));
  }

  function getCollections() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE.collections) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch { return {}; }
  }

  function setCollections(data) {
    localStorage.setItem(STORAGE.collections, JSON.stringify(data));
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  function coverHTML(song, large = false) {
    if (song?.cover) return `<img src="${escapeHTML(song.cover)}" alt="">`;
    return `<div class="cover-placeholder${large ? " large" : ""}">VS</div>`;
  }

  function djCoverHTML() {
    return `<div class="dj-image-placeholder${" large"}"><span class="dj-symbol">VS</span><strong>DJ</strong></div>`;
  }

  function updateOfflineCount() {
    const count = state.songs.length;
    $("offlineCount").textContent = count;
    $("offlineLabel").textContent = count === 1 ? "song" : "songs";
  }

  function renderMusicList(container, songs) {
    if (!container) return;
    if (!songs.length) {
      container.innerHTML = `<div style="padding:25px 5px;color:#91a7a2;font-size:13px">No music found here.</div>`;
      return;
    }
    container.innerHTML = songs.map(song => {
      const current = state.currentSongId === song.id;
      const favorite = isFavorite(song.id);
      return `
        <article class="music-item ${current ? "current" : ""}" data-song-id="${escapeHTML(song.id)}">
          <button class="music-cover" data-action="open-song" aria-label="Open ${escapeHTML(song.title)}">${coverHTML(song)}</button>
          <button class="music-info" data-action="open-song" style="background:none;text-align:left;padding:0">
            <strong>${escapeHTML(song.title)}</strong>
            <span>${escapeHTML(song.artist)}</span>
          </button>
          <div class="music-actions">
            ${current && isPlaying() ? `<div class="playing-bars" aria-label="Playing"><span></span><span></span><span></span></div>` : ""}
            <button class="heart-button ${favorite ? "favorited" : ""}" data-action="favorite" aria-label="${favorite ? "Remove from favorites" : "Favorite"}">${favorite ? "♥" : "♡"}</button>
            <button class="more-button" data-action="open-song" aria-label="Open song">⋮</button>
          </div>
        </article>`;
    }).join("");
  }

  function renderHome() {
    const active = qs(".category.active")?.dataset.category || "all";
    const query = $("searchInput").value.trim().toLowerCase();
    let songs = state.songs.filter(song => {
      const categoryOK = active === "all" || song.categories.includes(active);
      const searchOK = !query || `${song.title} ${song.artist} ${song.categories.join(" ")}`.toLowerCase().includes(query);
      return categoryOK && searchOK;
    });
    renderMusicList($("homeMusicList"), songs);
  }

  function renderFavorites() {
    const favIds = getFavorites();
    const favorites = favIds.map(getSong).filter(Boolean);
    const collections = getCollections();
    const grid = $("collectionGrid");
    const keys = Object.keys(collections);

    grid.innerHTML = keys.length ? keys.map(name => `
      <button class="collection-card" data-collection="${escapeHTML(name)}" type="button">
        <strong>${escapeHTML(name)}</strong>
        <span>${collections[name].length} ${collections[name].length === 1 ? "song" : "songs"}</span>
      </button>`).join("") : `<div style="color:#91a7a2;font-size:12px;padding:8px 0">No collections yet. Create one when saving a favorite.</div>`;

    renderMusicList($("favoriteMusicList"), favorites);
  }

  function renderLatest() {
    const latest = state.songs.filter(s => s.latest || s.categories.includes("new"));
    renderMusicList($("latestMusicList"), latest);
  }

  function renderAll() {
    updateOfflineCount();
    renderHome();
    renderFavorites();
    renderLatest();
    updatePlayerUI();
    updateMiniPlayer();
    updateNavigation();
  }

  function setScreen(screen) {
    if (state.playerOpen || state.djOpen || state.queueOpen || state.lyricsOpen) return;
    state.currentScreen = screen;
    qsa(".screen").forEach(el => el.classList.toggle("active", el.dataset.screen === screen));
    qsa(".nav-button").forEach(btn => btn.classList.toggle("active", btn.dataset.screen === screen));
    if (screen === "latest") markLatestSeen();
    installBackGuard();
  }

  function installBackGuard() {
    if (state.backGuardInstalled) return;
    history.pushState({vicsoundGuard:true}, "", location.href);
    state.backGuardInstalled = true;
  }

  function closeTopLayer() {
    if (state.lyricsOpen) return closeLyrics();
    if (state.queueOpen) return closeQueue();
    if (state.djOpen) return closeDJ();
    if (state.playerOpen) return closePlayer();
    if (qs(".bottom-sheet:not(.hidden)")) {
      closeAllSheets();
      return true;
    }
    return false;
  }

  function handleBack() {
    const now = Date.now();
    if (now - state.lastBackAt < 700) {
      // Second back is the explicit exit request.
      state.lastBackAt = 0;
      openExitModal();
      return;
    }
    state.lastBackAt = now;

    if (closeTopLayer()) return;

    if (state.currentScreen !== "home") {
      setScreen("home");
      return;
    }

    // At home: first back is consumed. A second back opens the exit prompt.
    showToast("Press Back again to exit Vic-sound.");
    setTimeout(() => {
      if (Date.now() - state.lastBackAt >= 700) state.lastBackAt = 0;
    }, 750);
  }

  function openExitModal() {
    $("exitModal").classList.remove("hidden");
  }

  function closeExitModal() {
    $("exitModal").classList.add("hidden");
  }

  function confirmExit() {
    closeExitModal();
    // A web/PWA page cannot reliably force-close itself.
    // We stop in-app activity, then let the browser/OS handle the actual app exit.
    stopPlayback();
    showToast("Vic-sound is ready to close. Use your device's app gesture/back action to leave.");
  }

  function openPlayer(songId) {
    const song = getSong(songId);
    if (!song) return;
    state.currentSongId = song.id;
    state.playerOpen = true;
    $("musicPlayerScreen").classList.remove("hidden");
    $("bottomNavigation").classList.add("hidden");
    updatePlayerUI();
    installBackGuard();
  }

  function closePlayer() {
    state.playerOpen = false;
    $("musicPlayerScreen").classList.add("hidden");
    if (!state.djOpen && !state.queueOpen) $("bottomNavigation").classList.remove("hidden");
    renderAll();
  }

  function openDJ() {
    state.djOpen = true;
    $("djPlayerScreen").classList.remove("hidden");
    $("bottomNavigation").classList.add("hidden");
    installBackGuard();
  }

  function closeDJ() {
    state.djOpen = false;
    $("djPlayerScreen").classList.add("hidden");
    if (!state.playerOpen && !state.queueOpen) $("bottomNavigation").classList.remove("hidden");
  }

  function openQueue() {
    state.queueOpen = true;
    $("queueScreen").classList.remove("hidden");
    $("bottomNavigation").classList.add("hidden");
    renderQueue();
    installBackGuard();
  }

  function closeQueue() {
    state.queueOpen = false;
    $("queueScreen").classList.add("hidden");
    if (!state.playerOpen && !state.djOpen) $("bottomNavigation").classList.remove("hidden");
  }

  function openLyrics() {
    state.lyricsOpen = true;
    $("lyricsScreen").classList.remove("hidden");
    $("bottomNavigation").classList.add("hidden");
    $("lyricsSongTitle").textContent = getSong(state.currentSongId)?.title || "Current song";
    installBackGuard();
  }

  function closeLyrics() {
    state.lyricsOpen = false;
    $("lyricsScreen").classList.add("hidden");
    if (!state.playerOpen && !state.djOpen && !state.queueOpen) $("bottomNavigation").classList.remove("hidden");
  }

  function updatePlayerUI() {
    const song = getSong(state.currentSongId);
    if (!song) return;
    $("playerTitle").textContent = song.title;
    $("playerArtist").textContent = song.artist;
    $("playerCover").innerHTML = coverHTML(song, true);
    $("playerFavoriteButton").textContent = isFavorite(song.id) ? "♥" : "♡";
    $("playerFavoriteButton").classList.toggle("favorited", isFavorite(song.id));
    $("musicPlayerScreen").classList.toggle("is-playing", isPlaying());
    $("playerPlayPause").textContent = isPlaying() ? "Ⅱ" : "▶";
    $("currentTime").textContent = formatTime(audio.currentTime || 0);
    $("duration").textContent = formatTime(audio.duration || 0);
    $("playerProgress").value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  }

  function updateMiniPlayer() {
    const mini = $("miniPlayer");
    const song = getSong(state.currentSongId);
    if (!song) {
      mini.classList.add("hidden");
      return;
    }
    mini.classList.remove("hidden");
    $("miniCover").innerHTML = coverHTML(song);
    $("miniTitle").textContent = song.title;
    $("miniArtist").textContent = song.artist;
    mini.classList.toggle("is-playing", isPlaying());
    $("miniPlayPause").textContent = isPlaying() ? "Ⅱ" : "▶";
  }

  function updateNavigation() {
    $("bottomNavigation").classList.toggle("is-playing", isPlaying());
  }

  function isPlaying() {
    return !audio.paused && !audio.ended;
  }

  const audio = $("audioPlayer");

  function buildQueueForCurrentContext(songId) {
    let list = state.songs.slice();
    const active = qs(".category.active")?.dataset.category || "all";
    const query = $("searchInput").value.trim().toLowerCase();

    if (state.currentScreen === "favorites") {
      list = getFavorites().map(getSong).filter(Boolean);
      state.queueSource = "favorites";
    } else if (state.currentScreen === "latest") {
      list = state.songs.filter(s => s.latest || s.categories.includes("new"));
      state.queueSource = "latest";
    } else {
      list = list.filter(song => {
        const categoryOK = active === "all" || song.categories.includes(active);
        const searchOK = !query || `${song.title} ${song.artist} ${song.categories.join(" ")}`.toLowerCase().includes(query);
        return categoryOK && searchOK;
      });
      state.queueSource = active;
    }

    if (!list.some(s => s.id === songId)) {
      const picked = getSong(songId);
      if (picked) list.unshift(picked);
    }
    state.queue = list.map(s => s.id);
  }

  function playSong(songId, openFullScreen = false, buildContext = true) {
    const song = getSong(songId);
    if (!song) return;

    if (buildContext || !state.queue.length) buildQueueForCurrentContext(songId);
    state.currentSongId = song.id;

    if (song.audio) {
      if (audio.src !== song.audio) audio.src = song.audio;
      audio.play().catch(() => showToast("Tap Play again if your browser blocked audio."));
    } else {
      audio.pause();
      showToast("This song has no audio file connected yet.");
    }

    updateMiniPlayer();
    renderAll();
    if (openFullScreen) openPlayer(song.id);
  }

  function stopPlayback() {
    audio.pause();
    audio.currentTime = 0;
    updateMiniPlayer();
    updateNavigation();
    updatePlayerUI();
  }

  function getQueueSongs() {
    const ids = state.queue.length ? state.queue : state.songs.map(s => s.id);
    return ids.map(getSong).filter(Boolean);
  }

  function nextSong() {
    const list = getQueueSongs();
    if (!list.length) return;

    const current = getSong(state.currentSongId);
    if (current?.repeatCount && current.repeatCount > 1) {
      current.repeatCount--;
      saveSongs();
      playSong(current.id, false, false);
      return;
    }

    let index = list.findIndex(s => s.id === state.currentSongId);
    let nextIndex = state.shuffle ? Math.floor(Math.random() * list.length) : index + 1;

    if (nextIndex >= list.length || nextIndex < 0) {
      if (state.repeatMode === 1) nextIndex = 0;
      else { stopPlayback(); return; }
    }

    playSong(list[nextIndex].id, false, false);
  }

  function previousSong() {
    const list = getQueueSongs();
    if (!list.length) return;
    let index = list.findIndex(s => s.id === state.currentSongId);
    if (index <= 0) index = list.length - 1;
    else index--;
    playSong(list[index].id, false, false);
  }

  function setRepeat(mode) {
    state.repeatMode = mode;
    localStorage.setItem(STORAGE.repeat, String(mode));
    updateRepeatButtons();
  }

  function cycleRepeat() {
    setRepeat((state.repeatMode + 1) % 3);
    showToast(["Play once, then stop","Loop queue","Repeat current song"][state.repeatMode]);
  }

  function updateRepeatButtons() {
    const labels = ["Repeat: off","Repeat: queue","Repeat: current"];
    ["playerRepeatButton","playerRepeatControl","queueRepeatButton"].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.classList.toggle("active", state.repeatMode !== 0);
      el.textContent = state.repeatMode === 2 ? "↻1" : "↻";
      el.setAttribute("aria-label", labels[state.repeatMode]);
    });
  }

  function cycleShuffle() {
    state.shuffle = !state.shuffle;
    localStorage.setItem(STORAGE.shuffle, String(state.shuffle));
    ["playerShuffleButton","queueShuffleButton"].forEach(id => $(id)?.classList.toggle("active", state.shuffle));
    showToast(state.shuffle ? "Shuffle on" : "Shuffle off");
  }

  function renderQueue() {
    const queue = getQueueSongs();
    $("queueCount").textContent = queue.length;
    const current = getSong(state.currentSongId);
    $("queueCurrentTitle").textContent = current?.title || "No music playing";
    $("queueCurrentArtist").textContent = current?.artist || "Vic-sound";
    $("queueCurrent").querySelector(".queue-cover").innerHTML = coverHTML(current);

    $("queueList").innerHTML = queue.map((song, i) => `
      <article class="queue-item ${song.id === state.currentSongId ? "current" : ""}" draggable="true" data-song-id="${escapeHTML(song.id)}">
        <span class="queue-number">${i + 1}${song.id === state.currentSongId ? ' <span style="font-size:13px">▮</span>' : ""}</span>
        <button class="music-cover queue-cover small" data-queue-action="play" aria-label="Play ${escapeHTML(song.title)}">${coverHTML(song)}</button>
        <button class="queue-item-info" data-queue-action="play" style="background:none;text-align:left;padding:0">
          <strong>${escapeHTML(song.title)}</strong><span>${escapeHTML(song.artist)}</span>
        </button>
        <div class="queue-item-actions">
          ${song.repeatCount > 1 ? `<button class="queue-repeat" data-queue-action="reduce" aria-label="Reduce repeats">×${song.repeatCount}</button>` : ""}
          <button class="heart-button ${isFavorite(song.id) ? "favorited" : ""}" data-queue-action="favorite">${isFavorite(song.id) ? "♥" : "♡"}</button>
          <span class="drag-handle">≡</span>
        </div>
      </article>`).join("");
  }

  function openTimerSheet() {
    closeAllSheets();
    $("timerSheet").classList.remove("hidden");
    updateTimerUI();
  }

  function closeAllSheets() {
    qsa(".bottom-sheet").forEach(s => s.classList.add("hidden"));
  }

  function setTimer(value) {
    clearTimeout(state.timer);
    state.timer = null;
    if (value === "off") {
      state.timerMode = "off";
      updateTimerUI();
      closeAllSheets();
      showToast("Playback timer off");
      return;
    }
    if (value === "end") {
      state.timerMode = "end";
      updateTimerUI();
      closeAllSheets();
      showToast("Timer set to end of track");
      return;
    }
    state.timerMode = Number(value);
    state.timer = setTimeout(() => {
      stopPlayback();
      showToast("Playback timer finished.");
    }, Number(value) * 1000);
    updateTimerUI();
    closeAllSheets();
    showToast(`Playback will stop in ${value / 60 >= 1 ? (value/60)+" min" : value+" sec"}.`);
  }

  function updateTimerUI() {
    qsa(".timer-option").forEach(btn => btn.classList.toggle("active", Number(btn.dataset.timer) === state.timerMode));
    $("endOfTrackTimer").classList.toggle("active", state.timerMode === "end");
    $("timerOff").classList.toggle("active", state.timerMode === "off");
    $("timerOff").querySelector(".timer-check").classList.toggle("hidden", state.timerMode !== "off");
    $("endOfTrackTimer").querySelector(".timer-check").classList.toggle("hidden", state.timerMode !== "end");
  }

  function addFavoriteFlow(songId) {
    state.pendingFavoriteSongId = songId;
    const collections = getCollections();
    const names = Object.keys(collections);
    const list = $("collectionSelectList");
    list.innerHTML = names.length ? names.map(name => `
      <label class="collection-select"><input type="checkbox" value="${escapeHTML(name)}"><span>${escapeHTML(name)}</span></label>
    `).join("") : `<p style="color:#91a7a2;font-size:12px">No collection exists yet. Create one for this music.</p>`;
    closeAllSheets();
    $("collectionSheet").classList.remove("hidden");
  }

  function createCollectionFlow() {
    closeAllSheets();
    $("collectionNameInput").value = "";
    $("createCollectionSheet").classList.remove("hidden");
    setTimeout(() => $("collectionNameInput").focus(), 50);
  }

  function saveFavoriteSelections() {
    const songId = state.pendingFavoriteSongId;
    if (!songId) return;
    const checked = qsa('#collectionSelectList input[type="checkbox"]:checked').map(i => i.value);
    const collections = getCollections();
    if (!checked.length) {
      showToast("Select a collection or create one.");
      return;
    }
    checked.forEach(name => {
      if (!collections[name]) collections[name] = [];
      if (!collections[name].includes(songId)) collections[name].push(songId);
    });
    setCollections(collections);
    const favs = getFavorites();
    if (!favs.includes(songId)) favs.push(songId);
    setFavorites(favs);
    closeAllSheets();
    renderAll();
    showToast("Saved to collection.");
  }

  function confirmCreateCollection() {
    const name = $("collectionNameInput").value.trim();
    if (!name) {
      showToast("Give the collection a name.");
      return;
    }
    const collections = getCollections();
    if (collections[name]) {
      showToast("That collection already exists.");
      return;
    }
    collections[name] = [];
    if (state.pendingFavoriteSongId) collections[name].push(state.pendingFavoriteSongId);
    setCollections(collections);

    if (state.pendingFavoriteSongId) {
      const favs = getFavorites();
      if (!favs.includes(state.pendingFavoriteSongId)) favs.push(state.pendingFavoriteSongId);
      setFavorites(favs);
    }
    state.pendingFavoriteSongId = null;
    closeAllSheets();
    renderAll();
    showToast("Collection created.");
  }

  function toggleFavorite(songId) {
    if (isFavorite(songId)) {
      const favs = getFavorites().filter(id => id !== songId);
      setFavorites(favs);
      // Remove from every collection too.
      const collections = getCollections();
      Object.keys(collections).forEach(name => {
        collections[name] = collections[name].filter(id => id !== songId);
      });
      setCollections(collections);
      renderAll();
      showToast("Removed from favorites.");
    } else {
      addFavoriteFlow(songId);
    }
  }

  function markLatestSeen() {
    state.latestNew = false;
    localStorage.setItem(STORAGE.latestSeen, "1");
    $("latestDot").classList.add("hidden");
    $("navLatestDot").classList.add("hidden");
  }

  function loadPreferences() {
    state.repeatMode = Number(localStorage.getItem(STORAGE.repeat) || "0");
    state.shuffle = localStorage.getItem(STORAGE.shuffle) === "true";
    state.latestNew = localStorage.getItem(STORAGE.latestSeen) !== "1";
    $("latestDot").classList.toggle("hidden", !state.latestNew);
    $("navLatestDot").classList.toggle("hidden", !state.latestNew);
    updateRepeatButtons();
  }

  function toggleSearch() {
    const section = $("searchSection");
    section.classList.toggle("hidden");
    if (!section.classList.contains("hidden")) {
      $("searchInput").focus();
    } else {
      $("searchInput").value = "";
      renderHome();
    }
  }

  function showToast(message) {
    const toast = $("toast");
    $("toastMessage").textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 2200);
  }

  // Basic speech reply for the DJ. It writes the reply first, then speaks it.
  function djReply(text) {
    $("djTypingIndicator").classList.remove("hidden");
    $("djReplyText").textContent = "";
    state.djSpeaking = true;
    setTimeout(() => {
      $("djTypingIndicator").classList.add("hidden");
      let i = 0;
      const typeTimer = setInterval(() => {
        $("djReplyText").textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(typeTimer);
          state.djSpeaking = false;
          if (state.speechSupported) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = .95;
            utterance.pitch = 1;
            utterance.onend = () => { state.djSpeaking = false; };
            window.speechSynthesis.speak(utterance);
          }
        }
      }, 28);
    }, 450);
  }

  function sendDJMessage() {
    const input = $("djTextInput");
    const text = input.value.trim();
    if (!text) return;
    $("djUserMessage").classList.remove("hidden");
    $("djUserText").textContent = text;
    input.value = "";
    const lower = text.toLowerCase();
    let reply = "I hear you. Tell me the mood, artist, genre, or type of music you want, and I’ll help you find it.";
    if (lower.includes("sad")) reply = "Got you. I’d go with a calm, emotional and slightly moody selection.";
    else if (lower.includes("rap")) reply = "Got you. I can keep it rap-focused and move through the matching songs.";
    else if (lower.includes("love")) reply = "Got you. I’ll keep the selection warm, romantic and smooth.";
    else if (lower.includes("play")) reply = "Sure. I can help you choose what to play next.";
    djReply(reply);
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice input is not supported by this browser.");
      return;
    }
    if (state.recognition) state.recognition.stop();
    const recognition = new SpeechRecognition();
    state.recognition = recognition;
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    $("djVoiceButton").classList.add("listening");
    recognition.onresult = (event) => {
      $("djTextInput").value = event.results[0][0].transcript;
      $("djTextInputWrap").classList.remove("hidden");
      sendDJMessage();
    };
    recognition.onerror = () => showToast("I couldn't hear that. Try again.");
    recognition.onend = () => $("djVoiceButton").classList.remove("listening");
    recognition.start();
  }

  function bindEvents() {
    $("searchToggle").addEventListener("click", toggleSearch);
    $("notificationButton").addEventListener("click", () => setScreen("latest"));
    $("brandButton").addEventListener("click", () => setScreen("home"));
    $("navHome").addEventListener("click", () => setScreen("home"));
    $("navFavorites").addEventListener("click", () => setScreen("favorites"));
    $("navLatest").addEventListener("click", () => setScreen("latest"));

    $("searchInput").addEventListener("input", renderHome);

    qsa(".category").forEach(btn => btn.addEventListener("click", () => {
      qsa(".category").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderHome();
    }));

    $("djPlayButton").addEventListener("click", openDJ);
    $("djEntryImage").addEventListener("click", openDJ);
    $("djChatButton").addEventListener("click", () => {
      $("djChatButton").classList.add("hidden");
      $("djTextInputWrap").classList.remove("hidden");
      $("djTextInput").focus();
    });
    $("djSendButton").addEventListener("click", sendDJMessage);
    $("djTextInput").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDJMessage(); }
    });
    $("djVoiceButton").addEventListener("click", startVoiceInput);
    $("djPlayerBack").addEventListener("click", closeDJ);

    $("miniPlayerOpen").addEventListener("click", () => openPlayer(state.currentSongId));
    $("miniPlayPause").addEventListener("click", e => { e.stopPropagation(); togglePlayback(); });
    $("miniPrevious").addEventListener("click", e => { e.stopPropagation(); previousSong(); });
    $("miniNext").addEventListener("click", e => { e.stopPropagation(); nextSong(); });

    $("musicPlayerBack").addEventListener("click", closePlayer);
    $("playerQueueButton").addEventListener("click", openQueue);
    $("playerRepeatButton").addEventListener("click", cycleRepeat);
    $("playerShuffleButton").addEventListener("click", cycleShuffle);
    $("playerRepeatControl").addEventListener("click", cycleRepeat);
    $("playerPreviousButton").addEventListener("click", previousSong);
    $("playerNextButton").addEventListener("click", nextSong);
    $("playerPlayPause").addEventListener("click", togglePlayback);
    $("lyricsButton").addEventListener("click", openLyrics);
    $("lyricsBackButton").addEventListener("click", closeLyrics);
    $("playerProgress").addEventListener("input", () => {
      if (audio.duration) audio.currentTime = (Number($("playerProgress").value) / 100) * audio.duration;
    });
    $("playerFavoriteButton").addEventListener("click", () => toggleFavorite(state.currentSongId));

    $("queueBackButton").addEventListener("click", closeQueue);
    $("queueCloseButton").addEventListener("click", closeQueue);
    $("queueShuffleButton").addEventListener("click", cycleShuffle);
    $("queueRepeatButton").addEventListener("click", cycleRepeat);
    $("queueFavoriteButton").addEventListener("click", () => state.currentSongId && toggleFavorite(state.currentSongId));
    $("timerButton").addEventListener("click", openTimerSheet);

    qsa(".timer-option").forEach(btn => btn.addEventListener("click", () => setTimer(btn.dataset.timer)));
    $("endOfTrackTimer").addEventListener("click", () => setTimer("end"));
    $("timerOff").addEventListener("click", () => setTimer("off"));

    $("saveCollectionsButton").addEventListener("click", saveFavoriteSelections);
    $("createCollectionFromSheet").addEventListener("click", createCollectionFlow);
    $("confirmCreateCollection").addEventListener("click", confirmCreateCollection);
    $("createCollectionButton").addEventListener("click", createCollectionFlow);
    $("createCollectionTop").addEventListener("click", createCollectionFlow);
    $("collectionGrid").addEventListener("click", e => {
      const card = e.target.closest("[data-collection]");
      if (!card) return;
      const name = card.dataset.collection;
      const ids = getCollections()[name] || [];
      state.queue = ids.slice();
      state.queueSource = `collection:${name}`;
      const first = ids.map(getSong).find(Boolean);
      if (first) {
        state.currentSongId = first.id;
        playSong(first.id, true, false);
      } else showToast("This collection is empty.");
    });

    $("cancelExitButton").addEventListener("click", closeExitModal);
    $("confirmExitButton").addEventListener("click", confirmExit);

    document.addEventListener("click", e => {
      const musicItem = e.target.closest(".music-item");
      if (musicItem) {
        const id = musicItem.dataset.songId;
        const action = e.target.closest("[data-action]")?.dataset.action;
        if (action === "favorite") {
          e.stopPropagation();
          toggleFavorite(id);
        } else if (action === "open-song") {
          if (state.currentSongId === id && isPlaying()) openPlayer(id);
          else playSong(id, false, true);
        }
        return;
      }

      const queueItem = e.target.closest(".queue-item");
      if (queueItem) {
        const id = queueItem.dataset.songId;
        const action = e.target.closest("[data-queue-action]")?.dataset.queueAction;
        if (action === "play") playSong(id, false, false);
        if (action === "favorite") toggleFavorite(id);
        if (action === "reduce") {
          const song = getSong(id);
          if (song.repeatCount > 2) song.repeatCount--;
          else delete song.repeatCount;
          saveSongs(); renderQueue();
        }
      }
    });

    let tapTimer = null;
    let tapCount = 0;
    $("queueList").addEventListener("click", e => {
      const item = e.target.closest(".queue-item");
      if (!item || e.target.closest("button")) return;
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        if (tapCount >= 2) {
          const song = getSong(item.dataset.songId);
          if (song) {
            song.repeatCount = Math.min(10, tapCount);
            if (song.repeatCount <= 1) delete song.repeatCount;
            saveSongs();
            renderQueue();
            showToast(song.repeatCount ? `Play ${song.repeatCount} times.` : "Repeat removed.");
          }
        }
        tapCount = 0;
      }, 300);
    });

    let draggedQueueId = null;
    $("queueList").addEventListener("dragstart", e => {
      const item = e.target.closest(".queue-item");
      if (!item) return;
      draggedQueueId = item.dataset.songId;
      e.dataTransfer.effectAllowed = "move";
    });
    $("queueList").addEventListener("dragover", e => {
      if (e.target.closest(".queue-item")) e.preventDefault();
    });
    $("queueList").addEventListener("drop", e => {
      e.preventDefault();
      const target = e.target.closest(".queue-item");
      if (!target || !draggedQueueId || target.dataset.songId === draggedQueueId) return;
      const from = state.queue.indexOf(draggedQueueId);
      const to = state.queue.indexOf(target.dataset.songId);
      if (from < 0 || to < 0) return;
      const [moved] = state.queue.splice(from, 1);
      state.queue.splice(to, 0, moved);
      draggedQueueId = null;
      renderQueue();
    });

    // Swipe a queue item left/right to remove it from the queue.
    let touchStartX = 0;
    $("queueList").addEventListener("touchstart", e => {
      touchStartX = e.changedTouches[0].clientX;
    }, {passive:true});
    $("queueList").addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const item = e.target.closest(".queue-item");
      if (item && Math.abs(dx) > 80) {
        const id = item.dataset.songId;
        const idx = state.queue.findIndex(qid => qid === id);
        if (idx >= 0 && id !== state.currentSongId) {
          state.queue.splice(idx, 1);
          renderQueue();
          showToast("Removed from queue.");
        }
      }
    }, {passive:true});

    // Long-press is intentionally NOT used for copying/menus.
    document.addEventListener("contextmenu", e => e.preventDefault());

    audio.addEventListener("play", () => { renderAll(); });
    audio.addEventListener("pause", () => { renderAll(); });
    audio.addEventListener("timeupdate", () => updatePlayerUI());
    audio.addEventListener("loadedmetadata", updatePlayerUI);
    audio.addEventListener("ended", () => {
      if (state.timerMode === "end") {
        stopPlayback();
        return;
      }
      if (state.repeatMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(()=>{});
      } else {
        nextSong();
      }
    });

    window.addEventListener("popstate", () => {
      // Every Back press first comes through our in-app history state.
      history.pushState({vicsoundGuard:true}, "", location.href);
      handleBack();
    });

    window.addEventListener("beforeunload", () => {
      // Do not pause audio just because the user leaves the page/PWA.
      // The browser decides whether playback may continue.
    });

    $("offlineButton").addEventListener("click", () => showToast(`${state.songs.length} ${state.songs.length === 1 ? "song" : "songs"} available offline.`));
  }

  function togglePlayback() {
    const song = getSong(state.currentSongId);
    if (!song) return;
    if (!song.audio) {
      showToast("Connect this song to an audio file first.");
      return;
    }
    if (isPlaying()) audio.pause();
    else audio.play().catch(() => showToast("Tap Play again to start."));
  }

  // Protect the app from accidental native back navigation while still
  // allowing one-step in-app navigation before the final exit prompt.
  function preventAccidentalExit() {
    installBackGuard();
  }

  function init() {
    loadPreferences();
    state.queue = state.songs.map(s => s.id);
    bindEvents();
    preventAccidentalExit();
    renderAll();
  }

  init();
})();
