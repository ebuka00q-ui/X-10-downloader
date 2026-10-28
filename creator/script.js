/* =========================================================
   VIC-SOUND CREATOR — CREATOR/APP.JS
   ========================================================= */

/* ==================== 01. STATE ==================== */

const creatorState = {

  screen: "upload",

  /* Draft music.
     Uploading music puts it here.
     Publishing moves/marks it as published.
  */
  music: [],

  /* Music that has actually been published */
  publishedMusic: [],

  /* Deleted published music */
  deletedMusic: [],

  /* Currently selected music */
  selectedMusic: new Set(),

  /* Release controls */
  releaseType: "single",
  releaseNumber: "auto",

  /* Search */
  searchDelete: "",
  deleteFilter: "all",
  searchAll: "",

  /* AI */
  generatedLyrics: {},
  generatedCovers: {},

  /* Manual covers */
  customCovers: {},

  /* Statistics */
  streams: {},
  downloads: {},

  /* DJ */
  dj: {
    enabled: true,

    name: "Vic-sound DJ",

    /* The DJ can use these instructions later */
    instructions: "",

    mood: "auto",

    style: "auto",

    energy: "auto",

    useFavorites: true,

    useHistory: true,

    avoidRepeats: true,

    maxRepeat: 1,

    replyEnabled: true
  },

  /* Monetization */
  monetization: {
    enabled: true,
    mode: "ready"
  },

  nextId: 1
};


/* ==================== 02. HELPERS ==================== */

const $ = (selector) =>
  document.querySelector(selector);


const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


function saveState() {

  try {

    localStorage.setItem(
      "vicSoundCreatorState",

      JSON.stringify({

        music: creatorState.music.map(song => ({
          ...song,
          file: undefined,
          objectUrl: undefined
        })),

        publishedMusic:
          creatorState.publishedMusic.map(song => ({
            ...song,
            file: undefined,
            objectUrl: undefined
          })),

        deletedMusic:
          creatorState.deletedMusic.map(song => ({
            ...song,
            file: undefined,
            objectUrl: undefined
          })),

        streams: creatorState.streams,

        downloads: creatorState.downloads,

        dj: creatorState.dj,

        monetization: creatorState.monetization,

        nextId: creatorState.nextId

      })
    );

  } catch (error) {

    console.warn(
      "Creator state could not be saved.",
      error
    );

  }

}


function loadState() {

  try {

    const saved =
      localStorage.getItem(
        "vicSoundCreatorState"
      );

    if (!saved) return;

    const data =
      JSON.parse(saved);


    if (Array.isArray(data.music)) {

      creatorState.music =
        data.music;

    }


    if (Array.isArray(data.publishedMusic)) {

      creatorState.publishedMusic =
        data.publishedMusic;

    }


    /*
      Compatibility with the older version.

      If old music exists but publishedMusic
      does not exist, treat the old music as
      existing creator data instead of deleting it.
    */

    if (
      !Array.isArray(data.publishedMusic) &&
      Array.isArray(data.music)
    ) {

      creatorState.publishedMusic = [];

    }


    if (Array.isArray(data.deletedMusic)) {

      creatorState.deletedMusic =
        data.deletedMusic;

    }


    if (data.streams) {

      creatorState.streams =
        data.streams;

    }


    if (data.downloads) {

      creatorState.downloads =
        data.downloads;

    }


    if (data.dj) {

      creatorState.dj = {
        ...creatorState.dj,
        ...data.dj
      };

    }


    if (data.monetization) {

      creatorState.monetization = {
        ...creatorState.monetization,
        ...data.monetization
      };

    }


    if (Number.isFinite(data.nextId)) {

      creatorState.nextId =
        data.nextId;

    }


  } catch (error) {

    console.warn(
      "Creator state could not be loaded.",
      error
    );

  }

}


function makeId() {

  const id =
    creatorState.nextId;

  creatorState.nextId++;

  return id;
}


function formatSize(bytes) {

  if (!bytes) {
    return "0 KB";
  }

  const mb =
    bytes / (1024 * 1024);


  if (mb >= 1) {

    return `${mb.toFixed(1)} MB`;

  }


  return `${Math.max(
    1,
    Math.round(bytes / 1024)
  )} KB`;

}


function getMusicById(id) {

  return creatorState.music.find(
    song => song.id === id
  );

}


function getPublishedMusicById(id) {

  return creatorState.publishedMusic.find(
    song => song.id === id
  );

}


function getSelectedSongs() {

  return creatorState.music.filter(
    song =>
      creatorState.selectedMusic.has(
        song.id
      )
  );

}


