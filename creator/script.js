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

              ...song,

              file:
                song.file,

              objectUrl:
                undefined

            }))

          );

    }


    /*
      Move songs from DRAFT
      into PUBLISHED.
    */

    songs.forEach(song => {

      song.published =
        true;

      song.publishedAt =
        new Date().toISOString();


      /*
        Keep the audio File in memory
        during this session.
      */

      const existing =
        creatorState.publishedMusic
          .find(
            item =>
              item.id === song.id
          );


      if (!existing) {

        creatorState.publishedMusic.push(
          song
        );

      }

    });


    /*
      Remove published songs from draft list.
    */

    const publishedIds =
      new Set(
        songs.map(song => song.id)
      );


    creatorState.music =
      creatorState.music.filter(
        song =>
          !publishedIds.has(
            song.id
          )
      );


    creatorState.selectedMusic.clear();


    saveState();

    renderUploadedMusic();

    renderDeleteMusic();

    renderRestoreList();

    renderAllMusic();

    renderDashboard();

    updateStatistics();


    alert(
      `${songs.length} music ${
        songs.length === 1
          ? "item"
          : "items"
      } published successfully.`
    );


  } catch (error) {

    console.error(error);


    alert(
      "Publishing failed. The music remains in your draft list."
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "🚀 Publish Music";

    }

  }

}


/* ==================== 16. DELETE FILTER ==================== */

function getFilteredDeleteMusic() {

  let list =
    [...creatorState.publishedMusic];


  const query =
    creatorState.searchDelete
      .trim()
      .toLowerCase();


  if (
    creatorState.deleteFilter !==
    "all"
  ) {

    list =
      list.filter(
        song =>
          song.releaseType ===
          creatorState.deleteFilter
      );

  }


  if (query) {

    list =
      list.filter(song =>

        String(song.title)
          .toLowerCase()
          .includes(query) ||

        String(song.author)
          .toLowerCase()
          .includes(query) ||

        String(song.releaseType)
          .toLowerCase()
          .includes(query)

      );

  }


  return list;

}


/* ==================== 17. DELETE MUSIC LIST ==================== */

function renderDeleteMusic() {

  const box =
    $("#deleteMusicList");


  if (!box) {
    return;
  }


  const list =
    getFilteredDeleteMusic();


  if (!list.length) {

    box.innerHTML = `

      <p class="empty-state">
        No published music available.
      </p>

    `;

    return;

  }


  box.innerHTML =

    list.map(song => {

      const checked =
        creatorState.selectedMusic.has(
          song.id
        )
          ? "checked"
          : "";


      return `

        <article class="delete-song">

          <input
            type="checkbox"
            data-delete-select="${song.id}"
            ${checked}
          >


          <div class="delete-song-info">

            <strong>
              ${escapeHTML(song.title)}
            </strong>

            <small>
              ${escapeHTML(
                song.author || "Victor"
              )}
              ·
              ${escapeHTML(
                song.releaseType ||
                "single"
              )}
            </small>

          </div>


          <div class="delete-song-stats">

            <strong>
              ${Number(
                song.streams || 0
              ).toLocaleString()}
            </strong>

            <small>
              streams
            </small>

          </div>

        </article>

      `;

    }).join("");

}


/* ==================== 18. SELECT ALL ==================== */

function selectAllDelete() {

  const list =
    getFilteredDeleteMusic();


  if (!list.length) {
    return;
  }


  const allSelected =
    list.every(
      song =>
        creatorState.selectedMusic.has(
          song.id
        )
    );


  if (allSelected) {

    list.forEach(song =>
      creatorState.selectedMusic.delete(
        song.id
      )
    );

  } else {

    list.forEach(song =>
      creatorState.selectedMusic.add(
        song.id
      )
    );

  }


  renderDeleteMusic();

}


/* ==================== 19. DELETE SELECTED ==================== */

