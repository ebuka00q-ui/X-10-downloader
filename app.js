document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. INITIAL DATA & STATE
    // ==========================================
    // Dynamic count starting at 0 as requested
    let downloadedSongs = []; 
    let currentSong = null;
    let isPlaying = false;
    let currentTime = 0;
    let totalDuration = 225; // 3:45 in seconds
    let playInterval = null;
    
    // Repeat/Loop states: 0 = None, 1 = Repeat (one song), 2 = Loop (queue)
    let repeatState = 0; 

    // Mock Database of Songs
    const allSongs = [
        { id: 1, title: "Midnight Echoes", artist: "Vic-sound", category: "Trap", cover: "https://via.placeholder.com/150/00ff41/000000?text=VS" },
        { id: 2, title: "Neon Nights", artist: "Vic-sound", category: "Pop", cover: "https://via.placeholder.com/150/000000/00ff41?text=VS" },
        { id: 3, title: "Dark Shadows", artist: "Vic-sound", category: "Moody", cover: "https://via.placeholder.com/150/121212/00ff41?text=VS" },
        { id: 4, title: "Golden Hour", artist: "Vic-sound", category: "Love", cover: "https://via.placeholder.com/150/222222/ffffff?text=VS" }
    ];

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const screens = document.querySelectorAll('.app-screen');
    const navBtns = document.querySelectorAll('.nav-btn');
    const offlineCount = document.getElementById('offline-count');
    const homeMusicList = document.getElementById('home-music-list');
    
    // Player Elements
    const miniPlayer = document.getElementById('mini-player');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnMiniPlayPause = document.getElementById('mini-play-pause');
    const progressBar = document.getElementById('player-progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const playerTitle = document.querySelector('.player-song-title');
    const playerArtist = document.querySelector('.player-artist');
    const miniTitle = document.querySelector('.mini-text h4');
    const miniArtist = document.querySelector('.mini-text p');
    const btnRepeat = document.getElementById('btn-repeat');
    
    // Queue Elements
    const queuePanel = document.getElementById('panel-queue');
    const btnQueue = document.getElementById('btn-queue');
    const btnCloseQueue = document.getElementById('btn-close-queue');
    const timerToggle = document.getElementById('btn-timer-toggle');
    const timerOptions = document.getElementById('timer-options');
    const timerBtns = document.querySelectorAll('.timer-opt');

    // Latest Elements
    const bellBtn = document.getElementById('notification-bell');
    const downloadBtn = document.querySelector('.btn-download');
    const downloadProgress = document.querySelector('.download-progress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    // Modals
    const modalCollection = document.getElementById('modal-collection');
    const modalExit = document.getElementById('modal-exit');

    // ==========================================
    // 3. NAVIGATION & SCREENS
    // ==========================================
    function showScreen(screenId) {
        screens.forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');
        
        // Update Bottom Nav
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.target === screenId) btn.classList.add('active');
        });
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen(btn.dataset.target);
        });
    });

    // ==========================================
    // 4. HOME SCREEN LOGIC (Search, Filter, Count)
    // ==========================================
    function updateOfflineCount() {
        const count = downloadedSongs.length;
        offlineCount.textContent = `${count} ${count === 1 ? 'song' : 'songs'}`;
    }

    function renderHomeSongs(songsToRender) {
        homeMusicList.innerHTML = '';
        songsToRender.forEach(song => {
            const li = document.createElement('li');
            li.className = 'music-item';
            li.innerHTML = `
                <img src="${song.cover}" alt="Cover" class="song-cover">
                <div class="song-info">
                    <h4 class="song-title">${song.title}</h4>
                    <p class="song-artist">${song.artist}</p>
                </div>
                <button class="btn-favorite"><i class="icon-heart"></i></button>
            `;
            // Click to play
            li.addEventListener('click', (e) => {
                if(e.target.closest('.btn-favorite')) return; // Ignore if clicking heart
                playSong(song);
            });
            // Heart click
            li.querySelector('.btn-favorite').addEventListener('click', () => {
                modalCollection.classList.add('active'); // Open collection selector
            });
            homeMusicList.appendChild(li);
        });
    }

    // Initialize Home
    updateOfflineCount();
    renderHomeSongs(allSongs); // Rendering mock songs for display

    // Search Filter
    document.getElementById('home-search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allSongs.filter(s => 
            s.title.toLowerCase().includes(term) || 
            s.artist.toLowerCase().includes(term) || 
            s.category.toLowerCase().includes(term)
        );
        renderHomeSongs(filtered);
    });

    // Category Filter
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.cat-btn.active').classList.remove('active');
            btn.classList.add('active');
            const cat = btn.dataset.category;
            if (cat === 'All') renderHomeSongs(allSongs);
            else renderHomeSongs(allSongs.filter(s => s.category === cat));
        });
    });

    // ==========================================
    // 5. PLAYER LOGIC (Play, Pause, Progress)
    // ==========================================
    function playSong(song) {
        currentSong = song;
        isPlaying = true;
        currentTime = 0;
        
        // Update UI
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        miniTitle.textContent = song.title;
        miniArtist.textContent = song.artist;
        
        miniPlayer.classList.add('active');
        btnPlayPause.innerHTML = '<i class="icon-pause"></i>';
        btnMiniPlayPause.innerHTML = '<i class="icon-pause"></i>';
        
        // Highlight active song in list
        document.querySelectorAll('.music-item').forEach(item => {
            item.querySelector('.song-title').classList.remove('active-playing');
            if(item.querySelector('.song-title').textContent === song.title) {
                item.querySelector('.song-title').classList.add('active-playing');
            }
        });

        startPlaybackTimer();
    }

    function togglePlayPause() {
        if(!currentSong) return;
        isPlaying = !isPlaying;
        
        const icon = isPlaying ? '<i class="icon-pause"></i>' : '<i class="icon-play"></i>';
        btnPlayPause.innerHTML = icon;
        btnMiniPlayPause.innerHTML = icon;

        if(isPlaying) startPlaybackTimer();
        else clearInterval(playInterval);
    }

    btnPlayPause.addEventListener('click', togglePlayPause);
    btnMiniPlayPause.addEventListener('click', togglePlayPause);

    function startPlaybackTimer() {
        clearInterval(playInterval);
        playInterval = setInterval(() => {
            if(currentTime < totalDuration) {
                currentTime++;
                updateProgressUI();
            } else {
                handleSongEnd();
            }
        }, 1000);
    }

    function updateProgressUI() {
        const percent = (currentTime / totalDuration) * 100;
        progressBar.value = percent;
        
        // Format time (MM:SS)
        const mins = Math.floor(currentTime / 60);
        const secs = currentTime % 60;
        currentTimeDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    progressBar.addEventListener('input', (e) => {
        const percent = e.target.value;
        currentTime = (percent / 100) * totalDuration;
        updateProgressUI();
    });

    // Open Full Player by tapping mini-player info
    document.getElementById('mini-player-open').addEventListener('click', () => {
        showScreen('full-player');
    });

    document.querySelector('.btn-back').addEventListener('click', () => {
        showScreen('home');
    });

    // ==========================================
    // 6. REPEAT / LOOP LOGIC
    // ==========================================
    btnRepeat.addEventListener('click', () => {
        repeatState = (repeatState + 1) % 3;
        btnRepeat.className = 'btn-control'; // Reset classes
        
        if(repeatState === 0) {
            btnRepeat.classList.add('inactive');
            btnRepeat.innerHTML = '<i class="icon-repeat"></i>'; // None
        } else if(repeatState === 1) {
            btnRepeat.classList.add('active');
            btnRepeat.innerHTML = '<i class="icon-repeat"></i>'; // Repeat One
        } else if(repeatState === 2) {
            btnRepeat.classList.add('active');
            btnRepeat.innerHTML = '<i class="icon-loop"></i>'; // Loop Queue
        }
    });

    function handleSongEnd() {
        if(repeatState === 1) {
            currentTime = 0; // Repeat same song
        } else {
            // Play next logic (Simulated)
            const currentIndex = allSongs.findIndex(s => s.id === currentSong.id);
            if(currentIndex < allSongs.length - 1) {
                playSong(allSongs[currentIndex + 1]);
            } else {
                if(repeatState === 2) playSong(allSongs[0]); // Loop back to start
                else togglePlayPause(); // Stop
            }
        }
    }

    // ==========================================
    // 7. QUEUE & TIMER LOGIC
    // ==========================================
    btnQueue.addEventListener('click', () => queuePanel.classList.add('active'));
    btnCloseQueue.addEventListener('click', () => queuePanel.classList.remove('active'));

    timerToggle.addEventListener('click', () => {
        timerOptions.classList.toggle('hidden');
    });

    timerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const time = btn.dataset.time;
            
            if(time === 'end') {
                alert("Timer set: Stop at end of track.");
            } else {
                const mins = parseInt(time);
                alert(`Timer set for ${mins} minutes.`);
                // Real implementation would use setTimeout(() => togglePlayPause(), mins * 60000)
            }
        });
    });

    // Long Press for Queue Items (Action Modal)
    document.querySelectorAll('.queue-item').forEach(item => {
        let pressTimer;
        item.addEventListener('mousedown', () => {
            pressTimer = setTimeout(() => {
                // Show action modal logic here (Play Next, Move, Remove)
                alert("Long press detected! Options: Play Next, Move, Remove from queue, Cancel.");
            }, 800);
        });
        item.addEventListener('mouseup', () => clearTimeout(pressTimer));
        item.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    });

    // Tap Count logic for Queue (e.g., ×2, ×3)
    document.querySelectorAll('.queue-item').forEach(item => {
        let tapCount = 1;
        item.addEventListener('dblclick', () => {
            if(tapCount < 10) {
                tapCount++;
                item.querySelector('.queue-count').textContent = `×${tapCount}`;
            }
        });
    });

    // ==========================================
    // 8. LYRICS LOGIC
    // ==========================================
    document.getElementById('btn-show-lyrics').addEventListener('click', () => {
        showScreen('lyrics');
    });
    document.querySelector('.btn-back-lyrics').addEventListener('click', () => {
        showScreen('full-player');
    });

    // ==========================================
    // 9. LATEST SCREEN & BELL LOGIC
    // ==========================================
    bellBtn.addEventListener('click', () => {
        if(bellBtn.classList.contains('bell-on')) {
            bellBtn.classList.remove('bell-on');
            bellBtn.classList.add('bell-off');
        } else {
            bellBtn.classList.remove('bell-off');
            bellBtn.classList.add('bell-on');
        }
    });

    downloadBtn.addEventListener('click', () => {
        downloadBtn.style.display = 'none';
        downloadProgress.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Downloading ${Math.floor((progress/100)*50)} of 50`;
            
            if(progress >= 100) {
                clearInterval(interval);
                downloadProgress.style.display = 'none';
                
                // Add to offline library dynamically
                downloadedSongs = [...allSongs]; // Populate offline array
                updateOfflineCount(); // Update the number on Home!
                alert("Release downloaded! Check your Home screen.");
            }
        }, 300);
    });

    // ==========================================
    // 10. MODALS (Favorites & Exit)
    // ==========================================
    document.getElementById('btn-cancel-collection').addEventListener('click', () => {
        modalCollection.classList.remove('active');
    });
    document.getElementById('btn-done-collection').addEventListener('click', () => {
        modalCollection.classList.remove('active');
    });
    document.getElementById('btn-exit-cancel').addEventListener('click', () => {
        modalExit.classList.remove('active');
    });

    // ==========================================
    // 11. PHYSICAL BACK BUTTON HANDLING
    // ==========================================
    // Push a state on load so we can intercept Back
    history.pushState({ page: 'home' }, 'Vic-sound');

    window.addEventListener('popstate', (e) => {
        // If an overlay/modal is open, close it first
        if(queuePanel.classList.contains('active')) {
            queuePanel.classList.remove('active');
            history.pushState({ page: 'app' }, 'Vic-sound');
            return;
        }
        if(modalCollection.classList.contains('active')) {
            modalCollection.classList.remove('active');
            history.pushState({ page: 'app' }, 'Vic-sound');
            return;
        }

        // Handle Screen Navigation
        const activeScreen = document.querySelector('.app-screen.active').id;
        
        if (activeScreen === 'screen-lyrics') {
            showScreen('full-player');
            history.pushState({ page: 'app' }, 'Vic-sound');
        } else if (activeScreen === 'screen-full-player') {
            showScreen('home');
            history.pushState({ page: 'app' }, 'Vic-sound');
        } else if (activeScreen === 'screen-favorites' || activeScreen === 'screen-latest') {
            showScreen('home');
            history.pushState({ page: 'app' }, 'Vic-sound');
        } else {
            // We are at Home (Root). Show Exit Modal.
            modalExit.classList.add('active');
            history.pushState({ page: 'app' }, 'Vic-sound'); // Trap back button again
        }
    });

    // Exit Application (PWA/Web fallback)
    document.getElementById('btn-exit-confirm').addEventListener('click', () => {
        window.close(); // May not work in all browsers
        alert("Exiting Vic-sound...");
    });

});
