/* ============================================================
   X10 — APPLICATION JAVASCRIPT
   Movies · Downloads · AI
   Vanilla JS · No framework · Production-ready
   ============================================================ */

'use strict';

/* ============================================================
   APP — Core state, DOM cache, initialization
   ============================================================ */
const App = {
  state: {
    currentPage: 'movies',
    isOnline: navigator.onLine,
    isInitialized: false,
    isInstalled: false,
  },

  dom: {},

  config: {
    debug: false,
    archiveApi: 'https://archive.org/advancedsearch.php',
    archiveMeta: 'https://archive.org/metadata',
    archiveThumb: 'https://archive.org/services/img',
    archiveDownload: 'https://archive.org/download',
    rowsPerPage: 30,
  },

  init() {
    if (this.state.isInitialized) return;
    this.state.isInitialized = true;

    this.cacheDom();
    this.bindEvents();
    this.detectOnline();

    Movies.init();
    Downloads.init();
    AI.init();
    Toast.init();
    PWA.init();

    this.switchPage('movies');

    if (this.config.debug) console.log('🚀 X10 initialized');
  },

  cacheDom() {
    this.dom = {
      body: document.body,
      main: document.getElementById('main-content'),
      pages: {
        movies: document.getElementById('page-movies'),
        downloads: document.getElementById('page-downloads'),
        ai: document.getElementById('page-ai'),
      },
      tabs: document.querySelectorAll('#bottom-tabs .tab-item'),
      downloadsBadge: document.getElementById('downloads-badge'),
      offlineNotice: document.getElementById('offline-notice'),
      loadingBar: document.getElementById('global-loading-bar'),
    };
  },

  bindEvents() {
    // Bottom tabs
    this.dom.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.tab;
        if (page) this.switchPage(page);
      });
    });

    // Header AI button
    const aiBtn = document.getElementById('header-ai-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => this.switchPage('ai'));
    }

    // Hash routing
    window.addEventListener('hashchange', () => this.handleHash());
  },

  switchPage(page) {
    const valid = ['movies', 'downloads', 'ai'];
    if (!valid.includes(page)) return;
    if (this.state.currentPage === page) return;

    this.state.currentPage = page;

    // Hide all pages
    Object.values(this.dom.pages).forEach(p => {
      if (p) p.classList.remove('active');
    });

    // Show target
    const target = this.dom.pages[page];
    if (target) target.classList.add('active');

    // Update tabs
    this.dom.tabs.forEach(tab => {
      const isActive = tab.dataset.tab === page;
      tab.classList.toggle('active', isActive);
      if (isActive) {
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.removeAttribute('aria-current');
      }
    });

    // Update hash
    if (window.location.hash !== `#${page}`) {
      history.replaceState(null, '', `#${page}`);
    }

    if (this.config.debug) console.log('📄 Page:', page);
  },

  handleHash() {
    const hash = window.location.hash.replace('#', '') || 'movies';
    if (['movies', 'downloads', 'ai'].includes(hash)) {
      this.switchPage(hash);
    }
  },

  detectOnline() {
  // Trust the browser's live events — don't trust navigator.onLine at load
  this.state.isOnline = true;
  this.setOfflineNotice(false);

  window.addEventListener('online', () => {
    this.state.isOnline = true;
    this.setOfflineNotice(false);
    Toast.show('Back online', 'success');
  });

  window.addEventListener('offline', () => {
    this.state.isOnline = false;
    this.setOfflineNotice(true);
    Toast.show('You are offline', 'warning');
  });
},

  setOfflineNotice(show) {
    if (this.dom.offlineNotice) {
      this.dom.offlineNotice.hidden = !show;
    }
  },

  showLoadingBar(show) {
    if (this.dom.loadingBar) {
      this.dom.loadingBar.hidden = !show;
    }
  },
};

/* ============================================================
   MOVIES — Search, grid, details, player
   ============================================================ */
