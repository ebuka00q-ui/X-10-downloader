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
    if (!navigator.onLine) this.setOfflineNotice(true);
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
    if (!App.state.isOnline) {
      this.showError('You are offline');
      return;
    }

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
      const q = this.g
