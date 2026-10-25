document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. MOCK DATA & GLOBAL STATE
    // ==========================================
    // Dynamic Offline Count starts at 0
    let offlineSongs = []; 

    // Mock Database (These would normally come from your backend)
    const allSongs = [
        { id: 1, title: "Midnight Echoes", artist: "Vic-sound", category: "Trap", cover: "linear-gradient(135deg, #0a1c0a, #000)" },
        { id: 2, title: "Neon Nights", artist: "Vic-sound", category: "Pop", cover: "linear-gradient(135deg, #111, #222)" },
        { id: 3, title: "Dark Shadows", artist: "Vic-sound", category: "Moody", cover: "linear-gradient(135deg, #050505, #0a1c0a)" },
        { id: 4, title: "Golden Hour", artist: "Vic-sound", category: "Love", cover: "linear-gradient(135deg, #1a1a1a, #000)" }
    ];

    let currentSong = null;
    let isPlaying = false;
    let currentTime = 0;
    let totalDuration = 225; // 3:45
    let playInterval = null;
    let repeatMode = 0; // 0: None, 1: Repeat (Current), 2: Loop (Queue)
    let activeTimer = null;

    // Queue data
    let queue = [...allSongs];
    let currentQueueIndex = 0;

    // Collections data
    let userCollections = ["Workout", "Late Night", "Sad"];

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const screens = document.querySelectorAll('.app-screen');
    const navBtns = document.querySelectorAll('.nav-btn');
    const offlineCountDisplay = document.getElementById('offline-count');
    const homeMusicList = document.getElementById('home-music-list');
    const miniPlayer = document.getElementById('mini-player');
    
    // Player Elements
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnMiniPlayPause = document.getElementById('mini-play-pause');
    const btnPrev = document.getElementById('btn-prev');
    const btnMiniPrev = document.getElementById('mini-prev');
    const btnNext = document.getElementById('btn-next');
    const btnMiniNext = document.getElementById('mini-next');
    const btnRepeat = document.getElementById('btn-repeat');
    const progressBar = document.getElementById('player-progress');
    
    // Title Elements
    const playerTitle = document.getElementById('player-song-title');
    const playerArtist = document.getElementById('player-song-artist');
    const miniTitle = document.getElementById('mini-song-title');
    const miniArtist = document.getElementById('mini-song-artist');
    const timeDisplay = document.getElementById('current-time');

    // ==========================================
    // 3. NAVIGATION & SCREENS
    // ==========================================
    function showScreen(screenId) {
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');
        
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.target === screenId) btn.classList.add('active');
        });
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen(btn.dataset.target);
            history.pushState({ screen: btn.dataset.target }, '', `#${btn.dataset.target}`);
        });
    });

    // ==========================================
    // 4. HOME SCREEN (Search, Categories, Offline Count)
    // ==========================================
    function updateOfflineCount() {
        offlineCountDisplay.textContent = offlineSongs.length;
    }

    function renderHomeSongs() {
        homeMusicList.innerHTML = '';
        const searchTerm = document.getElementById('home-search-input').value.toLowerCase();
        const activeCategory = document.querySelector('.cat-btn.active').dataset.category;

        const filteredSongs = allSongs.filter(song => {
            const matchesSearch = song.title.toLowerCase().includes(searchTerm) || 
                                  song.artist.toLowerCase().includes(searchTerm) || 
                                  song.category.toLowerCase().includes(searchTerm);
            const matchesCategory = activeCategory === 'All' || song.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        filteredSongs.forEach(song => {
            const li = document.createElement('li');
            li.className = 'music-item';
            
            // Check if this song is currently playing to apply green highlight
            const isActive = currentSong && currentSong.id === song.id;
            
            li.innerHTML = `
                <div class="song-cover" style="background:${song.cover}">VS</div>
                <div class="song-info">
                    <h4 class="song-title ${isActive ? 'active-playing' : ''}">${song.title}</h4>
                    <p class="song-artist">${song.artist}</p>
                </div>
                <button class="btn-favorite ${isActive ? 'active' : ''}" data-id="${song.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="${isActive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
            `;
            
            // Click to play
            li.addEventListener('click', (e) => {
                if(e.target.closest('.btn-favorite')) return; // Ignore if heart clicked
                playSongById(song.id);
            });
            
            // Favorite button opens collection modal
            li.querySelector('.btn-favorite').addEventListener('click', (e) => {
                e.stopPropagation();
                openCollectionModal(song.id);
            });
            
            homeMusicList.appendChild(li);
        });
    }

    document.getElementById('home-search-input').addEventListener('input', renderHomeSongs);
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.cat-btn.active').classList.remove('active');
            btn.classList.add('active');
            renderHomeSongs();
        });
    });

    // Initialize
    updateOfflineCount();
    renderHomeSongs();

    // ==========================================
    // 5. PLAYBACK ENGINE (Play, Pause, Progress)
    // ==========================================
    function playSongById(songId) {
        const song = allSongs.find(s => s.id === songId);
        if (!song) return;
        
        currentSong = song;
        currentQueueIndex = queue.findIndex(s => s.id === songId);
        if(currentQueueIndex === -1) currentQueueIndex = 0; // Fallback
        
        currentTime = 0;
        isPlaying = true;
        
        updatePlayerUI(song);
        renderHomeSongs(); // Refresh Home to show active green title
        
        miniPlayer.classList.add('active');
        playIconUpdate();
        startPlayback();
    }

    function updatePlayerUI(song) {
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        miniTitle.textContent = song.title;
        miniArtist.textContent = song.artist;
        // (Artwork would update here with song.cover)
    }

    function playIconUpdate() {
        const playSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        const pauseSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        
        btnPlayPause.innerHTML = isPlaying ? pauseSvg : playSvg;
        btnMiniPlayPause.innerHTML = isPlaying ? pauseSvg : playSvg;
    }

    function togglePlayPause() {
        if(!currentSong) return;
        isPlaying = !isPlaying;
        playIconUpdate();
        
        if(isPlaying) startPlayback();
        else clearInterval(playInterval);
    }

    btnPlayPause.addEventListener('click', togglePlayPause);
    btnMiniPlayPause.addEventListener('click', togglePlayPause);

    function startPlayback() {
        clearInterval(playInterval);
        playInterval = setInterval(() => {
            if(currentTime < totalDuration) {
                currentTime++;
                updateProgressBar();
            } else {
                handleSongEnd();
            }
        }, 1000);
    }

    function updateProgressBar() {
        const percent = (currentTime / totalDuration) * 100;
        progressBar.value = percent;
        document.getElementById('lyrics-progress').value = percent;
        
        const mins = Math.floor(currentTime / 60);
        const secs = currentTime % 60;
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        timeDisplay.textContent = timeStr;
        document.getElementById('lyrics-current-time').textContent = timeStr;
        
        syncLyrics();
    }

    // Draggable Progress Bar
    progressBar.addEventListener('input', (e) => {
        currentTime = (e.target.value / 100) * totalDuration;
        updateProgressBar();
    });

    // ==========================================
    // 6. PREV / NEXT LOGIC
    // ==========================================
    // First press: Restart. Second press: Previous Song.
    function handlePrevious() {
        if (currentTime > 3) { // If more than 3 seconds in, restart
            currentTime = 0;
            updateProgressBar();
        } else {
            // Go to previous song
            currentQueueIndex = (currentQueueIndex - 1 + queue.length) % queue.length;
            playSongById(queue[currentQueueIndex].id);
        }
    }

    btnPrev.addEventListener('click', handlePrevious);
    btnMiniPrev.addEventListener('click', handlePrevious);

    function handleNext() {
        currentQueueIndex = (currentQueueIndex + 1) % queue.length;
        playSongById(queue[currentQueueIndex].id);
    }

    btnNext.addEventListener('click', handleNext);
    btnMiniNext.addEventListener('click', handleNext);

    function handleSongEnd() {
        if(repeatMode === 1) {
            currentTime = 0; // Repeat current
        } else if (repeatMode === 2) {
            handleNext(); // Loop queue
        } else {
            if(currentQueueIndex < queue.length - 1) {
                handleNext();
            } else {
                togglePlayPause(); // Stop at end of queue
                currentTime = 0;
            }
        }
    }

    // ==========================================
    // 7. REPEAT / LOOP CONTROL
    // ==========================================
    const repeatIcons = {
        0: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`, // None (Crossed out)
        1: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="14" fill="currentColor" stroke="none" font-size="8" text-anchor="middle" font-weight="bold">1</text></svg>`, // Repeat One
        2: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` // Loop Queue
    };

    btnRepeat.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        btnRepeat.innerHTML = repeatIcons[repeatMode];
        
        if(repeatMode === 0) btnRepeat.className = 'btn-control inactive';
        else btnRepeat.className = 'btn-control active';
    });
    btnRepeat.innerHTML = repeatIcons[0]; // Initialize

    // ==========================================
    // 8. QUEUE & TIMER LOGIC
    // ==========================================
    const queuePanel = document.getElementById('panel-queue');
    document.getElementById('btn-queue').addEventListener('click', () => queuePanel.classList.add('active'));
    document.getElementById('btn-close-queue').addEventListener('click', () => queuePanel.classList.remove('active'));

    // Timer logic
    document.querySelectorAll('.timer-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.timer-opt').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const timeVal = e.target.dataset.time;
            const display = document.getElementById('active-timer-display');
            
            clearTimeout(activeTimer);
            
            if (timeVal === 'end') {
                display.textContent = "End of track";
            } else {
                const mins = parseInt(timeVal);
                display.textContent = `${mins} min`;
                // Simulate timer stopping playback
                activeTimer = setTimeout(() => {
                    if(isPlaying) togglePlayPause();
                    display.textContent = "None";
                    document.querySelectorAll('.timer-opt').forEach(b => b.classList.remove('active'));
                }, mins * 60000); // Real time
            }
        });
    });

    // Render Queue List
    function renderQueue() {
        const queueList = document.getElementById('queue-list');
        queueList.innerHTML = '';
        queue.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = `queue-item ${currentSong && currentSong.id === song.id ? 'current' : ''}`;
            li.innerHTML = `
                <div style="color:#555; font-size:1.2rem;">≡</div>
                <div class="queue-cover" style="background:${song.cover}"></div>
                <div class="queue-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
                <span class="queue-count">×1</span>
            `;

            // Double tap for queue count (×2 to ×10)
            let lastTap = 0;
            li.addEventListener('click', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    // Double tap detected
                    const countDisplay = li.querySelector('.queue-count');
                    let currentCount = parseInt(countDisplay.textContent.replace('×', ''));
                    if (currentCount < 10) {
                        currentCount++;
                        countDisplay.textContent = `×${currentCount}`;
                    }
                }
                lastTap = currentTime;
            });

            // Long press for options
            let pressTimer;
            li.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    document.getElementById('modal-queue-action').classList.add('active');
                }, 800);
            });
            li.addEventListener('mouseup', () => clearTimeout(pressTimer));
            li.addEventListener('mouseleave', () => clearTimeout(pressTimer));
            li.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    document.getElementById('modal-queue-action').classList.add('active');
                }, 800);
            });
            li.addEventListener('touchend', () => clearTimeout(pressTimer));

            queueList.appendChild(li);
        });
    }
    
    // Open queue and render
    document.getElementById('btn-queue').addEventListener('click', renderQueue);

    // Close Queue Action Modal
    document.getElementById('btn-cancel-queue-action').addEventListener('click', () => {
        document.getElementById('modal-queue-action').classList.remove('active');
    });
    document.getElementById('btn-remove-queue').addEventListener('click', () => {
        document.getElementById('modal-queue-action').classList.remove('active');
        // Real remove logic would go here
    });

    // ==========================================
    // 9. LYRICS LOGIC
    // ==========================================
    document.getElementById('btn-show-lyrics').addEventListener('click', () => {
        showScreen('lyrics');
        history.pushState({ screen: 'lyrics' }, '', '#lyrics');
    });
    document.querySelector('.btn-back-lyrics').addEventListener('click', () => {
        showScreen('full-player');
        history.back(); // Triggers popstate
    });

    // Simple lyric sync simulation
    const mockLyrics = [
        { time: 0, text: "Walking through the neon glow..." },
        { time: 10, text: "Shadows dancing on the floor..." },
        { time: 20, text: "I can hear the echo..." },
        { time: 30, text: "Of the midnight hour." }
    ];

    function syncLyrics() {
        const container = document.getElementById('lyrics-display');
        if (container.children.length !== mockLyrics.length) {
            container.innerHTML = mockLyrics.map(l => `<p class="lyric-line" style="opacity:0.4; padding:10px; transition:0.3s;">${l.text}</p>`).join('');
        }
        
        const lines = container.querySelectorAll('.lyric-line');
        mockLyrics.forEach((lyric, index) => {
            if(currentTime >= lyric.time && (index === mockLyrics.length - 1 || currentTime < mockLyrics[index + 1].time)) {
                lines.forEach(l => l.style.opacity = '0.4');
                lines[index].style.opacity = '1';
                lines[index].style.color = 'var(--neon-green)';
                lines[index].style.transform = 'scale(1.05)';
            } else {
                lines[index].style.color = 'var(--text-main)';
                lines[index].style.transform = 'scale(1)';
            }
        });
    }

    // ==========================================
    // 10. FAVORITES & COLLECTION MODAL
    // ==========================================
    let songToFavorite = null;
    
    function openCollectionModal(songId) {
        songToFavorite = songId;
        const list = document.getElementById('collection-options-list');
        list.innerHTML = userCollections.map(col => `
            <label style="display:flex; gap:10px; margin-bottom:10px; color:white;">
                <input type="checkbox" value="${col}"> ${col}
            </label>
        `).join('');
        document.getElementById('modal-collection').classList.add('active');
    }

    document.getElementById('btn-cancel-collection').addEventListener('click', () => {
        document.getElementById('modal-collection').classList.remove('active');
    });
    
    document.getElementById('btn-done-collection').addEventListener('click', () => {
        document.getElementById('modal-collection').classList.remove('active');
        // In a real app, you'd save the checked states here.
        // We'll just update the UI to show it was favorited.
        renderHomeSongs(); 
    });

    // ==========================================
    // 11. LATEST SCREEN (BELL & DOWNLOAD)
    // ==========================================
    const bellBtn = document.getElementById('notification-bell');
    const bellText = document.getElementById('bell-text');
    
    bellBtn.addEventListener('click', () => {
        if (bellBtn.classList.contains('bell-on')) {
            bellBtn.classList.remove('bell-on');
            bellBtn.classList.add('bell-off');
            bellText.textContent = "Notifications: OFF";
            bellText.classList.