async function deleteSelectedMusic() {

  /*
    Delete ONLY published music.
  */

  const selected =
    creatorState.publishedMusic.filter(
      song =>
        creatorState.selectedMusic.has(
          song.id
        )
    );


  if (!selected.length) {

    alert(
      "Select published music first."
    );

    return;

  }


  const confirmed =
    confirm(
      `Delete ${selected.length} selected music ${
        selected.length === 1
          ? "item"
          : "items"
      }?`
    );


  if (!confirmed) {
    return;
  }


  selected.forEach(song => {

    creatorState.deletedMusic.push({

      ...song,

      deletedAt:
        new Date().toISOString()

    });

  });


  creatorState.publishedMusic =
    creatorState.publishedMusic.filter(
      song =>
        !creatorState.selectedMusic.has(
          song.id
        )
    );


  creatorState.selectedMusic.clear();


  try {

    if (
      window.VicSoundCreatorBackend &&
      typeof
        window.VicSoundCreatorBackend
          .deleteMusic ===
        "function"
    ) {

      await
        window.VicSoundCreatorBackend
          .deleteMusic(
            selected.map(
              song => song.id
            )
          );

    }

  } catch (error) {

    console.error(error);

  }


  saveState();

  renderDeleteMusic();

  renderRestoreList();

  renderAllMusic();

  renderDashboard();

  updateStatistics();

}

/* ==================== 20. RESTORE ==================== */

function renderRestoreList() {

  const box =
    $("#restoreList");


  if (!box) {
    return;
  }


  if (
    !creatorState.deletedMusic.length
  ) {

    box.innerHTML = `

      <p class="empty-state">
        Nothing recently deleted.
      </p>

    `;

    return;

  }


  box.innerHTML =

    creatorState.deletedMusic
      .slice()
      .reverse()
      .map(song => {

        return `

          <article class="restore-item">

            <div class="restore-info">

              <strong>
                ${escapeHTML(
                  song.title
                )}
              </strong>

              <small>
                ${escapeHTML(
                  song.author ||
                  "Victor"
                )}
              </small>

            </div>


            <button
              type="button"
              data-restore="${song.id}"
            >
              Restore
            </button>

          </article>

        `;

      }).join("");

}


function restoreMusic(id) {

  const index =
    creatorState.deletedMusic
      .findIndex(
        song =>
          song.id === id
      );


  if (index === -1) {
    return;
  }


  const song =
    creatorState.deletedMusic[
      index
    ];


  creatorState.deletedMusic.splice(
    index,
    1
  );


  creatorState.publishedMusic.push(
    song
  );


  saveState();

  renderRestoreList();

  renderDeleteMusic();

  renderAllMusic();

  renderDashboard();

  updateStatistics();

}


/* ==================== 21. ALL PUBLISHED MUSIC ==================== */

function renderAllMusic() {

  const box =
    $("#allMusicList");


  if (!box) {
    return;
  }


  let list =
    [...creatorState.publishedMusic];


  const query =
    creatorState.searchAll
      .trim()
      .toLowerCase();


  if (query) {

    list =
      list.filter(song =>

        String(song.title)
          .toLowerCase()
          .includes(query) ||

        String(song.author)
          .toLowerCase()
          .includes(query)

      );

  }


  if (!list.length) {

    box.innerHTML = `

      <p class="empty-state">
        No published music yet.
      </p>

    `;

    return;

  }


  box.innerHTML =

    list.map((song, index) => {

      const cover =
        song.cover ||
        song.customCoverUrl;


      return `

        <article class="delete-song">

          ${
            cover
              ? `
                <img
                  src="${escapeHTML(cover)}"
                  alt=""
                  style="
                    width:42px;
                    height:42px;
                    object-fit:cover;
                    border-radius:10px;
                  "
                >
              `
              : ""
          }


          <div class="delete-song-info">

            <strong>
              ${escapeHTML(
                song.title
              )}
            </strong>

            <small>
              ${escapeHTML(
                song.author ||
                "Victor"
              )}
              ·
              ${escapeHTML(
                song.releaseType ||
                "single"
              )}
              · #${index + 1}
            </small>

          </div>


          <div class="delete-song-stats">

            <strong>
              ${Number(
                song.streams || 0
              ).toLocaleString()}
            </strong>

            <small>
              streams
            </small>

          </div>

        </article>

      `;

    }).join("");

}


