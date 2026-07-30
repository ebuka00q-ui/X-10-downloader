// =====================================
// X10 DOWNLOADER
// Version 2.0
// =====================================

// ---------- CONFIG ----------
const API = {

    football: "/api/football",

    footballData: "/api/football-data",

    sportsDB: "/api/sportsdb"

};

// ---------- APP STATE ----------

let matches = [];

let favoriteTeams = JSON.parse(
localStorage.getItem("favoriteTeams") || "[]"
);

let notifications = JSON.parse(
localStorage.getItem("notifications") || "{}"
);

let cache = {};

let currentPage = "homePage";

// ---------- START ----------

window.addEventListener("load", init);

async function init(){

    updateToday();

    setupNavigation();

    await loadMatches();

    renderFavorites();

}

// ---------- DATE ----------

function updateToday(){

    const d = new Date();

    document.getElementById("todayDate").innerText =
        d.toDateString();

}

// ---------- NAVIGATION ----------

function setupNavigation(){

    document.querySelectorAll(".nav").forEach(btn=>{

        btn.onclick=()=>{

            document.querySelectorAll(".nav")
            .forEach(n=>n.classList.remove("active"));

            btn.classList.add("active");

            document.querySelectorAll(".page")
            .forEach(p=>p.classList.remove("active"));

            document.getElementById(
                btn.dataset.page
            ).classList.add("active");

            currentPage=btn.dataset.page;

        };

    });

}

// ---------- LOAD MATCHES ----------

async function loadMatches(){

    try{

        const res=await fetch(API.football);

        matches=await res.json();

        renderMatches();

    }

    catch(e){

        console.log(e);

    }

}

// ---------- RENDER MATCHES ----------

function renderMatches(){

    const box=document.getElementById("todayMatches");

    box.innerHTML="";

    matches.forEach(match=>{

        const fav=favoriteTeams.includes(match.home.id)
        ||favoriteTeams.includes(match.away.id);

        box.innerHTML+=`

<div class="match-card">

<div class="match-header">

<span>${match.league}</span>

<span>${match.time}</span>

</div>

<div class="teams">

<div class="team">

<img src="${match.home.logo}">

<span>${match.home.name}</span>

</div>

<div class="score">

${match.score}

</div>

<div class="team">

<img src="${match.away.logo}">

<span>${match.away.name}</span>

</div>

</div>

<div class="match-footer">

<button

class="favorite-btn ${fav?"active":""}"

onclick="toggleFavorite('${match.home.id}','${match.away.id}')">

⭐ Favorite

</button>

<button

class="notify-btn"

onclick="openNotificationMenu('${match.id}')">

🔔 Notify

</button>

</div>

</div>

`;

    });

}
