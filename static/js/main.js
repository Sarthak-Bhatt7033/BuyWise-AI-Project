/**
 * BuyWise AI — Main JS (main.js)
 * Navbar scroll behavior, mobile menu, smooth scroll, general utilities
 */

(function () {
  'use strict';

  /* ── Navbar Scroll Glass Effect ─────────────────────────────────────────── */
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function onScroll() {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
        navbar.classList.remove('transparent');
      } else {
        navbar.classList.remove('scrolled');
        navbar.classList.add('transparent');
      }
    }

    // Set initial state
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile Menu ─────────────────────────────────────────────────────────── */
  function initMobileMenu() {
    const hamburger = document.querySelector('.navbar-hamburger');
    const mobileMenu = document.querySelector('.navbar-mobile-menu');
    if (!hamburger || !mobileMenu) return;

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      isOpen = false;
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      isOpen ? closeMenu() : openMenu();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && isOpen) closeMenu();
    });
  }

  /* ── Active Nav Link ─────────────────────────────────────────────────────── */
  function initActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navbar-nav a, .mobile-nav a').forEach(link => {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
        link.classList.add('active');
      }
    });
  }

  /* ── Smooth Scroll for Anchor Links ─────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navHeight = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--nav-height') || '72px');
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Toast Notification System ──────────────────────────────────────────── */
  function createToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const iconMap = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${iconMap[type] || ''}<span>${message}</span>`;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* ── Stats Counter Animation (fallback without GSAP) ─────────────────────── */
  function initStatsCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  /* ── Lucide Icons Init ────────────────────────────────────────────────────── */
  function initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ── DOMContentLoaded Entry Point ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initMobileMenu();
    initActiveNavLink();
    initSmoothScroll();
    initStatsCounters();
    initIcons();
  });

  // Expose globally
  window.BuyWise = window.BuyWise || {};
  window.BuyWise.toast = createToast;

})();