/* ==================== 22. DASHBOARD ==================== */

function renderDashboard() {

  const musicCount =
    creatorState.publishedMusic.length;


  const totalStreams =
    creatorState.publishedMusic.reduce(
      (total, song) =>
        total +
        Number(
          song.streams || 0
        ),
      0
    );


  const totalDownloads =
    creatorState.publishedMusic.reduce(
      (total, song) =>
        total +
        Number(
          song.downloads || 0
        ),
      0
    );


  const dashboardMusic =
    $("#dashboardMusic");


  const dashboardStreams =
    $("#dashboardStreams");


  const dashboardDownloads =
    $("#dashboardDownloads");


  const dashboardUsers =
    $("#dashboardUsers");


  if (dashboardMusic) {

    dashboardMusic.textContent =
      musicCount.toLocaleString();

  }


  if (dashboardStreams) {

    dashboardStreams.textContent =
      totalStreams.toLocaleString();

  }


  if (dashboardDownloads) {

    dashboardDownloads.textContent =
      totalDownloads.toLocaleString();

  }


  if (dashboardUsers) {

    dashboardUsers.textContent =
      "0";

  }


  renderStreamList(
    $("#dashboardMostStreamed"),
    creatorState.publishedMusic,
    true
  );


  renderStreamList(
    $("#dashboardLeastStreamed"),
    creatorState.publishedMusic,
    false
  );

}

      

function renderStreamList(
  box,
  songs,
  descending
) {

  if (!box) {
    return;
  }


  if (!songs.length) {

    box.innerHTML = `

      <p class="empty-state">
        No streaming data yet.
      </p>

    `;

    return;

  }


  const sorted =
    [...songs]
      .sort((a, b) => {

        const aValue =
          Number(
            a.streams || 0
          );


        const bValue =
          Number(
            b.streams || 0
          );


        return descending
          ? bValue - aValue
          : aValue - bValue;

      })
      .slice(0, 3);


  box.innerHTML =

    sorted.map(
      (song, index) => {

        return `

          <div class="stream-row">

            <span class="stream-number">
              ${index + 1}
            </span>

            <span class="stream-name">
              ${escapeHTML(
                song.title
              )}
            </span>

            <span class="stream-value">
              ${Number(
                song.streams || 0
              ).toLocaleString()}
            </span>

          </div>

        `;

      }
    ).join("");

}


/* ==================== 24. QUICK STATISTICS ==================== */

function updateStatistics() {

  const musicCount =
    creatorState.publishedMusic.length;


  const totalStreams =
    creatorState.publishedMusic.reduce(
      (total, song) =>
        total +
        Number(
          song.streams || 0
        ),
      0
    );


  const musicCountBox =
    $("#musicCount");


  const streamCountBox =
    $("#streamCount");


  const userCountBox =
    $("#userCount");


  if (musicCountBox) {

    musicCountBox.textContent =
      musicCount.toLocaleString();

  }


  if (streamCountBox) {

    streamCountBox.textContent =
      totalStreams.toLocaleString();

  }


  if (userCountBox) {

    userCountBox.textContent =
      "0";

  }


  renderStreamList(
    $("#mostStreamed"),
    creatorState.publishedMusic,
    true
  );


  renderStreamList(
    $("#leastStreamed"),
    creatorState.publishedMusic,
    false
  );

}



/* ==================== 25. DJ CONTROL ==================== */