function getReleaseNumber(type) {

  const releases =
    creatorState.publishedMusic.filter(
      song =>
        song.releaseType === type
    );


  return releases.length + 1;

}


function escapeHTML(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* ==================== 03. SCREEN NAVIGATION ==================== */

function goCreatorScreen(screen) {

  creatorState.screen =
    screen;


  const uploadScreen =
    $("#uploadScreen");

  const deleteScreen =
    $("#deleteScreen");

  const dashboardScreen =
    $("#dashboardScreen");


  if (uploadScreen) {

    uploadScreen.classList.toggle(
      "active",
      screen === "upload"
    );

  }


  if (deleteScreen) {

    deleteScreen.classList.toggle(
      "active",
      screen === "delete"
    );

  }


  if (dashboardScreen) {

    dashboardScreen.classList.toggle(
      "active",
      screen === "dashboard"
    );

  }


  $$(".creator-nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.screen === screen
      );

    });


  if (screen === "upload") {

    renderUploadedMusic();

    renderDJControls();

  }


  if (screen === "delete") {

    renderDeleteMusic();

    renderRestoreList();

  }


  if (screen === "dashboard") {

    renderDashboard();

    renderAllMusic();

  }

}


/* ==================== 04. MUSIC UPLOAD ==================== */

function handleMusicUpload(event) {

  const fileInput =
    event.target;


  const files =
    Array.from(
      fileInput.files || []
    );


  if (!files.length) {
    return;
  }


  let added = 0;


  files.forEach(file => {

    /*
      Accept audio files.

      Some Android file managers may provide
      an empty MIME type, so extension checking
      is also included.
    */

    const isAudio =
      file.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|webm)$/i
        .test(file.name);


    if (!isAudio) {
      return;
    }


    const song = {

      id: makeId(),

      title: file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " "),

      author:
        $("#musicAuthor")?.value.trim() ||
        "Victor",

      fileName:
        file.name,

      fileSize:
        file.size,

      fileType:
        file.type || "audio/*",

      releaseType:
        creatorState.releaseType,

      releaseNumber:
        creatorState.releaseNumber,

      /*
        Every uploaded song starts with
        empty lyrics and no cover.

        AI will fill these later.
      */

      lyrics: "",

      cover: "",

      customCoverUrl: "",

      streams: 0,

      downloads: 0,

      published: false,

      uploadedAt:
        new Date().toISOString(),

      file: file,

      objectUrl:
        URL.createObjectURL(file)

    };


    creatorState.music.push(song);

    added++;

  });


  /*
    Important:
    Uploading does NOT publish.
  */


  fileInput.value = "";


  saveState();

  renderUploadedMusic();

  renderDeleteMusic();

  renderAllMusic();

  updateStatistics();


  if (!added) {

    alert(
      "No supported audio files were selected."
    );

  }

}


/* ==================== 05. UPLOADED MUSIC LIST ==================== */

function renderUploadedMusic() {

  const box =
    $("#uploadedMusicList");


  if (!box) {
    return;
  }


  if (!creatorState.music.length) {

    box.innerHTML = `

      <div class="empty-state">

        <b>No music uploaded yet</b>

        <span>
          Your draft songs will appear here.
        </span>

      </div>

    `;

    updateStatistics();

    return;
  }


  box.innerHTML =

    creatorState.music.map(song => {

      const selected =
        creatorState.selectedMusic.has(
          song.id
        );


      const cover =
        song.cover ||
        song.customCoverUrl;


      return `

        <article
          class="uploaded-song"
          data-song-id="${song.id}"
          style="${
            selected
              ? "outline:1px solid rgba(160,100,255,.75);"
              : ""
          }"
        >

          ${
            cover
              ? `
                <img
                  src="${escapeHTML(cover)}"
                  alt=""
                  style="
                    width:38px;
                    height:38px;
                    object-fit:cover;
                    border-radius:10px;
                    flex:0 0 38px;
                  "
                >
              `
              : `
                <div class="uploaded-song-icon">
                  ♪
                </div>
              `
          }


          <div class="uploaded-song-info">

            <strong>
              ${escapeHTML(song.title)}
            </strong>

            <small>
              ${escapeHTML(
                song.author || "Victor"
              )}
              ·
              ${formatSize(song.fileSize)}
              ·
              Draft
            </small>

          </div>


          <button
            class="uploaded-song-remove"
            type="button"
            data-remove-upload="${song.id}"
            aria-label="Remove ${escapeHTML(song.title)}"
          >
            ×
          </button>

        </article>

      `;

    }).join("");


  updateStatistics();

}