const Movies = {
  state: {
    query: '',
    category: 'all',
    year: '',
    page: 1,
    results: [],
    isLoading: false,
    hasMore: false,
    currentMovie: null,
  },

  dom: {},

  init() {
    this.cacheDom();
    this.bindEvents();
    this.loadFeatured();
  },

  cacheDom() {
    this.dom = {
      grid: document.getElementById('movies-grid'),
      loading: document.getElementById('movies-loading'),
      empty: document.getElementById('movies-empty'),
      error: document.getElementById('movies-error'),
      retryBtn: document.getElementById('movies-retry-btn'),
      loadMoreWrap: document.getElementById('movies-load-more-wrap'),
      loadMoreBtn: document.getElementById('movies-load-more-btn'),
      searchForm: document.getElementById('movies-search-form'),
      searchInput: document.getElementById('movies-search-input'),
      searchClear: document.getElementById('movies-search-clear'),
      categoryChips: document.querySelectorAll('.category-chip'),
      yearSelect: document.getElementById('movies-year-select'),
      detailsOverlay: document.getElementById('movie-details-overlay'),
      detailsContent: document.getElementById('movie-details-content'),
      detailsClose: document.getElementById('movie-details-close'),
      playerOverlay: document.getElementById('player-overlay'),
      playerVideo: document.getElementById('player-video'),
      playerTitle: document.getElementById('player-title'),
      playerClose: document.getElementById('player-close'),
      playerQuality: document.getElementById('player-quality'),
      playerTime: document.getElementById('player-time'),
      downloadConfirm: document.getElementById('download-confirm-overlay'),
      downloadConfirmSize: document.getElementById('download-confirm-size'),
      downloadConfirmCancel: document.getElementById('download-confirm-cancel'),
      downloadConfirmStart: document.getElementById('download-confirm-start'),
    };
  },

  bindEvents() {
    // Search
    this.dom.searchForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = this.dom.searchInput.value.trim();
      if (!q) return;
      this.state.query = q;
      this.state.page = 1;
      this.state.results = [];
      this.search(true);
    });

    this.dom.searchInput?.addEventListener('input', (e) => {
      this.dom.searchClear.hidden = !e.target.value.trim();
    });

    this.dom.searchClear?.addEventListener('click', () => {
      this.dom.searchInput.value = '';
      this.dom.searchClear.hidden = true;
      this.state.query = '';
      this.loadFeatured();
    });

    // Categories
    this.dom.categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.state.category = chip.dataset.category;
        this.state.page = 1;
        this.state.results = [];
        this.search(true);
      });
    });

    // Year
    this.dom.yearSelect?.addEventListener('change', (e) => {
      this.state.year = e.target.value;
      this.state.page = 1;
      this.state.results = [];
      this.search(true);
    });

    // Load more
    this.dom.loadMoreBtn?.addEventListener('click', () => {
      this.state.page++;
      this.search(false);
    });

    // Retry
    this.dom.retryBtn?.addEventListener('click', () => {
      this.search(true);
    });

    // Details close
    this.dom.detailsClose?.addEventListener('click', () => this.closeDetails());
    this.dom.detailsOverlay?.addEventListener('click', (e) => {
      if (e.target === this.dom.detailsOverlay) this.closeDetails();
    });

    // Player close
    this.dom.playerClose?.addEventListener('click', () => this.closePlayer());
    this.dom.playerVideo?.addEventListener('timeupdate', () => this.updatePlayerTime());
    this.dom.playerVideo?.addEventListener('ended', () => this.closePlayer());

    // Download confirm
    this.dom.downloadConfirmCancel?.addEventListener('click', () => {
      this.dom.downloadConfirm.hidden = true;
    });
    this.dom.downloadConfirmStart?.addEventListener('click', () => {
      const movie = this.state.currentMovie;
      if (movie) {
        Downloads.add(movie);
        Toast.show(`Downloading: ${movie.title}`, 'success');
      }
      this.dom.downloadConfirm.hidden = true;
    });
    this.dom.downloadConfirm?.addEventListener('click', (e) => {
      if (e.target === this.dom.downloadConfirm) {
        this.dom.downloadConfirm.hidden = true;
      }
    });
  },

  /* -------- Internet Archive search -------- */
  async loadFeatured() {
    this.state.query = 'feature_films';
    this.state.page = 1;
    this.state.results = [];
    await this.search(true);
  },

  async search(reset) {
    if (this.state.isLoading) return;
    this.state.isLoading = true;
    if (reset) this.showLoading();
    App.showLoadingBar(true);

    try {
      const query = this.buildQuery();
      const params = new URLSearchParams({
        q: query,
        'fl[]': ['identifier', 'title', 'year', 'description', 'mediatype'],
        rows: App.config.rowsPerPage,
        page: this.state.page,
        output: 'json',
        sort: 'downloads desc',
      });

      // URLSearchParams with array doesn't send multiple fl[] well; build manually
      const fl = 'fl[]=identifier&fl[]=title&fl[]=year&fl[]=description&fl[]=mediatype';
      const url = `${App.config.archiveApi}?q=${encodeURIComponent(query)}&${fl}&rows=${App.config.rowsPerPage}&page=${this.state.page}&output=json&sort=downloads+desc`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      const docs = data?.response?.docs || [];
      const total = data?.response?.numFound || 0;

      this.state.results = reset ? docs : [...this.state.results, ...docs];
      this.state.hasMore = this.state.results.length < total && docs.length > 0;

      this.render();

      if (this.state.results.length === 0) {
        this.showEmpty();
      } else {
        this.hideStates();
      }
    } catch (err) {
      if (App.config.debug) console.error(err);
      this.showError('Could not load movies. Please try again.');
    } finally {
      this.state.isLoading = false;
      App.showLoadingBar(false);
    }
  },

  buildQuery() {
    const parts = [];
    parts.push('mediatype:movies');

    if (this.state.query && this.state.query !== 'feature_films') {
      parts.push(`(${this.state.query})`);
    } else {
      parts.push('collection:feature_films');
    }

    if (this.state.category && this.state.category !== 'all') {
      parts.push(`subject:"${this.state.category}"`);
    }

    if (this.state.year) {
      parts.push(`year:${this.state.year}`);
    }

    return parts.join(' AND ');
  },

  /* -------- Rendering -------- */
  render() {
    if (!this.dom.grid) return;

    const html = this.state.results.map(movie => this.renderCard(movie)).join('');
    this.dom.grid.innerHTML = html;

    // Bind card clicks
    this.dom.grid.querySelectorAll('.movie-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const movie = this.state.results.find(m => m.identifier === id);
        if (movie) this.openDetails(movie);
      });
    });

    // Load more
    if (this.dom.loadMoreWrap) {
      this.dom.loadMoreWrap.hidden = !this.state.hasMore;
    }
  },

  renderCard(movie) {
    const id = this.escapeAttr(movie.identifier || '');
    const title = this.escape(movie.title || 'Untitled');
    const year = movie.year || '';
    const thumb = movie.identifier
      ? `${App.config.archiveThumb}/${encodeURIComponent(movie.identifier)}`
      : '';

    return `
      <article class="movie-card" data-id="${id}" tabindex="0" role="button" aria-label="${title}">
        <div class="movie-card-poster">
          ${thumb
            ? `<img src="${thumb}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div class="movie-card-poster-placeholder" style="display:none;">🎬</div>`
            : `<div class="movie-card-poster-placeholder">🎬</div>`}
        </div>
        <div class="movie-card-info">
          <h3 class="movie-card-title">${title}</h3>
          <div class="movie-card-meta">
            ${year ? `<span>📅 ${this.escape(String(year))}</span>` : ''}
            <span>🎞️ Movie</span>
          </div>
        </div>
      </article>
    `;
  },

  /* -------- Movie details -------- */
  async openDetails(movie) {
    this.state.currentMovie = movie;
    const overlay = this.dom.detailsOverlay;
    const content = this.dom.detailsContent;
    if (!overlay || !content) return;

    // Show loading inside overlay
    content.innerHTML = `<div class="state-block"><div class="error-icon">⏳</div><p>Loading details...</p></div>`;
    overlay.hidden = false;

    try {
      const res = await fetch(`${App.config.archiveMeta}/${encodeURIComponent(movie.identifier)}`);
      const meta = await res.json();

      const videoFile = this.pickVideoFile(meta);
      const thumb = `${App.config.archiveThumb}/${encodeURIComponent(movie.identifier)}`;
      const description = this.extractDescription(meta, movie);

      content.innerHTML = this.renderDetails(meta, movie, videoFile, thumb, description);

      // Bind watch
      const watchBtn = content.querySelector('#movie-watch-btn');
      watchBtn?.addEventListener('click', () => {
        if (!videoFile) {
          Toast.show('No playable video available', 'warning');
          return;
        }
        this.playVideo(movie, videoFile, meta);
      });

      // Bind download
      const downloadBtn = content.querySelector('#movie-download-btn');
      downloadBtn?.addEventListener('click', () => {
        if (!videoFile) return;
        const sizeBytes = parseInt(videoFile.size || 0, 10);
        const sizeLabel = this.formatBytes(sizeBytes);
        this.dom.downloadConfirmSize.textContent = sizeLabel;
        this.dom.downloadConfirm.hidden = false;
      });
    } catch (err) {
      if (App.config.debug) console.error(err);
      content.innerHTML = `
        <div class="movie-details-body">
          <h2 class="movie-details-title">${this.escape(movie.title || 'Unknown')}</h2>
          <p class="movie-details-description">Could not load details.</p>
          <div class="movie-details-actions">
            <button class="btn btn-secondary" onclick="Movies.closeDetails()">Close</button>
          </div>
        </div>
      `;
    }
  },

  renderDetails(meta, movie, videoFile, thumb, description) {
    const title = this.escape(meta?.metadata?.title || movie.title || 'Untitled');
    const year = meta?.metadata?.year || movie.year || '';
    const creator = meta?.metadata?.creator || '';
    const subject = meta?.metadata?.subject || '';
    const genres = Array.isArray(subject) ? subject.slice(0, 4).join(', ') : subject;

    const sizeBytes = parseInt(videoFile?.size || 0, 10);
    const sizeLabel = sizeBytes ? this.formatBytes(sizeBytes) : '';
    const quality = this.guessQuality(videoFile?.name || '');

    return `
      <div class="movie-details-hero">
        <img src="${thumb}" alt="${title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="movie-details-hero-placeholder" style="display:none;">🎬</div>
      </div>
      <div class="movie-details-body">
        <h2 class="movie-details-title">${title}</h2>
        <div class="movie-details-meta">
          ${year ? `<span>📅 ${this.escape(String(year))}</span>` : ''}
          ${quality ? `<span>🎞️ ${quality}</span>` : ''}
          ${sizeLabel ? `<span>💾 ${sizeLabel}</span>` : ''}
          ${creator ? `<span>🎬 ${this.escape(String(creator))}</span>` : ''}
        </div>
        ${description ? `<p class="movie-details-description">${this.escape(description)}</p>` : ''}
        ${genres ? `<p class="movie-details-description" style="opacity:0.8;">🏷️ ${this.escape(genres)}</p>` : ''}
        <div class="movie-details-source">
          <strong>Source:</strong> Internet Archive — ${this.escape(movie.identifier || '')}
        </div>
        <div class="movie-details-actions">
          ${videoFile
            ? `<button id="movie-watch-btn" class="btn btn-primary">▶ Watch</button>`
            : `<button class="btn btn-secondary" disabled>No video</button>`}
          ${videoFile
            ? `<button id="movie-download-btn" class="btn btn-secondary">⬇ Download</button>`
            : ''}
        </div>
        ${videoFile && sizeLabel
          ? `<p class="movie-details-data-size">This download may use approximately ${sizeLabel} of data.</p>`
          : ''}
      </div>
    `;
  },

  pickVideoFile(meta) {
    if (!meta?.files) return null;
    const videos = meta.files.filter(f =>
      f.name && /\.(mp4|webm|ogv|m4v|mov)$/i.test(f.name) && f.source !== 'metadata'
    );
    if (videos.length === 0) return null;

    // Prefer mp4, prefer h.264, prefer smaller for mobile
    const sorted = [...videos].sort((a, b) => {
      const scoreA = this.scoreFile(a);
      const scoreB = this.scoreFile(b);
      return scoreB - scoreA;
    });
    return sorted[0];
  },

  scoreFile(f) {
    let score = 0;
    const name = (f.name || '').toLowerCase();
    if (name.endsWith('.mp4')) score += 100;
    if (name.endsWith('.webm')) score += 50;
    if (f.format?.toLowerCase().includes('h.264') || f.format?.toLowerCase().includes('mpeg4')) score += 40;
    if (name.includes('512kb') || name.includes('360p')) score += 30;
    if (name.includes('h.264')) score += 20;
    return score;
  },

  guessQuality(filename) {
    const name = (filename || '').toLowerCase();
    if (name.includes('1080')) return '1080p';
    if (name.includes('720')) return '720p';
    if (name.includes('480')) return '480p';
    if (name.includes('360')) return '360p';
    if (name.includes('512kb')) return '360p';
    if (name.includes('256kb')) return '240p';
    return '';
  },

  extractDescription(meta, movie) {
    let desc = meta?.metadata?.description;
    if (Array.isArray(desc)) desc = desc.join(' ');
    if (!desc) desc = movie.description;
    if (Array.isArray(desc)) desc = desc.join(' ');
    if (!desc) return '';
    // Strip HTML tags
    return String(desc).replace(/<[^>]+>/g, '').trim().slice(0, 500);
  },

  closeDetails() {
    if (this.dom.detailsOverlay) this.dom.detailsOverlay.hidden = true;
    this.state.currentMovie = null;
  },

  
  /* -------- Player -------- */
  playVideo(movie, file, meta) {
    const url = `${App.config.archiveDownload}/${encodeURIComponent(movie.identifier)}/${encodeURIComponent(file.name)}`;
    if (!this.dom.playerVideo) return;

    this.dom.playerTitle.textContent = meta?.metadata?.title || movie.title || 'Playing';
    this.dom.playerVideo.src = url;
    this.dom.playerVideo.load();
    this.dom.playerOverlay.hidden = false;

    // Populate quality selector (only if multiple qualities exist)
    this.populateQualitySelector(meta, movie, file);

    this.dom.playerVideo.play().catch(() => {});
  },

  populateQualitySelector(meta, movie, currentFile) {
    const sel = this.dom.playerQuality;
    if (!sel) return;

    const videos = (meta?.files || []).filter(f =>
      f.name && /\.(mp4|webm|ogv|m4v)$/i.test(f.name) && f.source !== 'metadata'
    );

    if (videos.length <= 1) {
      sel.innerHTML = `<option value="">Auto</option>`;
      sel.disabled = true;
      return;
    }

    sel.disabled = false;
    sel.innerHTML = videos.map(f => {
      const q = this.guessQuality(f.name) || f.name;
      const selected = f.name === currentFile.name ? 'selected' : '';
      return `<option value="${this.escapeAttr(f.name)}" ${selected}>${this.escape(q)}</option>`;
    }).join('');

    // Replace to remove old listeners
    const newSel = sel.cloneNode(true);
    sel.parentNode.replaceChild(newSel, sel);
    this.dom.playerQuality = newSel;

    newSel.addEventListener('change', (e) => {
      const chosen = e.target.value;
      if (!chosen) return;
      const file = videos.find(f => f.name === chosen);
      if (file) {
        const url = `${App.config.archiveDownload}/${encodeURIComponent(movie.identifier)}/${encodeURIComponent(file.name)}`;
        const currentTime = this.dom.playerVideo.currentTime;
        this.dom.playerVideo.src = url;
        this.dom.playerVideo.currentTime = currentTime;
        this.dom.playerVideo.play().catch(() => {});
      }
    });
  },

  updatePlayerTime() {
    const v = this.dom.playerVideo;
    if (!v || !this.dom.playerTime) return;
    this.dom.playerTime.textContent = `${this.formatTime(v.currentTime)} / ${this.formatTime(v.duration)}`;
  },

  closePlayer() {
    if (this.dom.playerVideo) {
      this.dom.playerVideo.pause();
      this.dom.playerVideo.removeAttribute('src');
      this.dom.playerVideo.load();
    }
    if (this.dom.playerOverlay) this.dom.playerOverlay.hidden = true;
  },

  /* -------- States -------- */
  showLoading() {
    this.dom.loading?.removeAttribute('hidden');
    this.dom.empty?.setAttribute('hidden', '');
    this.dom.error?.setAttribute('hidden', '');
  },

  showEmpty() {
    this.dom.loading?.setAttribute('hidden', '');
    this.dom.empty?.removeAttribute('hidden');
    this.dom.error?.setAttribute('hidden', '');
  },

  showError(msg) {
    this.dom.loading?.setAttribute('hidden', '');
    this.dom.empty?.setAttribute('hidden', '');
    if (this.dom.error) {
      this.dom.error.removeAttribute('hidden');
      const m = this.dom.error.querySelector('.error-message');
      if (m && msg) m.textContent = msg;
    }
  },

  hideStates() {
    this.dom.loading?.setAttribute('hidden', '');
    this.dom.empty?.setAttribute('hidden', '');
    this.dom.error?.setAttribute('hidden', '');
  },

  /* -------- Utilities -------- */
  escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeAttr(str) {
    return this.escape(str);
  },

  formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(n >= 100 ? 0 : 1)} ${units[i]}`;
  },

  formatTime(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
};

