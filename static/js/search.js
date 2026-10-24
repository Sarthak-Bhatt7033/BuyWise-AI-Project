/**
 * BuyWise AI — Search Page JS (search.js)
 * Handles the full search UX:
 *  - Search input with suggestions dropdown
 *  - API call to /api/search with fetch
 *  - Skeleton loader management
 *  - Result card rendering (with trust score ring, pros/cons, specs)
 *  - Empty, error, and loading states
 *  - Trending tag quick-search
 */

(function () {
  'use strict';

  // ── Static suggestions data ──────────────────────────────────────────────
  const SUGGESTIONS = [
    { text: 'iPhone 15 Pro', category: 'Smartphone', emoji: '📱' },
    { text: 'Sony WH-1000XM5', category: 'Headphones', emoji: '🎧' },
    { text: 'MacBook Pro M3', category: 'Laptop', emoji: '💻' },
    { text: 'Samsung 4K OLED TV', category: 'Television', emoji: '📺' },
    { text: 'DJI Mini 4 Pro', category: 'Drone', emoji: '🚁' },
    { text: 'iPad Pro M4', category: 'Tablet', emoji: '📲' },
    { text: 'Sony PlayStation 5', category: 'Gaming Console', emoji: '🎮' },
    { text: 'Dyson V15 Detect', category: 'Vacuum Cleaner', emoji: '🌀' },
    { text: 'Apple Watch Ultra 2', category: 'Smartwatch', emoji: '⌚' },
    { text: 'Nikon Z8', category: 'Camera', emoji: '📷' },
  ];

  // ── State ────────────────────────────────────────────────────────────────
  let isLoading = false;
  let activeHighlight = -1;
  let filteredSuggestions = [];

  // ── DOM References ───────────────────────────────────────────────────────
  const searchInput    = document.getElementById('search-input');
  const searchForm     = document.getElementById('search-form');
  const submitBtn      = document.getElementById('search-submit');
  const suggestionsBox = document.getElementById('search-suggestions');
  const resultsArea    = document.getElementById('search-results');
  const emptyState     = document.getElementById('empty-state');
  const thinkingState  = document.getElementById('ai-thinking');
  const errorState     = document.getElementById('error-state');

  if (!searchInput) return; // Not on search page

  /* ── Suggestions Dropdown ────────────────────────────────────────────────── */
  searchInput.addEventListener('input', onInputChange);
  searchInput.addEventListener('keydown', onInputKeydown);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.length >= 1) showSuggestions(searchInput.value);
  });

  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      hideSuggestions();
    }
  });

  function onInputChange() {
    const val = searchInput.value.trim();
    activeHighlight = -1;
    if (val.length >= 1) {
      showSuggestions(val);
    } else {
      hideSuggestions();
    }
  }

  function showSuggestions(query) {
    filteredSuggestions = SUGGESTIONS.filter(s =>
      s.text.toLowerCase().includes(query.toLowerCase()) ||
      s.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    if (!filteredSuggestions.length) {
      hideSuggestions();
      return;
    }

    suggestionsBox.innerHTML = `
      <div class="suggestions-header">Suggestions</div>
      ${filteredSuggestions.map((s, i) => `
        <div class="suggestion-item" data-index="${i}" role="option">
          <div class="suggestion-icon">${s.emoji}</div>
          <div>
            <div class="suggestion-text">${highlightMatch(s.text, query)}</div>
            <div class="suggestion-cat">${s.category}</div>
          </div>
        </div>
      `).join('')}
    `;

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index, 10);
        const s = filteredSuggestions[idx];
        searchInput.value = s.text;
        hideSuggestions();
        doSearch(s.text);
      });
    });

    suggestionsBox.classList.add('visible');
  }

  function hideSuggestions() {
    suggestionsBox.classList.remove('visible');
    activeHighlight = -1;
  }

  function onInputKeydown(e) {
    const items = suggestionsBox.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeHighlight = Math.min(activeHighlight + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeHighlight = Math.max(activeHighlight - 1, -1);
      updateHighlight(items);
    } else if (e.key === 'Escape') {
      hideSuggestions();
    } else if (e.key === 'Enter' && activeHighlight >= 0) {
      e.preventDefault();
      const s = filteredSuggestions[activeHighlight];
      if (s) {
        searchInput.value = s.text;
        hideSuggestions();
        doSearch(s.text);
      }
    }
  }

  function updateHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === activeHighlight);
    });
  }

  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(108,99,255,0.25);color:inherit;border-radius:2px;padding:0 1px;">$1</mark>');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ── Form Submit ─────────────────────────────────────────────────────────── */
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        searchInput.focus();
        return;
      }
      hideSuggestions();
      doSearch(query);
    });
  }

  /* ── Trending Tags ───────────────────────────────────────────────────────── */
  document.querySelectorAll('.trending-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.textContent.trim();
      searchInput.value = text;
      hideSuggestions();
      doSearch(text);
    });
  });

  /* ── Main Search Function ────────────────────────────────────────────────── */
  async function doSearch(query) {
    if (isLoading) return;
    isLoading = true;

    // Transition states
    setState('loading');

    // Update URL param without page reload
    const url = new URL(window.location);
    url.searchParams.set('q', query);
    history.replaceState({}, '', url);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();

      if (response.status === 401 || json.code === 'AUTH_REQUIRED') {
        window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Search failed. Please try again.');
      }

      renderResults(json.data);
      setState('results');

    } catch (err) {
      showError(err.message || 'An unexpected error occurred.');
      setState('error');
    } finally {
      isLoading = false;
      setSubmitLoading(false);
    }
  }

  /* ── State Management ────────────────────────────────────────────────────── */
  function setState(state) {
    emptyState.style.display   = state === 'empty'   ? 'flex'   : 'none';
    thinkingState.style.display = state === 'loading' ? 'flex'  : 'none';
    errorState.style.display   = state === 'error'   ? 'flex'   : 'none';
    resultsArea.style.display  = state === 'results'  ? 'block'  : 'none';

    if (state === 'loading') {
      setSubmitLoading(true);
    }
  }

  function setSubmitLoading(loading) {
    if (!submitBtn) return;
    submitBtn.classList.toggle('loading', loading);
    const icon = submitBtn.querySelector('.submit-icon');
    const spin = submitBtn.querySelector('.submit-spinner');
    if (icon) icon.style.display = loading ? 'none' : 'flex';
    if (spin) spin.style.display = loading ? 'flex' : 'none';
  }

  function showError(msg) {
    const msgEl = document.getElementById('error-message');
    if (msgEl) msgEl.textContent = msg;
  }

  /* ── Result Rendering ────────────────────────────────────────────────────── */
  function renderResults(data) {
    console.log('[SEARCH UI] Rendering product search results:', data);
    const {
      product_name, brand, category, price_range, ai_description,
      specifications = [], pros = [], cons = [], best_for, trust_score = 75
    } = data;

    // Clamp trust score
    const score = Math.max(0, Math.min(100, trust_score));
    const scoreColor = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
    const categoryEmoji = getCategoryEmoji(category);

    // SVG circle circumference
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const specsHtml = specifications.slice(0, 5).map(spec =>
      `<li class="result-spec-item">${escapeHtml(spec)}</li>`
    ).join('');

    const prosHtml = pros.slice(0, 3).map(p =>
      `<li>${escapeHtml(p)}</li>`
    ).join('');

    const consHtml = cons.slice(0, 2).map(c =>
      `<li>${escapeHtml(c)}</li>`
    ).join('');

    const isDiscontinued = data.is_discontinued || score < 50 || (data.lifecycle_status && (data.lifecycle_status.includes('Discontinued') || data.lifecycle_status.includes('Obsolete')));
    const lifecycleStatus = data.lifecycle_status || (isDiscontinued ? 'Discontinued & Obsolete' : 'Active & Current');
    const buyRecommendation = data.buy_recommendation || (isDiscontinued ? 'Do Not Buy (Obsolete / Overpriced)' : 'Recommended');
    const priceJustification = data.price_justification || '';
    const alternatives = data.better_alternatives || [];

    // Format price range to Rupees (₹) if contains $
    let displayPrice = price_range || '';
    if (displayPrice.includes('$')) {
      displayPrice = displayPrice.replace(/\$(\d+(?:\,\d+)*(?:\.\d+)?)/g, (match, p1) => {
        const val = parseFloat(p1.replace(/,/g, ''));
        return '₹' + Math.round(val * 83).toLocaleString('en-IN');
      });
    }

    resultsArea.innerHTML = `
      <div class="results-header">
        <div class="results-count">
          Showing AI analysis for <strong>${escapeHtml(product_name)}</strong>
        </div>
        <span class="badge ${isDiscontinued ? 'badge-outline' : 'badge-primary'}">${escapeHtml(lifecycleStatus)}</span>
      </div>

      <div class="results-grid">
        <div class="result-card">
          <div class="result-card-image">
            <span class="product-emoji">${categoryEmoji}</span>
          </div>

          <div class="result-card-info">
            <div class="result-card-meta">
              <span class="badge badge-teal">${escapeHtml(category)}</span>
              <span class="result-card-brand">${escapeHtml(brand)}</span>
              ${data.release_year ? `<span class="badge badge-outline">Year: ${data.release_year}</span>` : ''}
              <span class="badge ${isDiscontinued ? 'badge-outline' : 'badge-teal'}" style="${isDiscontinued ? 'color:var(--color-error);border-color:var(--color-error);' : ''}">${escapeHtml(buyRecommendation)}</span>
            </div>

            <h2 class="result-card-name">${escapeHtml(product_name)}</h2>
            <p class="result-card-description">${escapeHtml(ai_description)}</p>

            <!-- Obsolescence / Do Not Buy Alert Banner -->
            ${isDiscontinued ? `
              <div class="obsolescence-alert-box">
                <div class="obsolescence-header">
                  <div class="obsolescence-title">
                    <i data-lucide="alert-triangle" width="16" height="16"></i>
                    ${escapeHtml(buyRecommendation)}
                  </div>
                  <span class="badge" style="background:rgba(239,68,68,0.2);color:var(--color-error);border:1px solid rgba(239,68,68,0.4);font-size:10px;">
                    ${escapeHtml(lifecycleStatus)}
                  </span>
                </div>
                ${priceJustification ? `
                  <p class="price-critique-text">
                    <strong>Real-World Market & Price Verdict:</strong> ${escapeHtml(priceJustification)}
                  </p>
                ` : `
                  <p class="price-critique-text">
                    This product is outdated or discontinued with no modern software/security updates. Purchasing at this price in today's Indian market is not justified.
                  </p>
                `}
              </div>
            ` : ''}

            ${specsHtml ? `<ul class="result-specs">${specsHtml}</ul>` : ''}

            ${(prosHtml || consHtml) ? `
              <div class="result-pros-cons">
                ${prosHtml ? `
                  <div class="result-pros">
                    <h6>Pros</h6>
                    <ul class="pros-list">${prosHtml}</ul>
                  </div>
                ` : ''}
                ${consHtml ? `
                  <div class="result-cons">
                    <h6>Cons</h6>
                    <ul class="cons-list">${consHtml}</ul>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Better Modern Alternatives Section -->
            ${alternatives && alternatives.length > 0 ? `
              <div class="alternatives-container">
                <div class="alternatives-title">
                  <i data-lucide="sparkles" width="15" height="15" style="color:var(--color-secondary);"></i>
                  ${isDiscontinued ? 'Recommended Modern Alternatives in this Price Range:' : 'Top Competitor Alternatives in this Segment:'}
                </div>
                <div class="alternatives-grid">
                  ${alternatives.map(alt => `
                    <div class="alternative-card">
                      <div class="alternative-name">${escapeHtml(alt.name)}</div>
                      <div class="alternative-price">${escapeHtml(alt.price_range || '')}</div>
                      <div class="alternative-advantage">${escapeHtml(alt.advantage || '')}</div>
                      <button type="button" class="alternative-btn" onclick="const inp=document.getElementById('search-input'); if(inp){ inp.value='${escapeHtml(alt.name)}'; window.scrollTo({top:0,behavior:'smooth'}); document.getElementById('search-form').dispatchEvent(new Event('submit')); }">
                        Search this alternative →
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="result-card-sidebar">
            <div class="trust-score-ring" title="AI Trust Score: ${score}/100">
              <svg viewBox="0 0 100 100">
                <circle class="trust-score-track" cx="50" cy="50" r="${radius}"/>
                <circle
                  class="trust-score-fill"
                  cx="50" cy="50" r="${radius}"
                  stroke="${scoreColor}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${circumference}"
                  data-target-offset="${strokeDashoffset}"
                />
              </svg>
              <div class="trust-score-label">
                <span class="trust-score-value">${score}</span>
                <span class="trust-score-text">Trust</span>
              </div>
            </div>

            ${displayPrice ? `<div class="result-price" style="color:var(--color-secondary); font-weight:bold; font-size:1.1rem;">${escapeHtml(displayPrice)}</div>` : ''}

            ${best_for ? `
              <div class="result-best-for">
                <strong style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted)">Best For</strong><br>
                ${escapeHtml(best_for)}
              </div>
            ` : ''}

            <div class="result-actions">
              ${data.id ? `
                <a href="/product/${data.id}" class="btn btn-primary" style="width:100%;justify-content:center;text-decoration:none;">
                  View Full Details
                </a>
              ` : `
                <div class="tooltip-wrap">
                  <button class="btn btn-primary" disabled style="opacity:0.5;cursor:not-allowed;width:100%">
                    View Details
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-initialize lucide icons inside dynamically injected HTML
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }


    // Animate trust score ring after render
    requestAnimationFrame(() => {
      const fillEl = resultsArea.querySelector('.trust-score-fill');
      if (fillEl) {
        const targetOffset = parseFloat(fillEl.dataset.targetOffset);
        setTimeout(() => {
          fillEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
          fillEl.style.strokeDashoffset = targetOffset;
        }, 200);
      }
    });
  }

  /* ── Emoji Map ───────────────────────────────────────────────────────────── */
  function getCategoryEmoji(category) {
    if (!category) return '📦';
    const cat = category.toLowerCase();
    if (cat.includes('phone') || cat.includes('mobile')) return '📱';
    if (cat.includes('laptop') || cat.includes('computer')) return '💻';
    if (cat.includes('headphone') || cat.includes('earphone') || cat.includes('audio')) return '🎧';
    if (cat.includes('tv') || cat.includes('television') || cat.includes('display')) return '📺';
    if (cat.includes('tablet')) return '📲';
    if (cat.includes('camera')) return '📷';
    if (cat.includes('game') || cat.includes('console')) return '🎮';
    if (cat.includes('drone')) return '🚁';
    if (cat.includes('watch')) return '⌚';
    if (cat.includes('speaker')) return '🔊';
    if (cat.includes('vacuum') || cat.includes('clean')) return '🌀';
    if (cat.includes('kitchen') || cat.includes('appliance')) return '🍳';
    if (cat.includes('fitness') || cat.includes('health')) return '💪';
    return '📦';
  }

  /* ── XSS Prevention ──────────────────────────────────────────────────────── */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Init: check for query param ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      searchInput.value = q;
      doSearch(q);
    } else {
      setState('empty');
    }
  });

  setState('empty');

})();
