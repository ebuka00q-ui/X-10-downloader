/**
 * ============================================================
 * X10 — APPLICATION JAVASCRIPT
 * Movies (Internet Archive) · Downloads · AI (via backend)
 * ============================================================
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const CONFIG = {
    debug: false,

    api: {
      // Internet Archive (public, no key needed)
      archiveSearch:   'https://archive.org/advancedsearch.php',
      archiveMetadata: 'https://archive.org/metadata',
      archiveDownload: 'https://archive.org/download',
      archiveThumb:    'https://archive.org/services/img',
      // Your backend — set this to your Vercel endpoint (Gemini key lives there)
      ai:              '/api/ai'
    },

    movies: {
      rowsPerPage: 24
    },

    storage: {
      downloads: 'x10_downloads',
      chat:      'x10_chat_history'
    },

    download: {
      maxBlobSize: 500 * 1024 * 1024 // 500 MB — larger uses direct link
    }
  };

  // ============================================================
  // UTILITIES
  // ============================================================
  const Utils = {
    log:   (...a) => { if (CONFIG.debug) console.log('[X10]', ...a); },
    warn:  (...a) => { if (CONFIG.debug) console.warn('[X10]', ...a); },
    error: (...a) => console.error('[X10]', ...a),

    escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    formatBytes(bytes) {
      const n = Number(bytes);
      if (!n || n < 1) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
      const val = n / Math.pow(k, i);
      return `${val.toFixed(i > 1 ? 1 : 0)} ${sizes[i]}`;
    },

    formatTime(sec) {
      if (!isFinite(sec) || sec < 0) return '00:00';
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    storage: {
      get(key, fallback = null) {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch { return false; }
      }
    }
  };

  const { log, warn, error, escapeHtml, formatBytes, formatTime, storage } = Utils;

  // ============================================================
  // TOAST
  // ============================================================
  const Toast = {
    container: null,

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
        el.style.transition = 'all 0.25s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => el.remove(), 260);
      }, duration);
    }
  };

  // ============================================================
  // MOVIES MODULE
  // ============================================================
  const Movies = {
    state: {
      query:    '',
      category: 'all',
      year:     '',
      page:     1,
      items:    [],
      loading:  false,
      hasMore:  true
    },

    dom: {},

    categoryQueries: {
      all:         '',
      action:      'subject:("action")',
      comedy:      'subject:("comedy")',
      drama:       'subject:("drama")',
      horror:      'subject:("horror")',
      'sci-fi':    'subject:("science fiction")',
      animation:   'subject:("animation")',
      documentary: 'subject:("documentary")',
      romance:     'subject:("romance")',
      thriller:    'subject:("thriller")'
    },

    init() {
      this.cacheDom();
      this.bindEvents();
      this.search({ reset: true });
    },

    cacheDom() {
      this.dom = {
        page:         document.getElementById('page-movies'),
        form:         document.getElementById('movies-search-form'),
        input:        document.getElementById('movies-search-input'),
        clearBtn:     document.getElementById('movies-search-clear'),
        catList:      document.getElementById('movies-categories-list'),
        yearSelect:   document.getElementById('movies-year-select'),
        grid:         document.getElementById('movies-grid'),
        loading:      document.getElementById('movies-loading'),
        empty:        document.getElementById('movies-empty'),
        error:        document.getElementById('movies-error'),
        retryBtn:     document.getElementById('movies-retry-btn'),
        loadMoreWrap: document.getElementById('movies-load-more-wrap'),
        loadMoreBtn:  document.getElementById('movies-load-more-btn')
      };
    },

    bindEvents() {
      // Search form
      this.dom.form?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.state.query = this.dom.input.value.trim();
        this.search({ reset: true });
      });

      // Clear button
      this.dom.clearBtn?.addEventListener('click', () => {
        this.dom.input.value = '';
        this.state.query = '';
        this.dom.clearBtn.hidden = true;
        this.search({ reset: true });
      });

      // Show/hide clear button
      this.dom.input?.addEventListener('input', () => {
        this.dom.clearBtn.hidden = !this.dom.input.value;
      });

      // Category chips
      this.dom.catList?.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip');
        if (!chip) return;
        this.dom.catList.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.state.category = chip.dataset.category;
        this.search({ reset: true });
      });

      // Year filter
      this.dom.yearSelect?.addEventListener('change', () => {
        this.state.year = this.dom.yearSelect.value;
        this.search({ reset: true });
      });

      // Retry
      this.dom.retryBtn?.addEventListener('click', () => this.search({ reset: true }));

      // Load more
      this.dom.loadMoreBtn?.addEventListener('click', () => {
        this.state.page++;
        this.search({ append: true });
      });

      // Card click → details
      this.dom.grid?.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (!card) return;
        const id = card.dataset.id;
        const item = this.state.items.find(i => i.identifier === id);
        if (item) MovieDetails.open(item);
      });

      // Keyboard activation on cards
      this.dom.grid?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.movie-card');
        if (!card) return;
        e.preventDefault();
        card.click();
      });
    },

    buildQuery() {
      const parts = ['mediatype:(movies)'];

      if (this.state.query) {
        const q = this.state.query.replace(/["()]/g, ' ').trim();
        if (q) parts.push(`(title:(${q}) OR description:(${q}))`);
      }

      const catQuery = this.categoryQueries[this.state.category];
      if (catQuery) parts.push(`(${catQuery})`);

      if (this.state.year) {
        parts.push(`year:(${this.state.year})`);
      }

      return parts.join(' AND ');
    },

    async search({ reset = false, append = false } = {}) {
      if (this.state.loading) return;

      if (reset) {
        this.state.page    = 1;
        this.state.items   = [];
        this.state.hasMore = true;
      }

      this.state.loading = true;
      this.showLoading(!append);

      const params = new URLSearchParams();
      params.append('q', this.buildQuery());
      ['identifier', 'title', 'year', 'description', 'creator', 'downloads', 'subject']
        .forEach(f => params.append('fl[]', f));
      params.append('sort[]', 'downloads desc');
      params.append('rows',   String(CONFIG.movies.rowsPerPage));
      params.append('page',   String(this.state.page));
      params.append('output', 'json');

      const url = `${CONFIG.api.archiveSearch}?${params.toString()}`;
      log('Search URL:', url);

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const docs = (data?.response?.docs || []).map(d => ({
          identifier: d.identifier,
          title:      Array.isArray(d.title) ? d.title[0] : (d.title || 'Untitled'),
          year:       Array.isArray(d.year) ? d.year[0]  : (d.year || ''),
          description:Array.isArray(d.description) ? d.description[0] : (d.description || ''),
          creator:    Array.isArray(d.creator) ? d.creator[0] : (d.creator || ''),
          subject:    Array.isArray(d.subject) ? d.subject : (d.subject ? [d.subject] : []),
          downloads:  d.downloads || 0,
          thumb:      `${CONFIG.api.archiveThumb}/${d.identifier}`
        }));

        this.state.items = append ? [...this.state.items, ...docs] : docs;
        this.state.hasMore = docs.length >= CONFIG.movies.rowsPerPage;

        this.render();
      } catch (err) {
        error('Movies search failed:', err);
        this.showError();
      } finally {
        this.state.loading = false;
      }
    },

    render() {
      this.hideAllStates();

      if (this.state.items.length === 0) {
        this.dom.empty.hidden = false;
        this.dom.grid.style.display = 'none';
        this.dom.loadMoreWrap.hidden = true;
        return;
      }

      this.dom.grid.style.display = 'grid';
      this.dom.grid.innerHTML = this.state.items.map(item => this.renderCard(item)).join('');
      this.dom.loadMoreWrap.hidden = !this.state.hasMore;
    },

    renderCard(item) {
      const year   = item.year ? String(item.year) : '';
      const genre  = item.subject?.[0] ? String(item.subject[0]).slice(0, 22) : '';
      const isHot  = item.downloads > 10000;

      return `
        <article class="movie-card" data-id="${escapeHtml(item.identifier)}" tabindex="0" role="button" aria-label="${escapeHtml(item.title)}">
          <div class="movie-card-poster">
            <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="movie-card-poster-placeholder" style="display:none" aria-hidden="true">🎬</div>
            ${isHot ? '<span class="movie-card-badge">Popular</span>' : ''}
          </div>
          <div class="movie-card-info">
            <div class="movie-card-title">${escapeHtml(item.title)}</div>
            <div class="movie-card-meta">
              ${year  ? `<span>${escapeHtml(year)}</span>` : ''}
              ${genre ? `<span>${escapeHtml(genre)}</span>` : ''}
            </div>
          </div>
        </article>`;
    },

    showLoading(full) {
      if (full) {
        this.dom.grid.innerHTML = '';
        this.dom.grid.style.display = 'none';
      }
      this.dom.loading.hidden = !full;
      this.dom.empty.hidden   = true;
      this.dom.error.hidden   = true;
      this.dom.loadMoreWrap.hidden = true;
    },

    showError() {
      this.hideAllStates();
      this.dom.error.hidden = false;
      this.dom.grid.style.display = 'none';
      this.dom.loadMoreWrap.hidden = true;
    },

    hideAllStates() {
      this.dom.loading.hidden = true;
      this.dom.empty.hidden   = true;
      this.dom.error.hidden   = true;
    }
  };

  // ============================================================
  // MOVIE DETAILS MODULE
  // ============================================================
  const MovieDetails = {
    dom: {},
    current: null,
    videoFiles: [],

    init() {
      this.cacheDom();
      this.bindEvents();
    },

    cacheDom() {
      this.dom = {
        overlay: document.getElementById('movie-details-overlay'),
        close:   document.getElementById('movie-details-close'),
        content: document.getElementById('movie-details-content')
      };
    },

    bindEvents() {
      this.dom.close?.addEventListener('click', () => this.close());
      this.dom.overlay?.addEventListener('click', (e) => {
        if (e.target === this.dom.overlay) this.close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.dom.overlay && !this.dom.overlay.hidden) this.close();
      });
    },

    async open(item) {
      this.current = item;
      this.dom.overlay.hidden = false;
      document.body.classList.add('no-scroll');

      // Loading state
      this.dom.content.innerHTML = `
        <div class="movie-details-hero">
          <img src="${escapeHtml(item.thumb)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="movie-details-hero-placeholder" style="display:none">🎬</div>
        </div>
        <div class="movie-details-body">
          <h2 class="movie-details-title">${escapeHtml(item.title)}</h2>
          <p class="movie-details-description">Loading details…</p>
        </div>`;

      try {
        const res = await fetch(`${CONFIG.api.archiveMetadata}/${item.identifier}`);
        if (!res.ok) throw new Error('Metadata failed');
        const meta = await res.json();
        this.render(meta);
      } catch (err) {
        warn('Metadata unavailable:', err);
        this.render({ metadata: item, files: [] });
      }
    },

    render(meta) {
      const item    = this.current;
      const md      = meta.metadata || {};
      const files   = meta.files || [];

      // Find video files
      this.videoFiles = files.filter(f => {
        if (!f.name) return false;
        const ext = f.name.toLowerCase().split('.').pop();
        const isVideoExt = ['mp4', 'webm', 'ogv', 'ogg', 'mkv', 'avi', 'mov', 'm4v'].includes(ext);
        const fmt = (f.format || '').toLowerCase();
        const isVideoFmt = fmt.includes('mpeg4') || fmt.includes('h.264') || fmt.includes('webm') ||
                           fmt.includes('matroska') || fmt.includes('quicktime') || fmt.includes('ogg video');
        return isVideoExt || isVideoFmt;
      });

      const preferred = this.pickPreferred(this.videoFiles);

      const title       = md.title || item.title;
      const year        = md.year || item.year || '';
      const creator     = md.creator || item.creator || '';
      const description = md.description || item.description || 'No description available.';
      const subjects = []
        .concat(md.subject  ? (Array.isArray(md.subject) ? md.subject : [md.subject]) : [])
        .concat(item.subject || [])
        .slice(0, 5);

      const heroImg = item.thumb;
      const hasVideo = this.videoFiles.length > 0;

      this.dom.content.innerHTML = `
        <div class="movie-details-hero">
          <img src="${escapeHtml(heroImg)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="movie-details-hero-placeholder" style="display:none">🎬</div>
        </div>
        <div class="movie-details-body">
          <h2 class="movie-details-title" id="movie-details-title">${escapeHtml(title)}</h2>

          <div class="movie-details-meta">
            ${year    ? `<span>📅 ${escapeHtml(String(year))}</span>` : ''}
            ${creator ? `<span>🎬 ${escapeHtml(String(creator).slice(0, 40))}</span>` : ''}
            ${preferred?.size ? `<span>📦 ${formatBytes(preferred.size)}</span>` : ''}
            ${preferred?.format ? `<span>🎞 ${escapeHtml(String(preferred.format))}</span>` : ''}
          </div>

          ${subjects.length ? `
            <div class="movie-details-meta">
              ${subjects.map(s => `<span>${escapeHtml(String(s).slice(0, 30))}</span>`).join('')}
            </div>` : ''}

          <p class="movie-details-description">${escapeHtml(String(description).slice(0, 800))}</p>

          <div class="movie-details-source">
            Source: Internet Archive · ${escapeHtml(item.identifier)}
          </div>

          ${hasVideo ? `
            <div class="movie-details-actions">
              <button type="button" class="btn btn-primary" id="movie-watch-btn">▶ Watch</button>
              ${preferred ? `<button type="button" class="btn btn-secondary" id="movie-download-btn">⬇ Download</button>` : ''}
            </div>
            ${preferred?.size ? `
              <p class="movie-details-data-size">
                ⚠️ Download may use approximately ${formatBytes(preferred.size)} of data.
              </p>` : ''}
          ` : `
            <div class="movie-details-source" style="border-left-color: var(--warning); color: var(--warning)">
              ⚠️ No playable video file available for this item.
            </div>
          `}
        </div>`;

      // Bind actions
      document.getElementById('movie-watch-btn')
        ?.addEventListener('click', () => this.watch(preferred));

      document.getElementById('movie-download-btn')
        ?.addEventListener('click', () => this.confirmDownload(preferred));
    },

    pickPreferred(files) {
      if (!files.length) return null;
      // Prefer MP4 for browser compatibility
      const mp4 = files.find(f => /\.mp4$/i.test(f.name));
      if (mp4) return mp4;
      // Otherwise largest
      return files.slice().sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))[0];
    },

    watch(file) {
      if (!file) return;
      const files = this.videoFiles.map(f => ({
        name:   f.name,
        format: f.format || f.name.split('.').pop().toUpperCase(),
        url:    `${CONFIG.api.archiveDownload}/${this.current.identifier}/${encodeURIComponent(f.name)}`
      }));
      Player.open({
        title: this.current.title,
        url:   `${CONFIG.api.archiveDownload}/${this.current.identifier}/${encodeURIComponent(file.name)}`,
        files
      });
    },

    confirmDownload(file) {
      if (!file) return;
      DownloadConfirm.open({
        size: file.size ? Number(file.size) : 0,
        onConfirm: () => {
          Downloads.add(this.current, file);
          App.updateDownloadsBadge();
        }
      });
    },

    close() {
      this.dom.overlay.hidden = true;
      document.body.classList.remove('no-scroll');
      this.current    = null;
      this.videoFiles = [];
    }
  };

  // ============================================================
  // PLAYER MODULE
  // ============================================================
  const Player = {
    dom: {},

    init() {
      this.cacheDom();
      this.bindEvents();
    },

    cacheDom() {
      this.dom = {
        overlay: document.getElementById('player-overlay'),
        close:   document.getElementById('player-close'),
        title:   document.getElementById('player-title'),
        video:   document.getElementById('player-video'),
        time:    document.getElementById('player-time'),
        quality: document.getElementById('player-quality')
      };
    },

    bindEvents() {
      this.dom.close?.addEventListener('click', () => this.close());

      this.dom.video?.addEventListener('timeupdate',     () => this.updateTime());
      this.dom.video?.addEventListener('loadedmetadata', () => this.updateTime());
      this.dom.vi