/* ============================================================
   DOWNLOADS — Manage downloads with IndexedDB persistence
   ============================================================ */
const Downloads = {
  state: {
    items: [], // { id, title, thumb, quality, size, downloaded, status }
  },

  dom: {},

  db: null,
  DB_NAME: 'x10-downloads',
  STORE: 'items',

  init() {
    this.cacheDom();
    this.openDB().then(() => this.loadFromDB());
    this.bindEvents();
    this.render();
  },

  cacheDom() {
    this.dom = {
      activeList: document.getElementById('downloads-active-list'),
      activeEmpty: document.getElementById('downloads-active-empty'),
      completedGrid: document.getElementById('downloads-completed-grid'),
      completedEmpty: document.getElementById('downloads-completed-empty'),
      emptyAll: document.getElementById('downloads-empty'),
      browseBtn: document.getElementById('downloads-browse-btn'),
      badge: document.getElementById('downloads-badge'),
      activeSection: document.getElementById('downloads-active'),
      completedSection: document.getElementById('downloads-completed'),
    };
  },

  bindEvents() {
    this.dom.browseBtn?.addEventListener('click', () => App.switchPage('movies'));
  },

  /* -------- IndexedDB -------- */
  openDB() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => resolve(null);
    });
  },

  async loadFromDB() {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.STORE, 'readonly');
      const store = tx.objectStore(this.STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        this.state.items = req.result || [];
        this.render();
      };
    } catch (_) {}
  },

  async saveToDB(item) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put(item);
    } catch (_) {}
  },

  async deleteFromDB(id) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).delete(id);
    } catch (_) {}
  },

  /* -------- Public API -------- */
  async add(movie) {
    if (!movie || !movie.identifier) return;

    const exists = this.state.items.some(i => i.id === movie.identifier);
    if (exists) {
      Toast.show('Already in downloads', 'warning');
      return;
    }

    const item = {
      id: movie.identifier,
      title: movie.title || 'Untitled',
      thumb: `${App.config.archiveThumb}/${encodeURIComponent(movie.identifier)}`,
      quality: movie.quality || '',
      size: movie.size || 0,
      downloaded: 0,
      status: 'downloading',
      createdAt: Date.now(),
    };

    this.state.items.unshift(item);
    this.render();
    await this.saveToDB(item);

    // Simulate progress (real download would be implemented via backend)
    this.simulateProgress(item.id);
  },

  simulateProgress(id) {
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;

    const total = item.size || 500 * 1024 * 1024; // 500MB default
    const stepTime = 250;
    const totalSteps = 40;
    const stepSize = total / totalSteps;
    let step = 0;

    const timer = setInterval(async () => {
      step++;
      item.downloaded = Math.min(step * stepSize, total);
      if (step >= totalSteps) {
        item.downloaded = total;
        item.status = 'completed';
        clearInterval(timer);
        Toast.show(`✅ ${item.title} downloaded`, 'success');
      }
      this.render();
      await this.saveToDB(item);
    }, stepTime);
  },

  async remove(id) {
    this.state.items = this.state.items.filter(i => i.id !== id);
    await this.deleteFromDB(id);
    this.render();
  },

  async clearCompleted() {
    this.state.items = this.state.items.filter(i => i.status !== 'completed');
    if (this.db) {
      const tx = this.db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).clear();
      for (const item of this.state.items) {
        tx.objectStore(this.STORE).put(item);
      }
    }
    this.render();
  },

  /* -------- Rendering -------- */
  render() {
    const downloading = this.state.items.filter(i => i.status === 'downloading');
    const completed = this.state.items.filter(i => i.status === 'completed');

    // Active
    if (this.dom.activeList) {
      this.dom.activeList.innerHTML = downloading.map(i => this.renderActive(i)).join('');
      this.bindActiveActions();
    }
    if (this.dom.activeEmpty) this.dom.activeEmpty.hidden = downloading.length > 0;
    if (this.dom.activeSection) this.dom.activeSection.hidden = downloading.length === 0;

    // Completed
    if (this.dom.completedGrid) {
      this.dom.completedGrid.innerHTML = completed.map(i => this.renderCompleted(i)).join('');
      this.bindCompletedActions();
    }
    if (this.dom.completedEmpty) this.dom.completedEmpty.hidden = completed.length > 0;
    if (this.dom.completedSection) this.dom.completedSection.hidden = completed.length === 0;

    // Empty all
    if (this.dom.emptyAll) {
      this.dom.emptyAll.hidden = this.state.items.length > 0;
    }

    // Badge
    if (this.dom.badge) {
      this.dom.badge.hidden = downloading.length === 0;
      this.dom.badge.textContent = String(downloading.length);
    }
  },

  renderActive(item) {
    const pct = item.size ? Math.min(100, Math.round((item.downloaded / item.size) * 100)) : 0;
    const sizeLabel = Movies.formatBytes(item.size);
    const doneLabel = Movies.formatBytes(item.downloaded);

    return `
      <div class="download-item" data-id="${Movies.escapeAttr(item.id)}">
        <div class="download-item-head">
          <div class="download-item-poster">
            ${item.thumb
              ? `<img src="${Movies.escapeAttr(item.thumb)}" alt="" onerror="this.style.display='none';" />`
              : ''}
          </div>
          <div class="download-item-info">
            <div class="download-item-title">${Movies.escape(item.title)}</div>
            <div class="download-item-meta">${item.quality || 'Video'} • ${sizeLabel || '—'}</div>
          </div>
          <div class="download-item-actions">
            <button class="danger" data-action="cancel" aria-label="Cancel download">✕</button>
          </div>
        </div>
        <div class="download-progress">
          <div class="download-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="download-item-stats">
          <span><strong>${pct}%</strong></span>
          <span>${doneLabel} / ${sizeLabel || '—'}</span>
        </div>
        ${sizeLabel ? `<div class="download-warning">⚠️ This download may use approximately ${sizeLabel} of data.</div>` : ''}
      </div>
    `;
  },

  bindActiveActions() {
    this.dom.activeList?.querySelectorAll('[data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const wrap = e.target.closest('.download-item');
        const id = wrap?.dataset.id;
        if (id) this.remove(id);
      });
    });
  },

  renderCompleted(item) {
    return `
      <article class="movie-card" data-id="${Movies.escapeAttr(item.id)}">
        <div class="movie-card-poster">
          ${item.thumb
            ? `<img src="${Movies.escapeAttr(item.thumb)}" alt="${Movies.escapeAttr(item.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div class="movie-card-poster-placeholder" style="display:none;">🎬</div>`
            : `<div class="movie-card-poster-placeholder">🎬</div>`}
          <div class="movie-card-badge">✓ Downloaded</div>
        </div>
        <div class="movie-card-info">
          <h3 class="movie-card-title">${Movies.escape(item.title)}</h3>
          <div class="movie-card-meta">
            <span>💾 ${Movies.formatBytes(item.size)}</span>
          </div>
        </div>
      </article>
    `;
  },

  bindCompletedActions() {
    this.dom.completedGrid?.querySelectorAll('.movie-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const item = this.state.items.find(i => i.id === id);
        if (item) {
          Toast.show(`Playing: ${item.title}`, 'info');
          // Actual playback from IndexedDB blob can be added here
        }
      });
    });
  },
};

/* ============================================================
   AI — Chat interface with Gemini backend
   ============================================================ */
const AI = {
  state: {
    messages: [],
    isStreaming: false,
    abortController: null,
    conversationId: 'default',
  },

  dom: {},

  init() {
    this.cacheDom();
    this.bindEvents();
    this.loadHistory();
  },

  cacheDom() {
    this.dom = {
      conversation: document.getElementById('ai-conversation'),
      welcome: document.getElementById('ai-welcome'),
      suggestions: document.getElementById('ai-suggestions'),
      form: document.getElementById('ai-composer'),
      input: document.getElementById('ai-input'),
      sendBtn: document.getElementById('ai-send-btn'),
      stopBtn: document.getElementById('ai-stop-btn'),
      attachBtn: document.getElementById('ai-attach-btn'),
      fileInput: document.getElementById('ai-file-input'),
      voiceBtn: document.getElementById('ai-voice-btn'),
      newChatBtn: document.getElementById('ai-new-chat-btn'),
      error: document.getElementById('ai-error'),
      retryBtn: document.getElementById('ai-retry-btn'),
    };
  },

  bindEvents() {
    this.dom.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.send();
    });

    this.dom.input?.addEventListener('input', () => {
      this.autoResize();
    });

    this.dom.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    this.dom.stopBtn?.addEventListener('click', () => this.stop());
    this.dom.attachBtn?.addEventListener('click', () => this.dom.fileInput?.click());
    this.dom.newChatBtn?.addEventListener('click', () => this.newChat());
    this.dom.retryBtn?.addEventListener('click', () => this.retry());

    this.dom.suggestions?.querySelectorAll('.ai-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        if (prompt) {
          this.dom.input.value = prompt;
          this.send();
        }
      });
    });

    this.dom.fileInput?.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length) Toast.show(`${files.length} file(s) attached`, 'info');
      e.target.value = '';
    });

    this.dom.voiceBtn?.addEventListener('click', () => this.toggleVoice());
  },

  autoResize() {
    const el = this.dom.input;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  },

  /* -------- Sending -------- */
  async send() {
    const input = this.dom.input;
    if (!input) return;
    const text = input.value.trim();
    if (!text || this.state.isStreaming) return;

    input.value = '';
    this.autoResize();

    this.addMessage('user', text);
    this.hideWelcome();
    this.state.isStreaming = true;
    this.setComposerState('streaming');

    const thinkingId = this.addThinking();

    try {
      const response = await this.callBackend(text);
      this.removeThinking(thinkingId);
      await this.appendAssistantStreaming(response);
      this.saveHistory();
    } catch (err) {
      this.removeThinking(thinkingId);
      if (err.name === 'AbortError') {
        // stopped
      } else {
        this.showError();
      }
      if (App.config.debug) console.error(err);
    } finally {
      this.state.isStreaming = false;
      this.setComposerState('idle');
    }
  },

  async callBackend(message) {
    // Backend endpoint — expects JSON { message, conversationId } → { reply }
    // Never expose API keys here. The backend handles Gemini securely.
    try {
      this.state.abortController = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: this.state.conversationId,
          history: this.state.messages.slice(-10),
        }),
        signal: this.state.abortController.signal,
      });

      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      return data.reply || data.message || 'No response.';
    } catch (err) {
      // Fallback reply if backend is not yet connected
      if (err.name === 'AbortError') throw err;
      return this.fallbackReply(message);
    }
  },

  fallbackReply(message) {
    const lower = message.toLowerCase();
    if (lower.includes('download')) {
      return "To download a movie:\n\n1. Open the movie's details.\n2. Tap **Download**.\n3. Confirm the data size.\n4. It will appear in the **Downloads** tab.\n\nNote: A Download button only appears when the source provides a downloadable video file.";
    }
    if (lower.includes('where') && lower.includes('download')) {
      return "Your downloaded movies are in the **Downloads** tab at the bottom of the screen. Completed downloads appear in the *Downloaded* section.";
    }
    if (lower.includes('why') && lower.includes('download')) {
      return "The Download button only appears when the movie's source provides a legitimate downloadable video file. Some items are streaming-only.";
    }
    return "I'm X10 AI. I can help you find movies, explain downloads, and answer general questions. What would you like to know?";
  },

  stop() {
    if (this.state.abortController) {
      this.state.abortController.abort();
    }
    this.state.isStreaming = false;
    this.setComposerState('idle');
  },

  retry() {
    this.dom.error?.setAttribute('hidden', '');
    const lastUser = [...this.state.messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      this.dom.input.value = lastUser.content;
      this.send();
    }
  },

  /* -------- Messages -------- */
  addMessage(role, content) {
    const msg = { role, content, ts: Date.now() };
    this.state.messages.push(msg);
    this.renderMessage(msg);
  },

  renderMessage(msg, streaming) {
    const container = this.dom.conversation;
    if (!container) return null;

    const el = document.createElement('div');
    el.className = `ai-msg ${msg.role}`;

    const bubble = document.createElement('div');
    bubble.className = 'ai-msg-bubble';
    bubble.innerHTML = this.formatMessage(msg.content);

    el.appendChild(bubble);

    if (msg.role === 'assistant') {
      const time = document.createElement('span');
      time.className = 'ai-msg-time';
      time.textContent = new Date(msg.ts).toLocaleTimeString();
      el.appendChild(time);
    }

    container.appendChild(el);
    this.scrollBottom();

    return el;
  },

  formatMessage(text) {
    if (!text) return '';
    let safe = Movies.escape(text);

    // Code blocks
    safe = safe.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    safe = safe.replace(/\n/g, '<br />');

    return safe;
  },

  addThinking() {
    const container = this.dom.conversation;
    if (!container) return null;
    const el = document.createElement('div');
    el.className = 'ai-typing';
    el.id = 'ai-typing-' + Date.now();
    el.innerHTML = `
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
    `;
    container.appendChild(el);
    this.scrollBottom();
    return el.id;
  },

  removeThinking(id) {
    if (!id) return;
    document.getElementById(id)?.remove();
  },

  async appendAssistantStreaming(text) {
    // Simulated streaming — chunks of words
    const msg = { role: 'assistant', content: '', ts: Date.now() };
    const el = this.renderMessage(msg);
    if (!el) return;
    const bubble = el.querySelector('.ai-msg-bubble');

    const words = text.split(/(\s+)/);
    let acc = '';
    for (let i = 0; i < words.length; i++) {
      acc += words[i];
      bubble.innerHTML = this.formatMessage(acc);
      this.scrollBottom();
      await this.delay(12);
    }
    msg.content = text;
    this.state.messages.push(msg);
  },

  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  scrollBottom() {
    const c = this.dom.conversation;
    if (c) c.scrollTop = c.scrollHeight;
  },

  hideWelcome() {
    if (this.dom.welcome) this.dom.welcome.hidden = true;
    if (this.dom.error) this.dom.error.hidden = true;
  },

  showError() {
    if (this.dom.error) this.dom.error.hidden = false;
  },

  setComposerState(state) {
    const streaming = state === 'streaming';
    if (this.dom.sendBtn) this.dom.sendBtn.hidden = streaming;
    if (this.dom.stopBtn) this.dom.stopBtn.hidden = !streaming;
  },

  /* -------- Voice -------- */
  toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      Toast.show('Voice input not supported', 'warning');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onstart = () => Toast.show('Listening...', 'info');
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      if (this.dom.input) this.dom.input.value = t;
      this.send();
    };
    rec.onerror = () => Toast.show('Could not hear you', 'warning');
    rec.start();
  },

  /* -------- History -------- */
  saveHistory() {
    try {
      localStorage.setItem('x10-ai-history', JSON.stringify(this.state.messages.slice(-50)));
    } catch (_) {}
  },

  loadHistory() {
    try {
      const raw = localStorage.getItem('x10-ai-history');
      if (raw) {
        this.state.messages = JSON.parse(raw) || [];
        if (this.state.messages.length) {
          this.hideWelcome();
          this.state.messages.forEach(m => this.renderMessage(m));
        }
      }
    } catch (_) {}
  },

  newChat() {
    this.state.messages = [];
    this.state.conversationId = 'conv-' + Date.now();
    if (this.dom.conversation) this.dom.conversation.innerHTML = '';
    if (this.dom.welcome) this.dom.welcome.hidden = false;
    try { localStorage.removeItem('x10-ai-history'); } catch (_) {}
    Toast.show('New chat', 'info');
  },
};

/* ============================================================
   TOAST — Notifications
   ============================================================ */
const Toast = {
  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    this.container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
};

/* ============================================================
   PWA — Service worker registration & online/offline
   ============================================================ */
const PWA = {
  init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('sw.js')
        .catch(() => {
          if (App.config.debug) console.warn('SW registration failed');
        });
    }

    window.addEventListener('appinstalled', () => {
      App.state.isInstalled = true;
      Toast.show('✅ X10 installed', 'success');
    });
  },
};

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
