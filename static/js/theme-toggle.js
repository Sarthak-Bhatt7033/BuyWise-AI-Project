/**
 * BuyWise AI — Theme Toggle (theme-toggle.js)
 * Handles dark/light mode switching with smooth CSS variable transitions
 * and localStorage persistence.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'buywise-theme';
  const html = document.documentElement;

  /**
   * Apply a theme by toggling the data-theme attribute.
   * @param {'dark'|'light'} theme
   */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Update aria-label on toggle button
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /**
   * Get preferred theme from localStorage, then system preference.
   * @returns {'dark'|'light'}
   */
  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Default to dark for this product
    return 'dark';
  }

  /**
   * Toggle between dark and light modes.
   */
  function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply on load immediately (before DOM paints) to prevent flash
  applyTheme(getPreferredTheme());

  // Bind toggle button after DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  });

  // Expose globally for other scripts
  window.BuyWise = window.BuyWise || {};
  window.BuyWise.toggleTheme = toggleTheme;
  window.BuyWise.getTheme = () => html.getAttribute('data-theme') || 'dark';
})();
