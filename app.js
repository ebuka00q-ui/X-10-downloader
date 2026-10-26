/* =========================================================
   VIX-SOUND
   Main Application JavaScript
   ========================================================= */

"use strict";


/* =========================================================
   1. APP STATE
   ========================================================= */

const appState = {

    currentSong: null,

    currentIndex: -1,

    isPlaying: false,

    shuffle: false,

    repeatMode: "none",
    /*
        none    = play current song once, then stop
        queue   = continue through queue
        current = repeat current song
    */

    queue: [],

    queueIndex: 0,

    timer: null,

    timerEnd: null,

    timerMode: "off",

    favorites: [],

    collections: [],

    latestViewed: true,

    searchOpen: false,

    djActive: false,

    djSpeaking: false,

    djListening: false,

    voiceStartTime: null,

    voiceTimer: null,

    currentScreen: "home-screen"

};


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const audio = document.getElementById("audio-player");

const djCover = document.getElementById("dj-cover");

const djCurrentCover =
    document.getElementById("dj-current-cover");

const djCurrentTitle =
    document.getElementById("dj-current-title");

const djCurrentArtist =
    document.getElementById("dj-current-artist");

const djCurrentWave =
    document.getElementById("dj-current-wave");

const djPlayPause =
    document.getElementById("dj-play-pause");

const djStartOver =
    document.getElementById("dj-start-over");

const djNext =
    document.getElementById("dj-next");

const djSeek =
    document.getElementById("dj-seek");

const djCurrentTime =
    document.getElementById("dj-current-time");

const djDuration =
    document.getElementById("dj-duration");

const djMessages =
    document.getElementById("dj-messages");

const djChatTrigger =
    document.getElementById("dj-chat-trigger");

const djTextContainer =
    document.getElementById("dj-text-input-container");

const djTextInput =
    document.getElementById("dj-text-input");

const djSendMessage =
    document.getElementById("dj-send-message");

const djVoiceInput =
    document.getElementById("dj-voice-input");

const queueScreen =
    document.getElementById("queue-screen");

const queueList =
    document.getElementById("queue-list");

const queueSongCount =
    document.getElementById("queue-song-count");

const queueCurrentCover =
    document.getElementById("queue-current-cover");

const queueCurrentTitle =
    document.getElementById("queue-current-title");

const queueCurrentArtist =
    document.getElementById("queue-current-artist");

const queueSeek =
    document.getElementById("queue-seek");

const queueShuffle =
    document.getElementById("queue-shuffle");

const queueFavorite =
    document.getElementById("queue-favorite");

const queueTimer =
    document.getElementById("queue-timer");

const queueRepeat =
    document.getElementById("queue-repeat");

const queueClose =
    document.getElementById("queue-close");

const queueExit =
    document.getElementById("queue-exit");

const timerSheet =
    document.getElementById("timer-sheet");

const timerEndOfTrack =
    document.getElementById("timer-end-of-track");

const timerOff =
    document.getElementById("timer-off");

const collectionPicker =
    document.getElementById("collection-picker");

const collectionOptions =
    document.getElementById("collection-options");

const createCollectionButton =
    document.getElementById("create-collection");

const createCollectionSheet =
    document.getElementById("create-collection-sheet");

const collectionName =
    document.getElementById("collection-name");

const saveCollection =
    document.getElementById("save-collection");

const lyricsSheet =
    document.getElementById("lyrics-sheet");

const lyricsContent =
    document.getElementById("lyrics-content");

const lyricsSongName =
    document.getElementById("lyrics-song-name");

const navigationWave =
    document.getElementById("navigation-wave");

const latestDot =
    document.getElementById("latest-dot");

const navHome =
    document.getElementById("nav-home");

const navFavorites =
    document.getElementById("nav-favorites");

const navLatest =
    document.getElementById("nav-latest");


/* =========================================================
   3. LOCAL STORAGE
   ========================================================= */

function loadSavedData() {

    try {

        appState.favorites =
            JSON.parse(
                localStorage.getItem("vixsoundFavorites")
            ) || [];

        appState.collections =
            JSON.parse(
                localStorage.getItem("vixsoundCollections")
            ) || [];

    } catch (error) {

        appState.favorites = [];

        appState.collections = [];

    }

}


function saveSavedData() {

    localStorage.setItem(
        "vixsoundFavorites",
        JSON.stringify(appState.favorites)
    );

    localStorage.setItem(
        "vixsoundCollections",
        JSON.stringify(appState.collections)
    );

}


loadSavedData();


/* =========================================================
   4. SONG DATA
   =========================================================

   Your real songs can later be loaded from your backend/API.
   For now the application can work with songs supplied here.
   ========================================================= */

