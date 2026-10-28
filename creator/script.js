/* =========================================================
   VIC-SOUND CREATOR — CREATOR/APP.JS
   ========================================================= */

/* ==================== 01. STATE ==================== */

const creatorState = {
  screen: "upload",

  music: [],
  deletedMusic: [],

  selectedMusic: new Set(),

  releaseType: "single",
  releaseNumber: "auto",

  searchDelete: "",
  deleteFilter: "all",

  searchAll: "",

  generatedLyrics: {},
  generatedCovers: {},

  customCovers: {},

  streams: {},
  downloads: {},

  /* ==================== DJ ==================== */

  dj: {
    name: "Vic-sound DJ",

    picture: "",

    description:
      "Your personal music DJ.",

    instructions:
      "Play music based on the listener's mood, favorites, listening history and requested style.",

    favoriteMode: true,

    avoidRepeatingCovers: true,

    preferredStyles: [],

    calmMode: false,

    active: true
  },

  /* ==================== MONETIZATION ==================== */

  monetization: {
    active: true,

    adsEnabled: true,

    rewardedAdsEnabled: true,

    premiumEnabled: true,

    payoutEnabled: false
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

        deletedMusic:
          creatorState.deletedMusic.map(song => ({
            ...song,
            file: undefined,
            objectUrl: undefined
          })),

        streams:
          creatorState.streams,

        downloads:
          creatorState.downloads,

        dj:
          creatorState.dj,

        monetization:
          creatorState.monetization,

        nextId:
          creatorState.nextId

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

  if (!bytes) return "0 KB";

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
    creatorState.music.filter(
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


  $("#uploadScreen")
    .classList.toggle(
      "active",
      screen === "upload"
    );


  $("#deleteScreen")
    .classList.toggle(
      "active",
      screen === "delete"
    );


  $("#dashboardScreen")
    .classList.toggle(
      "active",
      screen === "dashboard"
    );


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

  const files =
    [...event.target.files];

  if (!files.length) return;


  files.forEach(file => {

    if (!file.type.startsWith("audio/")) {

      return;

    }


    const song = {

      id: makeId(),

      title: file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " "),

      author:
        $("#musicAuthor").value.trim()
        || "Victor",

      fileName:
        file.name,

      fileSize:
        file.size,

      fileType:
        file.type,

      releaseType:
        creatorState.releaseType,

      releaseNumber:
        creatorState.releaseNumber,

      lyrics: "",

      cover: "",

      customCoverUrl: "",

      streams: 0,

      downloads: 0,

      uploadedAt:
        new Date().toISOString(),

      file: file,

      objectUrl:
        URL.createObjectURL(file)

    };


    creatorState.music.push(song);

  });


  event.target.value = "";

  saveState();

  renderUploadedMusic();

  updateStatistics();

}


/* ==================== 05. UPLOADED MUSIC LIST ==================== */

function renderUploadedMusic() {

  const box =
    $("#uploadedMusicList");

  if (!box) return;


  if (!creatorState.music.length) {

    box.innerHTML = `
      <div class="empty-state">
        <b>No music uploaded yet</b>
        <span>Your uploaded songs will appear here.</span>
      </div>
    `;

    updateStatistics();

    return;

  }


  box.innerHTML =
    creatorState.music.map(song => {

      return `

        <article class="uploaded-song">

          <div class="uploaded-song-icon">
            ♪
          </div>

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
            </small>

          </div>

          <button
            class="uploaded-song-remove"
            type="button"
            data-remove-upload="${song.id}"
            aria-label="Remove ${escapeHTML(
              song.title
            )}"
          >
            ×
          </button>

        </article>

      `;

    }).join("");


  updateStatistics();

}


/* ==================== 06. REMOVE UPLOADED SONG ==================== */

function removeUploadedSong(id) {

  const index =
    creatorState.music.findIndex(
      song => song.id === id
    );

  if (index === -1) return;


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


/* ==================== 07. RELEASE CONTROL ==================== */

function updateReleaseControls() {

  creatorState.releaseType =
    $("#releaseType").value;

  creatorState.releaseNumber =
    $("#releaseNumber").value;

  updateReleaseNumberOptions();

}


function updateReleaseNumberOptions() {

  const select =
    $("#releaseNumber");

  if (!select) return;


  const type =
    $("#releaseType").value;

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


/* ==================== 08. MUSIC INFORMATION ==================== */

function updateSelectedMusicInformation() {

  const title =
    $("#musicTitle").value.trim();


  const author =
    $("#musicAuthor").value.trim()
    || "Victor";


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


/* ==================== 09. MUSIC SELECTION ==================== */

function selectMusic(id) {

  if (
    creatorState.selectedMusic.has(id)
  ) {

    creatorState.selectedMusic.delete(
      id
    );

  } else {

    creatorState.selectedMusic.add(
      id
    );

  }


  renderUploadedMusic();

}


/* =========================================================
   10. AI LYRICS
   ========================================================= */

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


  const oldHTML =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `
    <span>♪</span>
    <strong>Generating...</strong>
    <small>Preparing lyrics</small>
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
        ] = lyrics;

      }

    }


    saveState();


    alert(
      "Lyrics generation finished."
    );


  } catch (error) {

    console.error(error);


    alert(
      "Lyrics could not be generated yet. Connect the AI backend first."
    );

  } finally {

    button.disabled =
      false;

    button.innerHTML =
      oldHTML;

  }

}


/* =========================================================
   11. AI COVER
   ========================================================= */

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


  const oldHTML =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `
    <span>▧</span>
    <strong>Generating...</strong>
    <small>Creating cover</small>
  `;


  try {

    for (const song of songs) {

      const cover =
        await requestCoverFromBackend(
          song
        );


      if (cover) {

        song.cover =
          cover;

        creatorState.generatedCovers[
          song.id
        ] = cover;

      }

    }


    saveState();


    alert(
      "Cover generation finished."
    );


  } catch (error) {

    console.error(error);


    alert(
      "Cover generation is not connected yet. Connect the AI backend first."
    );

  } finally {

    button.disabled =
      false;

    button.innerHTML =
      oldHTML;

  }

}


/* =========================================================
   12. AI BACKEND HOOKS
   ========================================================= */

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

          title:
            song.title,

          author:
            song.author,

          fileName:
            song.fileName

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

          title:
            song.title,

          author:
            song.author,

          fileName:
            song.fileName,

          lyrics:
            song.lyrics || "",

          releaseType:
            song.releaseType,

          previousCovers:
            Object.values(
              creatorState.generatedCovers
            )

        });

  }


  throw new Error(
    "Cover backend not connected."
  );

}


/* =========================================================
   13. CUSTOM COVER
   ========================================================= */

function handleCustomCover(event) {

  const file =
    event.target.files[0];


  if (!file) return;


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "Please choose an image."
    );

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
    ] = url;

  });


  saveState();


  event.target.value = "";


  alert(
    "Custom cover applied."
  );

}


/* =========================================================
   14. DJ CONTROL
   ========================================================= */

function renderDJControls() {

  const box =
    $("#djControlArea");

  if (!box) return;


  const dj =
    creatorState.dj;


  box.innerHTML = `

    <div class="dj-control-header">

      <div class="dj-picture-preview">

        ${
          dj.picture
            ? `
              <img
                src="${escapeHTML(dj.picture)}"
                alt="DJ picture"
              >
            `
            : `
              <span>DJ</span>
            `
        }

      </div>

      <div>

        <strong>
          ${escapeHTML(dj.name)}
        </strong>

        <p>
          ${escapeHTML(dj.description)}
        </p>

      </div>

    </div>


    <label class="field-label">
      DJ Name
    </label>

    <input
      id="djName"
      type="text"
      value="${escapeHTML(dj.name)}"
      placeholder="DJ name"
    >


    <label class="field-label">
      DJ Description
    </label>

    <input
      id="djDescription"
      type="text"
      value="${escapeHTML(dj.description)}"
      placeholder="What your DJ does"
    >


    <label class="field-label">
      DJ Instructions
    </label>

    <textarea
      id="djInstructions"
      class="dj-textarea"
      placeholder="Tell the DJ how to behave..."
    >${escapeHTML(dj.instructions)}</textarea>


    <div class="dj-options">

      <label class="dj-option">

        <input
          id="djFavoriteMode"
          type="checkbox"
          ${dj.favoriteMode ? "checked" : ""}
        >

        <span>
          Use favorites to guide DJ
        </span>

      </label>


      <label class="dj-option">

        <input
          id="djAvoidRepeating"
          type="checkbox"
          ${dj.avoidRepeatingCovers ? "checked" : ""}
        >

        <span>
          Avoid repeating generated covers
        </span>

      </label>


      <label class="dj-option">

        <input
          id="djActive"
          type="checkbox"
          ${dj.active ? "checked" : ""}
        >

        <span>
          Keep DJ active
        </span>

      </label>

    </div>


    <label
      class="override-button dj-picture-button"
      for="djPicture"
    >
      Upload DJ Picture
    </label>

    <input
      id="djPicture"
      type="file"
      accept="image/*"
      hidden
    >


    <button
      id="saveDJSettings"
      class="dj-save-button"
      type="button"
    >
      Save DJ Settings
    </button>

  `;


  attachDJListeners();

}


/* =========================================================
   15. DJ SETTINGS
   ========================================================= */

function attachDJListeners() {

  const name =
    $("#djName");

  const description =
    $("#djDescription");

  const instructions =
    $("#djInstructions");

  const favoriteMode =
    $("#djFavoriteMode");

  const avoidRepeating =
    $("#djAvoidRepeating");

  const active =
    $("#djActive");

  const picture =
    $("#djPicture");

  const saveButton =
    $("#saveDJSettings");


  if (picture) {

    picture.addEventListener(
      "change",
      handleDJPicture
    );

  }


  if (saveButton) {

    saveButton.addEventListener(
      "click",
      () => {

        creatorState.dj.name =
          name.value.trim()
          || "Vic-sound DJ";


        creatorState.dj.description =
          description.value.trim()
          || "Your personal music DJ.";


        creatorState.dj.instructions =
          instructions.value.trim()
          || "Play music based on the listener's mood, favorites and requested style.";


        creatorState.dj.favoriteMode =
          favoriteMode.checked;


        creatorState.dj.avoidRepeatingCovers =
          avoidRepeating.checked;


        creatorState.dj.active =
          active.checked;


        saveState();


        renderDJControls();


        alert(
          "DJ settings saved."
        );

      }
    );

  }

}


/* =========================================================
   16. DJ PICTURE
   ========================================================= */

function handleDJPicture(event) {

  const file =
    event.target.files[0];


  if (!file) return;


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "Please choose an image."
    );

    return;

  }


  const url =
    URL.createObjectURL(file);


  creatorState.dj.picture =
    url;


  saveState();


  renderDJControls();

}


/* =========================================================
   17. DJ REQUEST BUILDER
   ========================================================= */

function buildDJRequest(request = "") {

  const dj =
    creatorState.dj;


  const favorites =
    creatorState.music.filter(
      song =>
        song.isFavorite === true
    );


  const availableMusic =
    creatorState.music.map(
      song => ({

        id:
          song.id,

        title:
          song.title,

        author:
          song.author,

        releaseType:
          song.releaseType,

        lyrics:
          song.lyrics || "",

        cover:
          song.cover || "",

        streams:
          Number(song.streams || 0),

        downloads:
          Number(song.downloads || 0)

      })
    );


  return {

    dj: {

      name:
        dj.name,

      instructions:
        dj.instructions,

      active:
        dj.active

    },

    request,

    favoriteMode:
      dj.favoriteMode,

    favorites:
      favorites.map(song => song.id),

    availableMusic,

    avoidRepeatingCovers:
      dj.avoidRepeatingCovers

  };

}


/* =========================================================
   18. DJ BACKEND
   ========================================================= */

async function askDJ(request = "") {

  if (!creatorState.dj.active) {

    throw new Error(
      "DJ is currently disabled."
    );

  }


  const payload =
    buildDJRequest(request);


  if (
    window.VicSoundCreatorBackend &&
    typeof
      window.VicSoundCreatorBackend
        .askDJ ===
      "function"
  ) {

    return await
      window.VicSoundCreatorBackend
        .askDJ(payload);

  }


  throw new Error(
    "DJ backend not connected."
  );

}


/* =========================================================
   19. COVER DUPLICATE PROTECTION
   ========================================================= */

function getUsedGeneratedCovers() {

  return Object.values(
    creatorState.generatedCovers
  );

}


function coverAlreadyUsed(cover) {

  if (!cover) return false;


  return getUsedGeneratedCovers()
    .includes(cover);

}


/* =========================================================
   20. PUBLISH
   ========================================================= */

async function publishMusic() {

  const selected =
    getSelectedSongs();


  const songs =
    selected.length
      ? selected
      : creatorState.music;


  if (!songs.length) {

    alert(
      "Upload at least one music file first."
    );

    return;

  }


  const releaseType =
    $("#releaseType").value;


  const author =
    $("#musicAuthor").value.trim()
    || "Victor";


  songs.forEach(song => {

    song.author =
      author;


    song.releaseType =
      releaseType;


    song.releaseNumber =
      $("#releaseNumber").value === "auto"

        ? getReleaseNumber(
            releaseType
          )

        : $("#releaseNumber").value;


    if (!song.title) {

      song.title =
        "Untitled Music";

    }

  });


  try {

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
                undefined,

              objectUrl:
                undefined

            }))

          );

    }


    saveState();


    renderUploadedMusic();

    renderDeleteMusic();

    renderAllMusic();

    renderDashboard();


    alert(
      `${songs.length} music ${
        songs.length === 1
          ? "item"
          : "items"
      } prepared for publishing.`
    );


  } catch (error) {

    console.error(error);


    alert(
      "Publishing backend is not connected yet."
    );

  }

       }

/* =========================================================
   21. DELETE FILTER
   ========================================================= */

function getFilteredDeleteMusic() {

  let list =
    [...creatorState.music];


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

        song.title
          .toLowerCase()
          .includes(query)

        ||

        song.author
          .toLowerCase()
          .includes(query)

        ||

        song.releaseType
          .toLowerCase()
          .includes(query)

      );

  }


  return list;

}


/* =========================================================
   22. DELETE MUSIC LIST
   ========================================================= */

function renderDeleteMusic() {

  const box =
    $("#deleteMusicList");

  if (!box) return;


  const list =
    getFilteredDeleteMusic();


  if (!list.length) {

    box.innerHTML = `
      <p class="empty-state">
        No music available.
      </p>
    `;

    return;

  }


  box.innerHTML =
    list.map(song => {

      const checked =
        creatorState.selectedMusic
          .has(song.id)
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


/* =========================================================
   23. SELECT ALL
   ========================================================= */

function selectAllDelete() {

  const list =
    getFilteredDeleteMusic();


  const allSelected =
    list.length &&
    list.every(song =>
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

  renderUploadedMusic();

}


/* =========================================================
   24. DELETE SELECTED
   ========================================================= */

async function deleteSelectedMusic() {

  const selected =
    getSelectedSongs();


  if (!selected.length) {

    alert(
      "Select music first."
    );

    return;

  }


  const confirmed =
    confirm(
      `Delete ${
        selected.length
      } selected music ${
        selected.length === 1
          ? "item"
          : "items"
      }?`
    );


  if (!confirmed) return;


  selected.forEach(song => {

    creatorState.deletedMusic.push({

      ...song,

      deletedAt:
        new Date().toISOString()

    });

  });


  creatorState.music =
    creatorState.music.filter(
      song =>
        !creatorState.selectedMusic
          .has(song.id)
    );


  creatorState.selectedMusic.clear();


  saveState();


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


  renderDeleteMusic();

  renderRestoreList();

  renderUploadedMusic();

  renderAllMusic();

  renderDashboard();

  updateStatistics();

}


/* =========================================================
   25. RESTORE
   ========================================================= */

function renderRestoreList() {

  const box =
    $("#restoreList");

  if (!box) return;


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
        song => song.id === id
      );


  if (index === -1) return;


  const song =
    creatorState.deletedMusic[
      index
    ];


  creatorState.deletedMusic.splice(
    index,
    1
  );


  creatorState.music.push(
    song
  );


  saveState();

  renderRestoreList();

  renderDeleteMusic();

  renderUploadedMusic();

  renderAllMusic();

  renderDashboard();

  updateStatistics();

}


/* =========================================================
   26. ALL MUSIC
   ========================================================= */

function renderAllMusic() {

  const box =
    $("#allMusicList");

  if (!box) return;


  let list =
    [...creatorState.music];


  const query =
    creatorState.searchAll
      .trim()
      .toLowerCase();


  if (query) {

    list =
      list.filter(song =>

        song.title
          .toLowerCase()
          .includes(query)

        ||

        song.author
          .toLowerCase()
          .includes(query)

      );

  }


  if (!list.length) {

    box.innerHTML = `
      <p class="empty-state">
        No music uploaded yet.
      </p>
    `;

    return;

  }


  box.innerHTML =
    list.map((song, index) => {

      return `

        <article class="delete-song">

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


/* =========================================================
   27. DASHBOARD
   ========================================================= */

function renderDashboard() {

  const musicCount =
    creatorState.music.length;


  const totalStreams =
    creatorState.music.reduce(
      (total, song) =>
        total +
        Number(song.streams || 0),
      0
    );


  const totalDownloads =
    creatorState.music.reduce(
      (total, song) =>
        total +
        Number(song.downloads || 0),
      0
    );


  $("#dashboardMusic")
    .textContent =
      musicCount.toLocaleString();


  $("#dashboardStreams")
    .textContent =
      totalStreams.toLocaleString();


  $("#dashboardDownloads")
    .textContent =
      totalDownloads.toLocaleString();


  $("#dashboardUsers")
    .textContent =
      "0";


  renderStreamList(
    $("#dashboardMostStreamed"),
    creatorState.music,
    true
  );


  renderStreamList(
    $("#dashboardLeastStreamed"),
    creatorState.music,
    false
  );

}


/* =========================================================
   28. STREAM LISTS
   ========================================================= */

function renderStreamList(
  box,
  songs,
  descending
) {

  if (!box) return;


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

         /* =========================================================
   29. QUICK STATISTICS
   ========================================================= */

function updateStatistics() {

  const musicCount =
    creatorState.music.length;


  const totalStreams =
    creatorState.music.reduce(
      (total, song) =>
        total +
        Number(song.streams || 0),
      0
    );


  $("#musicCount")
    .textContent =
      musicCount.toLocaleString();


  $("#streamCount")
    .textContent =
      totalStreams.toLocaleString();


  $("#userCount")
    .textContent =
      "0";


  renderStreamList(
    $("#mostStreamed"),
    creatorState.music,
    true
  );


  renderStreamList(
    $("#leastStreamed"),
    creatorState.music,
    false
  );

}


/* =========================================================
   30. EVENT LISTENERS
   ========================================================= */

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

$("#musicFiles")
  .addEventListener(
    "change",
    handleMusicUpload
  );


/* Remove uploaded music */

$("#uploadedMusicList")
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-remove-upload]"
        );


      if (!button) return;


      removeUploadedSong(
        Number(
          button.dataset.removeUpload
        )
      );

    }
  );


/* Release type */

$("#releaseType")
  .addEventListener(
    "change",
    updateReleaseControls
  );


/* Release number */

$("#releaseNumber")
  .addEventListener(
    "change",
    () => {

      creatorState.releaseNumber =
        $("#releaseNumber").value;

    }
  );


/* Music title */

$("#musicTitle")
  .addEventListener(
    "input",
    () => {

      const selected =
        getSelectedSongs();


      if (selected.length === 1) {

        selected[0].title =
          $("#musicTitle").value;

      }

    }
  );


/* Music author */

$("#musicAuthor")
  .addEventListener(
    "input",
    () => {

      const author =
        $("#musicAuthor")
          .value
          .trim();


      getSelectedSongs()
        .forEach(song => {

          song.author =
            author || "Victor";

        });

    }
  );


/* Lyrics */

$("#generateLyrics")
  .addEventListener(
    "click",
    generateLyrics
  );


/* Cover */

$("#generateCover")
  .addEventListener(
    "click",
    generateCover
  );


/* Manual cover */

$("#customCover")
  .addEventListener(
    "change",
    handleCustomCover
  );


/* Publish */

$("#publishMusic")
  .addEventListener(
    "click",
    publishMusic
  );


/* Delete search */

$("#deleteSearch")
  .addEventListener(
    "input",
    event => {

      creatorState.searchDelete =
        event.target.value;

      renderDeleteMusic();

    }
  );


$("#deleteSearchButton")
  .addEventListener(
    "click",
    () => {

      creatorState.searchDelete =
        $("#deleteSearch").value;

      renderDeleteMusic();

    }
  );


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

$("#deleteMusicList")
  .addEventListener(
    "change",
    event => {

      const checkbox =
        event.target.closest(
          "[data-delete-select]"
        );


      if (!checkbox) return;


      const id =
        Number(
          checkbox.dataset.deleteSelect
        );


      if (checkbox.checked) {

        creatorState.selectedMusic
          .add(id);

      } else {

        creatorState.selectedMusic
          .delete(id);

      }


      renderUploadedMusic();

    }
  );


/* Select all */

$("#selectAllDelete")
  .addEventListener(
    "click",
    selectAllDelete
  );


/* Delete */

$("#deleteSelected")
  .addEventListener(
    "click",
    deleteSelectedMusic
  );


/* Restore */

$("#restoreList")
  .addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-restore]"
        );


      if (!button) return;


      restoreMusic(
        Number(
          button.dataset.restore
        )
      );

    }
  );


/* All music search */

$("#allMusicSearch")
  .addEventListener(
    "input",
    event => {

      creatorState.searchAll =
        event.target.value;

      renderAllMusic();

    }
  );


$("#allMusicSearchButton")
  .addEventListener(
    "click",
    () => {

      creatorState.searchAll =
        $("#allMusicSearch").value;

      renderAllMusic();

    }
  );


/* =========================================================
   31. CREATOR BACKEND
   ========================================================= */

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


  async askDJ(payload) {

    console.log(
      "DJ request:",
      payload
    );


    throw new Error(
      "DJ backend not connected."
    );

  },


  async publishMusic(songs) {

    console.log(
      "Publish request:",
      songs
    );


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

  }

};


/* =========================================================
   32. START
   ========================================================= */

function initCreator() {

  loadState();

  updateReleaseNumberOptions();

  renderUploadedMusic();

  renderDeleteMusic();

  renderRestoreList();

  renderDashboard();

  renderAllMusic();

  updateStatistics();

  renderDJControls();

  goCreatorScreen(
    "upload"
  );

}


initCreator();


/* =========================================================
   END OF CREATOR/APP.JS
   ========================================================= */
