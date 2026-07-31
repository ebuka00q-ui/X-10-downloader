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
