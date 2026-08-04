/**
 * ============================================================
 * X-10 DOWNLOADER — COMPLETE JAVASCRIPT
 * Parts 1–8
 * Production Ready
 * ============================================================
 */

(function() {
  'use strict';

  // ============================================================
  // PART 1 — APPLICATION INITIALIZATION, NAVIGATION & CORE FRAMEWORK
  // ============================================================

  const App = {
    // ----- Global State -----
    state: {
      currentPage: 'home',
      previousPage: null,
      theme: 'dark',
      isOnline: navigator.onLine,
      isAIButtonVisible: true,
      isSidebarOpen: false,
      isSearchOpen: false,
      isInitialized: false,
      isAppInstalled: false,
      updateAvailable: false,
    },

    // ----- DOM Cache -----
    dom: {},

    // ----- Config -----
    config: {
      debug: false,
      refreshIntervals: {
        live: 20000,        // 20 seconds
        upcoming: 300000,   // 5 minutes
        tables: 1800000,    // 30 minutes
        images: 86400000,   // 24 hours
      },
    },

    // ----- Init -----
    init: function() {
      if (this.state.isInitialized) return;
      this.state.isInitialized = true;

      this.cacheDom();
      this.bindEvents();
      this.handleHash();
      this.detectOnlineStatus();
      this.prepareTheme();
      this.setupPWA();

      if (this.config.debug) console.log('🚀 X-10 Downloader initialized');

      window.addEventListener('hashchange', () => this.handleHash());
    },

    // ----- Cache DOM -----
    cacheDom: function() {
      this.dom = {
        body: document.body,
        main: document.getElementById('main-content'),
        header: document.getElementById('global-header'),
        bottomTabs: document.getElementById('bottom-tabs'),
        drawer: document.getElementById('side-drawer'),
        drawerOverlay: document.getElementById('drawer-overlay'),
        searchOverlay: document.getElementById('search-overlay'),
        aiButton: document.getElementById('quick-ai-trigger'),
        menuToggle: document.getElementById('menu-toggle'),
        drawerClose: document.getElementById('drawer-close'),
        searchClose: document.getElementById('search-close'),
        searchInput: document.getElementById('search-input'),
        searchForm: document.getElementById('search-form'),
        searchClear: document.getElementById('search-clear'),
        tabs: document.querySelectorAll('#bottom-tabs .tab-item'),
        pages: {
          home: document.getElementById('section-home'),
          sports: document.getElementById('section-sports'),
          favorites: document.getElementById('section-favorites'),
          watch: document.getElementById('section-watch'),
          account: document.getElementById('section-account'),
        },
      };

      // Ensure all critical elements exist
      Object.keys(this.dom).forEach(key => {
        if (!this.dom[key] && key !== 'drawerOverlay') {
          if (this.config.debug) console.warn(`⚠️ DOM element not found: ${key}`);
        }
      });
    },

    // ----- Bind Events -----
    bindEvents: function() {
      // Bottom navigation
      this.dom.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const page = tab.dataset.tab;
          if (page) this.navigateTo(page);
        });
      });

      // Menu toggle
      if (this.dom.menuToggle) {
        this.dom.menuToggle.addEventListener('click', () => this.toggleSidebar());
      }

      // Drawer close
      if (this.dom.drawerClose) {
        this.dom.drawerClose.addEventListener('click', () => this.closeSidebar());
      }

      // Close drawer on overlay click
      if (this.dom.drawerOverlay) {
        this.dom.drawerOverlay.addEventListener('click', () => this.closeSidebar());
      }

      // Search
      const searchBtn = document.getElementById('search-global');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => this.openSearch());
      }

      if (this.dom.searchClose) {
        this.dom.searchClose.addEventListener('click', () => this.closeSearch());
      }

      if (this.dom.searchForm) {
        this.dom.searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSearch();
        });
      }

      if (this.dom.searchClear) {
        this.dom.searchClear.addEventListener('click', () => {
          if (this.dom.searchInput) {
            this.dom.searchInput.value = '';
            this.dom.searchInput.focus();
          }
        });
      }

      // AI button
      if (this.dom.aiButton) {
        this.dom.aiButton.addEventListener('click', () => {
          this.navigateTo('account');
          // AI panel will be opened by Account module
          document.dispatchEvent(new CustomEvent('x10:openAI'));
        });
      }

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.state.isSearchOpen) this.closeSearch();
          if (this.state.isSidebarOpen) this.closeSidebar();
        }
      });

      // Visibility change
      document.addEventListener('visibilitychange', () => {
        const isVisible = document.visibilityState === 'visible';
        document.dispatchEvent(new CustomEvent('x10:visibilityChange', {
          detail: { isVisible }
        }));
      });

      // Theme events
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.state.theme === 'system') {
          this.applyTheme('system');
        }
      });
    },

    // ----- Navigation -----
    navigateTo: function(page) {
      const validPages = ['home', 'sports', 'favorites', 'watch', 'account'];
      if (!validPages.includes(page)) {
        if (this.config.debug) console.warn(`⚠️ Invalid page: ${page}`);
        return;
      }

      if (this.state.currentPage === page) return;

      this.state.previousPage = this.state.currentPage;
      this.state.currentPage = page;

      // Update hash
      if (window.location.hash !== `#${page}`) {
        window.location.hash = page;
      }

      this.renderPage(page);
      this.updateTabs(page);
      this.updateAIButtonVisibility(page);
      this.scrollToTop();

      document.dispatchEvent(new CustomEvent('x10:pageChange', {
        detail: { page, previous: this.state.previousPage }
      }));

      if (this.config.debug) console.log(`📄 Navigated to: ${page}`);
    },

    renderPage: function(page) {
      // Hide all pages
      Object.values(this.dom.pages).forEach(el => {
        if (el) el.style.display = 'none';
      });

      // Show target page
      const target = this.dom.pages[page];
      if (target) {
        target.style.display = 'block';
        target.style.animation = 'fadeSlideUp 0.3s ease';
      }

      // Show/hide AI button based on page
      this.updateAIButtonVisibility(page);
    },

    updateTabs: function(page) {
      this.dom.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === page);
      });
    },

    updateAIButtonVisibility: function(page) {
      const visibleOn = ['home', 'sports', 'favorites'];
      const shouldShow = visibleOn.includes(page);

      this.state.isAIButtonVisible = shouldShow;
      if (this.dom.aiButton) {
        this.dom.aiButton.style.display = shouldShow ? 'flex' : 'none';
      }
    },

    scrollToTop: function() {
      if (this.dom.main) {
        this.dom.main.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ----- Hash Routing -----
    handleHash: function() {
      const hash = window.location.hash.replace('#', '') || 'home';
      const validPages = ['home', 'sports', 'favorites', 'watch', 'account'];
      if (validPages.includes(hash)) {
        this.navigateTo(hash);
      } else {
        this.navigateTo('home');
      }
    },

    // ----- Sidebar -----
    toggleSidebar: function() {
      this.state.isSidebarOpen ? this.closeSidebar() : this.openSidebar();
    },

    openSidebar: function() {
      this.state.isSidebarOpen = true;
      if (this.dom.drawer) this.dom.drawer.classList.add('open');
      if (this.dom.drawerOverlay) this.dom.drawerOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    closeSidebar: function() {
      this.state.isSidebarOpen = false;
      if (this.dom.drawer) this.dom.drawer.classList.remove('open');
      if (this.dom.drawerOverlay) this.dom.drawerOverlay.classList.remove('open');
      document.body.style.overflow = '';
    },

    // ----- Search -----
    openSearch: function() {
      this.state.isSearchOpen = true;
      if (this.dom.searchOverlay) {
        this.dom.searchOverlay.classList.add('open');
      }
      if (this.dom.searchInput) {
        setTimeout(() => this.dom.searchInput.focus(), 100);
      }
      document.body.style.overflow = 'hidden';
    },

    closeSearch: function() {
      this.state.isSearchOpen = false;
      if (this.dom.searchOverlay) {
        this.dom.searchOverlay.classList.remove('open');
      }
      document.body.style.overflow = '';
      if (this.dom.searchInput) {
        this.dom.searchInput.value = '';
      }
    },

    handleSearch: function() {
      const query = this.dom.searchInput ? this.dom.searchInput.value.trim() : '';
      if (!query) return;

      if (this.config.debug) console.log(`🔍 Search: "${query}"`);
      document.dispatchEvent(new CustomEvent('x10:search', { detail: { query } }));
      this.closeSearch();
    },

    // ----- Online/Offline -----
    detectOnlineStatus: function() {
      window.addEventListener('online', () => {
        this.state.isOnline = true;
        document.dispatchEvent(new CustomEvent('x10:online'));
        if (this.config.debug) console.log('🌐 Online');
      });

      window.addEventListener('offline', () => {
        this.state.isOnline = false;
        document.dispatchEvent(new CustomEvent('x10:offline'));
        if (this.config.debug) console.log('📡 Offline');
      });
    },

    // ----- Theme -----
    prepareTheme: function() {
      const savedTheme = localStorage.getItem('x10-theme') || 'system';
      this.state.theme = savedTheme;
      this.applyTheme(savedTheme);

      // Listen for theme changes from other modules
      document.addEventListener('x10:themeChange', (e) => {
        if (e.detail && e.detail.theme) {
          this.state.theme = e.detail.theme;
          this.applyTheme(e.detail.theme);
          localStorage.setItem('x10-theme', e.detail.theme);
        }
      });
    },

    applyTheme: function(theme) {
      const root = document.documentElement;

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.removeAttribute('data-theme');
        root.style.colorScheme = prefersDark ? 'dark' : 'light';
        return;
      }

      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    },

    // ----- PWA -----
    setupPWA: function() {
      // Service Worker registration
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            if (this.config.debug) console.log('📦 Service Worker registered');

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  this.state.updateAvailable = true;
                  document.dispatchEvent(new CustomEvent('x10:updateAvailable'));
                  if (this.config.debug) console.log('🔄 Update available');
                }
              });
            });
          })
          .catch((err) => {
            if (this.config.debug) console.warn('⚠️ Service Worker registration failed:', err);
          });
      }

      // Install prompt
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.dispatchEvent(new CustomEvent('x10:installAvailable'));
        if (this.config.debug) console.log('📲 Install prompt available');
      });

      // App installed detection
      window.addEventListener('appinstalled', () => {
        this.state.isAppInstalled = true;
        document.dispatchEvent(new CustomEvent('x10:appInstalled'));
        if (this.config.debug) console.log('✅ App installed');
      });

      // Standalone mode detection
      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.state.isAppInstalled = true;
      }
    },

    // ----- Public API -----
    getState: function() {
      return { ...this.state };
    },

    getConfig: function() {
      return { ...this.config };
    },
  };
 // ============================================================
  // PART 2 — HOME PAGE MODULE
  // ============================================================

  const Home = {
    dom: {},
    state: {
      isLoaded: false,
      refreshTimer: null,
      isActive: true,
      featuredMatch: null,
      liveMatches: [],
      upcomingMatches: [],
      finishedMatches: [],
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.setupRefresh();
      this.renderWelcome();
      this.renderFeatured();
      this.renderLiveMatches();
      this.renderUpcomingMatches();
      this.renderFinishedMatches();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('🏠 Home module initialized');
    },

    cacheDom: function() {
      const section = document.getElementById('section-home');
      if (!section) return;

      this.dom = {
        section: section,
        welcome: section.querySelector('#home-welcome'),
        featured: section.querySelector('#featured-match'),
        liveList: section.querySelector('#live-matches-list'),
        upcomingList: section.querySelector('#upcoming-matches-list'),
        finishedList: section.querySelector('#finished-matches-list'),
        skeleton: section.querySelector('#home-skeleton'),
        emptyState: section.querySelector('#home-empty-state'),
        refreshIndicator: section.querySelector('#home-refresh-indicator'),
        lastUpdated: section.querySelector('#home-last-updated'),
      };
    },

    bindEvents: function() {
      // Page change events
      document.addEventListener('x10:pageChange', (e) => {
        this.state.isActive = e.detail.page === 'home';
        if (this.state.isActive) {
          this.resumeRefresh();
        } else {
          this.pauseRefresh();
        }
      });

      // Visibility change
      document.addEventListener('x10:visibilityChange', (e) => {
        if (!this.state.isActive) return;
        if (e.detail.isVisible) {
          this.resumeRefresh();
        } else {
          this.pauseRefresh();
        }
      });

      // Quick action buttons
      const quickActions = this.dom.section?.querySelectorAll('.quick-item');
      if (quickActions) {
        quickActions.forEach(btn => {
          btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if (target) App.navigateTo(target);
          });
        });
      }
    },

    setupRefresh: function() {
      this.startRefresh();
    },

    startRefresh: function() {
      if (this.state.refreshTimer) return;

      this.state.refreshTimer = setInterval(() => {
        if (this.state.isActive && App.state.isOnline) {
          this.refreshData();
        }
      }, App.config.refreshIntervals.live);

      if (App.config.debug) console.log('🔄 Home refresh started');
    },

    pauseRefresh: function() {
      if (this.state.refreshTimer) {
        clearInterval(this.state.refreshTimer);
        this.state.refreshTimer = null;
        if (App.config.debug) console.log('⏸️ Home refresh paused');
      }
    },

    resumeRefresh: function() {
      if (!this.state.refreshTimer) {
        this.startRefresh();
        if (App.config.debug) console.log('▶️ Home refresh resumed');
      }
    },

    refreshData: function() {
      if (App.config.debug) console.log('🔄 Home refresh triggered');
      this.updateLastUpdated();
      // Future: fetch live data from backend
    },

    updateLastUpdated: function() {
      const now = new Date();
      const time = now.toLocaleTimeString();
      if (this.dom.lastUpdated) {
        this.dom.lastUpdated.textContent = `Last updated: ${time}`;
      }
    },

    renderWelcome: function() {
      if (!this.dom.welcome) return;

      const now = new Date();
      const greeting = this.getGreeting();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      this.dom.welcome.innerHTML = `
        <div class="greeting">${greeting}</div>
        <div class="date">${dateStr}</div>
        <div class="featured-competition">🏆 Premier League • Matchday 38</div>
      `;
    },

    getGreeting: function() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning ☀️';
      if (hour < 17) return 'Good Afternoon 🌤️';
      if (hour < 21) return 'Good Evening 🌅';
      return 'Good Night 🌙';
    },

    renderFeatured: function() {
      if (!this.dom.featured) return;

      // Placeholder featured match
      this.dom.featured.innerHTML = `
        <div class="competition-info">
          <img src="#" alt="Premier League" class="competition-logo" />
          <span>Premier League • Matchday 38</span>
        </div>
        <div class="teams">
          <div class="team">
            <img src="#" alt="Liverpool" class="badge" />
            <span class="name">Liverpool</span>
          </div>
          <div class="score">2 - 1</div>
          <div class="team">
            <img src="#" alt="Arsenal" class="badge" />
            <span class="name">Arsenal</span>
          </div>
        </div>
        <div class="match-meta">
          <span class="live-badge">● LIVE</span>
          <span>67'</span>
          <span>Anfield</span>
          <span>Ref: M. Oliver</span>
        </div>
        <div class="match-actions">
          <button class="btn btn-primary watch-btn">▶ Watch</button>
          <button class="btn btn-secondary stats-btn">📊 Stats</button>
          <button class="btn btn-secondary lineup-btn">📋 Lineups</button>
          <button class="btn btn-secondary favorite-btn">⭐</button>
        </div>
      `;

      // Bind actions
      const watchBtn = this.dom.featured.querySelector('.watch-btn');
      if (watchBtn) {
        watchBtn.addEventListener('click', () => App.navigateTo('watch'));
      }
    },

    renderLiveMatches: function() {
      if (!this.dom.liveList) return;

      // Placeholder live matches
      const matches = [
        { home: 'Chelsea', away: 'Tottenham', score: '1 - 0', minute: '32' },
        { home: 'Bayern', away: 'Dortmund', score: '2 - 2', minute: '78' },
      ];

      this.dom.liveList.innerHTML = matches.map(m => `
        <article class="match-card live-card">
          <div class="competition-info">
            <img src="#" alt="Premier League" class="competition-logo" />
            <span>Premier League</span>
          </div>
          <div class="teams">
            <div class="team">
              <img src="#" alt="${m.home}" class="badge" />
              <span class="name">${m.home}</span>
            </div>
            <div class="score">${m.score}</div>
            <div class="team">
              <img src="#" alt="${m.away}" class="badge" />
              <span class="name">${m.away}</span>
            </div>
          </div>
          <div class="match-meta">
            <span class="live-badge">● LIVE</span>
            <span class="minute">${m.minute}'</span>
          </div>
          <div class="match-actions">
            <button class="watch-btn">▶</button>
            <button class="stats-btn">📊</button>
            <button class="lineup-btn">📋</button>
            <button class="favorite-btn">⭐</button>
          </div>
        </article>
      `).join('');
    },

    renderUpcomingMatches: function() {
      if (!this.dom.upcomingList) return;

      // Placeholder upcoming matches
      const matches = [
        { home: 'Barcelona', away: 'Real Madrid', time: '21:00', date: 'Tomorrow' },
        { home: 'AC Milan', away: 'Inter', time: '20:45', date: 'Tomorrow' },
      ];

      this.dom.upcomingList.innerHTML = matches.map(m => `
        <article class="match-card upcoming-card">
          <div class="competition-info">
            <img src="#" alt="La Liga" class="competition-logo" />
            <span>La Liga</span>
          </div>
          <div class="teams">
            <div class="team">
              <img src="#" alt="${m.home}" class="badge" />
              <span class="name">${m.home}</span>
            </div>
            <div class="score">vs</div>
            <div class="team">
              <img src="#" alt="${m.away}" class="badge" />
              <span class="name">${m.away}</span>
            </div>
          </div>
          <div class="match-meta">
            <span>${m.date} • ${m.time}</span>
          </div>
          <div class="match-actions">
            <button class="notify-btn">🔔</button>
            <button class="favorite-btn">⭐</button>
          </div>
        </article>
      `).join('');
    },

    renderFinishedMatches: function() {
      if (!this.dom.finishedList) return;

      // Placeholder finished matches
      const matches = [
        { home: 'Manchester City', away: 'Arsenal', score: '3 - 1' },
        { home: 'Liverpool', away: 'Everton', score: '2 - 0' },
      ];

      this.dom.finishedList.innerHTML = matches.map(m => `
        <article class="match-card finished-card">
          <div class="competition-info">
            <img src="#" alt="Premier League" class="competition-logo" />
            <span>Premier League</span>
          </div>
          <div class="teams">
            <div class="team">
              <img src="#" alt="${m.home}" class="badge" />
              <span class="name">${m.home}</span>
            </div>
            <div class="score">${m.score}</div>
            <div class="team">
              <img src="#" alt="${m.away}" class="badge" />
              <span class="name">${m.away}</span>
            </div>
          </div>
          <div class="match-meta">
            <span>✅ Full Time</span>
          </div>
          <div class="match-actions">
            <button class="stats-btn">📊</button>
            <button class="lineup-btn">📋</button>
          </div>
        </article>
      `).join('');
    },

    showLoading: function() {
      if (this.dom.skeleton) {
        this.dom.skeleton.style.display = 'block';
      }
    },

    hideLoading: function() {
      if (this.dom.skeleton) {
        this.dom.skeleton.style.display = 'none';
      }
    },

    showEmpty: function() {
      if (this.dom.emptyState) {
        this.dom.emptyState.style.display = 'flex';
      }
    },

    hideEmpty: function() {
      if (this.dom.emptyState) {
        this.dom.emptyState.style.display = 'none';
      }
    },

    // Public API
    refresh: function() {
      this.refreshData();
    },

    destroy: function() {
      this.pauseRefresh();
      this.state.isLoaded = false;
      if (App.config.debug) console.log('🏠 Home module destroyed');
    },
  };
