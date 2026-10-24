/**
 * BuyWise AI — Auth Validation v2 (auth-validation.js)
 * Works with the redesigned input structure:
 *  .field-wrap > .field-label + .input-shell > .input-icon-left + .input-field + .input-icon-right
 * + .field-error
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle();
    initEmailValidation();

    const registerForm = document.getElementById('register-form');
    const loginForm    = document.getElementById('login-form');

    if (registerForm) initRegisterForm(registerForm);
    if (loginForm)    initLoginForm(loginForm);
  });

  /* ── Password Visibility Toggle ──────────────────────────────────────────── */
  function initPasswordToggle() {
    document.querySelectorAll('[data-toggle-password]').forEach(btn => {
      const targetId = btn.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;

      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        const eyeOpen  = btn.querySelector('.eye-open');
        const eyeClose = btn.querySelector('.eye-close');
        if (eyeOpen && eyeClose) {
          eyeOpen.style.display  = show ? 'none'  : '';
          eyeClose.style.display = show ? ''      : 'none';
        }
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  }

  /* ── Email Validation ────────────────────────────────────────────────────── */
  function initEmailValidation() {
    document.querySelectorAll('input[type="email"]').forEach(input => {
      input.addEventListener('blur', () => {
        if (input.value && !isValidEmail(input.value)) {
          showFieldError(input, 'Please enter a valid email address.');
        } else if (input.value) {
          clearFieldError(input);
          input.classList.add('success');
        }
      });
      input.addEventListener('input', () => {
        clearFieldError(input);
        input.classList.remove('success');
      });
    });
  }

  /* ── Register Form ────────────────────────────────────────────────────────── */
  function initRegisterForm(form) {
    const fullName = document.getElementById('full_name');
    const email    = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm  = document.getElementById('confirm_password');
    const terms    = document.getElementById('terms');
    const submitBtn = document.getElementById('register-submit');

    // Strength meter
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (password && strengthFill) {
      password.addEventListener('input', () => {
        const s = getPasswordStrength(password.value);
        updateStrengthMeter(s, strengthFill, strengthText);
      });
    }

    // Confirm match
    if (confirm && password) {
      confirm.addEventListener('input', () => {
        if (confirm.value && confirm.value !== password.value) {
          showFieldError(confirm, 'Passwords do not match.');
          confirm.classList.remove('success');
        } else if (confirm.value) {
          clearFieldError(confirm);
          confirm.classList.add('success');
        }
      });
    }

    // Full name blur
    if (fullName) {
      fullName.addEventListener('blur', () => {
        const val = fullName.value.trim();
        if (!val)         showFieldError(fullName, 'Full name is required.');
        else if (val.length < 2) showFieldError(fullName, 'Name must be at least 2 characters.');
        else { clearFieldError(fullName); fullName.classList.add('success'); }
      });
      fullName.addEventListener('input', () => { clearFieldError(fullName); fullName.classList.remove('success'); });
    }

    // Submit
    form.addEventListener('submit', e => {
      let valid = true;

      if (!fullName.value.trim()) {
        showFieldError(fullName, 'Full name is required.'); valid = false;
      }
      if (!email.value || !isValidEmail(email.value)) {
        showFieldError(email, 'Please enter a valid email address.'); valid = false;
      }
      if (password.value.length < 8) {
        showFieldError(password, 'Password must be at least 8 characters.'); valid = false;
      }
      if (confirm.value !== password.value) {
        showFieldError(confirm, 'Passwords do not match.'); valid = false;
      }
      if (terms && !terms.checked) {
        showFieldError(terms, 'You must accept the terms to continue.'); valid = false;
      }

      if (!valid) { e.preventDefault(); return; }
      if (submitBtn) setLoading(submitBtn, true);
    });
  }

  /* ── Login Form ──────────────────────────────────────────────────────────── */
  function initLoginForm(form) {
    const email    = document.getElementById('email');
    const password = document.getElementById('password');
    const submitBtn = document.getElementById('login-submit');

    form.addEventListener('submit', e => {
      let valid = true;

      if (!email.value || !isValidEmail(email.value)) {
        showFieldError(email, 'Please enter a valid email address.'); valid = false;
      }
      if (!password.value) {
        showFieldError(password, 'Password is required.'); valid = false;
      }

      if (!valid) { e.preventDefault(); return; }
      if (submitBtn) setLoading(submitBtn, true);
    });
  }

  /* ── Password Strength ───────────────────────────────────────────────────── */
  function getPasswordStrength(pw) {
    if (!pw) return { score: -1, key: '', text: '' };
    let score = 0;
    if (pw.length >= 8)             score++;
    if (pw.length >= 12)            score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))   score++;

    const keys  = ['weak',  'fair',    'good',   'strong', 'strong'];
    const texts = ['Weak',  'Fair',    'Good',   'Strong', 'Very Strong'];
    return { score, key: keys[Math.min(score, 4)], text: texts[Math.min(score, 4)] };
  }

  function updateStrengthMeter(s, fill, label) {
    fill.className = 'strength-fill';
    if (label) label.className = 'strength-text';
    if (s.score < 0) { fill.style.width = '0%'; if (label) label.textContent = ''; return; }
    fill.classList.add(s.key);
    if (label) { label.classList.add(s.key); label.textContent = s.text; }
  }

  /* ── Field Error Helpers ─────────────────────────────────────────────────── */
  function showFieldError(input, message) {
    input.classList.add('error');
    input.classList.remove('success');

    // Find error element: check within .field-wrap parent, or as next sibling
    const fieldWrap = input.closest('.field-wrap') || input.parentNode;
    let errorEl = fieldWrap.querySelector('.field-error');

    if (!errorEl) {
      // Fallback: create one
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      fieldWrap.appendChild(errorEl);
    }

    errorEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
    // Force reflow for CSS transition
    errorEl.offsetHeight;
    errorEl.classList.add('visible');
  }

  function clearFieldError(input) {
    input.classList.remove('error');
    const fieldWrap = input.closest('.field-wrap') || input.parentNode;
    const errorEl = fieldWrap ? fieldWrap.querySelector('.field-error') : null;
    if (errorEl) errorEl.classList.remove('visible');
  }

  /* ── Button Loading State ─────────────────────────────────────────────────── */
  function setLoading(btn, loading) {
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
  }

  /* ── Utilities ───────────────────────────────────────────────────────────── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

})();
