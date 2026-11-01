/* =========================================================
   VIC-SOUND LISTENER — FINAL FRONTEND APP.JS
   Frontend-first build. Creator + secure backend connections
   are prepared as clearly marked placeholders.
   ========================================================= */

/* =========================================================
   1. CONNECTION SETTINGS — EDIT THESE LATER
   ========================================================= */
const VIC_CONFIG = {
  /* SUPABASE PUBLIC CLIENT SETTINGS
     Put ONLY the Supabase project URL and publishable/anon key here.
     Never put service_role keys, passwords, R2 secrets or private AI keys here. */
  SUPABASE_URL: "https://gkfivuvtpfetzatzhnaq.supabase.co",
  SUPABASE_PUBLIC_KEY: "PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE",
  SUPABASE_SONGS_TABLE: "songs",
  SUPABASE_RELEASES_TABLE: "releases",

  /* FUTURE CREATOR / BACKEND API
     After the Creator dashboard and backend exist, put the public API base URL here.
     Example format only: https://your-api-domain.example.com
     Do not put secret keys in this file. */
  CREATOR_API_BASE_URL: "",
  API_ROUTES: {
    catalogue: "/listener/catalogue",
    releases: "/listener/releases",
    downloadPermission: "/listener/download-permission",
    monetizationStatus: "/listener/monetization",
    recordPlayback: "/listener/playback"
  },

  /* FUTURE CLOUDFLARE R2 CONNECTION
     The bucket name is not a secret. The backend will return temporary signed URLs.
     Never put an R2 access key, secret key or permanent private bucket credential here. */
  R2_PUBLIC_DELIVERY_BASE: "",

  /* ADVERTISING PLACEHOLDERS
     Add real Google Ad Manager identifiers after the ad account and inventory exist.
     Reward verification must be performed by the backend, not trusted from this file. */
  GOOGLE_AD_MANAGER_NETWORK_CODE: "",
  BOTTOM_AD_UNIT_PATH: "",
  REWARDED_AD_UNIT_PATH: "",

  /* OPTIONAL ONLINE DJ AI
     Keep the private AI key on the backend. This is only the future endpoint. */
  DJ_AI_ENDPOINT: "",

  MUSIC_CACHE_NAME: "vic-sound-music-v3",
  COVER_CACHE_NAME: "vic-sound-covers-v1",
  LOCAL_STATE_KEY: "vic-sound-listener-state-v3",
  TEST_CACHE_NAME: "vic-sound-test-only-v1",
  DOWNLOAD_WORKERS: 2,
  MAX_AUTO_DOWNLOADS_PER_RUN: 50,
  REGULAR_AD_AFTER_COMPLETED_SONGS: 10,
  REGULAR_AD_COOLDOWN_MS: 15 * 60 * 1000
};

/* =========================================================
   2. TEMPORARY PLAYER TEST — REMOVE THIS WHOLE SECTION LATER
   =========================================================
   HOW TO TEST:
   Open the Listener link with ?test=1 at the end.
   Example: https://your-site.example/?test=1

   The demo song is local test data only. It is never uploaded,
   published, counted as real offline music, or sent to Creator.

   WHEN VIC-SOUND IS READY FOR PUBLIC RELEASE:
   1) Remove this entire section (section 2).
   2) In section 8, remove the call to addTemporaryTestSong().
   3) Remove the test-mode URL check if you want.
   The rest of the app does not depend on the demo song.
   ========================================================= */
const VIC_TEST_MODE = new URLSearchParams(location.search).get("test") === "1";
const VIC_TEST_SONG = {
  id: "vic-sound-temporary-player-test",
  title: "Vic-sound Test Track",
  artist: "Temporary Demo",
  album: "Player Test",
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80",
  duration: 0,
  cat: ["Test"],
  mood: ["Test"],
  tags: ["Temporary"],
  lyrics: "Temporary player test track.",
  lyrics_timed: null,
  release_date: "",
  release_id: null,
  published: true,
  destination: "home",
  isTestTrack: true
};

/* =========================================================
   3. APP STATE
   ========================================================= */
