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
