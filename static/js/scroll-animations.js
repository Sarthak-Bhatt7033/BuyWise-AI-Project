/**
 * BuyWise AI — Scroll Animations (scroll-animations.js)
 * GSAP ScrollTrigger powered animations for the home page.
 * Falls back to IntersectionObserver if GSAP is not available.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (window.gsap && window.ScrollTrigger) {
      initGSAPAnimations();
    } else {
      initFallbackAnimations();
    }
  });

  /* ── GSAP ScrollTrigger Animations ──────────────────────────────────────── */
  function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // ── Hero content entrance ────────────────────────────────────────────────
    const heroTl = gsap.timeline({ delay: 0.1 });
    heroTl
      .from('.hero-eyebrow', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power2.out'
      })
      .from('.hero-title', {
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out'
      }, '-=0.3')
      .from('.hero-subtitle', {
        opacity: 0, y: 25, duration: 0.7, ease: 'power2.out'
      }, '-=0.5')
      .from('.hero-cta', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power2.out'
      }, '-=0.4')
      .from('.hero-trust-badges', {
        opacity: 0, y: 15, duration: 0.5, ease: 'power2.out'
      }, '-=0.3')
      .from('.hero-float-card-1', {
        opacity: 0, x: -30, duration: 0.7, ease: 'back.out(1.4)'
      }, '-=0.6')
      .from('.hero-float-card-2', {
        opacity: 0, x: 30, duration: 0.7, ease: 'back.out(1.4)'
      }, '-=0.6');

    // ── How It Works Steps (stagger) ─────────────────────────────────────────
    gsap.from('.step-card', {
      scrollTrigger: {
        trigger: '.steps-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      y: 50,
      stagger: 0.15,
      duration: 0.7,
      ease: 'power2.out',
    });

    // Animate the connecting line
    gsap.from('.steps-grid::before', {
      scrollTrigger: {
        trigger: '.steps-grid',
        start: 'top 75%',
      },
      scaleX: 0,
      duration: 1,
      ease: 'power2.out',
      transformOrigin: 'left center',
    });

    // ── Feature Cards (stagger) ───────────────────────────────────────────────
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      y: 40,
      scale: 0.96,
      stagger: 0.1,
      duration: 0.65,
      ease: 'power2.out',
    });

    // ── Comparison Columns ────────────────────────────────────────────────────
    gsap.from('.comparison-col.old-way', {
      scrollTrigger: {
        trigger: '.comparison-grid',
        start: 'top 80%',
      },
      opacity: 0,
      x: -50,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.from('.comparison-col.new-way', {
      scrollTrigger: {
        trigger: '.comparison-grid',
        start: 'top 80%',
      },
      opacity: 0,
      x: 50,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.from('.vs-badge', {
      scrollTrigger: {
        trigger: '.comparison-grid',
        start: 'top 80%',
      },
      opacity: 0,
      scale: 0,
      duration: 0.5,
      delay: 0.4,
      ease: 'back.out(2)',
    });

    // ── Stats Counter Animation ───────────────────────────────────────────────
    ScrollTrigger.create({
      trigger: '.stats-section',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        document.querySelectorAll('[data-counter]').forEach(el => {
          if (!el.dataset.counted) {
            el.dataset.counted = 'true';
            animateCounter(el);
          }
        });
      },
    });

    gsap.from('.stat-item', {
      scrollTrigger: {
        trigger: '.stats-bar',
        start: 'top 85%',
      },
      opacity: 0,
      y: 30,
      stagger: 0.12,
      duration: 0.6,
      ease: 'power2.out',
    });

    // ── Testimonials ──────────────────────────────────────────────────────────
    gsap.from('.testimonial-card', {
      scrollTrigger: {
        trigger: '.testimonials-grid',
        start: 'top 80%',
      },
      opacity: 0,
      y: 35,
      stagger: 0.12,
      duration: 0.65,
      ease: 'power2.out',
    });

    // ── CTA Banner ────────────────────────────────────────────────────────────
    gsap.from('.cta-banner-inner', {
      scrollTrigger: {
        trigger: '.cta-banner',
        start: 'top 80%',
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power2.out',
    });

    // ── Section Headers ────────────────────────────────────────────────────────
    gsap.utils.toArray('.section-header').forEach(el => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
      });
    });
  }

  /* ── Fallback: IntersectionObserver ──────────────────────────────────────── */
  function initFallbackAnimations() {
    const elements = document.querySelectorAll(
      '.step-card, .feature-card, .testimonial-card, .stat-item, .section-header, .hero-content > *'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${i * 0.08}s`;
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    elements.forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });

    // Trigger stats counters on scroll
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      const statsObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          document.querySelectorAll('[data-counter]').forEach(animateCounter);
          statsObserver.disconnect();
        }
      }, { threshold: 0.3 });
      statsObserver.observe(statsSection);
    }
  }

  /* ── Counter Animation Utility ───────────────────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // expo ease
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

})();
