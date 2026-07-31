// ===============================
// X-10 Downloader
// Main Application
// ===============================

// Change this to your Vercel domain
const API_BASE = window.location.origin + "/api";

const app = {
    currentPage: "home",
    favorites: [],
    history: [],
    notifications: []
};

// ===============================
// Initialize
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    initializeNavigation();

    initializeDrawer();

    initializeSearch();

    initializeAI();

    loadHome();

});

// ===============================
// Navigation
// ===============================

function initializeNavigation(){

    document.querySelectorAll(".navButton").forEach(button=>{

        button.addEventListener("click",()=>{

            document.querySelectorAll(".navButton")
            .forEach(btn=>btn.classList.remove("active"));

            button.classList.add("active");

            const page=button.dataset.page;

            switch(page){

                case "home":
                    loadHome();
                    break;

                case "sports":
                    loadSports();
                    break;

                case "favorites":
                    loadFavorites();
                    break;

                case "watch":
                    loadWatch();
                    break;

                case "account":
                    loadAccount();
                    break;

            }

        });

    });

}

// ===============================
// Drawer
// ===============================

function initializeDrawer(){

    const drawer=document.getElementById("sideDrawer");

    document.getElementById("menuButton")
    ?.addEventListener("click",()=>{

        drawer.classList.toggle("open");

    });

}

// ===============================
// Search
// ===============================

function initializeSearch(){

    document.getElementById("searchButton")
    ?.addEventListener("click",()=>{

        document.getElementById("searchOverlay")
        .classList.remove("hidden");

    });

    document.getElementById("closeSearch")
    ?.addEventListener("click",()=>{

        document.getElementById("searchOverlay")
        .classList.add("hidden");

    });

}

// ===============================
// AI Assistant
// ===============================

function initializeAI(){

    document.getElementById("quickAIButton")
    ?.addEventListener("click",()=>{

        document.getElementById("aiAssistant")
        .classList.remove("hidden");

    });

    document.getElementById("closeAI")
    ?.addEventListener("click",()=>{

        document.getElementById("aiAssistant")
        .classList.add("hidden");

    });

}

// ===============================
// API Helper
// ===============================

async function api(endpoint){

    const response=await fetch(API_BASE+endpoint);

    if(!response.ok){

        throw new Error("Network Error");

    }

    return response.json();

}
// ===============================
// Home
// ===============================

async function loadHome() {

    app.currentPage = "home";

    const container = document.getElementById("page-container");

    container.innerHTML = `
        <h2>Today's Matches</h2>
        <div id="todayMatches">
            <p>Loading matches...</p>
        </div>
    `;

    try {

        // This endpoint should exist in your Vercel backend.
        const data = await api("/matches/today");

        renderTodayMatches(data);

    } catch (err) {

        document.getElementById("todayMatches").innerHTML = `
            <p>Unable to load today's matches.</p>
        `;

        console.error(err);

    }

}

function renderTodayMatches(matches) {

    const container = document.getElementById("todayMatches");

    if (!matches || matches.length === 0) {

        container.innerHTML = `
            <p>No matches today.</p>
        `;

        return;

    }

    container.innerHTML = matches.map(match => `
        <div class="match-card" data-id="${match.idEvent}">

            <div class="team">
                <img src="${match.strHomeTeamBadge || ""}" alt="">
                <span>${match.strHomeTeam}</span>
            </div>

            <div class="match-time">
                ${match.strTime}
            </div>

            <div class="team">
                <img src="${match.strAwayTeamBadge || ""}" alt="">
                <span>${match.strAwayTeam}</span>
            </div>

        </div>
    `).join("");

}

// ===============================
// Sports
// ===============================

function loadSports() {

    app.currentPage = "sports";

    document.getElementById("page-container").innerHTML = `
        <h2>Sports</h2>
        <p>Sports page coming soon...</p>
    `;

}

// ===============================
// Favorites
// ===============================

async function loadFavorites() {

    app.currentPage = "favorites";

    const container = document.getElementById("page-container");

    container.innerHTML = `
        <h2>Favorites</h2>
        <p>Loading favorites...</p>
    `;

    try {

        const response = await fetch(API_BASE + "/favorites");

        const data = await response.json();

        if (!data.length) {

            container.innerHTML = `
                <h2>Favorites</h2>
                <p>No favorite matches yet.</p>
            `;

            return;

        }

        container.innerHTML = `
            <h2>Favorites</h2>
            ${data.map(match => `
                <div class="match-card">
                    <strong>${match.home}</strong>
                    vs
                    <strong>${match.away}</strong>
                </div>
            `).join("")}
        `;

    } catch {

        container.innerHTML = `
            <h2>Favorites</h2>
            <p>Unable to load favorites.</p>
        `;

    }

}

// ===============================
// Watch
// ===============================

function loadWatch() {

    app.currentPage = "watch";

    document.getElementById("page-container").innerHTML = `
        <h2>Watch</h2>
        <p>Live streams will appear here.</p>
    `;

}

// ===============================
// Account
// ===============================

function loadAccount() {

    app.currentPage = "account";

    document.getElementById("page-container").innerHTML = `
        <h2>Account</h2>
        <p>Your profile page.</p>
    `;

}