const state = {
  screen: "home", category: "All", query: "",
  songs: [], releases: [], currentId: null, playing: false,
  queue: [], queueIndex: 0, shuffle: false, repeatMode: 0,
  favorites: new Set(), collections: [], currentCollection: null,
  playerOpen: false, queueOpen: false, djOpen: false, lyricsOpen: false,
  timerId: null, timerMode: "off", notifications: false,
  newRelease: false, downloading: false, downloaded: new Set(),
  backendConnected: false, backendError: null, supabase: null,
  monetizationEnabled: true, monetizationKnown: false,
  completedOnlineSongs: 0, lastRegularAdAt: 0, regularAdPending: false,
  testSongActive: false, firstMiniPlayerEntrance: true,
  objectAudioUrl: null, anonymousId: null
};

/* =========================================================
   4. SAFE DOM + GENERAL HELPERS
   ========================================================= */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const audio = $("#audio");
const has = selector => Boolean($(selector));
const on = (selector, event, handler) => {
  const element = $(selector);
  if (element) element.addEventListener(event, handler);
};
const text = value => String(value ?? "");
const escapeHTML = value => text(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const songKey = id => String(id);
const formatTime = seconds => {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};
function makeId() {
  return globalThis.crypto?.randomUUID?.() || `vic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function normaliseList(value) {
  if (Array.isArray(value)) return value.map(text).map(x => x.trim()).filter(Boolean);
  return text(value).split(",").map(x => x.trim()).filter(Boolean);
}
function normaliseSong(row = {}) {
  return {
    id: text(row.id || makeId()),
    title: text(row.title || "Untitled song"),
    artist: text(row.artist || "Unknown artist"),
    album: text(row.album || ""),
    audio: text(row.audio_url || row.audio || row.audioUrl || ""),
    cover: text(row.cover_url || row.cover || row.coverUrl || ""),
    duration: Number(row.duration || 0),
    cat: normaliseList(row.genre || row.cat),
    mood: normaliseList(row.mood),
    tags: normaliseList(row.tags),
    lyrics: text(row.lyrics || ""),
    lyrics_timed: row.lyrics_timed || row.timed_lyrics || row.lyricsTimed || null,
    release_date: text(row.release_date || row.releaseDate || ""),
    release_id: row.release_id || row.releaseId || null,
    release_type: text(row.release_type || row.releaseType || "single"),
    published: row.published ?? true,
    isTestTrack: Boolean(row.isTestTrack)
  };
}
function currentSong() {
  return state.songs.find(song => songKey(song.id) === songKey(state.currentId)) || null;
}
function notify(message, duration = 2800) {
  let box = $("#vicMessage");
  if (!box) {
    box = document.createElement("div");
    box.id = "vicMessage";
    box.setAttribute("role", "status");
    Object.assign(box.style, {
      position: "fixed", left: "50%", bottom: "105px", transform: "translateX(-50%)",
      zIndex: "100000", background: "#123c30", color: "white", padding: "12px 18px",
      borderRadius: "14px", maxWidth: "88%", textAlign: "center", fontSize: "14px",
      boxShadow: "0 10px 35px #0008", opacity: "0", transition: "opacity .2s"
    });
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.display = "block";
  requestAnimationFrame(() => { box.style.opacity = "1"; });
  clearTimeout(box._hideTimer);
  box._hideTimer = setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => { box.style.display = "none"; }, 220);
  }, duration);
}
function customDialog({ title = "Vic-sound", message = "", input = false, value = "", confirmText = "Continue", danger = false } = {}) {
  return new Promise(resolve => {
    let overlay = $("#vicDialog");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "vicDialog";
      overlay.className = "vic-dialog-backdrop";
      Object.assign(overlay.style, {
        position: "fixed", inset: "0", zIndex: "100001", display: "grid", placeItems: "center",
        padding: "22px", background: "#0009", backdropFilter: "blur(5px)"
      });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="vicDialogTitle" style="width:min(100%,390px);background:#10251f;color:#fff;border:1px solid #315b4b;border-radius:22px;padding:22px;box-shadow:0 20px 70px #0009">
        <h2 id="vicDialogTitle" style="margin:0 0 10px;font-size:20px">${escapeHTML(title)}</h2>
        <p style="color:#c6d6cf;line-height:1.5;margin:0 0 18px">${escapeHTML(message)}</p>
        ${input ? `<input id="vicDialogInput" value="${escapeHTML(value)}" maxlength="60" style="box-sizing:border-box;width:100%;padding:13px;border-radius:12px;border:1px solid #527666;background:#071610;color:white;margin-bottom:18px">` : ""}
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="button" id="vicDialogCancel" style="padding:11px 15px;border:1px solid #547466;border-radius:12px;background:transparent;color:white">Cancel</button>
          <button type="button" id="vicDialogConfirm" style="padding:11px 15px;border:0;border-radius:12px;background:${danger ? "#9b3c3c" : "#31a875"};color:white;font-weight:700">${escapeHTML(confirmText)}</button>
        </div>
      </section>`;
    overlay.style.display = "grid";
    const finish = result => { overlay.style.display = "none"; overlay.onclick = null; resolve(result); };
    $("#vicDialogCancel").onclick = () => finish(null);
    $("#vicDialogConfirm").onclick = () => finish(input ? $("#vicDialogInput").value : true);
    overlay.onclick = event => { if (event.target === overlay) finish(null); };
    if (input) { $("#vicDialogInput").focus(); $("#vicDialogInput").select(); }
  });
}
function getAnonymousId() {
  try {
    let id = localStorage.getItem("vic-sound-anonymous-id");
    if (!id) { id = makeId(); localStorage.setItem("vic-sound-anonymous-id", id); }
    state.anonymousId = id;
  } catch { state.anonymousId = makeId(); }
  return state.anonymousId;
}