const songs = [

    {
        id: "lost-in-thoughts",
        title: "Lost in Thoughts",
        artist: "Jay Nova",
        cover: "assets/lost-in-thoughts.jpg",
        audio: "music/lost-in-thoughts.mp3",
        categories: ["Calm", "Moody", "Sad"],
        lyrics: ""
    },

    {
        id: "better-days",
        title: "Better Days",
        artist: "Kendrick Vibes",
        cover: "assets/better-days.jpg",
        audio: "music/better-days.mp3",
        categories: ["Rap", "Hip-Hop"],
        lyrics: ""
    },

    {
        id: "neon-dreams",
        title: "Neon Dreams",
        artist: "The Vibe Collective",
        cover: "assets/neon-dreams.jpg",
        audio: "music/neon-dreams.mp3",
        categories: ["Pop", "New"],
        lyrics: ""
    },

    {
        id: "midnight-call",
        title: "Midnight Call",
        artist: "Zara Lane",
        cover: "assets/midnight-call.jpg",
        audio: "music/midnight-call.mp3",
        categories: ["Love", "Sad"],
        lyrics: ""
    },

    {
        id: "real-ones",
        title: "Real Ones",
        artist: "Teezy & Nova",
        cover: "assets/real-ones.jpg",
        audio: "music/real-ones.mp3",
        categories: ["Rap", "Hip-Hop"],
        lyrics: ""
    }

];


/* =========================================================
   5. SONG HELPERS
   ========================================================= */

function findSong(id) {

    return songs.find(song => song.id === id);

}


function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        Math.floor(seconds % 60);

    return (
        minutes +
        ":" +
        String(remaining).padStart(2, "0")
    );

}


/* =========================================================
   6. PLAY MUSIC
   ========================================================= */

function playSong(song, source = "normal") {

    if (!song) {
        return;
    }

    appState.currentSong = song;

    appState.isPlaying = true;

    audio.src = song.audio;

    audio.currentTime = 0;

    audio.play().catch(() => {
        /*
            Browser may require a direct user interaction.
            That is normal for autoplay protection.
        */
    });

    updatePlayerDisplays();

    updatePlayingIndicators();

    updateNavigationWave();

    updateMiniPlayer();

}


/* =========================================================
   7. PAUSE
   ========================================================= */

function pauseSong() {

    audio.pause();

    appState.isPlaying = false;

    updatePlayingIndicators();

    updateNavigationWave();

    updateMiniPlayer();

}


/* =========================================================
   8. PLAY / PAUSE
   ========================================================= */

function togglePlayPause() {

    if (!appState.currentSong) {

        if (songs.length > 0) {

            playSong(
                songs[0],
                "normal"
            );

        }

        return;

    }

    if (audio.paused) {

        audio.play().then(() => {

            appState.isPlaying = true;

            updatePlayingIndicators();

            updateNavigationWave();

            updateMiniPlayer();

        }).catch(() => {});

    } else {

        pauseSong();

    }

}


if (djPlayPause) {

    djPlayPause.addEventListener(
        "click",
        togglePlayPause
    );

}


/* =========================================================
   9. START OVER / PREVIOUS
   ========================================================= */

if (djStartOver) {

    djStartOver.addEventListener(
        "click",
        () => {

            if (!appState.currentSong) {
                return;
            }

            /*
                First click:
                restart current song.

                Second click:
                go to previous song.
            */

            if (audio.currentTime > 3) {

                audio.currentTime = 0;

                return;

            }

            previousSong();

        }
    );

}


/* =========================================================
   10. NEXT SONG
   ========================================================= */

function nextSong() {

    if (!appState.queue.length) {

        if (songs.length) {

            playSong(songs[0]);

        }

        return;

    }

    let nextIndex;

    if (appState.shuffle) {

        nextIndex =
            Math.floor(
                Math.random() *
                appState.queue.length
            );

    } else {

        nextIndex =
            appState.queueIndex + 1;

    }

    if (
        nextIndex >=
        appState.queue.length
    ) {

        if (appState.repeatMode === "queue") {

            nextIndex = 0;

        } else {

            pauseSong();

            audio.currentTime = 0;

            return;

        }

    }

    appState.queueIndex = nextIndex;

    playSong(
        appState.queue[nextIndex],
        "queue"
    );

}


if (djNext) {

    djNext.addEventListener(
        "click",
        nextSong
    );

}


/* =========================================================
   11. PREVIOUS SONG
   ========================================================= */

function previousSong() {

    if (!appState.queue.length) {
        return;
    }

    let previousIndex =
        appState.queueIndex - 1;

    if (previousIndex < 0) {

        previousIndex =
            appState.queue.length - 1;

    }

    appState.queueIndex =
        previousIndex;

    playSong(
        appState.queue[previousIndex],
        "queue"
    );

}


/* =========================================================
   12. AUDIO ENDED
   ========================================================= */

audio.addEventListener(
    "ended",
    () => {

        if (
            appState.repeatMode ===
            "current"
        ) {

            audio.currentTime = 0;

            audio.play();

            return;

        }

        nextSong();

    }
);


/* =========================================================
   13. AUDIO TIME UPDATE
   ========================================================= */

audio.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration) {
            return;
        }

        const percent =
            (audio.currentTime /
            audio.duration) * 100;

        if (djSeek) {

            djSeek.value =
                percent;

        }

        if (queueSeek) {

            queueSeek.value =
                percent;

        }

        if (djCurrentTime) {

            djCurrentTime.textContent =
                formatTime(
                    audio.currentTime
                );

        }

        if (djDuration) {

            djDuration.textContent =
                formatTime(
                    audio.duration
                );

        }

        checkPlaybackTimer();

    }
);


