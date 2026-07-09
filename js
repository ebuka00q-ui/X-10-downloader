// script.js
const supabase = supabase.createClient(
    "https://gkfivuvtpfetzatz.supabase.co", 
    "sb_publishable_T2Sxps8oB5ilNda3IU1SZQ_1LLxmVSE"
);

const display = document.getElementById('content-display');

async function loadTab(tab) {
    if (tab === 'movie') {
        display.innerHTML = "Fetching...";
        const { data, error } = await supabase.from('videos').select('*');
        if (error) display.innerHTML = "Error: " + error.message;
        else display.innerHTML = data.length > 0 ? data.map(v => `<div class="card">${v.title}</div>`).join('') : "No videos.";
    } else {
        display.innerHTML = '<div class="card">No downloads yet.</div>';
    }
}

document.getElementById('movie-tab').onclick = () => loadTab('movie');
document.getElementById('download-tab').onclick = () => loadTab('download');
document.getElementById('search-btn').onclick = async () => {
    const query = document.getElementById('search-input').value;
    const { data } = await supabase.from('videos').select('*').ilike('title', `%${query}%`);
    display.innerHTML = data.length > 0 ? data.map(v => `<div class="card">${v.title}</div>`).join('') : "No results.";
};

loadTab('movie');
