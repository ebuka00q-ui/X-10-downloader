async function render(view) {
    const display = document.getElementById('content-display');
    display.innerHTML = "Loading...";

    if (view === 'movie') {
        try {
            const { data, error } = await supabase.from('videos').select('*');
            
            if (error) {
                // This will print the actual error on your screen
                display.innerHTML = "Error: " + error.message;
                console.error("Supabase Error:", error);
            } else if (data.length === 0) {
                display.innerHTML = "Table is empty.";
            } else {
                display.innerHTML = data.map(v => `<div class="card">${v.title}</div>`).join('');
            }
        } catch (e) {
            display.innerHTML = "Connection failed: " + e.message;
        }
    } else {
        display.innerHTML = '<div class="card">No downloads yet.</div>';
    }
}