/* =========================================================
   5. LOCAL STATE
   ========================================================= */
function saveLocalState() {
  try {
    localStorage.setItem(VIC_CONFIG.LOCAL_STATE_KEY, JSON.stringify({
      favorites: [...state.favorites], collections: state.collections,
      shuffle: state.shuffle, repeatMode: state.repeatMode,
      notifications: state.notifications, completedOnlineSongs: state.completedOnlineSongs
    }));
  } catch (error) { console.warn("Could not save Listener settings:", error); }
}
function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIC_CONFIG.LOCAL_STATE_KEY) || "{}");
    state.favorites = new Set((saved.favorites || []).map(String));
    state.collections = Array.isArray(saved.collections) ? saved.collections : [];
    state.shuffle = Boolean(saved.shuffle);
    state.repeatMode = Number(saved.repeatMode) || 0;
    state.notifications = Boolean(saved.notifications);
    state.completedOnlineSongs = Number(saved.completedOnlineSongs) || 0;
  } catch { state.favorites = new Set(); state.collections = []; }
}

/* =========================================================
   6. SUPABASE — PUBLIC READ CONNECTION ONLY FOR NOW
   ========================================================= */
let supabaseClient = null;
function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error("Supabase library did not initialise."));
    script.onerror = () => reject(new Error("Could not load Supabase library."));
    document.head.appendChild(script);
  });
}
async function connectSupabase() {
  const key = VIC_CONFIG.SUPABASE_PUBLIC_KEY;
  if (!key || key.includes("PASTE_")) {
    state.backendConnected = false;
    console.info("Supabase public key has not been added. Local/demo mode is active.");
    return false;
  }
  try {
    const lib = await loadSupabaseLibrary();
    supabaseClient = lib.createClient(VIC_CONFIG.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const { error } = await supabaseClient.from(VIC_CONFIG.SUPABASE_SONGS_TABLE).select("id").limit(1);
    if (error) throw error;
    state.supabase = supabaseClient;
    state.backendConnected = true;
    state.backendError = null;
    return true;
  } catch (error) {
    state.backendConnected = false;
    state.backendError = error.message;
    console.warn("Supabase connection is not ready:", error);
    return false;
  }
}

/* =========================================================
   7. FUTURE CREATOR API ADAPTERS — NOT ACTIVE UNTIL BACKEND EXISTS
   ========================================================= */
function apiUrl(route) {
  if (!VIC_CONFIG.CREATOR_API_BASE_URL) return "";
  return VIC_CONFIG.CREATOR_API_BASE_URL.replace(/\/$/, "") + route;
}
async function creatorApi(route, options = {}) {
  const url = apiUrl(route);
  if (!url) throw new Error("Creator backend has not been connected yet.");
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Backend request failed (${response.status}).`);
  return data;
}
async function getMonetizationPolicy() {
  try {
    const data = await creatorApi(VIC_CONFIG.API_ROUTES.monetizationStatus);
    state.monetizationEnabled = Boolean(data.enabled);
    state.monetizationKnown = true;
    return state.monetizationEnabled;
  } catch {
    // Safe default: don't grant a protected download when policy is unknown.
    state.monetizationEnabled = true;
    state.monetizationKnown = false;
    return true;
  }
}

/* =========================================================
   8. CATALOGUE + TEMPORARY TEST TRACK INJECTION
   ========================================================= */
function addTemporaryTestSong() {
  if (!VIC_TEST_MODE) return;
  if (!state.songs.some(song => song.id === VIC_TEST_SONG.id)) {
    state.songs.unshift(normaliseSong(VIC_TEST_SONG));
  }
}
async function loadSongs() {
  if (state.backendConnected && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE_SONGS_TABLE)
        .select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      state.songs = (data || []).map(normaliseSong).filter(song => song.published && !song.isTestTrack);
      saveCatalogueSnapshot();
    } catch (error) {
      console.warn("Could not refresh published music:", error);
      loadCatalogueSnapshot();
      notify("Showing saved music. The catalogue could not refresh.");
    }
  } else {
    loadCatalogueSnapshot();
  }
  addTemporaryTestSong(); // Remove this line when removing section 2 for public release.
  renderAll();
  await refreshDownloadedSongs();
  if (navigator.onLine && state.backendConnected) prepareOfflineMusic();
  return state.songs;
}
function saveCatalogueSnapshot() {
  try { localStorage.setItem("vic-sound-catalogue-snapshot", JSON.stringify(state.songs.filter(song => !song.isTestTrack))); }
  catch (error) { console.warn("Catalogue snapshot could not be saved:", error); }
}
function loadCatalogueSnapshot() {
  try {
    const saved = JSON.parse(localStorage.getItem("vic-sound-catalogue-snapshot") || "[]");
    state.songs = Array.isArray(saved) ? saved.map(normaliseSong).filter(song => !song.isTestTrack) : [];
  } catch { state.songs = []; }
}

/* =========================================================
   9. RELEASES
   ========================================================= */
async function loadReleases() {
  if (!state.backendConnected || !supabaseClient) { state.releases = []; renderLatest(); return []; }
  try {
    const { data, error } = await supabaseClient.from(VIC_CONFIG.SUPABASE_RELEASES_TABLE)
      .select("*").eq("published", true).order("created_at", { ascending: false });
    if (error) throw error;
    state.releases = data || [];
    state.newRelease = state.releases.length > 0;
    renderLatest(); updateDots();
    return state.releases;
  } catch (error) { console.warn("Release list is unavailable:", error); return []; }
}
function renderLatest() {
  const box = $("#latestList"); if (!box) return;
  if (!state.releases.length) {
    box.innerHTML = `<div class="empty-state"><b>No new releases yet</b><span>New music will appear here.</span></div>`;
    return;
  }
  box.innerHTML = state.releases.map(release => `
    <article class="release-card">
      <img class="release-cover" src="${escapeHTML(release.cover_url || release.cover || "")}" alt="">
      <div class="release-info"><h3>${escapeHTML(release.title || "Untitled release")}</h3>
      <p>${escapeHTML(release.type || "Release")}</p><p>${escapeHTML(release.release_date || "")}</p>
      <button class="release-action" data-release-download="${escapeHTML(release.id)}">⇩ Download</button></div><span>›</span>
    </article>`).join("");
}

/* =========================================================
   10. OFFLINE AUDIO CACHE — TEST TRACK IS KEPT SEPARATE
   ========================================================= */
async function musicCache() { return "caches" in window ? caches.open(VIC_CONFIG.MUSIC_CACHE_NAME) : null; }
async function testCache() { return "caches" in window ? caches.open(VIC_CONFIG.TEST_CACHE_NAME) : null; }
function cacheKeyFor(song) { return new URL(song.audio, location.href).href; }
async function cachedAudio(song) {
  if (!song?.audio || !("caches" in window)) return null;
  const cache = song.isTestTrack ? await testCache() : await musicCache();
  return cache ? cache.match(cacheKeyFor(song)) : null;
}
async function refreshDownloadedSongs() {
  state.downloaded.clear();
  const cache = await musicCache();
  if (!cache) { updateOfflineCount(); return state.downloaded; }
  const keys = new Set((await cache.keys()).map(request => request.url));
  state.songs.filter(song => !song.isTestTrack).forEach(song => {
    if (song.audio && keys.has(cacheKeyFor(song))) state.downloaded.add(songKey(song.id));
  });
  updateOfflineCount();
  return state.downloaded;
}
function updateOfflineCount() {
  const count = $("#offlineCount"), status = $("#offlineStatus"), message = $("#offlineMessage"), card = $("#offlineCard");
  const realSongs = state.songs.filter(song => song.audio && !song.isTestTrack);
  const total = realSongs.length, saved = state.downloaded.size;
  if (count) count.textContent = `${saved} of ${total} songs`;
  if (card) {
    const percent = total ? Math.round(saved / total * 100) : 0;
    card.style.setProperty("--offline-progress", `${percent}%`);
    card.classList.toggle("is-complete", total > 0 && saved === total);
    card.classList.toggle("is-preparing", saved > 0 && saved < total);
  }
  if (status) status.textContent = !total ? "Waiting for music" : saved === total ? "Offline ready" : "Preparing offline music";
  if (message) message.textContent = !total ? "Published music will appear here." : saved === total ? "Your saved music is ready for offline listening." : navigator.onLine ? "New music is being saved for offline listening." : "Reconnect to continue saving music.";
}
async function saveAudioFile(song) {
  if (!song?.audio || song.isTestTrack || !navigator.onLine) return false;
  const cache = await musicCache(); if (!cache) return false;
  const url = cacheKeyFor(song);
  if (await cache.match(url)) { state.downloaded.add(songKey(song.id)); return true; }
  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error(`Audio request failed (${response.status}).`);
    const type = response.headers.get("content-type") || "";
    if (type.includes("text/html") || type.includes("application/json")) throw new Error("The supplied URL did not return audio.");
    await cache.put(url, response.clone());
    state.downloaded.add(songKey(song.id)); updateOfflineCount(); return true;
  } catch (error) { console.info("Offline save skipped:", song.title, error.message); return false; }
}
async function prepareOfflineMusic() {
  if (!navigator.onLine || state.downloading || !state.backendConnected) return;
  state.downloading = true;
  try {
    await refreshDownloadedSongs();
    const pending = state.songs.filter(song => song.audio && !song.isTestTrack && !state.downloaded.has(songKey(song.id))).slice(0, VIC_CONFIG.MAX_AUTO_DOWNLOADS_PER_RUN);
    let index = 0;
    const worker = async () => { while (index < pending.length && navigator.onLine) await saveAudioFile(pending[index++]); };
    await Promise.all(Array.from({ length: Math.min(VIC_CONFIG.DOWNLOAD_WORKERS, pending.length) }, worker));
  } finally { state.downloading = false; updateOfflineCount(); }
}
window.addEventListener("online", () => { loadSongs(); loadReleases(); });
window.addEventListener("offline", updateOfflineCount);

/* =========================================================
   11. PLAYER + QUEUE
   ========================================================= */
function getPlayableURL(song) { return song?.audio || ""; }
function setCurrentSong(song, list = null) {
  if (!song) return;
  state.currentId = songKey(song.id);
  if (Array.isArray(list) && list.length) {
    state.queue = list.map(item => songKey(typeof item === "object" ? item.id : item));
  } else if (!state.queue.includes(songKey(song.id))) {
    state.queue = [songKey(song.id)];
  }
  state.queueIndex = state.queue.indexOf(songKey(song.id));
  updatePlayer(); renderQueue(); updateLyrics();
}
async function playSong(song, list = null, shouldPlay = true) {
  if (!song) return;
  setCurrentSong(song, list);
  const url = getPlayableURL(song);
  if (!url) { notify("This song does not have an audio file yet."); return; }
  try {
    const cached = await cachedAudio(song);
    if (state.objectAudioUrl) { URL.revokeObjectURL(state.objectAudioUrl); state.objectAudioUrl = null; }
    if (cached) {
      state.objectAudioUrl = URL.createObjectURL(await cached.blob());
      audio.src = state.objectAudioUrl;
    } else {
      if (!navigator.onLine) { notify("This song is not saved for offline listening yet."); return; }
      audio.src = url;
    }
    audio.load();
    if (shouldPlay) await audio.play();
    updatePlayer();
  } catch (error) { state.playing = false; console.warn("Playback error:", error); notify("Could not play this song. Check the audio file or connection."); updatePlayer(); }
}
function playSongById(id) {
  const song = state.songs.find(item => songKey(item.id) === songKey(id));
  if (song) playSong(song, state.queue.length ? state.queue : [song.id]);
}
function togglePlayback() {
  if (!audio) return;
  if (audio.paused) {
    if (!currentSong()) {
      const first = state.songs.find(song => !song.isTestTrack) || state.songs[0];
      if (first) playSong(first);
    } else audio.play().catch(() => notify("This song could not start."));
  } else audio.pause();
}
function updatePlayer() {
  const song = currentSong(); if (!song) return;
  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
  setText("#playerTitle", song.title); setText("#playerArtist", song.artist);
  setText("#miniTitle", song.title); setText("#miniArtist", song.artist);
  setText("#queueTitle", song.title); setText("#queueArtist", song.artist);
  ["#playerCover", "#miniCover", "#queueCover"].forEach(selector => { const el = $(selector); if (el) el.src = song.cover || ""; });
  setText("#playPause", state.playing ? "Ⅱ" : "▶"); setText("#miniPlay", state.playing ? "Ⅱ" : "▶");
  const fav = $("#playerFav"); if (fav) { fav.textContent = isFavorite(song.id) ? "♥" : "♡"; fav.classList.toggle("active", isFavorite(song.id)); }
  setText("#currentTime", formatTime(audio.currentTime)); setText("#duration", formatTime(audio.duration || song.duration));
  const progress = $("#progress"); if (progress) progress.value = audio.duration ? audio.currentTime / audio.duration * 100 : 0;
  const mini = $("#miniPlayer");
  if (mini) {
    mini.classList.add("visible"); mini.setAttribute("aria-hidden", "false");
    if (state.firstMiniPlayerEntrance) { mini.classList.add("first-entrance"); state.firstMiniPlayerEntrance = false; setTimeout(() => mini.classList.remove("first-entrance"), 1600); }
  }
  const overlay = $("#playerOverlay"); if (overlay) overlay.classList.toggle("playing", state.playing);
  updateMediaSession();
}
if (audio) {
  audio.addEventListener("play", () => { state.playing = true; updatePlayer(); renderHome(); });
  audio.addEventListener("pause", () => { state.playing = false; updatePlayer(); renderHome(); });
  audio.addEventListener("timeupdate", () => { updatePlayer(); syncLyrics(); });
  audio.addEventListener("loadedmetadata", updatePlayer);
  audio.addEventListener("error", () => { state.playing = false; updatePlayer(); });
  audio.addEventListener("ended", () => {
    if (state.repeatMode === 2) { audio.currentTime = 0; audio.play().catch(() => {}); return; }
    if (!currentSong()?.isTestTrack) recordCompletedOnlineSong();
    nextSong();
  });
}
function nextSong() {
  const queue = state.queue.map(id => state.songs.find(song => songKey(song.id) === songKey(id))).filter(Boolean);
   
