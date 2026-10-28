/* =========================================================
   VIC-SOUND — APP.JS
   ========================================================= */

/* ==================== 01. MUSIC DATA ==================== */
const MUSIC=[
{id:1,title:"Lost in Thoughts",artist:"Jay Nova",album:"Lost in Thoughts",cat:["All","Calm","Moody","New"],duration:236,cover:"https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80",audio:""},
{id:2,title:"Better Days",artist:"Kendrick Vibes",album:"Better Days",cat:["All","Rap","Hip-Hop"],duration:218,cover:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=700&q=80",audio:""},
{id:3,title:"Neon Dreams",artist:"The Vibe Collective",album:"Neon Dreams",cat:["All","Pop","New"],duration:244,cover:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80",audio:""},
{id:4,title:"Midnight Call",artist:"Zara Lane",album:"Midnight Call",cat:["All","Love","Moody"],duration:207,cover:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=700&q=80",audio:""},
{id:5,title:"Real Ones",artist:"Teezy & Nova",album:"Real Ones",cat:["All","Rap","Trap"],duration:226,cover:"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=700&q=80",audio:""},
{id:6,title:"Sunset Vibes",artist:"The Weeknd",album:"Sunset Vibes",cat:["All","Pop","Love"],duration:228,cover:"https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=80",audio:""},
{id:7,title:"Calm Before Storm",artist:"SZA",album:"Calm Before Storm",cat:["All","Calm","Sad"],duration:241,cover:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",audio:""},
{id:8,title:"Midnight Drive",artist:"Frank Ocean",album:"Midnight Drive",cat:["All","Moody","Love"],duration:231,cover:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=700&q=80",audio:""}
];
const RELEASES=[
{id:101,title:"Neon Skies",type:"EP",date:"Apr 25, 2025",songs:5,cover:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",status:"Download"},
{id:102,title:"Soul Vibes",type:"Album",date:"Apr 20, 2025",songs:12,cover:"https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=80",status:"Downloading 6 of 12 (50%)"},
{id:103,title:"Trap Zone",type:"EP",date:"Apr 15, 2025",songs:7,cover:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80",status:"Download"},
{id:104,title:"Midnight Tales",type:"Album",date:"Apr 10, 2025",songs:15,cover:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",status:"Completed"}
];

/* ==================== 02. STATE ==================== */
const state={screen:"home",category:"All",query:"",current:0,playing:false,favorites:new Set(),repeat:false,shuffle:false,newRelease:true,notifications:true,player:false,queue:false,dj:false,timer:null};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$("#audio");

/* ==================== 03. HELPERS ==================== */
function song(){return MUSIC[state.current]||MUSIC[0]}
function time(v){v=Math.max(0,Math.floor(Number(v)||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,"0")}`}
function img(el,src,alt){if(el){el.src=src;el.alt=alt||""}}
function favorite(id){return state.favorites.has(id)}
function updateDots(){$("#latestDot").classList.toggle("show",state.newRelease);$("#navDot").classList.toggle("show",state.newRelease);$("#headerDot").classList.toggle("show",state.newRelease&&state.screen!=="latest")}

/* ==================== DYNAMIC MUSIC COUNT ==================== */
function updateOfflineCount(){
  const count=$("#offlineCount");
  if(!count)return;

  const total=MUSIC.length;
  count.textContent=`${total} ${total===1?"song":"songs"}`;
}

function closePopups(){$("#notificationPopover").classList.add("hidden");$("#timerSheet").classList.remove("open")}

/* ==================== 04. RENDER HOME ==================== */
function filtered(){
 let q=state.query.trim().toLowerCase();
 return MUSIC.filter(s=>(state.category==="All"||s.cat.includes(state.category))&&(!q||s.title.toLowerCase().includes(q)||s.artist.toLowerCase().includes(q)||s.album.toLowerCase().includes(q)));
}
function renderHome(){
 const list=filtered(), box=$("#homeMusicList");
 if(!list.length){box.innerHTML='<div class="empty-state"><b>No music found</b><span>Try another search or category.</span></div>';return}
 box.innerHTML=list.map(s=>{let i=MUSIC.indexOf(s),p=state.playing&&i===state.current;return `<article class="music-row ${p?"playing":""}"><button class="music-main" data-play="${i}"><img class="cover" src="${s.cover}" alt="${s.title}"></button><button class="music-main" data-play="${i}"><b>${s.title}</b><small>${s.artist}</small></button><span class="playing-bars">▮▮▮</span><button class="favorite-toggle ${favorite(s.id)?"active":""}" data-fav="${s.id}">${favorite(s.id)?"♥":"♡"}</button><button class="row-more" data-menu="${s.id}">⋮</button></article>`}).join("");
}

/* ==================== 05. RENDER FAVORITES ==================== */
function renderFavorites(){
 const list=MUSIC.filter(s=>favorite(s.id));$("#favoriteCount").textContent=`${list.length} ${list.length===1?"song":"songs"}`;
 if(!list.length){$("#favoriteGrid").innerHTML='<div class="empty-state"><b>No favorites yet</b><span>Tap the heart on a song to keep it here.</span></div>';return}
 $("#favoriteGrid").innerHTML=list.map(s=>`<article class="favorite-card"><button class="favorite-card-open" data-play-id="${s.id}"><img src="${s.cover}" alt="${s.title}"></button><div class="favorite-card-info"><button class="favorite-card-open" data-play-id="${s.id}"><b>${s.title}</b><small>${s.artist}</small></button><button class="favorite-card-more" data-menu="${s.id}">⋮</button></div></article>`).join("");
}

/* ==================== 06. RENDER LATEST ==================== */
function renderLatest(){
 $("#latestList").innerHTML=RELEASES.map(r=>`<article class="release-card"><img class="release-cover" src="${r.cover}" alt="${r.title}"><div class="release-info"><h3>${r.title}</h3><p>${r.type}</p><p>▣ ${r.date}</p><p>♫ ${r.songs} songs</p><button class="release-action">${r.status==="Completed"?"✓ Completed":"⇩ "+r.status}</button></div><span>›</span></article>`).join("");
}

/* ==================== 07. NAVIGATION ==================== */
function go(screen){
 state.screen=screen;$("#homeScreen").classList.toggle("active",screen==="home");$("#favoritesScreen").classList.toggle("active",screen==="favorites");$("#latestScreen").classList.toggle("active",screen==="latest");
 $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.screen===screen));$("#searchToggle").style.visibility=screen==="home"?"visible":"hidden";
 if(screen==="latest"){state.newRelease=false;updateDots()}
 renderHome();renderFavorites();renderLatest();
}

/* ==================== 08. SEARCH ==================== */
function openSearch(){if(state.screen!=="home")return;$("#searchPanel").classList.add("open");$("#searchPanel").setAttribute("aria-hidden","false");setTimeout(()=>$("#searchInput").focus(),40)}
function closeSearch(){state.query="";$("#searchInput").value="";$("#searchPanel").classList.remove("open");$("#searchPanel").setAttribute("aria-hidden","true");renderHome()}

/* ==================== 09. PLAYER ==================== */
function load(index,play=true){
 if(!MUSIC[index])return;state.current=index;let s=song();
 $("#playerTitle").textContent=s.title;$("#playerArtist").textContent=s.artist;img($("#playerCover"),s.cover,s.title);img($("#miniCover"),s.cover,s.title);$("#miniTitle").textContent=s.title;$("#miniArtist").textContent=s.artist;img($("#queueCover"),s.cover,s.title);$("#queueTitle").textContent=s.title;$("#queueArtist").textContent=s.artist;
 if(s.audio){if(audio.src!==s.audio)audio.src=s.audio}else{audio.removeAttribute("src");audio.load()}
 renderHome();renderQueue();updatePlayer();if(play)start();
}
function start(){state.playing=true;$("#miniPlayer").classList.add("visible");$("#miniPlayer").setAttribute("aria-hidden","false");if(song().audio)audio.play().catch(()=>{});updatePlayer();renderHome()}
function pause(){state.playing=false;audio.pause();updatePlayer();renderHome()}
function toggle(){state.playing?pause():start()}
function updatePlayer(){let s=song();$("#playPause").textContent=state.playing?"Ⅱ":"▶";$("#miniPlay").textContent=state.playing?"Ⅱ":"▶";$("#playerFav").textContent=favorite(s.id)?"♥":"♡";$("#playerFav").classList.toggle("active",favorite(s.id));$("#playerOverlay").classList.toggle("playing",state.playing);$("#currentTime").textContent=time(audio.currentTime);$("#duration").textContent=time(audio.duration||s.duration);$("#progress").value=audio.duration?(audio.currentTime/audio.duration)*100:0}
function openPlayer(){$("#playerOverlay").classList.add("open");state.player=true;updatePlayer()}
function closePlayer(){$("#playerOverlay").classList.remove("open");state.player=false}
function next(){state.current=state.shuffle?Math.floor(Math.random()*MUSIC.length):(state.current+1)%MUSIC.length;load(state.current,true)}
function prev(){if(audio.currentTime>4){audio.currentTime=0;updatePlayer();return}state.current=(state.current-1+MUSIC.length)%MUSIC.length;load(state.current,true)}

/* ==================== 10. QUEUE + MULTI-TAP ==================== */
let taps=0,tapTimer=null;
function queueTap(index){
 taps++;clearTimeout(tapTimer);
 tapTimer=setTimeout(()=>{let count=Math.min(taps,10);load(index,true);if(count>1){MUSIC[index].repeatCount=count;renderQueue()}taps=0},330);
}
function openQueue(){$("#queueOverlay").classList.add("open");state.queue=true;renderQueue()}
function closeQueue(){$("#queueOverlay").classList.remove("open");state.queue=false}
function renderQueue(){
 $("#queueCount").textContent=`${MUSIC.length} songs`;let s=song();$("#queueTitle").textContent=s.title;$("#queueArtist").textContent=s.artist;img($("#queueCover"),s.cover,s.title);
 $("#queueList").innerHTML=MUSIC.map((x,i)=>{let repeat=x.repeatCount>1?`<span class="repeat-badge">x${x.repeatCount}</span>`:"<span></span>";return `<article class="queue-row ${i===state.current?"current":""}"><span class="queue-num">${i+1}</span><img src="${x.cover}" alt="${x.title}"><button class="queue-song" data-queue="${i}"><b>${x.title}</b><small>${x.artist}</small></button>${repeat}<button class="favorite-toggle ${favorite(x.id)?"active":""}" data-fav="${x.id}">${favorite(x.id)?"♥":"♡"}</button><button class="row-more">☰</button></article>`}).join("");
}

/* ==================== 11. FAVORITES ==================== */
function toggleFavorite(id){state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);renderHome();renderFavorites();renderQueue();updatePlayer()}

/* ==================== 12. TIMER ==================== */
let timerId=null;
function openTimer(){$("#timerSheet").classList.add("open")}
function closeTimer(){$("#timerSheet").classList.remove("open")}
function setTimer(min){clearTimeout(timerId);state.timer=min;timerId=setTimeout(()=>{pause();state.timer=null;closeTimer()},min*60000);closeTimer()}
function offTimer(){clearTimeout(timerId);timerId=null;state.timer=null;closeTimer()}

/* ==================== 13. DJ ==================== */
let recognition=null,voiceTimer=null;
function openDJ(){$("#djOverlay").classList.add("open");state.dj=true}
function closeDJ(){stopVoice();$("#djOverlay").classList.remove("open");state.dj=false}
function speak(text){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.rate=1;window.speechSynthesis.speak(u)}
function command(text){text=text.trim();if(!text)return;$("#djReply").textContent=`I heard: "${text}"`;let q=text.toLowerCase(),reply="Got it. I understand what you want.";if(q.includes("calm")||q.includes("chill"))reply="Okay. I will prepare a calm, chill vibe for you.";else if(q.includes("sad")||q.includes("moody"))reply="Okay. I will prepare a sad and moody vibe for you.";else if(q.includes("party"))reply="Okay. I will prepare a party vibe for you.";else if(q.includes("rap")||q.includes("hip hop"))reply="Okay. I will prepare a rap and hip-hop vibe for you.";setTimeout(()=>{$("#djReply").textContent=reply;speak(reply)},200)}
function setupVoice(){let SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;recognition=new SR();recognition.lang="en-US";recognition.continuous=true;recognition.interimResults=true;recognition.onstart=()=>{state.djListening=true;$("#djMic").classList.add("listening");$("#djOverlay").classList.add("listening")};recognition.onresult=e=>{let text="";for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;$("#djInput").value=text};recognition.onend=()=>stopVoice();recognition.onerror=()=>stopVoice()}
function startVoice(){if(!recognition){$("#djReply").textContent="Voice typing is not supported here. Tap the text field and type instead.";return}if(state.djListening)return;try{recognition.start()}catch(e){}clearTimeout(voiceTimer);voiceTimer=setTimeout(()=>{stopVoice();command($("#djInput").value)},30000)}
function stopVoice(){clearTimeout(voiceTimer);voiceTimer=null;if(recognition&&state.djListening){try{recognition.stop()}catch(e){}}state.djListening=false;$("#djMic").classList.remove("listening");$("#djOverlay").classList.remove("listening")}

/* ==================== 14. BACK BUTTON ==================== */
function exitPrompt(){$("#exitModal").classList.remove("hidden")}
function closeExit(){$("#exitModal").classList.add("hidden")}
function back(){
 if(!$("#exitModal").classList.contains("hidden")){closeExit();return}
 if(!$("#notificationPopover").classList.contains("hidden")){$("#notificationPopover").classList.add("hidden");return}
 if($("#timerSheet").classList.contains("open")){closeTimer();return}
 if($("#searchPanel").classList.contains("open")){closeSearch();return}
 if($("#djOverlay").classList.contains("open")){closeDJ();return}
 if($("#queueOverlay").classList.contains("open")){closeQueue();return}
 if($("#playerOverlay").classList.contains("open")){closePlayer();return}
 if(state.screen!=="home"){go("home");return}
 exitPrompt();
}
/* The two history entries stop the browser/PWA from immediately leaving. */
history.replaceState({vicSound:true},"",location.href);history.pushState({vicSound:true},"",location.href);
window.addEventListener("popstate",()=>{history.pushState({vicSound:true},"",location.href);back()});

/* ==================== 15. EVENTS ==================== */
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.screen)));
$("#searchToggle").addEventListener("click",openSearch);$("#searchClose").addEventListener("click",closeSearch);$("#searchInput").addEventListener("input",e=>{state.query=e.target.value;renderHome()});
$("#categoryRow").addEventListener("click",e=>{let b=e.target.closest('[data-category]');if(!b)return;state.category=b.dataset.category;$$('.category').forEach(x=>x.classList.toggle('active',x===b));renderHome()});
$("#homeMusicList").addEventListener("click",e=>{let f=e.target.closest('[data-fav]');if(f){toggleFavorite(Number(f.dataset.fav));return}let p=e.target.closest('[data-play]');if(p){load(Number(p.dataset.play),true);return}});
$("#favoriteGrid").addEventListener("click",e=>{let p=e.target.closest('[data-play-id]');if(p){let i=MUSIC.findIndex(s=>s.id===Number(p.dataset.playId));if(i>=0)load(i,true)}});
$("#latestBell").addEventListener("click",e=>{e.stopPropagation();if(state.screen!=="latest")return;$("#notificationPopover").classList.remove("hidden")});$("#notificationSwitch").addEventListener("change",e=>{state.notifications=e.target.checked;try{localStorage.setItem('vicSoundNotifications',String(state.notifications))}catch(_){} });
document.addEventListener("click",e=>{let pop=$("#notificationPopover");if(!pop.classList.contains("hidden")&&!pop.contains(e.target)&&e.target!==$("#latestBell"))pop.classList.add("hidden")});
$("#miniOpen").addEventListener("click",openPlayer);$("#miniPlay").addEventListener("click",toggle);$("#miniPrev").addEventListener("click",prev);$("#miniNext").addEventListener("click",next);
$("#playerBack").addEventListener("click",back);$("#playPause").addEventListener("click",toggle);$("#prev").addEventListener("click",prev);$("#next").addEventListener("click",next);$("#openQueueFromPlayer").addEventListener("click",openQueue);$("#playerFav").addEventListener("click",()=>toggleFavorite(song().id));
$("#shuffle").addEventListener("click",()=>{state.shuffle=!state.shuffle;$("#shuffle").classList.toggle('active',state.shuffle)});$("#repeat").addEventListener("click",()=>{state.repeat=!state.repeat;$("#repeat").classList.toggle('active',state.repeat)});$("#playerRepeatTop").addEventListener("click",()=>{state.repeat=!state.repeat;$("#playerRepeatTop").classList.toggle('active',state.repeat)});
$("#progress").addEventListener("input",e=>{if(audio.duration)audio.currentTime=(Number(e.target.value)/100)*audio.duration;updatePlayer()});
$("#queueBack").addEventListener("click",back);$("#queueClose").addEventListener("click",closeQueue);$("#queueTimer").addEventListener("click",openTimer);$("#queueFav").addEventListener("click",()=>toggleFavorite(song().id));$("#queueList").addEventListener("click",e=>{let f=e.target.closest('[data-fav]');if(f){toggleFavorite(Number(f.dataset.fav));return}let q=e.target.closest('[data-queue]');if(q)queueTap(Number(q.dataset.queue))});
$$('.timer-options button').forEach(b=>b.addEventListener('click',()=>setTimer(Number(b.dataset.min))));$("#endTrack").addEventListener("click",closeTimer);$("#timerOff").addEventListener("click",offTimer);
$("#favoriteDjCover").addEventListener("click",openDJ);$("#favoriteDjPlay").addEventListener("click",()=>load(0,true));$("#djBack").addEventListener("click",back);$("#djSend").addEventListener("click",()=>{let t=$("#djInput").value;$("#djInput").value="";command(t)});
$("#djInput").addEventListener("click",()=>$("#djInput").focus());$("#djMic").addEventListener("pointerdown",e=>{e.preventDefault();startVoice()});$("#djMic").addEventListener("pointerup",()=>{if(state.djListening){stopVoice();command($("#djInput").value)}});$("#djMic").addEventListener("pointercancel",stopVoice);
$("#cancelExit").addEventListener("click",closeExit);$("#confirmExit").addEventListener("click",()=>{try{window.close()}catch(e){} });$("#exitModal").addEventListener("click",e=>{if(e.target===$("#exitModal"))closeExit()});

/* ==================== 16. AUDIO ==================== */
audio.addEventListener("play",()=>{state.playing=true;$("#miniPlayer").classList.add("visible");updatePlayer();renderHome()});audio.addEventListener("pause",()=>{state.playing=false;updatePlayer();renderHome()});audio.addEventListener("timeupdate",updatePlayer);audio.addEventListener("loadedmetadata",updatePlayer);audio.addEventListener("ended",()=>{let s=song();if(s.repeatCount>1){s.repeatCount--;if(s.audio){audio.currentTime=0;start()}renderQueue();return}if(state.repeat){if(s.audio){audio.currentTime=0;start()}return}next()});

/* ==================== 17. BACKEND CONNECTION POINTS ==================== */
window.VicSoundBackend={
 async loadSongs(){return MUSIC},
 async saveFavorite(songId,isFavorite){console.log('Vic-sound backend favorite:',songId,isFavorite);return{success:true}},
 async sendDJCommand(text){console.log('Vic-sound backend DJ:',text);return{success:true,text}},
 async getLatestReleases(){return RELEASES}
};

/* ==================== 18. START ==================== */
function init(){try{let n=localStorage.getItem('vicSoundNotifications');if(n!==null){state.notifications=n==='true';$("#notificationSwitch").checked=state.notifications}}catch(e){}setupVoice();go('home');load(0,false);state.playing=false;updatePlayer();updateDots();updateOfflineCount()}
init()