// ============================================================
  // PART 3 — SPORTS MODULE
  // ============================================================

  const Sports = {
    dom: {},
    state: {
      isLoaded: false,
      isActive: true,
      competitions: [],
      currentFilter: 'all',
      currentSort: 'time',
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.renderCompetitions();
      this.renderStandings();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('⚽ Sports module initialized');
    },

    cacheDom: function() {
      const section = document.getElementById('section-sports');
      if (!section) return;

      this.dom = {
        section: section,
        competitions: section.querySelector('#sports-competitions'),
        standings: section.querySelector('#standings-table'),
        filters: section.querySelector('#sports-filters'),
        sort: section.querySelector('#sports-sort'),
        liveList: section.querySelector('#sports-live-list'),
        fixturesList: section.querySelector('#sports-todays-fixtures-list'),
        upcomingList: section.querySelector('#sports-upcoming-fixtures-list'),
        searchInput: section.querySelector('#sports-search-input'),
        searchForm: section.querySelector('#sports-search-form'),
      };
    },

    bindEvents: function() {
      // Page change
      document.addEventListener('x10:pageChange', (e) => {
        this.state.isActive = e.detail.page === 'sports';
        if (this.state.isActive && !this.state.isLoaded) {
          this.init();
        }
      });

      // Filters
      if (this.dom.filters) {
        this.dom.filters.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.currentFilter = btn.dataset.filter;
            this.applyFilters();
          });
        });
      }

      // Sort
      if (this.dom.sort) {
        this.dom.sort.querySelectorAll('.sort-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.sort.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.currentSort = btn.dataset.sort;
            this.applySort();
          });
        });
      }

      // Search
      if (this.dom.searchForm) {
        this.dom.searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSearch();
        });
      }

      // Navigation
      const navLinks = this.dom.section?.querySelectorAll('#sports-nav ul li a');
      if (navLinks) {
        navLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const target = link.getAttribute('href');
            if (target) {
              const el = document.querySelector(target);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          });
        });
      }
    },

    renderCompetitions: function() {
      if (!this.dom.competitions) return;

      const competitions = [
        { name: 'Premier League', country: 'England', logo: '#' },
        { name: 'La Liga', country: 'Spain', logo: '#' },
        { name: 'Serie A', country: 'Italy', logo: '#' },
        { name: 'Bundesliga', country: 'Germany', logo: '#' },
        { name: 'Ligue 1', country: 'France', logo: '#' },
        { name: 'UEFA Champions League', country: 'Europe', logo: '#' },
      ];

      this.dom.competitions.innerHTML = competitions.map(c => `
        <div class="competition-card" data-competition="${c.name}">
          <img src="${c.logo}" alt="${c.name}" class="competition-logo" />
          <div class="info">
            <div class="name">${c.name}</div>
            <div class="meta">${c.country} • 2025/26</div>
          </div>
          <button class="open-btn">📂</button>
          <button class="favorite-btn">⭐</button>
        </div>
      `).join('');

      // Bind favorite buttons
      this.dom.competitions.querySelectorAll('.favorite-btn').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = competitions[index].name;
          const type = 'Competition';
          document.dispatchEvent(new CustomEvent('x10:addFavorite', {
            detail: { id: `comp-${index}`, name, type, image: competitions[index].logo }
          }));
          btn.classList.toggle('active');
        });
      });
    },

    renderStandings: function() {
      if (!this.dom.standings) return;

      // Placeholder standings data
      const teams = [
        { pos: 1, name: 'Liverpool', played: 38, wins: 28, draws: 8, losses: 2, gf: 85, ga: 30, pts: 92 },
        { pos: 2, name: 'Manchester City', played: 38, wins: 27, draws: 7, losses: 4, gf: 82, ga: 28, pts: 88 },
        { pos: 3, name: 'Arsenal', played: 38, wins: 25, draws: 9, losses: 4, gf: 78, ga: 32, pts: 84 },
        { pos: 4, name: 'Chelsea', played: 38, wins: 22, draws: 10, losses: 6, gf: 70, ga: 35, pts: 76 },
      ];

      const tbody = this.dom.standings.querySelector('#standings-body');
      if (tbody) {
        tbody.innerHTML = teams.map(t => `
          <tr class="${t.pos <= 4 ? 'top-four' : ''}">
            <td>${t.pos}</td>
            <td><img src="#" alt="${t.name}" class="club-badge" /> ${t.name}</td>
            <td>${t.played}</td>
            <td>${t.wins}</td>
            <td>${t.draws}</td>
            <td>${t.losses}</td>
            <td>${t.gf}</td>
            <td>${t.ga}</td>
            <td>${t.gf - t.ga}</td>
            <td>${t.pts}</td>
          </tr>
        `).join('');
      }
    },

    applyFilters: function() {
      // Future: filter competitions, matches, etc.
      if (App.config.debug) console.log(`🔍 Sports filter: ${this.state.currentFilter}`);
    },

    applySort: function() {
      // Future: sort competitions, matches, etc.
      if (App.config.debug) console.log(`↕ Sports sort: ${this.state.currentSort}`);
    },

    handleSearch: function() {
      const query = this.dom.searchInput ? this.dom.searchInput.value.trim() : '';
      if (!query) return;

      if (App.config.debug) console.log(`🔍 Sports search: "${query}"`);
      document.dispatchEvent(new CustomEvent('x10:search', { detail: { query, source: 'sports' } }));
    },

    // Public API
    refresh: function() {
      if (App.config.debug) console.log('🔄 Sports refresh triggered');
      // Future: fetch data from backend
    },

    destroy: function() {
      this.state.isLoaded = false;
      if (App.config.debug) console.log('⚽ Sports module destroyed');
    },
  };

  // ============================================================
  // PART 4 — FAVORITES MODULE
  // ============================================================

  const Favorites = {
    dom: {},
    state: {
      isLoaded: false,
      isActive: true,
      items: [],
      filteredItems: [],
      currentFilter: 'all',
      currentSort: 'recent',
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.loadFavorites();
      this.renderFavorites();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('⭐ Favorites module initialized');
    },

    cacheDom: function() {
      const section = document.getElementById('section-favorites');
      if (!section) return;

      this.dom = {
        section: section,
        categories: section.querySelector('#favorites-categories'),
        clubList: section.querySelector('#favorite-clubs-list'),
        nationalList: section.querySelector('#favorite-national-teams-list'),
        competitionList: section.querySelector('#favorite-competitions-list'),
        playerList: section.querySelector('#favorite-players-list'),
        countryList: section.querySelector('#favorite-countries-list'),
        recentList: section.querySelector('#recently-added-favorites-list'),
        emptyState: section.querySelector('#favorites-empty-state'),
        searchInput: section.querySelector('#favorite-search-input'),
        searchForm: section.querySelector('#favorite-search-form'),
        sort: section.querySelector('#favorites-sort'),
        filters: section.querySelector('#favorites-filters'),
      };
    },

    bindEvents: function() {
      // Page change
      document.addEventListener('x10:pageChange', (e) => {
        this.state.isActive = e.detail.page === 'favorites';
        if (this.state.isActive && !this.state.isLoaded) {
          this.init();
        }
      });

      // Add favorite from other modules
      document.addEventListener('x10:addFavorite', (e) => {
        if (e.detail) {
          this.addItem(e.detail);
        }
      });

      // Remove favorite event
      document.addEventListener('x10:removeFavorite', (e) => {
        if (e.detail && e.detail.id) {
          this.removeItem(e.detail.id);
        }
      });

      // Categories
      if (this.dom.categories) {
        this.dom.categories.querySelectorAll('.category-toggle').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.categories.querySelectorAll('.category-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.currentFilter = btn.dataset.category;
            this.applyFilters();
          });
        });
      }

      // Sort
      if (this.dom.sort) {
        this.dom.sort.querySelectorAll('.sort-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.sort.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.state.currentSort = btn.dataset.sort;
            this.applySort();
          });
        });
      }

      // Search
      if (this.dom.searchForm) {
        this.dom.searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSearch();
        });
      }