/* =========================================================
   14. SEEK
   ========================================================= */

function seekAudio(value) {

    if (!audio.duration) {
        return;
    }

    audio.currentTime =
        (Number(value) / 100) *
        audio.duration;

}


if (djSeek) {

    djSeek.addEventListener(
        "input",
        event => {

            seekAudio(
                event.target.value
            );

        }
    );

}


if (queueSeek) {

    queueSeek.addEventListener(
        "input",
        event => {

            seekAudio(
                event.target.value
            );

        }
    );

}


/* =========================================================
   15. PLAYER DISPLAY
   ========================================================= */

function updatePlayerDisplays() {

    const song =
        appState.currentSong;

    if (!song) {
        return;
    }

    /*
        Normal music:
        use the music cover.

        DJ music:
        use the DJ artwork.
    */

    const isDJ =
        appState.djActive;

    const cover =
        isDJ
            ? "assets/vic-sound-dj.png"
            : song.cover;

    if (djCurrentCover) {

        djCurrentCover.src =
            cover;

    }

    if (djCurrentTitle) {

        djCurrentTitle.textContent =
            song.title;

    }

    if (djCurrentArtist) {

        djCurrentArtist.textContent =
            song.artist;

    }

    if (queueCurrentCover) {

        queueCurrentCover.src =
            cover;

    }

    if (queueCurrentTitle) {

        queueCurrentTitle.textContent =
            song.title;

    }

    if (queueCurrentArtist) {

        queueCurrentArtist.textContent =
            song.artist;

    }

    if (lyricsSongName) {

        lyricsSongName.textContent =
            song.title;

    }

}


/* =========================================================
   16. PLAYING WAVE
   ========================================================= */

function updatePlayingIndicators() {

    const playing =
        appState.isPlaying;

    document
        .querySelectorAll(
            ".queue-wave, .dj-current-wave"
        )
        .forEach(wave => {

            wave.classList.toggle(
                "playing",
                playing
            );

        });

    document
        .querySelectorAll(
            ".music-wave"
        )
        .forEach(wave => {

            wave.classList.toggle(
                "playing",
                playing
            );

        });

}


/* =========================================================
   17. NAVIGATION WAVE
   ========================================================= */

function updateNavigationWave() {

    if (!navigationWave) {
        return;
    }

    navigationWave.classList.toggle(
        "playing",
        appState.isPlaying
    );

}


/* =========================================================
   18. MINI PLAYER
   =========================================================

   The mini-player is intentionally kept separate from
   the DJ/full-screen player.

   If your HTML contains a mini-player, this function
   updates it automatically.
   ========================================================= */

function updateMiniPlayer() {

    const miniPlayer =
        document.querySelector(
            "#mini-player, .mini-player"
        );

    if (!miniPlayer) {
        return;
    }

    if (!appState.currentSong) {

        miniPlayer.classList.remove(
            "visible"
        );

        return;

    }

    miniPlayer.classList.add(
        "visible"
    );

    const cover =
        miniPlayer.querySelector(
            "img"
        );

    const title =
        miniPlayer.querySelector(
            ".mini-player-title"
        );

    const artist =
        miniPlayer.querySelector(
            ".mini-player-artist"
        );

    if (cover) {

        cover.src =
            appState.djActive
                ? "assets/vic-sound-dj.png"
                : appState.currentSong.cover;

    }

    if (title) {

        title.textContent =
            appState.currentSong.title;

    }

    if (artist) {

        artist.textContent =
            appState.currentSong.artist;

    }

}


/* =========================================================
   19. OPEN FULL PLAYER
   ========================================================= */

function openFullPlayer() {

    /*
        The full-screen player does NOT automatically
        close just because music started.

        The user decides when to leave it.
    */

    const player =
        document.querySelector(
            "#full-player, .full-player"
        );

    if (!player) {
        return;
    }

    player.classList.remove(
        "hidden"
    );

    player.setAttribute(
        "aria-hidden",
        "false"
    );

    updatePlayerDisplays();

}


/* =========================================================
   20. CLOSE FULL PLAYER
   ========================================================= */

