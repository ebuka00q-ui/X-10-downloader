document.addEventListener('DOMContentLoaded', () => {
    // State
    let isPlaying = false;
    let offlineCount = 0;
    const screens = document.querySelectorAll('.app-screen');
    const navBtns = document.querySelectorAll('.nav-btn');
    const miniPlayer = document.getElementById('mini-player');
    const fullPlayer = document.getElementById('screen-full-player');

    // 1. Navigation Logic
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            screens.forEach(s => s.classList.remove('active'));
            document.getElementById(`screen-${btn.dataset.target}`).classList.add('active');
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 2. Play/Pause & Animation Logic
    function togglePlayState() {
        isPlaying = !isPlaying;
        
        // Update Play Buttons
        const playIcon = isPlaying ? '⏸' : '▶';
        document.getElementById('mini-play-btn').textContent = playIcon;
        document.getElementById('full-play-btn').textContent = playIcon;

        // Toggle the Global Equalizer Wave Animation
        if (isPlaying) {
            document.body.classList.add('is-playing');
        } else {
            document.body.classList.remove('is-playing');
        }
    }

    document.getElementById('mini-play-btn').addEventListener('click', togglePlayState);
    document.getElementById('full-play-btn').addEventListener('click', togglePlayState);

    // 3. Mini Player -> Full Player Flow (Magic Slide)
    document.getElementById('open-full-player').addEventListener('click', () => {
        fullPlayer.classList.add('active');
        miniPlayer.classList.add('hide'); // Mini player disappears
    });

    document.getElementById('close-player').addEventListener('click', () => {
        fullPlayer.classList.remove('active');
        miniPlayer.classList.remove('hide'); // Mini player reappears
    });

    // 4. Queue & Timer Logic
    const queueSheet = document.getElementById('queue-sheet');
    const timerSheet = document.getElementById('timer-sheet');

    document.getElementById('open-queue').addEventListener('click', () => queueSheet.classList.add('active'));
    document.getElementById('close-queue').addEventListener('click', () => queueSheet.classList.remove('active'));
    
    document.getElementById('btn-timer').addEventListener('click', () => timerSheet.classList.add('active'));
    document.getElementById('close-timer').addEventListener('click', () => timerSheet.classList.remove('active'));

    // 5. The Search Toggle
    const searchArea = document.getElementById('search-area');
    document.getElementById('toggle-search').addEventListener('click', () => {
        searchArea.classList.toggle('active');
    });

    // 6. The Latest Download Flow
    const btnDownload = document.getElementById('btn-download');
    const dlProgress = document.getElementById('dl-progress');
    const dlFill = document.getElementById('dl-fill');
    const dlText = document.getElementById('dl-text');
    const releaseCard = document.getElementById('release-card-1');

    btnDownload.addEventListener('click', () => {
        btnDownload.style.display = 'none';
        dlProgress.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            dlFill.style.width = `${progress}%`;
            dlText.textContent = `Downloading ${(progress/20)} of 5`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    releaseCard.style.display = 'none'; // Remove from Latest
                    offlineCount += 5;
                    document.getElementById('offline-num').textContent = offlineCount; // Update Home dynamically
                    alert("Download complete! 5 songs added to Home.");
                }, 500);
            }
        }, 400);
    });

    // 7. New Collection Modal
    const addColModal = document.getElementById('modal-add-collection');
    document.getElementById('btn-add-collection').addEventListener('click', () => {
        addColModal.classList.add('active');
    });
    document.getElementById('cancel-collection').addEventListener('click', () => {
        addColModal.classList.remove('active');
    });
    document.getElementById('save-collection').addEventListener('click', () => {
        addColModal.classList.remove('active');
        // Logic to add the new collection box goes here
    });

    // Initialize: Let's make the equalizer animate for the demo
    setTimeout(() => togglePlayState(), 1000);
});