function ensureDJControls() {

  /*
    If the latest HTML already contains
    a DJ section, we use it.

    If it does not, we create one at the
    very bottom of the Upload screen.
  */


  const uploadScreen =
    $("#uploadScreen");


  if (!uploadScreen) {
    return;
  }


  if (
    $("#djCreatorControl")
  ) {

    return;

  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "creator-card";


  section.id =
    "djCreatorControl";


  section.innerHTML = `

    <div class="card-heading">

      <div>

        <h3>DJ Control</h3>

        <p>
          Control how the DJ behaves when choosing music
        </p>

      </div>

    </div>


    <label class="field-label">
      DJ Instructions
    </label>

    <textarea
      id="djInstructions"
      rows="5"
      placeholder="Example: Play calm songs when I ask for calm music."
      style="
        width:100%;
        padding:13px;
        border:1px solid rgba(120,140,190,.3);
        border-radius:12px;
        background:#080f25;
        color:#fff;
        resize:vertical;
      "
    ></textarea>


    <label class="field-label">
      DJ Mood
    </label>

    <select id="djMood">

      <option value="auto">
        Auto
      </option>

      <option value="calm">
        Calm
      </option>

      <option value="sad">
        Sad
      </option>

      <option value="happy">
        Happy
      </option>

      <option value="party">
        Party
      </option>

      <option value="moody">
        Moody
      </option>

    </select>


    <label class="field-label">
      DJ Style
    </label>

    <select id="djStyle">

      <option value="auto">
        Auto
      </option>

      <option value="favorites">
        Favorites
      </option>

      <option value="recent">
        Recently played
      </option>

      <option value="mixed">
        Mixed
      </option>

    </select>


    <label class="field-label">
      Energy
    </label>

    <select id="djEnergy">

      <option value="auto">
        Auto
      </option>

      <option value="low">
        Low
      </option>

      <option value="medium">
        Medium
      </option>

      <option value="high">
        High
      </option>

    </select>


    <label
      style="
        display:flex;
        align-items:center;
        gap:9px;
        margin-top:13px;
        font-size:11px;
        color:#c7cfe0;
      "
    >

      <input
        id="djFavorites"
        type="checkbox"
      >

      Use my favorites

    </label>


    <label
      style="
        display:flex;
        align-items:center;
        gap:9px;
        margin-top:10px;
        font-size:11px;
        color:#c7cfe0;
      "
    >

      <input
        id="djHistory"
        type="checkbox"
      >

      Use my listening history

    </label>


    <label
      style="
        display:flex;
        align-items:center;
        gap:9px;
        margin-top:10px;
        font-size:11px;
        color:#c7cfe0;
      "
    >

      <input
        id="djAvoidRepeats"
        type="checkbox"
      >

      Avoid repeating the same song

    </label>


    <div
      style="
        margin-top:14px;
        padding:11px;
        border-radius:12px;
        background:rgba(115,60,255,.08);
      "
    >

      <strong
        style="
          display:block;
          font-size:12px;
        "
      >
        DJ status
      </strong>

      <p
        style="
          margin-top:4px;
          color:#8994ad;
          font-size:10px;
          line-height:1.4;
        "
      >
        The DJ controls are ready. The actual DJ intelligence
        will be connected to the backend later.
      </p>

    </div>

  `;


  /*
    Last option on the Upload screen.
  */

  uploadScreen.appendChild(
    section
  );

}


/* ==================== 26. DJ SETTINGS ==================== */

function readDJControls() {

  const instructions =
    $("#djInstructions");


  const mood =
    $("#djMood");


  const style =
    $("#djStyle");


  const energy =
    $("#djEnergy");


  const favorites =
    $("#djFavorites");


  const history =
    $("#djHistory");


  const avoidRepeats =
    $("#djAvoidRepeats");


  if (instructions) {

    creatorState.dj.instructions =
      instructions.value;

  }


  if (mood) {

    creatorState.dj.mood =
      mood.value;

  }


  if (style) {

    creatorState.dj.style =
      style.value;

  }


  if (energy) {

    creatorState.dj.energy =
      energy.value;

  }


  if (favorites) {

    creatorState.dj.useFavorites =
      favorites.checked;

  }


  if (history) {

    creatorState.dj.useHistory =
      history.checked;

  }


  if (avoidRepeats) {

    creatorState.dj.avoidRepeats =
      avoidRepeats.checked;

  }


  saveState();

}


function renderDJControls() {

  ensureDJControls();


  const instructions =
    $("#djInstructions");


  const mood =
    $("#djMood");


  const style =
    $("#djStyle");


  const energy =
    $("#djEnergy");


  const favorites =
    $("#djFavorites");


  const history =
    $("#djHistory");


  const avoidRepeats =
    $("#djAvoidRepeats");


  if (instructions) {

    instructions.value =
      creatorState.dj.instructions ||
      "";

  }


  if (mood) {

    mood.value =
      creatorState.dj.mood ||
      "auto";

  }


  if (style) {

    style.value =
      creatorState.dj.style ||
      "auto";

  }


  if (energy) {

    energy.value =
      creatorState.dj.energy ||
      "auto";

  }


  if (favorites) {

    favorites.checked =
      creatorState.dj.useFavorites;

  }


  if (history) {

    history.checked =
      creatorState.dj.useHistory;

  }


  if (avoidRepeats) {

    avoidRepeats.checked =
      creatorState.dj.avoidRepeats;

  }

}
   
/* ==================== 27. MONETIZATION ==================== */

function activateMonetization() {

  creatorState.monetization.enabled =
    true;

  creatorState.monetization.mode =
    "ready";


  const box =
    document.querySelector(
      ".monetization-placeholder"
    );


  if (box) {

    box.innerHTML = `

      <strong>
        Monetization Active
      </strong>

      <p>
        Monetization controls are enabled and ready
        for the real backend connection.
      </p>

    `;

  }


  saveState();

}


/* ==================== 28. BACKEND ==================== */

window.VicSoundCreatorBackend = {

  async generateLyrics(song) {

    console.log(
      "Lyrics request:",
      song
    );


    throw new Error(
      "Lyrics backend not connected."
    );

  },


  async generateCover(song) {

    console.log(
      "Cover request:",
      song
    );


    throw new Error(
      "Cover backend not connected."
    );

  },


  async publishMusic(songs) {

    console.log(
      "Publish request:",
      songs
    );


    /*
      This is where the real backend
      will eventually upload the files,
      lyrics, covers and metadata.
    */


    return {
      success: true
    };

  },


  async deleteMusic(ids) {

    console.log(
      "Delete request:",
      ids
    );


    return {
      success: true
    };

  },


  async getDJRecommendation(context) {

    console.log(
      "DJ request:",
      context
    );


    /*
      Later this becomes the real DJ AI.

      Example context:

      {
        mood: "calm",
        style: "favorites",
        energy: "low",
        history: [...],
        favorites: [...],
        music: [...]
      }
    */


    throw new Error(
      "DJ backend not connected."
    );

  }

};


/* ==================== 29. EVENTS ==================== */


/* Navigation */

$$(".creator-nav-item")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        goCreatorScreen(
          button.dataset.screen
        );

      }
    );

  });