function closeFullPlayer() {

    const player =
        document.querySelector(
            "#full-player, .full-player"
        );

    if (!player) {
        return;
    }

    player.classList.add(
        "hidden"
    );

    player.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   21. OPEN QUEUE
   ========================================================= */

function openQueue() {

    if (!queueScreen) {
        return;
    }

    queueScreen.classList.remove(
        "hidden"
    );

    queueScreen.setAttribute(
        "aria-hidden",
        "false"
    );

    renderQueue();

}


/* =========================================================
   22. CLOSE QUEUE
   ========================================================= */

function closeQueue() {

    if (!queueScreen) {
        return;
    }

    queueScreen.classList.add(
        "hidden"
    );

    queueScreen.setAttribute(
        "aria-hidden",
        "true"
    );

}


if (queueClose) {

    queueClose.addEventListener(
        "click",
        closeQueue
    );

}


if (queueExit) {

    queueExit.addEventListener(
        "click",
        closeQueue
    );

}


if (queueOpenList) {

    queueOpenList.addEventListener(
        "click",
        openQueue
    );

}

/* =========================================================
   23. QUEUE CREATION
   ========================================================= */

function createQueue(list) {

    appState.queue =
        Array.isArray(list)
            ? [...list]
            : [];

    appState.queueIndex = 0;

    renderQueue();

}


function renderQueue() {

    if (!queueList) {
        return;
    }

    queueList.innerHTML = "";

    if (queueSongCount) {

        queueSongCount.textContent =
            appState.queue.length;

    }

    appState.queue.forEach(
        (song, index) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "queue-item";

            item.dataset.index =
                index;

            if (
                appState.currentSong &&
                song.id ===
                appState.currentSong.id
            ) {

                item.classList.add(
                    "current"
                );

            }

            item.innerHTML = `

                <span class="queue-number">
                    ${index + 1}
                </span>

                <img
                    class="queue-item-cover"
                    src="${song.cover}"
                    alt=""
                >

                <div class="queue-item-info">

                    <h3>
                        ${escapeHTML(song.title)}
                    </h3>

                    <p>
                        ${escapeHTML(song.artist)}
                    </p>

                </div>

                <button
                    class="queue-item-favorite"
                    type="button"
                    aria-label="Favorite ${escapeHTML(song.title)}"
                >
                    ♡
                </button>

                <button
                    class="queue-item-menu"
                    type="button"
                    aria-label="Queue options"
                >
                    ☰
                </button>

            `;

            const favorite =
                item.querySelector(
                    ".queue-item-favorite"
                );

            favorite.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openCollectionPicker(
                        song
                    );

                }
            );

            item.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) {
                        return;
                    }

                    appState.queueIndex =
                        index;

                    appState.djActive =
                        false;

                    playSong(
                        song,
                        "queue"
                    );

                }
            );

            enableQueueSwipe(item, index);

            enableQueueLongPress(
                item,
                index
            );

            queueList.appendChild(
                item
            );

        }
    );

               }


/* =========================================================
   24. QUEUE LONG PRESS = REARRANGE
   ========================================================= */

function enableQueueLongPress(
    element,
    index
) {

    let timer = null;

    let startY = 0;

    element.addEventListener(
        "pointerdown",
        event => {

            startY =
                event.clientY;

            timer =
                setTimeout(() => {

                    element.classList.add(
                        "dragging"
                    );

                    element.setPointerCapture(
                        event.pointerId
                    );

                }, 450);

        }
    );

    element.addEventListener(
        "pointermove",
        event => {

            if (
                !element.classList.contains(
                    "dragging"
                )
            ) {
                return;
            }

            const difference =
                event.clientY - startY;

            if (
                Math.abs(difference) < 25
            ) {
                return;
            }

            const direction =
                difference < 0
                    ? -1
                    : 1;

            const newIndex =
                index + direction;

            if (
                newIndex >= 0 &&
                newIndex <
                appState.queue.length
            ) {

                const moved =
                    appState.queue.splice(
                        index,
                        1
                    )[0];

                appState.queue.splice(
                    newIndex,
                    0,
                    moved
                );

                appState.queueIndex =
                    newIndex;

                renderQueue();

            }

        }
    );

    element.addEventListener(
        "pointerup",
        () => {

            clearTimeout(timer);

            element.classList.remove(
                "dragging"
            );

        }
    );

    element.addEventListener(
        "pointercancel",
        () => {

            clearTimeout(timer);

            element.classList.remove(
                "dragging"
            );

        }
    );

}


/* =========================================================
   25. SWIPE QUEUE ITEM AWAY
   ========================================================= */