/* ==================== 06. SELECT UPLOADED SONG ==================== */

function toggleUploadedSongSelection(id) {

  if (
    creatorState.selectedMusic.has(id)
  ) {

    creatorState.selectedMusic.delete(id);

  } else {

    creatorState.selectedMusic.add(id);

  }


  renderUploadedMusic();

}


/* ==================== 07. REMOVE DRAFT ==================== */

function removeUploadedSong(id) {

  const index =
    creatorState.music.findIndex(
      song => song.id === id
    );


  if (index === -1) {
    return;
  }


  const song =
    creatorState.music[index];


  if (song.objectUrl) {

    try {

      URL.revokeObjectURL(
        song.objectUrl
      );

    } catch (_) {}

  }


  creatorState.music.splice(
    index,
    1
  );


  creatorState.selectedMusic.delete(
    id
  );


  saveState();

  renderUploadedMusic();

  renderDeleteMusic();

  renderAllMusic();

  updateStatistics();

}


/* ==================== 08. RELEASE CONTROL ==================== */

function updateReleaseControls() {

  const releaseType =
    $("#releaseType");


  if (!releaseType) {
    return;
  }


  creatorState.releaseType =
    releaseType.value;


  updateReleaseNumberOptions();

}


function updateReleaseNumberOptions() {

  const select =
    $("#releaseNumber");


  if (!select) {
    return;
  }


  const type =
    $("#releaseType")?.value ||
    "single";


  const nextNumber =
    getReleaseNumber(type);


  select.innerHTML = `

    <option value="auto">
      Auto — ${nextNumber}
    </option>

  `;


  creatorState.releaseNumber =
    "auto";

}


/* ==================== 09. MUSIC INFORMATION ==================== */

function updateSelectedMusicInformation() {

  const title =
    $("#musicTitle")?.value.trim() ||
    "";


  const author =
    $("#musicAuthor")?.value.trim() ||
    "Victor";


  const selected =
    getSelectedSongs();


  if (selected.length) {

    selected.forEach(song => {

      if (title) {

        song.title =
          title;

      }

      song.author =
        author;

    });

  } else if (
    creatorState.music.length
  ) {

    const latest =
      creatorState.music[
        creatorState.music.length - 1
      ];


    if (title) {

      latest.title =
        title;

    }


    latest.author =
      author;

  }


  saveState();

  renderUploadedMusic();

  renderDeleteMusic();

  renderAllMusic();

}


/* ==================== 10. AI LYRICS ==================== */

async function generateLyrics() {

  const selected =
    getSelectedSongs();


  const songs =
    selected.length
      ? selected
      : creatorState.music.length
        ? [
            creatorState.music[
              creatorState.music.length - 1
            ]
          ]
        : [];


  if (!songs.length) {

    alert(
      "Upload music first."
    );

    return;

  }


  const button =
    $("#generateLyrics");


  if (!button) {
    return;
  }


  const oldHTML =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <span>♪</span>

    <strong>
      Generating...
    </strong>

    <small>
      Preparing lyrics
    </small>

  `;


  try {

    for (const song of songs) {

      const lyrics =
        await requestLyricsFromBackend(
          song
        );


      if (lyrics) {

        song.lyrics =
          lyrics;

        creatorState.generatedLyrics[
          song.id
        ] =
          lyrics;

      }

    }


    saveState();


    alert(
      "Lyrics generation finished."
    );


  } catch (error) {

    console.error(error);


    alert(
      "Lyrics could not be generated yet. Connect the backend AI endpoint first."
    );


  } finally {

    button.disabled =
      false;

    button.innerHTML =
      oldHTML;

  }

}


/* ==================== 11. AI COVER ==================== */

async function generateCover() {

  const selected =
    getSelectedSongs();


  const songs =
    selected.length
      ? selected
      : creatorState.music.length
        ? [
            creatorState.music[
              creatorState.music.length - 1
            ]
          ]
        : [];


  if (!songs.length) {

    alert(
      "Upload music first."
    );

    return;

  }


  const button =
    $("#generateCover");


  if (!button) {
    return;
  }


  const oldHTML =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <span>▧</span>

    <strong>
      Generating...
    </strong>

    <small>
      Creating cover
    </small>

  `;


  try {

    for (const song of songs) {

      const cover =
        await requestCoverFromBackend(
          song
        );


      if (cover) {

        /*
          Every song receives its own cover.

          We do NOT create one global cover.
        */

        song.cover =
          cover;

        creatorState.generatedCovers[
          song.id
        ] =
          cover;

      }

    }


    saveState();

    renderUploadedMusic();


    alert(
      "Cover generation finished."
    );


  } catch (error) {

    console.error(error);


    alert(
      "Cover generation is not connected yet. Connect the backend AI endpoint first."
    );


  } finally {

    button.disabled =
      false;

    button.innerHTML =
      oldHTML;

  }

}