/* Music upload */

const musicFiles =
  $("#musicFiles");


if (musicFiles) {

  musicFiles.addEventListener(
    "change",
    handleMusicUpload
  );

}


/* Uploaded music selection */

const uploadedMusicList =
  $("#uploadedMusicList");


if (uploadedMusicList) {

  uploadedMusicList.addEventListener(
    "click",
    event => {

      const removeButton =
        event.target.closest(
          "[data-remove-upload]"
        );


      if (removeButton) {

        removeUploadedSong(
          Number(
            removeButton.dataset
              .removeUpload
          )
        );

        return;

      }


      const song =
        event.target.closest(
          "[data-song-id]"
        );


      if (!song) {
        return;
      }


      toggleUploadedSongSelection(
        Number(
          song.dataset.songId
        )
      );

    }
  );

}


/* Release type */

const releaseType =
  $("#releaseType");


if (releaseType) {

  releaseType.addEventListener(
    "change",
    updateReleaseControls
  );

}


/* Release number */

const releaseNumber =
  $("#releaseNumber");


if (releaseNumber) {

  releaseNumber.addEventListener(
    "change",
    () => {

      creatorState.releaseNumber =
        releaseNumber.value;

      saveState();

    }
  );

}


/* Music title */

const musicTitle =
  $("#musicTitle");


if (musicTitle) {

  musicTitle.addEventListener(
    "input",
    () => {

      const selected =
        getSelectedSongs();


      if (selected.length === 1) {

        selected[0].title =
          musicTitle.value;

        saveState();

        renderUploadedMusic();

      }

    }
  );

}


/* Music author */

const musicAuthor =
  $("#musicAuthor");