function enableQueueSwipe(
    element,
    index
) {

    let startX = null;

    element.addEventListener(
        "touchstart",
        event => {

            startX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );

    element.addEventListener(
        "touchend",
        event => {

            if (startX === null) {
                return;
            }

            const endX =
                event.changedTouches[0].clientX;

            const distance =
                endX - startX;

            if (
                Math.abs(distance) > 90
            ) {

                appState.queue.splice(
                    index,
                    1
                );

                if (
                    appState.queueIndex >=
                    appState.queue.length
                ) {

                    appState.queueIndex =
                        Math.max(
                            0,
                            appState.queue.length - 1
                        );

                }

                renderQueue();

            }

            startX = null;

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   26. SHUFFLE
   ========================================================= */

if (queueShuffle) {

    queueShuffle.addEventListener(
        "click",
        () => {

            appState.shuffle =
                !appState.shuffle;

            queueShuffle.classList.toggle(
                "active",
                appState.shuffle
            );

        }
    );

}

/* =========================================================
   27. REPEAT
   ========================================================= */

if (queueRepeat) {

    queueRepeat.addEventListener(
        "click",
        () => {

            if (
                appState.repeatMode ===
                "none"
            ) {

                appState.repeatMode =
                    "queue";

            } else if (
                appState.repeatMode ===
                "queue"
            ) {

                appState.repeatMode =
                    "current";

            } else {

                appState.repeatMode =
                    "none";

            }

            updateRepeatButton();

        }
    );

}


function updateRepeatButton() {

    if (!queueRepeat) {
        return;
    }

    queueRepeat.dataset.repeatMode =
        appState.repeatMode;

    queueRepeat.classList.toggle(
        "active",
        appState.repeatMode !== "none"
    );

    if (
        appState.repeatMode ===
        "current"
    ) {

        queueRepeat.setAttribute(
            "data-repeat-number",
            "1"
        );

    } else {

        queueRepeat.removeAttribute(
            "data-repeat-number"
        );

    }

}


updateRepeatButton();


/* =========================================================
   28. TIMER
   ========================================================= */

if (queueTimer) {

    queueTimer.addEventListener(
        "click",
        () => {

            openTimer();

        }
    );

}


function openTimer() {

    if (!timerSheet) {
        return;
    }

    timerSheet.classList.remove(
        "hidden"
    );

    timerSheet.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeTimer() {

    if (!timerSheet) {
        return;
    }

    timerSheet.classList.add(
        "hidden"
    );

    timerSheet.setAttribute(
        "aria-hidden",
        "true"
    );

}


document
    .querySelectorAll(
        ".timer-option"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const minutes =
                    Number(
                        button.dataset.timer
                    );

                setPlaybackTimer(
                    minutes
                );

                closeTimer();

            }
        );

    });


if (timerEndOfTrack) {

    timerEndOfTrack.addEventListener(
        "click",
        () => {

            appState.timerMode =
                "end";

            appState.timerEnd =
                null;

            updateTimerSelection();

            closeTimer();

        }
    );

}


if (timerOff) {

    timerOff.addEventListener(
        "click",
        () => {

            clearPlaybackTimer();

            closeTimer();

        }
    );

}


function setPlaybackTimer(minutes) {

    appState.timerMode =
        "countdown";

    appState.timerEnd =
        Date.now() +
        minutes * 60 * 1000;

    updateTimerSelection();

}


function clearPlaybackTimer() {

    appState.timerMode =
        "off";

    appState.timerEnd =
        null;

    updateTimerSelection();

}


function checkPlaybackTimer() {

    if (
        appState.timerMode !==
        "countdown"
    ) {
        return;
    }

    if (
        Date.now() >=
        appState.timerEnd
    ) {

        pauseSong();

        clearPlaybackTimer();

    }

}


function updateTimerSelection() {

    document
        .querySelectorAll(
            ".timer-option"
        )
        .forEach(button => {

            const minutes =
                Number(
                    button.dataset.timer
                );

            const selected =
                appState.timerMode ===
                    "countdown" &&
                appState.timerEnd &&
                Math.round(
                    (
                        appState.timerEnd -
                        Date.now()
                    ) /
                    60000
                ) === minutes;

            button.classList.toggle(
                "selected",
                selected
            );

        });

    if (timerEndOfTrack) {

        timerEndOfTrack.classList.toggle(
            "selected",
            appState.timerMode === "end"
        );

    }

}

/* =========================================================
   29. FAVORITES
   ========================================================= */

function isFavorite(songId) {

    return appState.favorites.includes(
        songId
    );

}


function openCollectionPicker(song) {

    if (!song) {
        return;
    }

    appState.favoriteTarget =
        song;

    if (!collectionPicker) {
        return;
    }

    renderCollectionOptions();

    collectionPicker.classList.remove(
        "hidden"
    );

    collectionPicker.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeCollectionPicker() {

    if (!collectionPicker) {
        return;
    }

    collectionPicker.classList.add(
        "hidden"
    );

    collectionPicker.setAttribute(
        "aria-hidden",
        "true"
    );

}


function renderCollectionOptions() {

    if (!collectionOptions) {
        return;
    }

    collectionOptions.innerHTML = "";

    if (!appState.collections.length) {

        const empty =
            document.createElement(
                "p"
            );

        empty.className =
            "collection-empty";

        empty.textContent =
            "No collections yet.";

        collectionOptions.appendChild(
            empty
        );

        return;

    }

    appState.collections.forEach(
        collection => {

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                "collection-option";

            button.innerHTML = `

                <span class="collection-check">
                    ✓
                </span>

                <span>
                    ${escapeHTML(collection.name)}
                </span>

            `;

            const selected =
                collection.songIds.includes(
                    appState.favoriteTarget.id
                );

            button.classList.toggle(
                "selected",
                selected
            );

            button.addEventListener(
                "click",
                () => {

                    toggleSongInCollection(
                        appState.favoriteTarget,
                        collection
                    );

                }
            );

            collectionOptions.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   30. ADD / REMOVE SONG FROM COLLECTION
   ========================================================= */

function toggleSongInCollection(
    song,
    collection
) {

    const position =
        collection.songIds.indexOf(
            song.id
        );

    if (position === -1) {

        collection.songIds.push(
            song.id
        );

    } else {

        collection.songIds.splice(
            position,
            1
        );

    }

    saveSavedData();

    updateFavoriteState(song);

    renderCollectionOptions();

}


/* =========================================================
   31. CREATE COLLECTION
   ========================================================= */

if (createCollectionButton) {

    createCollectionButton.addEventListener(
        "click",
        () => {

            if (!appState.favoriteTarget) {
                return;
            }

            if (createCollectionSheet) {

                createCollectionSheet.classList.remove(
                    "hidden"
                );

                createCollectionSheet.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }

            if (collectionName) {

                collectionName.value = "";

                setTimeout(
                    () => collectionName.focus(),
                    150
                );

            }

        }
    );

}


if (saveCollection) {

    saveCollection.addEventListener(
        "click",
        () => {

            const name =
                collectionName
                    ? collectionName.value.trim()
                    : "";

            if (!name) {
                return;
            }

            const song =
                appState.favoriteTarget;

            const newCollection = {

                id:
                    "collection-" +
                    Date.now(),

                name: name,

                songIds: [
                    song.id
                ]

            };

            appState.collections.push(
                newCollection
            );

            saveSavedData();

            closeCreateCollection();

            renderCollectionOptions();

            updateFavoriteState(song);

        }
    );

}


function closeCreateCollection() {

    if (!createCollectionSheet) {
        return;
    }

    createCollectionSheet.classList.add(
        "hidden"
    );

    createCollectionSheet.setAttribute(
        "aria-hidden",
        "true"
    );

}


function updateFavoriteState(song) {

    const belongsToCollection =
        appState.collections.some(
            collection =>
                collection.songIds.includes(
                    song.id
                )
        );

    if (belongsToCollection) {

        if (
            !appState.favorites.includes(
                song.id
            )
        ) {

            appState.favorites.push(
                song.id
            );

        }

    } else {

        appState.favorites =
            appState.favorites.filter(
                id => id !== song.id
            );

    }

    saveSavedData();

    updateAllFavoriteButtons();

}


function updateAllFavoriteButtons() {

    document
        .querySelectorAll(
            "[data-song-id]"
        )
        .forEach(element => {

            const id =
                element.dataset.songId;

            const heart =
                element.querySelector(
                    ".heart-icon, .favorite-icon, .heart"
                );

            if (!heart) {
                return;
            }

            heart.classList.toggle(
                "filled",
                isFavorite(id)
            );

        });

}

/* =========================================================
   32. LYRICS
   ========================================================= */

function openLyrics(song) {

    if (!lyricsSheet || !song) {
        return;
    }

    if (lyricsSongName) {

        lyricsSongName.textContent =
            song.title;

    }

    if (lyricsContent) {

        lyricsContent.textContent =
            song.lyrics ||
            "Lyrics are not available yet.";

    }

    lyricsSheet.classList.remove(
        "hidden"
    );

    lyricsSheet.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeLyrics() {

    if (!lyricsSheet) {
        return;
    }

    lyricsSheet.classList.add(
        "hidden"
    );

    lyricsSheet.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   33. DJ MODE
   ========================================================= */

function startDJ(song) {

    if (!song) {

        song =
            songs[
                Math.floor(
                    Math.random() *
                    songs.length
                )
            ];

    }

    appState.djActive =
        true;

    playSong(
        song,
        "dj"
    );

    updatePlayerDisplays();

}


/* =========================================================
   34. DJ MESSAGE
   ========================================================= */

function addDJMessage(
    text,
    type = "dj"
) {

    if (!djMessages) {
        return;
    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "dj-message " +
        type;

    message.textContent =
        text;

    djMessages.appendChild(
        message
    );

    message.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    return message;

}


/* =========================================================
   35. DJ SPEAK + TYPE AT SAME TIME
   ========================================================= */

function djSpeak(
    text
) {

    if (!text) {
        return;
    }

    appState.djSpeaking =
        true;

    const message =
        addDJMessage(
            "",
            "dj"
        );

    let character =
        0;

    const writingSpeed =
        25;

    const typing =
        setInterval(
            () => {

                message.textContent =
                    text.substring(
                        0,
                        character
                    );

                character++;

                if (
                    character >
                    text.length
                ) {

                    clearInterval(
                        typing
                    );

                }

            },
            writingSpeed
        );

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(
                text
            );

        speech.rate = 0.95;

        speech.pitch = 1;

        speech.volume = 1;

        speech.onend = () => {

            appState.djSpeaking =
                false;

        };

        window.speechSynthesis.speak(
            speech
        );

    } else {

        setTimeout(
            () => {

                appState.djSpeaking =
                    false;

            },
            text.length * writingSpeed
        );

    }

       }   

/* =========================================================
   36. DJ COMMAND UNDERSTANDING
   =========================================================

   This is the local version.

   It does NOT require an external AI.

   A real AI/backend can replace this function later.
   ========================================================= */

function handleDJRequest(
    text
) {

    const request =
        text
            .toLowerCase()
            .trim();

    if (!request) {
        return;
    }

    addDJMessage(
        text,
        "user"
    );

    let response =
        "I understand. I'll find something that matches your vibe.";

    if (
        request.includes("calm") ||
        request.includes("chill") ||
        request.includes("study")
    ) {

        response =
            "Got you. I'm going with something calm and smooth for you.";

        playDJByCategory(
            "Calm"
        );

    } else if (
        request.includes("sad") ||
        request.includes("emotional") ||
        request.includes("moody")
    ) {

        response =
            "I got you. I'm bringing up something with a deeper mood.";

        playDJByCategory(
            "Sad"
        );

    } else if (
        request.includes("rap") ||
        request.includes("hip hop") ||
        request.includes("hip-hop")
    ) {

        response =
            "Alright. Let's go with some rap and hip-hop energy.";

        playDJByCategory(
            "Rap"
        );

    } else if (
        request.includes("love") ||
        request.includes("romantic")
    ) {

        response =
            "Okay. I'll put you in a love mood.";

        playDJByCategory(
            "Love"
        );

    } else if (
        request.includes("party") ||
        request.includes("dance")
    ) {

        response =
            "Let's turn the energy up. Party mode is on.";

        playDJByCategory(
            "Party"
        );

    }

    setTimeout(
        () => {

            djSpeak(
                response
            );

        },
        250
    );

}


function playDJByCategory(
    category
) {

    const matches =
        songs.filter(
            song =>
                song.categories &&
                song.categories.some(
                    item =>
                        item.toLowerCase() ===
                        category.toLowerCase()
                )
        );

    if (!matches.length) {
        return;
    }

    appState.djActive =
        true;

    createQueue(
        matches
    );

    playSong(
        matches[0],
        "dj"
    );

}


/* =========================================================
   37. DJ TEXT INPUT
   ========================================================= */

if (djChatTrigger) {

    djChatTrigger.addEventListener(
        "click",
        () => {

            if (!djTextContainer) {
                return;
            }

            djTextContainer.classList.remove(
                "hidden"
            );

            djChatTrigger.classList.add(
                "hidden"
            );

            hideDJPlaybackControls();

            if (djTextInput) {

                setTimeout(
                    () => {

                        djTextInput.focus();

                    },
                    100
                );

            }

        }
    );

}


if (djSendMessage) {

    djSendMessage.addEventListener(
        "click",
        sendDJText
    );

}


if (djTextInput) {

    djTextInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendDJText();

            }

        }
    );

}


function sendDJText() {

    if (!djTextInput) {
        return;
    }

    const text =
        djTextInput.value.trim();

    if (!text) {
        return;
    }

    djTextInput.value = "";

    handleDJRequest(
        text
    );

       }


   
/* =========================================================
   38. HIDE DJ PLAYBACK WHILE TYPING
   ========================================================= */

function hideDJPlaybackControls() {

    if (djCurrentWave) {

        djCurrentWave.classList.add(
            "hidden"
        );

    }

    const controls =
        document.getElementById(
            "dj-playback-controls"
        );

    const seek =
        document.getElementById(
            "dj-seek-section"
        );

    if (controls) {

        controls.classList.add(
            "hidden"
        );

    }

    if (seek) {

        seek.classList.add(
            "hidden"
        );

    }

}


function showDJPlaybackControls() {

    const controls =
        document.getElementById(
            "dj-playback-controls"
        );

    const seek =
        document.getElementById(
            "dj-seek-section"
        );

    if (controls) {

        controls.classList.remove(
            "hidden"
        );

    }

    if (seek) {

        seek.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   39. DJ VOICE INPUT
   ========================================================= */

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous =
        true;

    recognition.interimResults =
        true;

    recognition.lang =
        "en-NG";

    recognition.onstart = () => {

        appState.djListening =
            true;

        appState.voiceStartTime =
            Date.now();

        if (djVoiceInput) {

            djVoiceInput.classList.add(
                "listening"
            );

        }

        startVoiceLimit();

    };

    recognition.onresult =
        event => {

            let finalText = "";

            for (
                let i =
                    event.resultIndex;
                i <
                    event.results.length;
                i++
            ) {

                const result =
                    event.results[i];

                if (
                    result.isFinal
                ) {

                    finalText +=
                        result[0].transcript;

                }

            }

            if (finalText.trim()) {

                handleDJRequest(
                    finalText.trim()
                );

            }

        };

    recognition.onend = () => {

        stopVoiceInput();

    };

    recognition.onerror = () => {

        stopVoiceInput();

    };

}

/* =========================================================
   40. HOLD TO SPEAK
   ========================================================= */

if (djVoiceInput) {

    djVoiceInput.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            startVoiceInput();

        }
    );

    djVoiceInput.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            stopVoiceInput();

        }
    );

    djVoiceInput.addEventListener(
        "pointercancel",
        stopVoiceInput
    );

    djVoiceInput.addEventListener(
        "pointerleave",
        event => {

            if (
                appState.djListening
            ) {

                stopVoiceInput();

            }

        }
    );

}


function startVoiceInput() {

    if (!recognition) {

        djSpeak(
            "Voice input is not supported by this browser. You can type your request instead."
        );

        return;

    }

    if (appState.djListening) {
        return;
    }

    try {

        recognition.start();

    } catch (error) {

        stopVoiceInput();

    }

}


function stopVoiceInput() {

    if (!appState.djListening) {
        return;
    }

    appState.djListening =
        false;

    if (djVoiceInput) {

        djVoiceInput.classList.remove(
            "listening"
        );

    }

    clearInterval(
        appState.voiceTimer
    );

    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {}

    }

}


/* =========================================================
   41. 50 SECOND VOICE LIMIT
   ========================================================= */

function startVoiceLimit() {

    clearInterval(
        appState.voiceTimer
    );

    appState.voiceTimer =
        setInterval(
            () => {

                if (!appState.djListening) {

                    clearInterval(
                        appState.voiceTimer
                    );

                    return;

                }

                const elapsed =
                    Date.now() -
                    appState.voiceStartTime;

                if (
                    elapsed >=
                    50000
                ) {

                    stopVoiceInput();

                }

            },
            250
        );

}


/* =========================================================
   42. NAVIGATION
   ========================================================= */

function switchScreen(
    screenId
) {

    document
        .querySelectorAll(
            ".screen, [data-screen-panel]"
        )
        .forEach(screen => {

            screen.classList.toggle(
                "hidden",
                screen.id !== screenId
            );

        });

    document
        .querySelectorAll(
            ".navigation-button"
        )
        .forEach(button => {

            const active =
                button.dataset.screen ===
                screenId;

            button.classList.toggle(
                "active-navigation",
                active
            );

            if (active) {

                button.setAttribute(
                    "aria-current",
                    "page"
                );

            } else {

                button.removeAttribute(
                    "aria-current"
                );

            }

        });

    appState.currentScreen =
        screenId;

    if (
        screenId ===
        "latest-screen"
    ) {

        markLatestViewed();

    }

}


if (navHome) {

    navHome.addEventListener(
        "click",
        () => {

            switchScreen(
                "home-screen"
            );

        }
    );

}


if (navFavorites) {

    navFavorites.addEventListener(
        "click",
        () => {

            switchScreen(
                "favorites-screen"
            );

        }
    );

}


if (navLatest) {

    navLatest.addEventListener(
        "click",
        () => {

            switchScreen(
                "latest-screen"
            );

        }
    );

               }


/* =========================================================
   43. LATEST NOTIFICATION
   ========================================================= */

function showLatestDot() {

    if (!latestDot) {
        return;
    }

    latestDot.classList.remove(
        "hidden"
    );

    appState.latestViewed =
        false;

}


function markLatestViewed() {

    if (!latestDot) {
        return;
    }

    latestDot.classList.add(
        "hidden"
    );

    appState.latestViewed =
        true;

}


/* =========================================================
   44. SEARCH
   ========================================================= */

function openSearch() {

    const search =
        document.querySelector(
            "#search"
        );

    if (!search) {
        return;
    }

    search.classList.remove(
        "hidden"
    );

    appState.searchOpen =
        true;

    search.focus();

}


function closeSearch() {

    const search =
        document.querySelector(
            "#search"
        );

    if (!search) {
        return;
    }

    search.classList.add(
        "hidden"
    );

    search.value = "";

    appState.searchOpen =
        false;

    filterMusic("");

}


document
    .querySelectorAll(
        "#search-button, .search-button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    appState.searchOpen
                ) {

                    closeSearch();

                } else {

                    openSearch();

                }

            }
        );

    });