/* ==================== 12. AI BACKEND HOOKS ==================== */

async function requestLyricsFromBackend(song) {

  if (
    window.VicSoundCreatorBackend &&
    typeof
      window.VicSoundCreatorBackend
        .generateLyrics ===
      "function"
  ) {

    return await
      window.VicSoundCreatorBackend
        .generateLyrics({

          id: song.id,

          title: song.title,

          author: song.author,

          fileName: song.fileName,

          releaseType:
            song.releaseType,

          instructions:
            creatorState.dj.instructions

        });

  }


  throw new Error(
    "Lyrics backend not connected."
  );

}


async function requestCoverFromBackend(song) {

  if (
    window.VicSoundCreatorBackend &&
    typeof
      window.VicSoundCreatorBackend
        .generateCover ===
      "function"
  ) {

    return await
      window.VicSoundCreatorBackend
        .generateCover({

          id: song.id,

          title: song.title,

          author: song.author,

          fileName: song.fileName,

          lyrics:
            song.lyrics || "",

          releaseType:
            song.releaseType,

          releaseNumber:
            song.releaseNumber,

          instructions:
            creatorState.dj.instructions

        });

  }


  throw new Error(
    "Cover backend not connected."
  );

}


/* ==================== 13. CUSTOM COVER ==================== */

function handleCustomCover(event) {

  const file =
    event.target.files?.[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "Please choose an image."
    );

    event.target.value =
      "";

    return;

  }


  const selected =
    getSelectedSongs();


  const songs =
    selected.length
      ? selected
      : creatorState.music.length
        ? [
            creatorState.music[
              creatorState.music.length - 1
            ]
          ]
        : [];


  if (!songs.length) {

    alert(
      "Upload music first."
    );

    return;

  }


  const url =
    URL.createObjectURL(file);


  /*
    Each selected song gets the same
    manually chosen image only when
    the creator explicitly chooses it.

    AI-generated covers remain individual.
  */

  songs.forEach(song => {

    if (song.customCoverUrl) {

      try {

        URL.revokeObjectURL(
          song.customCoverUrl
        );

      } catch (_) {}

    }


    song.customCoverUrl =
      url;

    song.cover =
      url;


    creatorState.customCovers[
      song.id
    ] =
      url;

  });


  saveState();

  renderUploadedMusic();

  event.target.value =
    "";


  alert(
    "Custom cover applied."
  );

}


/* ==================== 14. PUBLISH PREPARATION ==================== */

function prepareSongsForPublishing() {

  const selected =
    getSelectedSongs();


  /*
    IMPORTANT:

    If songs are selected,
    ONLY selected songs are prepared.

    If nothing is selected,
    we don't silently publish everything.
  */

  if (!selected.length) {

    alert(
      "Select the music you want to publish first."
    );

    return [];

  }


  const releaseType =
    $("#releaseType")?.value ||
    creatorState.releaseType;


  const author =
    $("#musicAuthor")?.value.trim() ||
    "Victor";


  const releaseNumber =
    $("#releaseNumber")?.value ||
    "auto";


  selected.forEach(song => {

    song.author =
      author;


    song.releaseType =
      releaseType;


    song.releaseNumber =
      releaseNumber === "auto"
        ? getReleaseNumber(
            releaseType
          )
        : releaseNumber;


    if (!song.title) {

      song.title =
        "Untitled Music";

    }

  });


  return selected;

}


/* ==================== 15. PUBLISH ==================== */

async function publishMusic() {

  const songs =
    prepareSongsForPublishing();


  if (!songs.length) {
    return;
  }


  const confirmed =
    confirm(
      `Publish ${songs.length} selected music ${
        songs.length === 1
          ? "item"
          : "items"
      }?`
    );


  if (!confirmed) {
    return;
  }


  const button =
    $("#publishMusic");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Publishing...";

  }


  try {

    /*
      Backend receives the actual publish request.
    */

    if (
      window.VicSoundCreatorBackend &&
      typeof
        window.VicSoundCreatorBackend
          .publishMusic ===
        "function"
    ) {

      await
        window.VicSoundCreatorBackend
          .publishMusic(

            songs.map(song => ({

              ...
