// ============================================================
// VIC-SOUND — APP.JS
// Main application interactions and UI behavior
// ============================================================

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const audio = $("audio");
  const APP_NAME = "Vic-sound";
  const MAX_REPEAT = 10;

  // Demo catalog. Replace/add real catalog records from the backend later.
  const songs = [
    { id: 1, title: "Dream Never Ends", artist: "Vic-sound", categories: ["rap", "calm", "moody"], duration: 214, cover: "" },
    { id: 2, title: "Triple Red", artist: "Vic-sound", categories: ["rap", "sad"], duration: 198, cover: "" },
    { id: 3, title: "Night Motion", artist: "Vic-sound", categories: ["hip-hop", "trap", "moody"], duration: 226, cover: "" },
    { id: 4, title: "Soft Lights", artist: "Vic-sound", categories: ["calm", "love"], duration: 201, cover: "" },
    { id: 5, title: "New Energy", artist: "Vic-sound", categories: ["pop", "new"], duration: 190, cover: "" }
  ];

  const state = {
    view: "homeView",
    category: "all",
    currentId: null,
    playing: false,
    queue: songs.map((s) => s.id),
    repeat: new Map(),
    history: ["homeView"],
    timer: "off",
    timerId: null,
    notifications: false,
    releases: [],
    collections: [],
    latestSeen: true,
    searchOpen: false,
    queueOpen: false,
    timerOpen: false,
    playerOpen: false,
    exitArmed: false
  };

  const safeStore = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  // Restore only user-state, never executable content.
  state.collections = safeStore.get("vicsound.collections", []);
  state.notifications = !!safeStore.get("vicsound.notifications", false);
  state.releases = safeStore.get("vicsound.releases", []);

  function song(id) { return songs.find((s) => s.id === Number(id)); }
  function current() { return song(state.currentId); }
  function initials(text) {
    return String(text).split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  }
  function esc(text) {
    return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function isLiked(id) { return state.collections.some((c) => c.songIds.includes(Number(id))); }

  function persist() {
    safeStore.set("vicsound.collections", state.collections);
    safeStore.set("vicsound.notifications", state.notifications);
    safeStore.set("vicsound.releases", state.releases);
  }

  function formatTime(seconds) {
    const n = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  }

  function visibleSongs() {
    let list = songs.filter((s) => state.category === "all" || s.categories.includes(state.category));
    const input = $("searchInput");
    const q = input ? input.value.trim().toLowerCase() : "";
    if (q) list = list.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(q));
    return list;
  }

  function coverHTML(s, extra = "") {
    if (s && s.cover) return `<div class="cover ${extra}" style="background-image:url('${esc(s.cover)}');background-size:cover;background-position:center"></div>`;
    return `<div class="cover ${extra}">${s ? initials(s.title) : "VS"}</div>`;
  }

  function renderHome() {
    const count = $("songCount");
    if (count) count.textContent = `${songs.length} ${songs.length === 1 ? "sound" : "sounds"}`;

    const list = $("homeSongs");
    if (!list) return;
    list.innerHTML = "";

    visibleSongs().forEach((s) => {
      const playing = state.currentId === s.id && state.playing;
      const el = document.createElement("article");
      el.className = `song-card${state.currentId === s.id ? " playing" : ""}`;
      el.dataset.id = s.id;
      el.innerHTML = `
        <button class="cover song-open" aria-label="Play ${esc(s.title)}">${s.cover ? `<span class="cover-image" style="background-image:url('${esc(s.cover)}')"></span>` : initials(s.title)}</button>
        <button class="song-details song-open" aria-label="Open ${esc(s.title)}">
          <span class="song-title">${esc(s.title)}</span>
          <span class="song-artist">${esc(s.artist)}</span>
          <span class="play-wave ${playing ? "" : "stopped"}">〰〰〰</span>
        </button>
        <button class="card-heart ${isLiked(s.id) ? "liked" : ""}" data-like="${s.id}" aria-label="Favorite ${esc(s.title)}">${isLiked(s.id) ? "♥" : "♡"}</button>
      `;
      list.appendChild(el);
    });

    if (!list.children.length) list.innerHTML = `<div class="empty-state">No music found.</div>`;
  }

  function renderCollections() {
    const grid = $("collections");
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.collections.length) {
      grid.innerHTML = `<div class="collection-card empty-collection"><div class="collection-covers"><div class="cover">+</div><div class="cover">+</div></div><div class="collection-title">Your collections</div><p class="collection-count">Create a collection from music.</p></div>`;
      return;
    }

    state.collections.forEach((c, index) => {
      const coverSongs = c.songIds.slice(0, 2).map(song).filter(Boolean);
      const el = document.createElement("article");
      el.className = "collection-card";
      el.dataset.collection = index;
      el.innerHTML = `
        <button class="collection-main" data-open-collection="${index}" aria-label="Open ${esc(c.name)}">
          <div class="collection-covers">${coverSongs.length ? coverSongs.map((s) => coverHTML(s)).join("") : `<div class="cover">+</div>`}</div>
          <div class="collection-title">${esc(c.name)}</div>
          <p class="collection-count">${c.songIds.length} sounds</p>
        </button>
        <button class="collection-menu" data-collection-menu="${index}" aria-label="Collection options">•••</button>
      `;
      grid.appendChild(el);
    });
  }

  function renderLatest() {
    const list = $("latestList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.releases.length) {
      list.innerHTML = `<div class="empty-state latest-empty">No release yet</div>`;
      return;
    }

    [...state.releases].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).forEach((r) => {
      const el = document.createElement("article");
      el.className = "release-card";
      el.dataset.release = r.id;
      el.innerHTML = `
        <div class="release-cover">${esc(r.name)}</div>
        <div class="release-meta">
          <div><h3>${esc(r.name)}</h3><p>${esc(r.type || "Release")} · ${r.songIds.length} songs · ${esc(r.date || "")}</p></div>
          <button data-release="${r.id}">${r.downloading ? "Pause" : r.downloaded ? "Downloaded" : "Download"}</button>
        </div>
        <div class="download-bar"><div class="download-progress" style="width:${Math.max(0, Math.min(100, Number(r.progress) || 0))}%"></div></div>
        <div class="release-status">${esc(r.status || "Ready")}</div>
      `;
      list.appendChild(el);
    });
  }

  function setView(viewId, push = true) {
    if (!$(viewId)) return;
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === viewId));
    $$(".nav-button").forEach((b) => b.classList.toggle("active", b.dataset.view === viewId));

    const search = $("searchToggle");
    if (search) search.classList.toggle("hidden", viewId !== "homeView");

    if (viewId === "latestView") {
      state.latestSeen = true;
      const dot = $("notificationDot");
      if (dot) dot.classList.add("hidden");
      renderLatest();
    }

    if (push && state.history[state.history.length - 1] !== viewId) state.history.push(viewId);
    state.view = viewId;
  }

  function openPlayer() {
    if (!current()) return;
    state.playerOpen = true;
    $("playerView")?.classList.remove("hidden");
    document.body.classList.add("player-open");
    updateUI();
  }

  function closePlayer() {
    state.playerOpen = false;
    $("playerView")?.classList.add("hidden");
    document.body.classList.remove("player-open");
  }

  function toggleSearch() {
    if (state.view !== "homeView") return;
    state.searchOpen = !state.searchOpen;
    $("searchBox")?.classList.toggle("hidden", !state.searchOpen);
    if (state.searchOpen) $("searchInput")?.focus();
    else if ($("searchInput")) $("searchInput").value = "";
    renderHome();
  }

  function startSong(id, options = {}) {
    const s = song(id);
    if (!s) return;
    state.currentId = s.id;
    if (!state.queue.includes(s.id)) state.queue.push(s.id);

    if (s.audio) {
      audio.src = s.audio;
      audio.currentTime = 0;
    } else {
      // UI/demo state remains usable until real audio URLs are injected by the backend.
      audio.removeAttribute("src");
      audio.load();
    }

    if (options.play !== false) {
      state.playing = true;
      if (s.audio) audio.play().catch(() => {});
    } else {
      state.playing = false;
    }

    updateUI();
    renderHome();
  }

  function togglePlay() {
    if (!current()) {
      const first = state.queue[0] || songs[0]?.id;
      if (first) startSong(first);
      return;
    }

    if (state.playing) {
      audio.pause();
      state.playing = false;
    } else {
      state.playing = true;
      if (current().audio) audio.play().catch(() => {});
    }
    updateUI();
    renderHome();
  }

  function nextSong() {
    if (!state.queue.length) return;
    const index = Math.max(0, state.queue.indexOf(state.currentId));
    const nextId = state.queue[(index + 1) % state.queue.length];
    startSong(nextId);
  }

  function previousOrRestart() {
    if (!current()) return;
    if (audio.currentTime > 5 || !current().audio) {
      if (current().audio) audio.currentTime = 0;
      updateUI();
      return;
    }
    const index = state.queue.indexOf(state.currentId);
    if (index > 0) startSong(state.queue[index - 1]);
    else if (current().audio) audio.currentTime = 0;
  }

  function renderQueue() {
    const list = $("queueList");
    if (!list) return;
    list.innerHTML = "";
    state.queue.forEach((id, index) => {
      const s = song(id);
      if (!s) return;
      const repeat = state.repeat.get(id) || 0;
      const row = document.createElement("div");
      row.className = `queue-item${id === state.currentId ? " current" : ""}`;
      row.draggable = true;
      row.dataset.id = id;
      row.innerHTML = `
        <span class="queue-index">${index + 1}</span>
        <div class="queue-cover">${initials(s.title)}</div>
        <div class="queue-name"><strong>${esc(s.title)}</strong><span>${esc(s.artist)}</span></div>
        <button class="queue-repeat" data-repeat="${id}" aria-label="Repeat ${esc(s.title)}">${repeat > 1 ? `×${repeat}` : ""}</button>
      `;
      list.appendChild(row);
    });
  }

  function openQueue() {
    state.queueOpen = true;
    renderQueue();
    $("queueSheet")?.classList.remove("hidden");
  }

  function closeQueue() {
    state.queueOpen = false;
    $("queueSheet")?.classList.add("hidden");
  }

  function openTimer() {
    state.timerOpen = true;
    $("timerSheet")?.classList.remove("hidden");
  }

  function closeTimer() {
    state.timerOpen = false;
    $("timerSheet")?.classList.add("hidden");
  }

  function setTimer(value) {
    clearTimeout(state.timerId);
    state.timer = value;
    closeTimer();

    if (value === "off") {
      toast("Timer off");
      return;
    }

    if (value === "track") {
      toast("Timer set: end of track");
      return;
    }

    const minutes = Number(value);
    if (!Number.isFinite(minutes)) return;
    state.timerId = setTimeout(() => {
      audio.pause();
      state.playing = false;
      updateUI();
      renderHome();
      toast("Timer finished");
    }, minutes * 60 * 1000);
    toast(`Timer set: ${minutes === 60 ? "1 hour" : `${minutes} minutes`}`);
  }

  function cycleRepeat(id) {
    const currentRepeat = state.repeat.get(Number(id)) || 0;
    const next = currentRepeat >= MAX_REPEAT ? 0 : currentRepeat + 1;
    if (next === 1) state.repeat.delete(Number(id));
    else state.repeat.set(Number(id), next);
    renderQueue();
  }

  function handleEnded() {
    const s = current();
    if (!s) return;
    const repeat = state.repeat.get(s.id) || 0;
    if (repeat > 1) {
      state.repeat.set(s.id, repeat - 1);
      startSong(s.id);
      renderQueue();
      return;
    }
    state.repeat.delete(s.id);
    nextSong();
    renderQueue();
  }

  function addToCollections(songId) {
    const id = Number(songId);
    const choices = state.collections.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
    const answer = choices ? prompt(`Choose collection number, or type "all".\n\n${choices}\n\nType "create" to make a new collection.`) : "create";
    if (!answer) return;

    if (answer.toLowerCase() === "create") {
      const name = prompt("Collection name:");
      if (!name?.trim()) return;
      state.collections.push({ name: name.trim(), songIds: [id] });
    } else if (answer.toLowerCase() === "all") {
      state.collections.forEach((c) => { if (!c.songIds.includes(id)) c.songIds.push(id); });
    } else {
      const index = Number(answer) - 1;
      if (!state.collections[index]) return toast("Collection not found");
      if (!state.collections[index].songIds.includes(id)) state.collections[index].songIds.push(id);
    }

    persist();
    renderCollections();
    renderHome();
  }

  function collectionMenu(index) {
    const c = state.collections[index];
    if (!c) return;
    const choice = prompt("Collection options:\n1. Remove\n2. Remove collection\n3. Rename collection\n4. Add music");
    if (!choice) return;

    if (choice === "1") {
      c.songIds = [];
    } else if (choice === "2") {
      state.collections.splice(index, 1);
    } else if (choice === "3") {
      const name = prompt("New collection name:", c.name);
      if (name?.trim()) c.name = name.trim();
    } else if (choice === "4") {
      const available = songs.map((s) => `${s.id}. ${s.title}`).join("\n");
      const selected = prompt(`Type song numbers separated by commas:\n\n${available}`);
      if (selected) {
        selected.split(",").map((x) => Number(x.trim())).filter(Boolean).forEach((id) => {
          if (song(id) && !c.songIds.includes(id)) c.songIds.push(id);
        });
      }
    }
    persist();
    renderCollections();
    renderHome();
  }

  function showLyrics() {
    const s = current();
    if (!s) return;
    const overlay = document.createElement("div");
    overlay.className = "lyrics-overlay";
    overlay.innerHTML = `
      <div class="lyrics-panel">
        <button class="lyrics-close" aria-label="Close lyrics">×</button>
        <span class="eyebrow">${esc(s.artist)}</span>
        <h2>${esc(s.title)}</h2>
        <div class="lyrics-body">Lyrics will be supplied with this track from the creator catalog.</div>
        <div class="lyrics-controls"><button class="lyrics-play">${state.playing ? "Ⅱ" : "▶"}</button></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".lyrics-close").onclick = () => overlay.remove();
    overlay.querySelector(".lyrics-play").onclick = togglePlay;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function openNotifications() {
    if (state.view !== "latestView") return;
    $("notificationPanel")?.classList.remove("hidden");
    state.latestSeen = true;
    $("notificationDot")?.classList.add("hidden");
  }

  function closeNotifications() {
    $("notificationPanel")?.classList.add("hidden");
  }

  function toggleNotifications() {
    state.notifications = !state.notifications;
    if ($("notificationSwitch")) $("notificationSwitch").checked = state.notifications;
    persist();
    toast(state.notifications ? "Release notifications on" : "Release notifications off");
  }

  function markNewRelease() {
    state.latestSeen = false;
    $("notificationDot")?.classList.remove("hidden");
  }

  function simulateReleaseDownload(id) {
    const release = state.releases.find((r) => String(r.id) === String(id));
    if (!release) return;
    if (release.downloaded) return;
    release.downloading = !release.downloading;
    if (!release.downloading) {
      release.status = "Paused";
      persist();
      renderLatest();
      return;
    }

    release.status = "Downloading...";
    persist();
    renderLatest();

    const step = () => {
      if (!release.downloading) return;
      if (!navigator.onLine) {
        release.status = "Offline — waiting for connection";
        persist();
        renderLatest();
        return;
      }
      release.progress = Math.min(100, (Number(release.progress) || 0) + 5);
      if (release.progress >= 100) {
        release.progress = 100;
        release.downloading = false;
        release.downloaded = true;
        release.status = "Downloaded";
        release.songIds.forEach((id) => {
          if (!state.queue.includes(id)) state.queue.unshift(id);
        });
        state.releases = state.releases.filter((r) => String(r.id) !== String(release.id));
        persist();
        renderLatest();
        renderHome();
        toast("Release added to Home");
        return;
      }
      persist();
      renderLatest();
      setTimeout(step, 300);
    };
    step();
  }

  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function updateUI() {
    const s = current();
    const mini = $("miniPlayer");
    const hasSong = !!s;

    if (!hasSong) {
      mini?.classList.add("hidden");
      $("navWave")?.classList.remove("playing");
      return;
    }

    $("miniTitle").textContent = s.title;
    $("miniArtist").textContent = s.artist;
    $("playerTitle").textContent = s.title;
    $("playerArtist").textContent = s.artist;
    $("miniCover").innerHTML = s.cover ? `<span class="cover-image" style="background-image:url('${esc(s.cover)}')"></span>` : initials(s.title);
    $("playerCover").innerHTML = s.cover ? `<span class="cover-image" style="background-image:url('${esc(s.cover)}')"></span>` : initials(s.title);
    $("miniPlay").textContent = state.playing ? "Ⅱ" : "▶";
    $("playerPlay").textContent = state.playing ? "Ⅱ" : "▶";
    $("miniPlayer")?.classList.remove("hidden");
    $("miniPlayer")?.classList.add("visible");
    $("navWave")?.classList.toggle("playing", state.playing);
    $("playerWave")?.classList.toggle("playing", state.playing);

    if (audio.duration && Number.isFinite(audio.duration)) {
      $("duration").textContent = formatTime(audio.duration);
      $("progress").value = String((audio.currentTime / audio.duration) * 100 || 0);
    } else {
      $("duration").textContent = formatTime(s.duration);
    }
    $("currentTime").textContent = formatTime(audio.currentTime);
  }

  function closeTopLayer() {
    if (state.timerOpen) { closeTimer(); return true; }
    if (state.queueOpen) { closeQueue(); return true; }
    if (state.playerOpen) { closePlayer(); return true; }
    if (!$('notificationPanel')?.classList.contains("hidden")) { closeNotifications(); return true; }
    if (state.searchOpen) { toggleSearch(); return true; }
    return false;
  }

  function goBackOneStep() {
    if (closeTopLayer()) return;

    if (state.history.length > 1) {
      state.history.pop();
      const previous = state.history[state.history.length - 1] || "homeView";
      setView(previous, false);
      return;
    }

    
    // On Home, the first back press arms exit; it does NOT stop music.
    if (!state.exitArmed) {
      state.exitArmed = true;
      toast("Press back again to exit Vic-sound");
      setTimeout(() => { state.exitArmed = false; }, 2200);
      return;
    }

    // A web app cannot force-close every browser/PWA window. The browser decides whether
    // the history entry/window can actually be closed.
    state.exitArmed = false;
    toast("Exit Vic-sound");
    try { window.close(); } catch {}
  }

  function installBackHandling() {
    // Keep an in-app history stack so one Back moves one UI level at a time.
    history.replaceState({ vicsound: true, view: "homeView" }, "", location.href);
    window.addEventListener("popstate", () => {
      history.pushState({ vicsound: true }, "", location.href);
      goBackOneStep();
    });
    window.addEventListener("beforeunload", () => {
      // Do not stop the audio here. The browser controls actual process/window lifetime.
    });
  }

  function disableCopying() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("selectstart", (e) => {
      if (!e.target.matches("input, textarea")) e.preventDefault();
    });
    document.addEventListener("dragstart", (e) => e.preventDefault());
  }

  function injectPolish() {
    if ($("vicsound-js-polish")) return;
    const style = document.createElement("style");
    style.id = "vicsound-js-polish";
    style.textContent = `
      :root{--vs-green:#38f58a;--vs-green-soft:rgba(56,245,138,.16);--vs-black:#050907;--vs-panel:rgba(11,19,15,.96)}
      body{background:radial-gradient(circle at 50% -10%,rgba(56,245,138,.08),transparent 35%),var(--vs-black)}
      .nav-wave,.play-wave,.player-wave,.mini-wave{color:var(--vs-green);text-shadow:0 0 14px rgba(56,245,138,.25)}
      .nav-wave.playing,.play-wave:not(.stopped),.player-wave.playing{animation:vsWave 900ms ease-in-out infinite alternate}
      .nav-wave{opacity:.42}
      .mini-player{box-shadow:0 -10px 30px rgba(0,0,0,.28),0 0 24px rgba(56,245,138,.08)}
      .card-heart.liked{color:var(--vs-green);text-shadow:0 0 12px rgba(56,245,138,.5)}
      .notification-dot{background:var(--vs-green);box-shadow:0 0 10px var(--vs-green)}
      .download-progress{background:var(--vs-green)!important;box-shadow:0 0 12px rgba(56,245,138,.35)}
      .empty-state{opacity:.72;text-align:center;padding:40px 20px}
      .cover-image{display:block;width:100%;height:100%;background-size:cover;background-position:center;border-radius:inherit}
      .collection-main{display:block;width:100%;background:transparent;border:0;color:inherit;text-align:left;padding:0;font:inherit}
      .collection-card{position:relative}
      .collection-menu{position:absolute;right:10px;top:10px;background:rgba(0,0,0,.45);border:0;color:inherit;border-radius:50%;width:36px;height:36px}
      .lyrics-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.62);display:grid;place-items:end center;padding:16px}
      .lyrics-panel{width:min(720px,100%);max-height:88vh;overflow:auto;background:var(--vs-panel);border:1px solid rgba(56,245,138,.2);border-radius:26px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
      .lyrics-close{float:right;border:0;background:transparent;color:inherit;font-size:28px}
      .lyrics-body{margin-top:24px;line-height:1.9;white-space:pre-wrap;opacity:.9}
      @keyframes vsWave{from{transform:scaleY(.65);opacity:.42}to{transform:scaleY(1.35);opacity:1}}
    `;
    document.head.appendChild(style);
  }

  function bindEvents() {
    $("searchToggle")?.addEventListener("click", toggleSearch);
    $("searchInput")?.addEventListener("input", renderHome);

    $("categories")?.addEventListener("click", (e) => {
      const button = e.target.closest(".category");
      if (!button) return;
      state.category = button.dataset.category || "all";
      $$(".category").forEach((b) => b.classList.toggle("active", b === button));
      renderHome();
    });

    $("homeSongs")?.addEventListener("click", (e) => {
      const heart = e.target.closest("[data-like]");
      if (heart) { addToCollections(heart.dataset.like); return; }
      const card = e.target.closest(".song-card");
      if (card) startSong(card.dataset.id);
    });

    $("collections")?.addEventListener("click", (e) => {
      const menu = e.target.closest("[data-collection-menu]");
      if (menu) { collectionMenu(Number(menu.dataset.collectionMenu)); return; }
      const open = e.target.closest("[data-open-collection]");
      if (open) {
        const c = state.collections[Number(open.dataset.openCollection)];
        if (!c) return;
        state.queue = c.songIds.slice();
        if (state.queue.length) startSong(state.queue[0]);
      }
    });

    $("latestList")?.addEventListener("click", (e) => {
      const button = e.target.closest("[data-release]");
      if (button) simulateReleaseDownload(button.dataset.release);
    });

    $("bellButton")?.addEventListener("click", () => {
      if (state.view === "latestView") openNotifications();
    });
    $("notificationSwitch")?.addEventListener("change", toggleNotifications);

    $$(".nav-button").forEach((button) => button.addEventListener("click", () => {
      setView(button.dataset.view);
      if (button.dataset.view === "latestView") closeNotifications();
    }));

    $("djPlay")?.addEventListener("click", () => {
      // DJ backend is intentionally not hardcoded here. This starts the catalog's DJ slot.
      const first = state.queue[0] || songs[0]?.id;
      if (first) startSong(first);
    });

    [$("miniCover"), $("miniInfo")].forEach((el) => el?.addEventListener("click", openPlayer));
    $("miniPlay")?.addEventListener("click", togglePlay);
    $("miniNext")?.addEventListener("click", nextSong);
    $("miniPrev")?.addEventListener("click", previousOrRestart);

    $("playerBack")?.addEventListener("click", closePlayer);
    $("playerPlay")?.addEventListener("click", togglePlay);
    $("playerNext")?.addEventListener("click", nextSong);
    $("playerPrev")?.addEventListener("click", previousOrRestart);
    $("queueOpen")?.addEventListener("click", openQueue);
    $("queueClose")?.addEventListener("click", closeQueue);
    $("timerButton")?.addEventListener("click", openTimer);
    $("playerTimer")?.addEventListener("click", openTimer);
    $("timerClose")?.addEventListener("click", closeTimer);
    $("lyricsButton")?.addEventListener("click", showLyrics);

    $("timerOptions")?.addEventListener("click", (e) => {
      const option = e.target.closest("[data-minutes]");
      if (option) setTimer(option.dataset.minutes);
    });

    $("queueList")?.addEventListener("click", (e) => {
      const repeat = e.target.closest("[data-repeat]");
      if (repeat) { cycleRepeat(repeat.dataset.repeat); return; }
      const row = e.target.closest(".queue-item");
      if (row) startSong(row.dataset.id);
    });

    // Long press + drag/drop rearranges the queue. Swipe left/right removes it.
    let dragId = null;
    $("queueList")?.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".queue-item");
      if (!row) return;
      dragId = Number(row.dataset.id);
      e.dataTransfer.setData("text/plain", String(dragId));
    });
    $("queueList")?.addEventListener("dragover", (e) => e.preventDefault());
    $("queueList")?.addEventListener("drop", (e) => {
      e.preventDefault();
      const target = e.target.closest(".queue-item");
      if (!target || dragId == null) return;
      const targetId = Number(target.dataset.id);
      if (dragId === targetId) return;
      const from = state.queue.indexOf(dragId);
      const to = state.queue.indexOf(targetId);
      if (from < 0 || to < 0) return;
      state.queue.splice(from, 1);
      state.queue.splice(to, 0, dragId);
      renderQueue();
      dragId = null;
    });

    audio.addEventListener("play", () => { state.playing = true; updateUI(); renderHome(); });
    audio.addEventListener("pause", () => { state.playing = false; updateUI(); renderHome(); });
    audio.addEventListener("timeupdate", updateUI);
    audio.addEventListener("ended", handleEnded);
    $("progress")?.addEventListener("input", (e) => {
      if (!audio.duration) return;
      audio.currentTime = (Number(e.target.value) / 100) * audio.duration;
      updateUI();
    });

    // A simple touch gesture for queue removal; no trash button is shown.
    let touchStartX = 0;
    let touchId = null;
    $("queueList")?.addEventListener("touchstart", (e) => {
      const row = e.target.closest(".queue-item");
      if (!row) return;
      touchId = Number(row.dataset.id);
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    $("queueList")?.addEventListener("touchend", (e) => {
      if (touchId == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 80) {
        state.queue = state.queue.filter((id) => id !== touchId);
        state.repeat.delete(touchId);
        renderQueue();
      }
      touchId = null;
    }, { passive: true });

    // Any touch outside the notification panel/switch closes its popup.
    document.addEventListener("pointerdown", (e) => {
      const panel = $("notificationPanel");
      if (!panel || panel.classList.contains("hidden")) return;
      if (!e.target.closest("#notificationPanel") && !e.target.closest("#bellButton")) closeNotifications();
    });

    window.addEventListener("online", () => {
      renderLatest();
      toast("Back online");
      state.releases.filter((r) => r.downloading).forEach((r) => simulateReleaseDownload(r.id));
    });
    window.addEventListener("offline", () => {
      toast("You are offline");
      renderLatest();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") goBackOneStep();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js", { scope: "./" })
      .then((registration) => registration.update().catch(() => {}))
      .catch((error) => console.warn("Vic-sound service worker registration failed:", error));
  }

  function init() {
    injectPolish();
    bindEvents();
    installBackHandling();
    disableCopying();
    renderHome();
    renderCollections();
    renderLatest();
    if ($("notificationSwitch")) $("notificationSwitch").checked = state.notifications;
    updateUI();
    registerServiceWorker();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
        