const searchInput =
    document.getElementById(
        "search"
    );

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            filterMusic(
                event.target.value
            );

        }
    );

}


function filterMusic(
    query
) {

    const text =
        query
            .toLowerCase()
            .trim();

    document
        .querySelectorAll(
            "[data-song-id]"
        )
        .forEach(item => {

            const id =
                item.dataset.songId;

            const song =
                findSong(id);

            if (!song) {
                return;
            }

            const searchable =
                (
                    song.title +
                    " " +
                    song.artist +
                    " " +
                    song.categories.join(" ")
                ).toLowerCase();

            item.classList.toggle(
                "hidden",
                text !== "" &&
                !searchable.includes(text)
            );

        });

}


/* =========================================================
   45. CATEGORY FILTER
   ========================================================= */

document
    .querySelectorAll(
        "[data-category]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.category;

                document
                    .querySelectorAll(
                        "[data-category]"
                    )
                    .forEach(
                        categoryButton => {

                            categoryButton.classList.toggle(
                                "active",
                                categoryButton ===
                                button
                            );

                        }
                    );

                filterCategory(
                    category
                );

            }
        );

    });


function filterCategory(
    category
) {

    if (
        !category ||
        category.toLowerCase() ===
        "all"
    ) {

        document
            .querySelectorAll(
                "[data-song-id]"
            )
            .forEach(item => {

                item.classList.remove(
                    "hidden"
                );

            });

        return;

    }

    document
        .querySelectorAll(
            "[data-song-id]"
        )
        .forEach(item => {

            const song =
                findSong(
                    item.dataset.songId
                );

            if (!song) {
                return;
            }

            const matches =
                song.categories.some(
                    itemCategory =>
                        itemCategory.toLowerCase() ===
                        category.toLowerCase()
                );

            item.classList.toggle(
                "hidden",
                !matches
            );

        });

}


