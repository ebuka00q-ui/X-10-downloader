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
      this.dom.video?.addEventListener('error',          () => Toast.show('Playback error', 'error'));

      this.dom.quality?.addEventListener('change', () => {
        const url = this.dom.quality.value;
        if (!url || !this.dom.video) return;
        const t = this.dom.video.currentTime;
        const playing = !this.dom.video.paused;
        this.dom.video.src = url;
        this.dom.video.currentTime = t;
        if (playing) this.dom.video.play().catch(() => {});
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.dom.overlay && !this.dom.overlay.hidden) this.close();
      });
    },

    open({ title, url, files }) {
      if (!this.dom.overlay || !this.dom.video) return;

      this.dom.overlay.hidden = false;
      this.dom.title.textContent = title || '';
      document.body.classList.add('no-scroll');

      // Quality options
      this.dom.quality.innerHTML = '';
      if (files && files.length > 1) {
        files.forEach((f, i) => {
          const opt = document.createElement('option');
          opt.value       = f.url;
          opt.textContent = f.format || `Quality ${i + 1}`;
          if (i === 0) opt.selected = true;
          this.dom.quality.appendChild(opt);
        });
        this.dom.quality.parentElement.style.display = '';
        this.dom.video.src = files[0].url;
      } else {
        this.dom.quality.parentElement.style.display = 'none';
        this.dom.video.src = url;
      }

      this.dom.video.play().catch(() => {});
    },

    updateTime() {
      if (!this.dom.video || !this.dom.time) return;
      this.dom.time.textContent = `${formatTime(this.dom.video.currentTime)} / ${formatTime(this.dom.video.duration)}`;
    },

    close() {
      if (!this.dom.overlay) return;
      this.dom.overlay.hidden = true;
      document.body.classList.remove('no-scroll');
      if (this.dom.video) {
        this.dom.video.pause();
        this.dom.video.removeAttribute('src');
        this.dom.video.load();
      }
    }
  };

  // ============================================================
  // DOWNLOAD CONFIRM DIALOG
  // ============================================================
  const DownloadConfirm = {
    dom: {},
    onConfirm: null,

    init() {
      this.cacheDom();
      this.bindEvents();
    },

    cacheDom() {
      this.dom = {
        overlay: document.getElementById('download-confirm-overlay'),
        size:    document.getElementById('download-confirm-size'),
        cancel:  document.getElementById('download-confirm-cancel'),
        start:   document.getElementById('download-confirm-start')
      };
    },

    bindEvents() {
      this.dom.cancel?.addEventListener('click', () => this.close());
      this.dom.start?.addEventListener('click', () => {
        if (typeof this.onConfirm === 'function') this.onConfirm();
        this.close();
      });
      this.dom.overlay?.addEventListener('click', (e) => {
        if (e.target === this.dom.overlay) this.close();
      });
    },

    open({ size, onConfirm }) {
      this.dom.size.textContent = formatBytes(size);
      this.onConfirm = onConfirm;
      this.dom.overlay.hidden = false;
      document.body.classList.add('no-scroll');
    },

    close() {
      this.dom.overlay.hidden = true;
      document.body.classList.remove('no-scroll');
      this.onConfirm = null;
    }
  };

  // ============================================================
  // DOWNLOADS MODULE
  // ============================================================
  const Downloads = {
    items: [],
    dom: {},
    activeFetches: {}, // id → AbortController

    init() {
      this.cacheDom();
      this.bindEvents();
      this.load();
      this.render();
    },

    cacheDom() {
      this.dom = {
        activeSection:   document.getElementById('downloads-active'),
        activeList:      document.getElementById('downloads-active-list'),
        activeEmpty:     document.getElementById('downloads-active-empty'),
        completedSection:document.getElementById('downloads-completed'),
        completedGrid:   document.getElementById('downloads-completed-grid'),
        completedEmpty:  document.getElementById('downloads-completed-empty'),
        empty:           document.getElementById('downloads-empty'),
        browseBtn:       document.getElementById('downloads-browse-btn')
      };
    },

    bindEvents() {
      this.dom.browseBtn?.addEventListener('click', () => App.navigateTo('movies'));

      // Delegate actions
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-dl-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.dlAction;
        if (action === 'cancel') this.cancel(id);
        if (action === 'remove') this.remove(id);
      });
    },

    load() {
      this.items = storage.get(CONFIG.storage.downloads, []) || [];
      // Mark stale 'downloading' items as failed on reload (can't resume)
      this.items.forEach(i => {
        if (i.status === 'downloading') i.status = 'failed';
      });
      this.save();
    },

    save() {
      storage.set(CONFIG.storage.downloads, this.items);
    },

    add(movie, file) {
      const url = `${CONFIG.api.archiveDownload}/${movie.identifier}/${encodeURIComponent(file.name)}`;

      const item = {
        id:         'dl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        identifier: movie.identifier,
        title:      movie.title,
        thumb:      movie.thumb,
        fileName:   file.name,
        size:       Number(file.size) || 0,
        url,
        progress:   0,
        downloaded: 0,
        status:     'downloading',
        createdAt:  Date.now()
      };

      this.items.unshift(item);
      this.save();
      this.render();
      Toast.show('Download started', 'success');
      this.startDownload(item.id);
    },

    async startDownload(id) {
      const item = this.items.find(i => i.id === id);
      if (!item) return;

      // Very large files → direct browser download (no progress)
      if (item.size > CONFIG.download.maxBlobSize) {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        item.status = 'completed';
        item.progress = 100;
        item.downloaded = item.size;
        this.save();
        this.render();
        App.updateDownloadsBadge();
        return;
      }

      const controller = new AbortController();
      this.activeFetches[id] = controller;

      try {
        const res = await fetch(item.url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const contentLength = Number(res.headers.get('content-length')) || item.size || 0;
        item.size = contentLength;

        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          item.downloaded = received;
          item.progress = contentLength
            ? Math.min(100, Math.round((received / contentLength) * 100))
            : 0;
          this.updateProgressRow(item);
        }

        // Trigger browser save
        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = item.fileName || `${item.title}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        item.status = 'completed';
        item.progress = 100;
        item.downloaded = contentLength;
        item.completedAt = Date.now();
        this.save();
        this.render();
        App.updateDownloadsBadge();
        Toast.show('Download complete', 'success');
      } catch (err) {
        if (err.name === 'AbortError') {
          log('Download cancelled:', id);
          return;
        }
        error('Download failed:', err);
        item.status = 'failed';
        this.save();
        this.render();
        App.updateDownloadsBadge();
        Toast.show('Download failed', 'error');
      } finally {
        delete this.activeFetches[id];
      }
    },

    updateProgressRow(item) {
      const row = this.dom.activeList?.querySelector(`[data-download-id="${item.id}"]`);
      if (!row) return;

      const fill = row.querySelector('.download-progress-fill');
      const stats = row.querySelector('[data-stats]');

      if (fill)  fill.style.width = item.progress + '%';
      if (stats) {
        stats.innerHTML = `
          <span>${formatBytes(item.downloaded)} / ${formatBytes(item.size)}</span>
          <strong>${item.progress}%</strong>`;
      }
    },

    cancel(id) {
      const controller = this.activeFetches[id];
      if (controller) controller.abort();
      this.items = this.items.filter(i => i.id !== id);
      this.save();
      this.render();
      App.updateDownloadsBadge();
      Toast.show('Download cancelled', 'info');
    },

    remove(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.save();
      this.render();
      App.updateDownloadsBadge();
      Toast.show('Removed', 'info');
    },

    render() {
      const active    = this.items.filter(i => i.status === 'downloading');
      const completed = this.items.filter(i => i.status === 'completed');
      const failed    = this.items.filter(i => i.status === 'failed');

      // Active section
      if (active.length === 0) {
        this.dom.activeList.innerHTML = '';
        this.dom.activeEmpty.hidden = false;
      } else {
        this.dom.activeEmpty.hidden = true;
        this.dom.activeList.innerHTML = active.map(i => this.renderActive(i)).join('');
      }

      // Completed + failed grouped as "Downloaded" section
      const done = [...completed, ...failed];
      if (done.length === 0) {
        this.dom.completedGrid.innerHTML = '';
        this.dom.completedEmpty.hidden = false;
      } else {
        this.dom.completedEmpty.hidden = true;
        this.dom.completedGrid.innerHTML = done.map(i => this.renderCompleted(i)).join('');
      }

      // Global empty
      const isEmpty = active.length === 0 && done.length === 0;
      this.dom.empty.hidden = !isEmpty;
      this.dom.activeSection.hidden = isEmpty;
      this.dom.completedSection.hidden = isEmpty;
    },

    renderActive(item) {
      return `
        <div class="download-item" data-download-id="${item.id}">
          <div class="download-item-head">
            <div class="download-item-poster">
              <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"
                   onerror="this.style.display='none';this.parentElement.innerHTML='🎬';">
            </div>
            <div class="download-item-info">
              <div class="download-item-title">${escapeHtml(item.title)}</div>
              <div class="download-item-meta">
                ${item.size ? formatBytes(item.size) : 'Downloading…'}
              </div>
            </div>
            <div class="download-item-actions">
              <button type="button" data-dl-action="cancel" data-id="${item.id}" aria-label="Cancel">✕</button>
            </div>
          </div>
          <div class="download-progress">
            <div class="download-progress-fill" style="width: ${item.progress}%"></div>
          </div>
          <div class="download-item-stats" data-stats>
            <span>${formatBytes(item.downloaded)} / ${formatBytes(item.size)}</span>
            <strong>${item.progress}%</strong>
          </div>
          <div class="download-warning">
            ⚠️ This download may use approximately ${formatBytes(item.size)} of data.
          </div>
        </div>`;
    },

    renderCompleted(item) {
      const failed = item.status === 'failed';
      return `
        <article class="movie-card" tabindex="0" role="button" aria-label="${escapeHtml(item.title)}">
          <div class="movie-card-poster">
            <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');">
            <div class="movie-card-poster-placeholder" style="display:none">🎬</div>
            <span class="movie-card-badge">${failed ? '⚠ Failed' : '✓ Downloaded'}</span>
          </div>
          <div class="movie-card-info">
            <div class="movie-card-title">${escapeHtml(item.title)}</div>
            <div class="movie-card-meta">
              <span>${formatBytes(item.size)}</span>
            </div>
          </div>
          <div class="download-item-actions" style="position:absolute;top:8px;right:8px;">
            <button type="button" data-dl-action="remove" data-id="${item.id}" aria-label="Remove"
                    style="background:rgba(0,0,0,0.6);color:#fff;border:none;width:32px;height:32px;border-radius:50%;">✕</button>
          </div>
        </article>`;
    },

    getActiveCount() {
      return this.items.filter(i => i.status === 'downloading').length;
    }
  };
  
