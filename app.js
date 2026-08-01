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

    // --- Navigation ---
navigateTo: function(page) {
    const validPages = ['home', 'sports', 'favorites', 'watch', 'account'];
    if (!validPages.includes(page)) return;

    if (this.state.currentPage === page) return;

    this.state.previousPage = this.state.currentPage;
    this.state.currentPage = page;

    // Hide all pages
    Object.keys(this.dom.pages).forEach(key => {
        if (this.dom.pages[key]) {
            this.dom.pages[key].style.display = 'none';
        }
    });

    // Show target page
    const target = this.dom.pages[page];
    if (target) {
        target.style.display = 'block';
    }

    // Update tabs
    this.dom.tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === page);
    });

    // Update URL hash
    window.location.hash = page;

    // Update AI button visibility
    this.updateAIButtonVisibility(page);
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

      // Browse Sports button
      const browseBtn = document.getElementById('browse-sports-btn');
      if (browseBtn) {
        browseBtn.addEventListener('click', () => App.navigateTo('sports'));
      }

      // Load favorites from localStorage
      document.addEventListener('x10:favoritesLoaded', () => {
        this.loadFavorites();
        this.renderFavorites();
      });
    },

    loadFavorites: function() {
      try {
        const saved = localStorage.getItem('x10-favorites');
        this.state.items = saved ? JSON.parse(saved) : [];
        this.state.filteredItems = [...this.state.items];
      } catch (e) {
        this.state.items = [];
        this.state.filteredItems = [];
        if (App.config.debug) console.warn('⚠️ Failed to load favorites:', e);
      }
    },

    saveFavorites: function() {
      try {
        localStorage.setItem('x10-favorites', JSON.stringify(this.state.items));
      } catch (e) {
        if (App.config.debug) console.warn('⚠️ Failed to save favorites:', e);
      }
    },

    addItem: function(item) {
      // Check for duplicates
      const exists = this.state.items.some(i => i.id === item.id);
      if (exists) {
        if (App.config.debug) console.log('⭐ Item already in favorites');
        return;
      }

      const newItem = {
        id: item.id || `fav-${Date.now()}`,
        name: item.name,
        type: item.type || 'Club',
        image: item.image || '#',
        addedAt: new Date().toISOString(),
        ...item,
      };

      this.state.items.unshift(newItem);
      this.state.filteredItems = [...this.state.items];
      this.saveFavorites();
      this.renderFavorites();
      this.showToast(`⭐ Added ${newItem.name} to favorites`);

      if (App.config.debug) console.log(`⭐ Added favorite: ${newItem.name}`);
    },

    removeItem: function(id) {
      const index = this.state.items.findIndex(i => i.id === id);
      if (index === -1) return;

      const removed = this.state.items[index];
      this.state.items.splice(index, 1);
      this.state.filteredItems = [...this.state.items];
      this.saveFavorites();
      this.renderFavorites();
      this.showToast(`🗑️ Removed ${removed.name} from favorites`);

      if (App.config.debug) console.log(`🗑️ Removed favorite: ${removed.name}`);
    },

    toggleFavorite: function(item) {
      const exists = this.state.items.some(i => i.id === item.id);
      if (exists) {
        this.removeItem(item.id);
      } else {
        this.addItem(item);
      }
    },

    renderFavorites: function() {
      if (this.state.items.length === 0) {
        this.showEmpty();
        return;
      }

      this.hideEmpty();

      // Group by type
      const clubs = this.state.items.filter(i => i.type === 'Club' || i.type === 'club');
      const national = this.state.items.filter(i => i.type === 'National Team' || i.type === 'national');
      const competitions = this.state.items.filter(i => i.type === 'Competition' || i.type === 'competition');
      const players = this.state.items.filter(i => i.type === 'Player' || i.type === 'player');
      const countries = this.state.items.filter(i => i.type === 'Country' || i.type === 'country');

      this.renderClubFavorites(clubs);
      this.renderNationalFavorites(national);
      this.renderCompetitionFavorites(competitions);
      this.renderPlayerFavorites(players);
      this.renderCountryFavorites(countries);
    },

    renderClubFavorites: function(items) {
      if (!this.dom.clubList) return;
      if (items.length === 0) {
        this.dom.clubList.innerHTML = '<div class="empty-state">No favorite clubs yet</div>';
        return;
      }

      this.dom.clubList.innerHTML = items.map(item => `
        <div class="favorite-club-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="badge" />
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.league || 'Club'} • Next match: TBD</div>
          </div>
          <div class="actions">
            <button class="open-btn" data-id="${item.id}">📂</button>
            <button class="remove-btn" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join('');

      // Bind remove buttons
      this.dom.clubList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeItem(btn.dataset.id);
        });
      });

      this.dom.clubList.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = this.state.items.find(i => i.id === btn.dataset.id);
          if (item) App.navigateTo('home');
        });
      });
    },

    renderNationalFavorites: function(items) {
      if (!this.dom.nationalList) return;
      if (items.length === 0) {
        this.dom.nationalList.innerHTML = '<div class="empty-state">No favorite national teams yet</div>';
        return;
      }

      this.dom.nationalList.innerHTML = items.map(item => `
        <div class="favorite-national-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="badge" />
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">National Team • Next match: TBD</div>
          </div>
          <div class="actions">
            <button class="open-btn" data-id="${item.id}">📂</button>
            <button class="remove-btn" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.nationalList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeItem(btn.dataset.id);
        });
      });
    },

    renderCompetitionFavorites: function(items) {
      if (!this.dom.competitionList) return;
      if (items.length === 0) {
        this.dom.competitionList.innerHTML = '<div class="empty-state">No favorite competitions yet</div>';
        return;
      }

      this.dom.competitionList.innerHTML = items.map(item => `
        <div class="favorite-competition-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="badge" />
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.country || 'International'} • 2025/26</div>
          </div>
          <div class="actions">
            <button class="open-btn" data-id="${item.id}">📂</button>
            <button class="remove-btn" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.competitionList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeItem(btn.dataset.id);
        });
      });
    },

    renderPlayerFavorites: function(items) {
      if (!this.dom.playerList) return;
      if (items.length === 0) {
        this.dom.playerList.innerHTML = '<div class="empty-state">No favorite players yet</div>';
        return;
      }

      this.dom.playerList.innerHTML = items.map(item => `
        <div class="favorite-player-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="badge" />
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.position || 'Player'} • ${item.club || 'TBD'}</div>
          </div>
          <div class="actions">
            <button class="open-btn" data-id="${item.id}">📂</button>
            <button class="remove-btn" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.playerList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeItem(btn.dataset.id);
        });
      });
    },

    renderCountryFavorites: function(items) {
      if (!this.dom.countryList) return;
      if (items.length === 0) {
        this.dom.countryList.innerHTML = '<div class="empty-state">No favorite countries yet</div>';
        return;
      }

      this.dom.countryList.innerHTML = items.map(item => `
        <div class="favorite-country-card" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="badge" />
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${item.competitions || '0'} competitions</div>
          </div>
          <div class="actions">
            <button class="open-btn" data-id="${item.id}">📂</button>
            <button class="remove-btn" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.countryList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeItem(btn.dataset.id);
        });
      });
    },

    applyFilters: function() {
      const filter = this.state.currentFilter;
      if (filter === 'all') {
        this.state.filteredItems = [...this.state.items];
      } else {
        const typeMap = {
          'clubs': ['Club', 'club'],
          'national-teams': ['National Team', 'national'],
          'competitions': ['Competition', 'competition'],
          'players': ['Player', 'player'],
          'countries': ['Country', 'country'],
        };
        const types = typeMap[filter] || [];
        this.state.filteredItems = this.state.items.filter(i => types.includes(i.type));
      }
      this.renderFavorites();
    },

    applySort: function() {
      const sort = this.state.currentSort;
      const items = this.state.filteredItems;

      switch (sort) {
        case 'recent':
          items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
          break;
        case 'alpha':
          items.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          break;
      }

      this.renderFavorites();
    },

    handleSearch: function() {
      const query = this.dom.searchInput ? this.dom.searchInput.value.trim().toLowerCase() : '';
      if (!query) {
        this.state.filteredItems = [...this.state.items];
        this.renderFavorites();
        return;
      }

      this.state.filteredItems = this.state.items.filter(i =>
        i.name.toLowerCase().includes(query) ||
        (i.type && i.type.toLowerCase().includes(query))
      );
      this.renderFavorites();
    },

    showEmpty: function() {
      if (this.dom.emptyState) {
        this.dom.emptyState.style.display = 'flex';
      }
      // Hide all lists
      const lists = ['clubList', 'nationalList', 'competitionList', 'playerList', 'countryList'];
      lists.forEach(key => {
        if (this.dom[key]) this.dom[key].innerHTML = '';
      });
    },

    hideEmpty: function() {
      if (this.dom.emptyState) {
        this.dom.emptyState.style.display = 'none';
      }
    },

    showToast: function(message) {
      document.dispatchEvent(new CustomEvent('x10:toast', {
        detail: { message, type: 'success' }
      }));
    },

    // Public API
    getItems: function() {
      return [...this.state.items];
    },

    isFavorite: function(id) {
      return this.state.items.some(i => i.id === id);
    },

    destroy: function() {
      this.state.isLoaded = false;
      if (App.config.debug) console.log('⭐ Favorites module destroyed');
    },
  };
// ============================================================
  // PART 5 — WATCH MODULE
  // ============================================================

  const Watch = {
    dom: {},
    state: {
      isLoaded: false,
      isActive: true,
      currentMedia: null,
      isPlaying: false,
      history: [],
      continueWatching: null,
      playbackPosition: 0,
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.loadHistory();
      this.renderHistory();
      this.renderContinueWatching();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('📺 Watch module initialized');
    },

    cacheDom: function() {
      const section = document.getElementById('section-watch');
      if (!section) return;

      this.dom = {
        section: section,
        linkInput: document.getElementById('watch-link'),
        playBtn: document.getElementById('watch-play-btn'),
        pasteBtn: document.getElementById('watch-paste-btn'),
        clearBtn: document.getElementById('watch-clear-btn'),
        videoPlayer: document.getElementById('video-player'),
        imageViewer: document.getElementById('image-viewer'),
        mediaVideo: document.getElementById('media-video'),
        mediaImage: document.getElementById('media-image'),
        mediaTitle: document.getElementById('media-title'),
        mediaDescription: document.getElementById('media-description'),
        mediaSource: document.getElementById('media-source'),
        mediaStatus: document.getElementById('media-status'),
        mediaResolution: document.getElementById('media-resolution'),
        mediaDuration: document.getElementById('media-duration'),
        mediaType: document.getElementById('media-type'),
        progressBar: document.getElementById('progress-bar'),
        currentTime: document.getElementById('current-time'),
        totalDuration: document.getElementById('total-duration'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        pipBtn: document.getElementById('pip-btn'),
        volumeSlider: document.getElementById('volume-slider'),
        volumeBtn: document.getElementById('volume-btn'),
        playbackSpeed: document.getElementById('playback-speed'),
        qualitySelector: document.getElementById('quality-selector'),
        historyList: document.getElementById('watch-history-list'),
        continueList: document.getElementById('watch-continue-list'),
        savedList: document.getElementById('watch-saved-links-list'),
        footballIntegration: document.getElementById('watch-football-integration'),
        errorStates: {
          unsupported: document.getElementById('watch-error-unsupported'),
          invalid: document.getElementById('watch-error-invalid'),
          broken: document.getElementById('watch-error-broken'),
          removed: document.getElementById('watch-error-removed'),
          blocked: document.getElementById('watch-error-blocked'),
          network: document.getElementById('watch-error-network'),
          playback: document.getElementById('watch-error-playback'),
        },
        aiLinkReceiver: document.getElementById('watch-ai-link-receiver'),
      };
    },

    bindEvents: function() {
      // Page change
      document.addEventListener('x10:pageChange', (e) => {
        this.state.isActive = e.detail.page === 'watch';
        if (this.state.isActive && !this.state.isLoaded) {
          this.init();
        }
        if (this.state.isActive && this.state.isPlaying) {
          // Resume if needed
        }
      });

      // Play button
      if (this.dom.playBtn) {
        this.dom.playBtn.addEventListener('click', () => this.loadMedia());
      }

      // Paste button
      if (this.dom.pasteBtn) {
        this.dom.pasteBtn.addEventListener('click', async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (this.dom.linkInput) {
              this.dom.linkInput.value = text;
              this.loadMedia();
            }
          } catch (e) {
            if (App.config.debug) console.warn('⚠️ Failed to read clipboard:', e);
          }
        });
      }

      // Clear button
      if (this.dom.clearBtn) {
        this.dom.clearBtn.addEventListener('click', () => {
          if (this.dom.linkInput) {
            this.dom.linkInput.value = '';
            this.clearMedia();
          }
        });
      }

      // Enter key on input
      if (this.dom.linkInput) {
        this.dom.linkInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.loadMedia();
          }
        });
      }

      // Video controls
      if (this.dom.mediaVideo) {
        const video = this.dom.mediaVideo;

        video.addEventListener('loadedmetadata', () => this.updateVideoInfo());
        video.addEventListener('timeupdate', () => this.updateProgress());
        video.addEventListener('play', () => { this.state.isPlaying = true; this.updatePlayButton(); });
        video.addEventListener('pause', () => { this.state.isPlaying = false; this.updatePlayButton(); });
        video.addEventListener('ended', () => this.onVideoEnded());
      }

      // Play/Pause button
      if (this.dom.playPauseBtn) {
        this.dom.playPauseBtn.addEventListener('click', () => this.togglePlay());
      }

      // Fullscreen
      if (this.dom.fullscreenBtn) {
        this.dom.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      }

      // PIP
      if (this.dom.pipBtn) {
        this.dom.pipBtn.addEventListener('click', () => this.togglePIP());
      }

      // Volume
      if (this.dom.volumeSlider && this.dom.mediaVideo) {
        this.dom.volumeSlider.addEventListener('input', () => {
          const val = parseFloat(this.dom.volumeSlider.value) / 100;
          this.dom.mediaVideo.volume = val;
          this.dom.mediaVideo.muted = false;
          this.updateVolumeIcon();
        });
      }

      if (this.dom.volumeBtn && this.dom.mediaVideo) {
        this.dom.volumeBtn.addEventListener('click', () => {
          this.dom.mediaVideo.muted = !this.dom.mediaVideo.muted;
          this.updateVolumeIcon();
        });
      }

      // Playback speed
      if (this.dom.playbackSpeed && this.dom.mediaVideo) {
        this.dom.playbackSpeed.addEventListener('change', () => {
          this.dom.mediaVideo.playbackRate = parseFloat(this.dom.playbackSpeed.value);
        });
      }

      // Progress bar
      if (this.dom.progressBar && this.dom.mediaVideo) {
        this.dom.progressBar.addEventListener('input', () => {
          const duration = this.dom.mediaVideo.duration;
          if (duration) {
            const time = (parseFloat(this.dom.progressBar.value) / 100) * duration;
            this.dom.mediaVideo.currentTime = time;
          }
        });
      }

      // AI link receiver
      if (this.dom.aiLinkReceiver) {
        document.addEventListener('x10:watchMedia', (e) => {
          if (e.detail && e.detail.url) {
            this.state.isActive = true;
            App.navigateTo('watch');
            if (this.dom.linkInput) {
              this.dom.linkInput.value = e.detail.url;
            }
            setTimeout(() => this.loadMedia(), 300);
          }
        });
      }

      // History controls
      const clearAllBtn = document.getElementById('history-clear-all');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => this.clearAllHistory());
      }

      const historySearch = document.getElementById('history-search');
      if (historySearch) {
        historySearch.addEventListener('input', (e) => this.searchHistory(e.target.value));
      }
    },

    // ----- Media Loading -----
    loadMedia: function() {
      const url = this.dom.linkInput ? this.dom.linkInput.value.trim() : '';
      if (!url) {
        this.showError('invalid');
        return;
      }

      if (!this.isValidUrl(url)) {
        this.showError('invalid');
        return;
      }

      this.clearErrors();
      this.detectMediaType(url);
    },

    isValidUrl: function(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    detectMediaType: function(url) {
      // Check if it's an image
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
      const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v|3gp)$/i;

      if (imageExtensions.test(url)) {
        this.loadImage(url);
      } else if (videoExtensions.test(url) || url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('dailymotion.com')) {
        this.loadVideo(url);
      } else {
        // Try as video first, fallback to image
        this.loadVideo(url);
      }
    },

    loadVideo: function(url) {
      if (!this.dom.videoPlayer || !this.dom.mediaVideo) {
        this.showError('unsupported');
        return;
      }

      this.dom.videoPlayer.style.display = 'block';
      if (this.dom.imageViewer) {
        this.dom.imageViewer.style.display = 'none';
      }

      const video = this.dom.mediaVideo;
      video.src = url;
      video.load();

      // Try to play
      video.play()
        .then(() => {
          this.state.isPlaying = true;
          this.state.currentMedia = { url, type: 'video', title: this.extractTitle(url) };
          this.saveToHistory(url, this.state.currentMedia.title, 'video');
          this.updateMediaInfo(this.state.currentMedia.title, 'Video', 'Unknown');
          if (App.config.debug) console.log(`▶️ Playing video: ${url}`);
        })
        .catch((err) => {
          if (App.config.debug) console.warn('⚠️ Playback failed:', err);
          this.showError('playback');
        });
    },

    loadImage: function(url) {
      if (!this.dom.imageViewer || !this.dom.mediaImage) {
        this.showError('unsupported');
        return;
      }

      this.dom.imageViewer.style.display = 'flex';
      if (this.dom.videoPlayer) {
        this.dom.videoPlayer.style.display = 'none';
      }

      const img = this.dom.mediaImage;
      img.src = url;
      img.onload = () => {
        this.state.currentMedia = { url, type: 'image', title: this.extractTitle(url) };
        this.saveToHistory(url, this.state.currentMedia.title, 'image');
        this.updateMediaInfo(this.state.currentMedia.title, 'Image', 'Unknown');
        if (App.config.debug) console.log(`🖼️ Loading image: ${url}`);
      };
      img.onerror = () => {
        this.showError('unsupported');
      };
    },

    clearMedia: function() {
      if (this.dom.mediaVideo) {
        this.dom.mediaVideo.pause();
        this.dom.mediaVideo.src = '';
        this.dom.mediaVideo.load();
      }
      if (this.dom.mediaImage) {
        this.dom.mediaImage.src = '';
      }
      this.state.currentMedia = null;
      this.state.isPlaying = false;
      if (App.config.debug) console.log('⏹️ Media cleared');
    },

    // ----- Media Controls -----
    togglePlay: function() {
      const video = this.dom.mediaVideo;
      if (!video) return;

      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    },

    updatePlayButton: function() {
      if (this.dom.playPauseBtn) {
        this.dom.playPauseBtn.textContent = this.state.isPlaying ? '⏸️' : '▶️';
      }
    },

    updateProgress: function() {
      const video = this.dom.mediaVideo;
      if (!video || !video.duration) return;

      const percent = (video.currentTime / video.duration) * 100;
      if (this.dom.progressBar) {
        this.dom.progressBar.value = percent;
      }

      if (this.dom.currentTime) {
        this.dom.currentTime.textContent = this.formatTime(video.currentTime);
      }

      if (this.dom.totalDuration) {
        this.dom.totalDuration.textContent = this.formatTime(video.duration);
      }

      // Save playback position
      this.state.playbackPosition = video.currentTime;
    },

    updateVideoInfo: function() {
      const video = this.dom.mediaVideo;
      if (!video) return;

      if (this.dom.totalDuration) {
        this.dom.totalDuration.textContent = this.formatTime(video.duration);
      }

      if (this.dom.mediaDuration) {
        this.dom.mediaDuration.textContent = `Duration: ${this.formatTime(video.duration)}`;
      }

      if (this.dom.mediaResolution) {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        this.dom.mediaResolution.textContent = `Resolution: ${width}x${height}`;
      }
    },

    toggleFullscreen: function() {
      const container = this.dom.videoPlayer || this.dom.imageViewer;
      if (!container) return;

      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    },

    togglePIP: function() {
      const video = this.dom.mediaVideo;
      if (!video) return;

      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        video.requestPictureInPicture().catch(() => {});
      }
    },

    updateVolumeIcon: function() {
      const video = this.dom.mediaVideo;
      if (!video || !this.dom.volumeBtn) return;

      if (video.muted || video.volume === 0) {
        this.dom.volumeBtn.textContent = '🔇';
      } else if (video.volume < 0.5) {
        this.dom.volumeBtn.textContent = '🔉';
      } else {
        this.dom.volumeBtn.textContent = '🔊';
      }
    },

    formatTime: function(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    onVideoEnded: function() {
      this.state.isPlaying = false;
      this.updatePlayButton();
      if (App.config.debug) console.log('✅ Video ended');
    },

    // ----- Title Extraction -----
    extractTitle: function(url) {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname;
        const filename = path.split('/').pop() || '';
                                    
 // Try to get title from query params
        const params = new URLSearchParams(parsed.search);
        const titleParam = params.get('title') || params.get('t') || params.get('name');

        if (titleParam) {
          return decodeURIComponent(titleParam).replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
        }

        // Clean filename
        if (filename) {
          const clean = decodeURIComponent(filename)
            .replace(/\.[^.]+$/, '') // Remove extension
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();

          if (clean && clean.length > 3) {
            return clean;
          }
        }

        // Fallback: domain name
        const domain = parsed.hostname.replace('www.', '');
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch {
        return 'Unknown Media';
      }
    },

    // ----- History -----
    loadHistory: function() {
      try {
        const saved = localStorage.getItem('x10-watch-history');
        this.state.history = saved ? JSON.parse(saved) : [];
      } catch (e) {
        this.state.history = [];
        if (App.config.debug) console.warn('⚠️ Failed to load watch history:', e);
      }
    },

    saveHistory: function() {
      try {
        localStorage.setItem('x10-watch-history', JSON.stringify(this.state.history));
      } catch (e) {
        if (App.config.debug) console.warn('⚠️ Failed to save watch history:', e);
      }
    },

    saveToHistory: function(url, title, type) {
      // Check for duplicate
      const existing = this.state.history.findIndex(h => h.url === url);
      if (existing !== -1) {
        this.state.history.splice(existing, 1);
      }

      const entry = {
        url: url,
        title: title || this.extractTitle(url),
        type: type || 'unknown',
        date: new Date().toISOString(),
        playbackPosition: this.state.playbackPosition || 0,
      };

      this.state.history.unshift(entry);
      if (this.state.history.length > 100) {
        this.state.history.pop();
      }

      this.saveHistory();
      this.renderHistory();
      this.renderContinueWatching();

      if (App.config.debug) console.log(`📝 Saved to history: ${entry.title}`);
    },

    renderHistory: function() {
      if (!this.dom.historyList) return;

      if (this.state.history.length === 0) {
        this.dom.historyList.innerHTML = '<div class="empty-state">No watch history yet</div>';
        return;
      }

      this.dom.historyList.innerHTML = this.state.history.slice(0, 20).map(item => `
        <div class="history-item" data-url="${item.url}">
          <div class="thumbnail" style="background: var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:24px;">
            ${item.type === 'video' ? '🎬' : '🖼️'}
          </div>
          <div class="info">
            <div class="title">${item.title}</div>
            <div class="meta">${new Date(item.date).toLocaleDateString()} • ${new Date(item.date).toLocaleTimeString()}</div>
          </div>
          <div class="actions">
            <button class="play-btn" data-url="${item.url}">▶</button>
            <button class="delete-btn" data-url="${item.url}">✕</button>
          </div>
        </div>
      `).join('');

      // Bind play buttons
      this.dom.historyList.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = btn.dataset.url;
          if (this.dom.linkInput) {
            this.dom.linkInput.value = url;
            this.loadMedia();
          }
        });
      });

      // Bind delete buttons
      this.dom.historyList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = btn.dataset.url;
          this.deleteHistoryItem(url);
        });
      });
    },

    deleteHistoryItem: function(url) {
      this.state.history = this.state.history.filter(h => h.url !== url);
      this.saveHistory();
      this.renderHistory();
      this.renderContinueWatching();
    },

    clearAllHistory: function() {
      if (confirm('Are you sure you want to clear all watch history?')) {
        this.state.history = [];
        this.saveHistory();
        this.renderHistory();
        this.renderContinueWatching();
        this.showToast('🗑️ All watch history cleared');
      }
    },

    searchHistory: function(query) {
      if (!this.dom.historyList) return;

      const filtered = this.state.history.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.url.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
        this.dom.historyList.innerHTML = '<div class="empty-state">No matches found</div>';
        return;
      }

      this.dom.historyList.innerHTML = filtered.slice(0, 20).map(item => `
        <div class="history-item" data-url="${item.url}">
          <div class="thumbnail" style="background: var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:24px;">
            ${item.type === 'video' ? '🎬' : '🖼️'}
          </div>
          <div class="info">
            <div class="title">${item.title}</div>
            <div class="meta">${new Date(item.date).toLocaleDateString()}</div>
          </div>
          <div class="actions">
            <button class="play-btn" data-url="${item.url}">▶</button>
            <button class="delete-btn" data-url="${item.url}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.historyList.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = btn.dataset.url;
          if (this.dom.linkInput) {
            this.dom.linkInput.value = url;
            this.loadMedia();
          }
        });
      });

      this.dom.historyList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = btn.dataset.url;
          this.deleteHistoryItem(url);
        });
      });
    },

    renderContinueWatching: function() {
      if (!this.dom.continueList) return;

      const recent = this.state.history.slice(0, 3);
      if (recent.length === 0) {
        this.dom.continueList.innerHTML = '<div class="empty-state">No media to continue</div>';
        return;
      }

      this.dom.continueList.innerHTML = recent.map(item => `
        <div class="continue-card" data-url="${item.url}">
          <div class="thumbnail" style="background: var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:40px; min-height:120px;">
            ${item.type === 'video' ? '🎬' : '🖼️'}
          </div>
          <div class="title">${item.title}</div>
          <div class="progress">
            <div class="progress-fill" style="width:${item.playbackPosition ? '30%' : '0%'}"></div>
          </div>
          <div class="actions">
            <button class="continue-btn" data-url="${item.url}">▶ Continue</button>
            <button class="delete-btn" data-url="${item.url}">✕</button>
          </div>
        </div>
      `).join('');

      this.dom.continueList.querySelectorAll('.continue-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.dataset.url;
          if (this.dom.linkInput) {
            this.dom.linkInput.value = url;
            this.loadMedia();
          }
        });
      });

      this.dom.continueList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = btn.dataset.url;
          this.deleteHistoryItem(url);
        });
      });
    },

    // ----- Media Info -----
    updateMediaInfo: function(title, type, source) {
      if (this.dom.mediaTitle) this.dom.mediaTitle.textContent = title || 'Untitled Media';
      if (this.dom.mediaDescription) this.dom.mediaDescription.textContent = 'Media loaded successfully';
      if (this.dom.mediaSource) this.dom.mediaSource.textContent = `Source: ${source || 'Unknown'}`;
      if (this.dom.mediaStatus) this.dom.mediaStatus.textContent = '✅ Loaded';
      if (this.dom.mediaType) this.dom.mediaType.textContent = `Type: ${type || 'Unknown'}`;
    },

    // ----- Error Handling -----
    showError: function(type) {
      this.clearErrors();

      const errorMap = {
        'invalid': 'invalid',
        'unsupported': 'unsupported',
        'broken': 'broken',
        'removed': 'removed',
        'blocked': 'blocked',
        'network': 'network',
        'playback': 'playback',
      };

      const key = errorMap[type] || 'unsupported';
      if (this.dom.errorStates && this.dom.errorStates[key]) {
        this.dom.errorStates[key].style.display = 'block';
      }

      if (App.config.debug) console.warn(`⚠️ Watch error: ${type}`);
    },

    clearErrors: function() {
      if (this.dom.errorStates) {
        Object.values(this.dom.errorStates).forEach(el => {
          if (el) el.style.display = 'none';
        });
      }
    },

    showToast: function(message) {
      document.dispatchEvent(new CustomEvent('x10:toast', {
        detail: { message, type: 'success' }
      }));
    },

    // ----- Public API -----
    playMedia: function(url) {
      if (this.dom.linkInput) {
        this.dom.linkInput.value = url;
        this.loadMeddia();
      }
    },

    getHistory: function() {
      return [...this.state.history];
    },

    destroy: function() {
      this.clearMedia();
      this.state.isLoaded = false;
      if (App.config.debug) console.log('📺 Watch module destroyed');
    },
  };
   // ============================================================
  // PART 6 — ACCOUNT & AI ASSISTANT MODULE
  // ============================================================

  const Account = {
    dom: {},
    state: {
      isLoaded: false,
      isAIOpen: false,
      conversations: [],
      currentConversation: null,
      isThinking: false,
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.loadConversations();
      this.renderConversations();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('👤 Account module initialized');
    },

    cacheDom: function() {
      const section = document.getElementById('section-account');
      if (!section) return;

      this.dom = {
        section: section,
        profile: document.getElementById('profile-card'),
        editProfile: document.getElementById('edit-profile-btn'),
        aiEntry: document.getElementById('ai-entry-card'),
        openAI: document.getElementById('open-ai-assistant-btn'),
        aiPanel: document.getElementById('ai-assistant'),
        chatList: document.getElementById('ai-chat-list'),
        chatMessages: document.getElementById('ai-messages'),
        chatInput: document.getElementById('ai-chat-input'),
        chatForm: document.getElementById('ai-chat-form'),
        sendBtn: document.getElementById('ai-send-btn'),
        stopBtn: document.getElementById('ai-stop-btn'),
        newChat: document.getElementById('ai-new-chat'),
        deleteChat: document.getElementById('ai-delete-chat'),
        renameChat: document.getElementById('ai-rename-chat'),
        searchConv: document.getElementById('ai-search-conversations'),
        memoryStatus: document.getElementById('ai-memory-status'),
        thinkingIndicator: document.getElementById('ai-thinking-indicator'),
        typingIndicator: document.getElementById('ai-typing-indicator'),
        memoryToggle: document.getElementById('memory-toggle'),
        memoryClear: document.getElementById('memory-clear'),
        memoryManage: document.getElementById('memory-manage'),
        aiSettings: document.getElementById('ai-settings'),
        resetAI: document.getElementById('ai-reset-btn'),
        fileInput: document.getElementById('ai-file-input'),
        imageInput: document.getElementById('ai-image-input'),
        docInput: document.getElementById('ai-doc-input'),
        attachmentsPreview: document.getElementById('ai-attachments-preview'),
        codeBlock: document.getElementById('ai-code-support'),
        imagePreview: document.getElementById('ai-image-support'),
        voiceSupport: document.getElementById('ai-voice-support'),
        securityNotice: document.getElementById('ai-security-notice'),
        emptyState: document.getElementById('ai-empty-state'),
      };

      // Quick settings
      this.dom.quickSettings = document.querySelectorAll('.quick-setting-card');
    },

    bindEvents: function() {
      // Page change
      document.addEventListener('x10:pageChange', (e) => {
        if (e.detail.page === 'account' && !this.state.isLoaded) {
          this.init();
        }
      });

      // Open AI from entry
      if (this.dom.openAI) {
        this.dom.openAI.addEventListener('click', () => this.openAI());
      }

      // Open AI from global event
      document.addEventListener('x10:openAI', () => {
        App.navigateTo('account');
        setTimeout(() => this.openAI(), 300);
      });

      // Quick settings
      if (this.dom.quickSettings) {
        this.dom.quickSettings.forEach(setting => {
          setting.addEventListener('click', () => {
            const id = setting.id;
            if (id) {
              const target = document.getElementById(id);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }
          });
        });
      }

      // Edit profile
      if (this.dom.editProfile) {
        this.dom.editProfile.addEventListener('click', () => {
          this.showToast('✏️ Edit profile coming soon');
        });
      }

      // AI Chat form
      if (this.dom.chatForm) {
        this.dom.chatForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.sendMessage();
        });
      }

      // New chat
      if (this.dom.newChat) {
        this.dom.newChat.addEventListener('click', () => this.newConversation());
      }

      // Delete chat
      if (this.dom.deleteChat) {
        this.dom.deleteChat.addEventListener('click', () => this.deleteCurrentConversation());
      }

      // Rename chat
      if (this.dom.renameChat) {
        this.dom.renameChat.addEventListener('click', () => this.renameCurrentConversation());
      }

      // Search conversations
      if (this.dom.searchConv) {
        this.dom.searchConv.addEventListener('input', (e) => this.searchConversations(e.target.value));
      }

      // Stop generation
      if (this.dom.stopBtn) {
        this.dom.stopBtn.addEventListener('click', () => this.stopGeneration());
      }

      // Memory controls
      if (this.dom.memoryToggle) {
        this.dom.memoryToggle.addEventListener('click', () => this.toggleMemory());
      }

      if (this.dom.memoryClear) {
        this.dom.memoryClear.addEventListener('click', () => this.clearMemory());
      }

      if (this.dom.memoryManage) {
        this.dom.memoryManage.addEventListener('click', () => {
          const target = document.getElementById('ai-memory-manager');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }

      // Reset AI
      if (this.dom.resetAI) {
        this.dom.resetAI.addEventListener('click', () => this.resetAI());
      }

      // File uploads
      if (this.dom.fileInput) {
        this.dom.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
      }

      // Image uploads
      if (this.dom.imageInput) {
        this.dom.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
      }

      // Document uploads
      if (this.dom.docInput) {
        this.dom.docInput.addEventListener('change', (e) => this.handleDocUpload(e));
      }

      // Voice button
      const voiceBtn = document.querySelector('#ai-voice-btn');
      if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
          this.showToast('🎤 Voice input coming soon');
        });
      }

      // Gallery button
      const galleryBtn = document.querySelector('#ai-gallery-btn');
      if (galleryBtn) {
        galleryBtn.addEventListener('click', () => {
          if (this.dom.imageInput) this.dom.imageInput.click();
        });
      }

      // File upload button
      const fileBtn = document.querySelector('#ai-file-upload-btn');
      if (fileBtn) {
        fileBtn.addEventListener('click', () => {
          if (this.dom.fileInput) this.dom.fileInput.click();
        });
      }

      // Document upload button
      const docBtn = document.querySelector('#ai-doc-upload-btn');
      if (docBtn) {
        docBtn.addEventListener('click', () => {
          if (this.dom.docInput) this.dom.docInput.click();
        });
      }

      // AI Settings changes
      const settings = ['ai-conversation-style', 'ai-response-length', 'ai-creativity', 'ai-memory-settings', 'ai-language'];
      settings.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', () => {
            this.saveSettings();
          });
        }
      });
    },

    // ----- AI Panel -----
    openAI: function() {
      if (!this.dom.aiPanel) return;

      this.state.isAIOpen = !this.state.isAIOpen;
      this.dom.aiPanel.style.display = this.state.isAIOpen ? 'block' : 'none';

      if (this.state.isAIOpen) {
        this.dom.aiPanel.scrollIntoView({ behavior: 'smooth' });
        if (this.state.conversations.length === 0) {
          this.newConversation();
        }
      }

      if (App.config.debug) console.log(`🧠 AI panel ${this.state.isAIOpen ? 'opened' : 'closed'}`);
    },

    // ----- Conversations -----
    loadConversations: function() {
      try {
        const saved = localStorage.getItem('x10-ai-conversations');
        this.state.conversations = saved ? JSON.parse(saved) : [];
      } catch (e) {
        this.state.conversations = [];
        if (App.config.debug) console.warn('⚠️ Failed to load AI conversations:', e);
      }

      if (this.state.conversations.length === 0) {
        this.newConversation();
      } else {
        this.state.currentConversation = this.state.conversations[0];
      }
    },

    saveConversations: function() {
      try {
        localStorage.setItem('x10-ai-conversations', JSON.stringify(this.state.conversations));
      } catch (e) {
        if (App.config.debug) console.warn('⚠️ Failed to save AI conversations:', e);
      }
    },

    renderConversations: function() {
      if (!this.dom.chatList) return;

      if (this.state.conversations.length === 0) {
        this.dom.chatList.innerHTML = '<div class="empty-state">No conversations</div>';
        return;
      }

      this.dom.chatList.innerHTML = this.state.conversations.map(conv => `
        <div class="chat-item ${conv.pinned ? 'pinned' : ''} ${conv.id === this.state.currentConversation?.id ? 'active' : ''}"
             data-id="${conv.id}">
          ${conv.pinned ? '📌 ' : ''}${conv.title || 'New Chat'}
        </div>
      `).join('');

      // Bind click to load conversation
      this.dom.chatList.querySelectorAll('.chat-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const conv = this.state.conversations.find(c => c.id === id);
          if (conv) {
            this.state.currentConversation = conv;
            this.renderMessages();
            this.renderConversations();
          }
        });
      });
    },

    renderMessages: function() {
      if (!this.dom.chatMessages) return;

      const conv = this.state.currentConversation;
      if (!conv || !conv.messages || conv.messages.length === 0) {
        this.dom.chatMessages.innerHTML = `
          <div class="empty-state">
            <div class="illustration">💬</div>
            <p>Start a conversation with X-10 AI</p>
          </div>
        `;
        return;
      }

      this.dom.chatMessages.innerHTML = conv.messages.map(msg => `
        <div class="message ${msg.role}">
          <span class="msg-content">${msg.content}</span>
          <span class="msg-time">${msg.time || 'Just now'}</span>
          ${msg.role === 'assistant' ? `
            <div class="msg-actions">
              <button class="copy-msg" data-content="${msg.content}">📋</button>
              <button class="delete-msg" data-id="${msg.id}">✕</button>
              <button class="regenerate-msg">🔄</button>
              <button class="like-msg">👍</button>
              <button class="dislike-msg">👎</button>
              <button class="share-msg">📤</button>
            </div>
          ` : ''}
        </div>
      `).join('');

      // Scroll to bottom
      this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

      // Bind copy buttons
      this.dom.chatMessages.querySelectorAll('.copy-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          const content = btn.dataset.content;
          navigator.clipboard.writeText(content).then(() => {
            this.showToast('📋 Copied to clipboard');
          }).catch(() => {});
        });
      });

      // Bind delete buttons
      this.dom.chatMessages.querySelectorAll('.delete-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.deleteMessage(id);
        });
      });

      // Bind regenerate buttons
      this.dom.chatMessages.querySelectorAll('.regenerate-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          this.regenerateResponse();
        });
      });

      // Bind like/dislike
      this.dom.chatMessages.querySelectorAll('.like-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showToast('👍 Thanks for your feedback');
        });
      });

      this.dom.chatMessages.querySelectorAll('.dislike-msg').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showToast('👎 We\'ll improve');
        });
      });
    },

    // ----- Send Message -----
    sendMessage: function() {
      const input = this.dom.chatInput;
      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      if (this.state.isThinking) {
        this.showToast('⏳ Please wait for the current response');
        return;
      }

      input.value = '';

      // Add user message
      this.addMessage('user', text);

      // Show thinking
      this.state.isThinking = true;
      if (this.dom.thinkingIndicator) {
        this.dom.thinkingIndicator.style.display = 'block';
        }
// Simulate AI response
      setTimeout(() => {
        const response = this.generateResponse(text);
        this.addMessage('assistant', response);
        this.state.isThinking = false;
        if (this.dom.thinkingIndicator) {
          this.dom.thinkingIndicator.style.display = 'none';
        }
      }, 1000 + Math.random() * 1000);
    },

    addMessage: function(role, content) {
      const conv = this.state.currentConversation;
      if (!conv) {
        this.newConversation();
        return this.addMessage(role, content);
      }

      if (!conv.messages) conv.messages = [];

      const msg = {
        id: `msg-${Date.now()}`,
        role: role,
        content: content,
        time: new Date().toLocaleTimeString(),
      };

      conv.messages.push(msg);
      conv.updatedAt = new Date().toISOString();

      // Update title from first user message
      if (conv.messages.length === 1 && role === 'user') {
        conv.title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
      }

      this.saveConversations();
      this.renderMessages();
      this.renderConversations();
    },

    deleteMessage: function(id) {
      const conv = this.state.currentConversation;
      if (!conv) return;

      conv.messages = conv.messages.filter(m => m.id !== id);
      this.saveConversations();
      this.renderMessages();
    },

    regenerateResponse: function() {
      const conv = this.state.currentConversation;
      if (!conv || conv.messages.length < 2) return;

      // Remove last assistant message
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg.role === 'assistant') {
        conv.messages.pop();
        this.saveConversations();
        this.renderMessages();

        // Re-send the last user message
        const lastUser = conv.messages[conv.messages.length - 1];
        if (lastUser && lastUser.role === 'user') {
          this.state.isThinking = true;
          if (this.dom.thinkingIndicator) {
            this.dom.thinkingIndicator.style.display = 'block';
          }

          setTimeout(() => {
            const response = this.generateResponse(lastUser.content);
            this.addMessage('assistant', response);
            this.state.isThinking = false;
            if (this.dom.thinkingIndicator) {
              this.dom.thinkingIndicator.style.display = 'none';
            }
          }, 1000 + Math.random() * 1000);
        }
      }
    },

    stopGeneration: function() {
      this.state.isThinking = false;
      if (this.dom.thinkingIndicator) {
        this.dom.thinkingIndicator.style.display = 'none';
      }
      this.showToast('⏹️ Generation stopped');
    },

    // ----- AI Response Generation (Simulated) -----
    generateResponse: function(input) {
      const lower = input.toLowerCase();

      // Football responses
      if (lower.includes('barcelona') || lower.includes('real madrid') || lower.includes('match')) {
        return this.getFootballResponse(input);
      }

      // Help responses
      if (lower.includes('help') || lower.includes('how') || lower.includes('what')) {
        return this.getHelpResponse(input);
      }

      // General responses
      const responses = [
        "That's a great question! Let me think about that for a moment.",
        "Interesting! I'd like to help you with that. Could you tell me more?",
        "I understand what you're asking. Here's what I know about that topic.",
        "That's a really good point. Let me share some insights with you.",
        "I appreciate your curiosity. Here's what I can tell you about that.",
      ];

      return responses[Math.floor(Math.random() * responses.length)] +
        "\n\n*I'm still learning. For more accurate information, feel free to ask me anything about X-10 Downloader, football, or general topics.*";
    },

    getFootballResponse: function(input) {
      const responses = [
        "⚽ **Match Information**\n\nI can help you find match details, statistics, and live scores for football matches across all major competitions. Just tell me which match you're interested in!",
        "🏆 **Competition Update**\n\nThe current football season is in full swing with exciting matches happening in the Premier League, La Liga, Serie A, Bundesliga, and Champions League.",
        "📊 **Statistics**\n\nI can provide detailed statistics including possession, shots, corners, and player performance data for any match. Which match would you like to analyze?",
      ];

      if (input.includes('barcelona') || input.includes('Barcelona')) {
        return "🔵🔴 **FC Barcelona**\n\nBarcelona is currently competing in La Liga and the Champions League. Their next match is coming up soon. Would you like to know the schedule or recent results?";
      }

      if (input.includes('real madrid') || input.includes('Real Madrid')) {
        return "⚪ **Real Madrid**\n\nReal Madrid, the reigning Champions League winners, continue to perform at the highest level. Their matches are always exciting to watch!";
      }

      return responses[Math.floor(Math.random() * responses.length)] +
        "\n\n*Would you like more specific information about a particular match, team, or competition?*";
    },

    getHelpResponse: function(input) {
      return "🤖 **X-10 Downloader Help Center**\n\nI can help you with:\n\n📌 **Navigation** — Move between Home, Sports, Favorites, Watch, and Account\n\n⚽ **Football** — Find matches, competitions, teams, and players\n\n⭐ **Favorites** — Save your favorite clubs, players, and competitions\n\n📺 **Watch** — Play videos, images, and media links\n\n🔍 **Search** — Find anything across the application\n\n🔔 **Notifications** — Stay updated with match alerts and reminders\n\n📜 **History** — View your watch history, search history, and conversations\n\nIs there something specific you'd like to learn about?";
    },

    // ----- Conversation Management -----
    newConversation: function() {
      const conv = {
        id: `conv-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.state.conversations.unshift(conv);
      this.state.currentConversation = conv;
      this.saveConversations();
      this.renderConversations();
      this.renderMessages();

      if (this.dom.chatInput) {
        this.dom.chatInput.focus();
      }

      if (App.config.debug) console.log('💬 New conversation created');
    },

    deleteCurrentConversation: function() {
      const conv = this.state.currentConversation;
      if (!conv) return;

      if (!confirm(`Delete "${conv.title}" conversation?`)) return;

      this.state.conversations = this.state.conversations.filter(c => c.id !== conv.id);
      if (this.state.conversations.length > 0) {
        this.state.currentConversation = this.state.conversations[0];
      } else {
        this.newConversation();
      }

      this.saveConversations();
      this.renderConversations();
      this.renderMessages();

      if (App.config.debug) console.log(`🗑️ Conversation deleted: ${conv.title}`);
    },

    renameCurrentConversation: function() {
      const conv = this.state.currentConversation;
      if (!conv) return;

      const newTitle = prompt('Rename conversation:', conv.title);
      if (newTitle && newTitle.trim()) {
        conv.title = newTitle.trim();
        this.saveConversations();
        this.renderConversations();
        this.showToast(`✏️ Renamed to "${conv.title}"`);
      }
    },

    searchConversations: function(query) {
      if (!query) {
        this.renderConversations();
        return;
      }

      const filtered = this.state.conversations.filter(conv =>
        conv.title.toLowerCase().includes(query.toLowerCase()) ||
        conv.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
      );

      if (this.dom.chatList) {
        if (filtered.length === 0) {
          this.dom.chatList.innerHTML = '<div class="empty-state">No conversations found</div>';
          return;
        }

        this.dom.chatList.innerHTML = filtered.map(conv => `
          <div class="chat-item ${conv.pinned ? 'pinned' : ''} ${conv.id === this.state.currentConversation?.id ? 'active' : ''}"
               data-id="${conv.id}">
            ${conv.pinned ? '📌 ' : ''}${conv.title || 'New Chat'}
          </div>
        `).join('');

        this.dom.chatList.querySelectorAll('.chat-item').forEach(el => {
          el.addEventListener('click', () => {
            const id = el.dataset.id;
            const conv = this.state.conversations.find(c => c.id === id);
            if (conv) {
              this.state.currentConversation = conv;
              this.renderMessages();
              this.renderConversations();
            }
          });
        });
      }
    },

    // ----- Memory -----
    toggleMemory: function() {
      this.showToast('🧠 Memory toggled (Supabase integration coming soon)');
    },

    clearMemory: function() {
      if (confirm('Clear all AI memory? This cannot be undone.')) {
        this.showToast('🧠 Memory cleared');
      }
    },

    // ----- Settings -----
    saveSettings: function() {
      const settings = {
        style: document.getElementById('ai-conversation-style')?.value || 'balanced',
        length: document.getElementById('ai-response-length')?.value || 'medium',
        creativity: document.getElementById('ai-creativity')?.value || 50,
        memory: document.getElementById('ai-memory-settings')?.value || 'enabled',
        language: document.getElementById('ai-language')?.value || 'en',
      };

      try {
        localStorage.setItem('x10-ai-settings', JSON.stringify(settings));
      } catch (e) {
        if (App.config.debug) console.warn('⚠️ Failed to save AI settings:', e);
      }

      if (App.config.debug) console.log('⚙️ AI settings saved:', settings);
    },

    resetAI: function() {
      if (confirm('Reset all AI settings and conversations?')) {
        this.state.conversations = [];
        this.saveConversations();
        this.newConversation();
        this.showToast('🔄 AI reset complete');
      }
    },

    // ----- File Uploads -----
    handleFileUpload: function(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      this.handleFiles(files);
      e.target.value = '';
    },

    handleImageUpload: function(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      this.handleFiles(files);
      e.target.value = '';
    },

    handleDocUpload: function(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      this.handleFiles(files);
      e.target.value = '';
    },

    handleFiles: function(files) {
      const preview = this.dom.attachmentsPreview;
      if (!preview) return;

      const fileNames = [];
      for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].name);
      }

      preview.innerHTML = fileNames.map(name => `
        <div class="attachment">
          📎 ${name}
          <span class="remove" data-file="${name}">✕</span>
        </div>
      `).join('');

      preview.querySelectorAll('.remove').forEach(el => {
        el.addEventListener('click', () => {
          el.closest('.attachment').remove();
        });
      });

      this.showToast(`📎 ${fileNames.length} file(s) attached`);
    },

    // ----- Toast -----
    showToast: function(message) {
      document.dispatchEvent(new CustomEvent('x10:toast', {
        detail: { message, type: 'info' }
      }));
    },

    // ----- Public API -----
    getConversations: function() {
      return [...this.state.conversations];
    },

    getCurrentConversation: function() {
      return this.state.currentConversation ? { ...this.state.currentConversation } : null;
    },

    destroy: function() {
      this.state.isLoaded = false;
      if (App.config.debug) console.log('👤 Account module destroyed');
    },
  };
        
// ============================================================
  // PART 7 — SEARCH, NOTIFICATIONS & HISTORY MODULE
  // ============================================================

  const SearchModule = {
    dom: {},
    state: {
      isLoaded: false,
      history: [],
      results: [],
      isSearching: false,
    },

    init: function() {
      if (this.state.isLoaded) return;
      this.cacheDom();
      this.bindEvents();
      this.loadSearchHistory();
      this.renderSearchSuggestions();
      this.state.isLoaded = true;

      if (App.config.debug) console.log('🔍 Search module initialized');
    },

    cacheDom: function() {
      this.dom = {
        overlay: document.getElementById('search-overlay'),
        input: document.getElementById('search-input'),
        form: document.getElementById('search-form'),
        results: document.getElementById('search-results'),
        suggestions: document.getElementById('search-suggestions'),
        clearBtn: document.getElementById('search-clear'),
        voiceBtn: document.getElementById('search-voice'),
        filterBtn: document.getElementById('search-filter-btn'),
        sortBtn: document.getElementById('search-sort-btn'),
        filters: document.getElementById('search-filters'),
        loading: document.getElementById('search-loading'),
        empty: document.getElementById('search-empty'),
        offline: document.getElementById('search-offline'),
        error: document.getElementById('search-error'),
        noQuery: document.getElementById('search-no-query'),
        recentList: document.getElementById('recent-search-list'),
        trendingList: document.getElementById('trending-search-list'),
        suggestedList: document.getElementById('suggested-search-list'),
        popularClubs: document.getElementById('popular-club-list'),
        popularPlayers: document.getElementById('popular-player-list'),
        popularCompetitions: document.getElementById('popular-competition-list'),
        popularCountries: document.getElementById('popular-country-list'),
      };
    },

    bindEvents: function() {
      // Search input
      if (this.dom.input) {
        this.dom.input.addEventListener('input', (e) => {
          const query = e.target.value.trim();
          if (query.length >= 2) {
            this.performSearch(query);
          } else {
            this.showSuggestions();
          }
        });

        this.dom.input.addEventListener('focus', () => {
          this.showSuggestions();
        });
      }

      // Filter buttons
      if (this.dom.filterBtn) {
        this.dom.filterBtn.addEventListener('click', () => {
          if (this.dom.filters) {
            this.dom.filters.hidden = !this.dom.filters.hidden;
          }
        });
      }

      if (this.dom.filters) {
        this.dom.filters.querySelectorAll('.filter-option').forEach(btn => {
          btn.addEventListener('click', () => {
            this.dom.filters.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Re-search with filter
            if (this.dom.input && this.dom.input.value.trim()) {
              this.performSearch(this.dom.input.value.trim());
            }
          });
        });
      }

      // Voice search
      if (this.dom.voiceBtn) {
        this.dom.voiceBtn.addEventListener('click', () => {
          if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.startVoiceSearch();
          } else {
            this.showToast('🎤 Voice search not supported on this browser');
          }
        });
      }

      // Search events from other modules
      document.addEventListener('x10:search', (e) => {
        if (e.detail && e.detail.query) {
          App.openSearch();
          setTimeout(() => {
            if (this.dom.input) {
              this.dom.input.value = e.detail.query;
              this.performSearch(e.detail.query);
            }
          }, 200);
        }
      });
    },

    loadSearchHistory: function() {
      try {
        const saved = localStorage.getItem('x10-search-history');
        this.state.history = saved ? JSON.parse(saved) : [];
      } catch (e) {
        this.state.history = [];
        if (App.config.debug) console.warn('⚠️ Failed to load search history:', e);
      }
    },

    saveSearchHistory: function() {
      try {
        localStorage.setItem('x10-search-history', JSON.stringify(this.state.history));
      } catch (e) {
        if (App.config.debug) console.warn('⚠️ Failed to save search history:', e);
      }
    },

    performSearch: function(query) {
      this.state.isSearching = true;
      this.hideAllStates();

      // Simulate search
      setTimeout(() => {
        const results = this.getSearchResults(query);
        this.state.results = results;
        this.displayResults(results, query);

        // Save to history
        this.addToHistory(query);
        this.state.isSearching = false;
      }, 300);
    },

    getSearchResults: function(query) {
      const lower = query.toLowerCase();
      const results = [];

      // Mock data
      const clubs = ['Barcelona', 'Liverpool', 'Real Madrid', 'Bayern Munich', 'Arsenal'];
      const players = ['Lamine Yamal', 'Erling Haaland', 'Jude Bellingham', 'Kylian Mbappé', 'Bukayo Saka'];
      const competitions = ['Premier League', 'La Liga', 'Champions League', 'Serie A', 'Bundesliga'];
      const countries = ['Spain', 'England', 'Germany', 'Italy', 'France'];

      clubs.forEach(name => {
        if (name.toLowerCase().includes(lower)) {
          results.push({ type: 'Club', name: name, image: '#' });
        }
      });

      players.forEach(name => {
        if (name.toLowerCase().includes(lower)) {
          results.push({ type: 'Player', name: name, image: '#' });
        }
      });

      competitions.forEach(name => {
        if (name.toLowerCase().includes(lower)) {
          results.push({ type: 'Competition', name: name, image: '#' });
        }
      });

      countries.forEach(name => {
        if (name.toLowerCase().includes(lower)) {
          results.push({ type: 'Country', name: name, image: '#' });
        }
      });

      return results;
    },

    displayResults: function(results, query) {
      if (!this.dom.results) return;

      if (results.length === 0) {
        this.showEmpty();
        return;
      }

      // Group by type
      const grouped = {};
      results.forEach(r => {
        if (!grouped[r.type]) grouped[r.type] = [];
        grouped[r.type].push(r);
      });

      let html = '';
      for (const [type, items] of Object.entries(grouped)) {
        html += `<section class="result-group">
          <h3>${type}s</h3>
          <div class="result-list">
            ${items.map(item => `
              <div class="search-result-item" data-name="${item.name}">
                <img src="${item.image}" alt="${item.name}" class="image" />
                <div class="info">
                  <div class="title">${item.name}</div>
                  <div class="subtitle">${type}</div>
                </div>
                <button class="open-btn">📂</button>
              </div>
            `).join('')}
          </div>
        </section>`;
      }

      this.dom.results.innerHTML = html;

      // Bind clicks
      this.dom.results.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const name = el.dataset.name;
          this.showToast(`🔍 Opening ${name}`);
          App.closeSearch();
        });
      });
    },

    showSuggestions: function() {
      this.hideAllStates();
      if (this.dom.suggestions) {
        this.dom.suggestions.style.display = 'block';
      }

      // Render recent searches
      if (this.dom.recentList && this.state.history.length > 0) {
        this.dom.recentList.innerHTML = this.state.history.slice(0, 5).map(s =>
          `<li data-query="${s}">${s}</li>`
        ).join('');

        this.dom.recentList.querySelectorAll('li').forEach(el => {
          el.addEventListener('click', () => {
            const query = el.dataset.query;
            if (this.dom.input) {
              this.dom.input.value = query;
              this.performSearch(query);
            }
          });
        });
      }

      // Trending
      if (this.dom.trendingList) {
        const trending = ['Champions League', 'El Clásico', 'Derby', 'World Cup', 'Transfer News'];
        this.dom.trendingList.innerHTML = trending.map(s =>
          `<li data-query="${s}">🔥 ${s}</li>`
        ).join('');

        this.dom.trendingList.querySelectorAll('li').forEach(el => {
          el.addEventListener('click', () => {
            const query = el.dataset.query;
            if (this.dom.input) {
              this.dom.input.value = query;
              this.performSearch(query);
            }
          });
        });
      }
    },

    addToHistory: function(query) {
      // Remove duplicate
      this.state.history = this.state.history.filter(s => s !== query);
      this.state.history.unshift(query);

      if (this.state.history.length > 20) {
        this.state.history.pop();
      }

      this.saveSearchHistory();
    },

    hideAllStates: function() {
      if (this.dom.suggestions) this.dom.suggestions.style.display = 'none';
      if (this.dom.results) this.dom.results.innerHTML = '';
      if (this.dom.loading) this.dom.loading.style.display = 'none';
      if (this.dom.empty) this.dom.empty.style.display = 'none';
      if (this.dom.offline) this.dom.offline.style.display = 'none';
      if (this.dom.error) this.dom.error.style.display = 'none';
      if (this.dom.noQuery) this.dom.noQuery.style.display = 'none';
    },

    showEmpty: function() {
      if (this.dom.empty) this.dom.empty.style.display = 'flex';
    },

    showToast: function(message) {
      document.dispatchEvent(new CustomEvent('x10:toast', {
        detail: { message, type: 'info' }
      }));
    },

    startVoiceSearch: function() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.showToast('🎤 Voice search not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        this.showToast('🎤 Listening...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.dom.input) {
          this.dom.input.value = transcript;
          this.performSearch(transcript);
        }
      };

      recognition.onerror = () => {
        this.showToast('🎤 Could not understand');
      };

      recognition.start();
    },

    // Public API
    clearHistory: function() {
      if (confirm('Clear all search history?')) {
        this.state.history = [];
        this.saveSearchHistory();
        this.showSuggestions();
        this.showToast('🗑️ Search history cleared');
      }
    },

    destroy: function() {
      this.state.isLoaded = false;
      if (App.config.debug) console.log('🔍 Search module destroyed');
    },
  };
// ============================================================
  // PART 8 — PWA, OFFLINE MODE, SMART REFRESH, MODULE INTEGRATION
  // ============================================================

  const PWA = {
    state: {
      isOnline: navigator.onLine,
      isVisible: document.visibilityState === 'visible',
      updateAvailable: false,
      isInstalled: false,
    },

    init: function() {
      this.bindEvents();
      this.checkOnlineStatus();
      this.setupVisibility();
      this.setupInstallPrompt();

      if (App.config.debug) console.log('📲 PWA module initialized');
    },

    bindEvents: function() {
      // Online/Offline
      window.addEventListener('online', () => {
        this.state.isOnline = true;
        this.updateStatus();
        document.dispatchEvent(new CustomEvent('x10:online'));
        this.showToast('🌐 Back online');
      });

      window.addEventListener('offline', () => {
        this.state.isOnline = false;
        this.updateStatus();
        document.dispatchEvent(new CustomEvent('x10:offline'));
        this.showToast('📡 You are offline');
      });

      // Visibility
      document.addEventListener('visibilitychange', () => {
        this.state.isVisible = document.visibilityState === 'visible';
        document.dispatchEvent(new CustomEvent('x10:visibilityChange', {
          detail: { isVisible: this.state.isVisible }
        }));
      });

      // App installed
      window.addEventListener('appinstalled', () => {
        this.state.isInstalled = true;
        document.dispatchEvent(new CustomEvent('x10:appInstalled'));
        if (App.config.debug) console.log('✅ App installed');
      });
    },

    checkOnlineStatus: function() {
      // Check if we're in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.state.isInstalled = true;
      }
    },

    setupVisibility: function() {
      // Handle page visibility for refresh management
      let refreshTimers = {};

      document.addEventListener('x10:visibilityChange', (e) => {
        if (e.detail.isVisible) {
          // Resume all refreshes
          document.dispatchEvent(new CustomEvent('x10:resumeRefreshes'));
        } else {
          // Pause all refreshes
          document.dispatchEvent(new CustomEvent('x10:pauseRefreshes'));
        }
      });
    },

    setupInstallPrompt: function() {
      let deferredPrompt;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.dispatchEvent(new CustomEvent('x10:installAvailable'));

        // Show install button
        const installBtn = document.createElement('button');
        installBtn.id = 'install-app-btn';
        installBtn.textContent = '📲 Install X-10';
        installBtn.className = 'btn btn-primary';
        installBtn.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          padding: 12px 24px;
          border-radius: 9999px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: fadeSlideUp 0.3s ease;
        `;

        installBtn.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            if (result.outcome === 'accepted') {
              this.showToast('✅ App installed successfully!');
              installBtn.remove();
            }
            deferredPrompt = null;
          }
        });

        document.body.appendChild(installBtn);
      });
    },

    updateStatus: function() {
      // Update any status indicators
      const offlineIndicators = document.querySelectorAll('.offline-indicator');
      offlineIndicators.forEach(el => {
        el.style.display = this.state.isOnline ? 'none' : 'flex';
      });

      // Show offline screen if applicable
      const offlinePages = document.querySelectorAll('.offline-page');
      offlinePages.forEach(el => {
        el.style.display = this.state.isOnline ? 'none' : 'flex';
      });
    },

    showToast: function(message) {
      document.dispatchEvent(new CustomEvent('x10:toast', {
        detail: { message, type: 'info' }
      }));
    },

    // Public API
    getStatus: function() {
      return { ...this.state };
    },

    isOnline: function() {
      return this.state.isOnline;
    },

    isVisible: function() {
      return this.state.isVisible;
    },
  };

  // ============================================================
  // SMART REFRESH MANAGER
  // ============================================================

  const RefreshManager = {
    timers: {},
    active: true,
    paused: false,
    intervals: {
      live: 20000,      // 20 seconds
      upcoming: 300000, // 5 minutes
      tables: 1800000,  // 30 minutes
      images: 86400000, // 24 hours
    },

    init: function() {
      this.bindEvents();
      this.startAll();

      if (App.config.debug) console.log('🔄 Refresh Manager initialized');
    },

    bindEvents: function() {
      document.addEventListener('x10:pageChange', (e) => {
        // Only refresh active page
        this.active = true;
      });

      document.addEventListener('x10:pauseRefreshes', () => {
        this.pauseAll();
      });

      document.addEventListener('x10:resumeRefreshes', () => {
        this.resumeAll();
      });
    },

    startAll: function() {
      this.startTimer('live', this.intervals.live);
      this.startTimer('upcoming', this.intervals.upcoming);
      this.startTimer('tables', this.intervals.tables);
      this.startTimer('images', this.intervals.images);
    },

    startTimer: function(name, interval) {
      if (this.timers[name]) {
        clearInterval(this.timers[name]);
      }

      this.timers[name] = setInterval(() => {
        if (!this.paused && this.active && App.state.isOnline) {
          this.refresh(name);
        }
      }, interval);

      if (App.config.debug) console.log(`⏱️ Refresh timer started: ${name}`);
    },

    refresh: function(type) {
      if (App.config.debug) console.log(`🔄 Refreshing: ${type}`);

      switch (type) {
        case 'live':
          // Refresh live data
          if (Home.state.isActive) {
            Home.refreshData();
          }
          if (Sports.state.isActive) {
            Sports.refresh();
          }
          break;
        case 'upcoming':
          // Refresh upcoming matches
          if (Home.state.isActive) {
            Home.renderUpcomingMatches();
          }
          break;
        case 'tables':
          // Refresh league tables
          if (Sports.state.isActive) {
            Sports.renderStandings();
          }
          break;
        case 'images':
          // Refresh cached images (only if needed)
          break;
        default:
          break;
      }
    },

    pauseAll: function() {
      this.paused = true;
      if (App.config.debug) console.log('⏸️ All refreshes paused');
    },

    resumeAll: function() {
      this.paused = false;
      if (App.config.debug) console.log('▶️ All refreshes resumed');
    },

    stopAll: function() {
      Object.keys(this.timers).forEach(key => {
        clearInterval(this.timers[key]);
        delete this.timers[key];
      });
      if (App.config.debug) console.log('⏹️ All refreshes stopped');
    },

    // Public API
    getIntervals: function() {
      return { ...this.intervals };
    },

    setInterval: function(name, ms) {
      this.intervals[name] = ms;
      if (this.timers[name]) {
        clearInterval(this.timers[name]);
        this.startTimer(name, ms);
      }
    },
  };

  // ============================================================
  // TOAST SYSTEM
  // ============================================================

  const ToastSystem = {
    container: null,
    timers: [],

    init: function() {
      this.createContainer();
      this.bindEvents();

      if (App.config.debug) console.log('🍞 Toast system initialized');
    },

    createContainer: function() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    },

    bindEvents: function() {
      document.addEventListener('x10:toast', (e) => {
        if (e.detail) {
          this.show(e.detail.message, e.detail.type || 'info');
        }
      });
    },

    show: function(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;

      this.container.appendChild(toast);

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 3000);

      this.timers.push(timer);

      // Clean up timer on click
      toast.addEventListener('click', () => {
        clearTimeout(timer);
        toast.remove();
      });
    },

    clear: function() {
      this.timers.forEach(t => clearTimeout(t));
      this.timers = [];
      if (this.container) {
        this.container.innerHTML = '';
      }
    },
  };

  // ============================================================
  // APPLICATION INITIALIZATION
  // ============================================================

  document.addEventListener('DOMContentLoaded', function() {
    // Initialize core
    App.init();

    // Initialize modules
    Home.init();
    Sports.init();
    Favorites.init();
    Watch.init();
    Account.init();
    SearchModule.init();
    PWA.init();
    RefreshManager.init();
    ToastSystem.init();

    // Handle initial hash
    App.handleHash();

    // Handle online/offline status on load
    if (!navigator.onLine) {
      document.dispatchEvent(new CustomEvent('x10:offline'));
    }

    if (App.config.debug) console.log('🚀 X-10 Downloader fully initialized');
  });

  // ============================================================
  // EXPOSE PUBLIC API
  // ============================================================