if (musicAuthor) {

  musicAuthor.addEventListener(
    "input",
    () => {

      const author =
        musicAuthor.value.trim();


      getSelectedSongs()
        .forEach(song => {

          song.author =
            author || "Victor";

        });


      saveState();

      renderUploadedMusic();

    }
  );

}


/* Lyrics */

const generateLyricsButton =
  $("#generateLyrics");


if (generateLyricsButton) {

  generateLyricsButton.addEventListener(
    "click",
    generateLyrics
  );

}


/* Cover */

const generateCoverButton =
  $("#generateCover");


if (generateCoverButton) {

  generateCoverButton.addEventListener(
    "click",
    generateCover
  );

}


/* Manual cover */

const customCover =
  $("#customCover");


if (customCover) {

  customCover.addEventListener(
    "change",
    handleCustomCover
  );

}


/* Publish */

const publishButton =
  $("#publishMusic");


if (publishButton) {

  publishButton.addEventListener(
    "click",
    publishMusic
  );

}


/* Delete search */

const deleteSearch =
  $("#deleteSearch");


if (deleteSearch) {

  deleteSearch.addEventListener(
    "input",
    event => {

      creatorState.searchDelete =
        event.target.value;

      renderDeleteMusic();

    }
  );

}


/* Delete search button */

const deleteSearchButton =
  $("#deleteSearchButton");


if (deleteSearchButton) {

  deleteSearchButton.addEventListener(
    "click",
    () => {

      creatorState.searchDelete =
        deleteSearch?.value || "";

      renderDeleteMusic();

    }
  );

}


/* Delete filters */

$$(".delete-filter")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        creatorState.deleteFilter =
          button.dataset.filter;


        $$(".delete-filter")
          .forEach(item => {

            item.classList.toggle(
              "active",
              item === button
            );

          });


        renderDeleteMusic();

      }
    );

  });


/* Delete selection */

const deleteMusicList =
  $("#deleteMusicList");


if (deleteMusicList) {

  deleteMusicList.addEventListener(
    "change",
    event => {

      const checkbox =
        event.target.closest(
          "[data-delete-select]"
        );


      if (!checkbox) {
        return;
      }


      const id =
        Number(
          checkbox.dataset
            .deleteSelect
        );


      if (checkbox.checked) {

        creatorState.selectedMusic.add(
          id
        );

      } else {

        creatorState.selectedMusic.delete(
          id
        );

      }


      renderDeleteMusic();

    }
  );

}


/* Select all */

const selectAllButton =
  $("#selectAllDelete");


if (selectAllButton) {

  selectAllButton.addEventListener(
    "click",
    selectAllDelete
  );

}


/* Delete */

const deleteButton =
  $("#deleteSelected");


if (deleteButton) {

  deleteButton.addEventListener(
    "click",
    deleteSelectedMusic
  );

}


/* Restore */

const restoreList =
  $("#restoreList");


if (restoreList) {

  restoreList.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-restore]"
        );


      if (!button) {
        return;
      }


      restoreMusic(
        Number(
          button.dataset.restore
        )
      );

    }
  );

}


/* All music search */

const allMusicSearch =
  $("#allMusicSearch");


if (allMusicSearch) {

  allMusicSearch.addEventListener(
    "input",
    event => {

      creatorState.searchAll =
        event.target.value;

      renderAllMusic();

    }
  );

}


/* All music search button */

const allMusicSearchButton =
  $("#allMusicSearchButton");


if (allMusicSearchButton) {

  allMusicSearchButton.addEventListener(
    "click",
    () => {

      creatorState.searchAll =
        allMusicSearch?.value ||
        "";

      renderAllMusic();

    }
  );

}


/* ==================== 30. START ==================== */

function initCreator() {

  loadState();

  updateReleaseNumberOptions();

  ensureDJControls();

  renderUploadedMusic();

  renderDeleteMusic();

  renderRestoreList();

  renderDashboard();

  renderAllMusic();

  renderDJControls();

  activateMonetization();

  updateStatistics();

  goCreatorScreen(
    "upload"
  );

}


initCreator();


/* =========================================================
   END OF CREATOR/APP.JS
   ========================================================= */
