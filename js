function playVideo() {
    const link = document.getElementById('videoLink').value.trim();
    const playerContainer = document.getElementById('playerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    const noVideoMsg = document.getElementById('noVideoMsg');
    
    if (!link) {
        alert('Please paste a link first.');
        return;
    }
    
    // Show player
    playerContainer.style.display = 'block';
    noVideoMsg.style.display = 'none';
    
    // Check for YouTube
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        // Extract YouTube video ID
        let videoId = '';
        if (link.includes('v=')) {
            videoId = link.split('v=')[1].split('&')[0];
        } else if (link.includes('youtu.be/')) {
            videoId = link.split('youtu.be/')[1].split('?')[0];
        }
        if (videoId) {
            videoPlayer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%;height:400px;border:none;border-radius:10px;" allowfullscreen></iframe>`;
            return;
        }
    }
    
    // Check for direct video file
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const isVideo = videoExtensions.some(ext => link.toLowerCase().includes(ext));
    
    if (isVideo) {
        videoPlayer.innerHTML = `<video controls style="width:100%;border-radius:10px;max-height:450px;background:#000;"><source src="${link}" type="video/mp4"></video>`;
        return;
    }
    
    // Try to embed any website
    videoPlayer.innerHTML = `<iframe src="${link}" style="width:100%;height:450px;border:none;border-radius:10px;"></iframe>`;
}
