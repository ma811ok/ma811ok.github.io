// === API Base URL — auto-detection logic ===
//
// This script sets window.API_BASE based on:
//   1. window.API_PRODUCTION_URL  (set by js/config.js — edit that file)
//   2. localhost auto-detect      (http://127.0.0.1:8001)
//   3. same-origin fallback       (for production, when backend serves frontend)
//
// To change the production URL, edit js/config.js — don't touch this file.

window.API_BASE = (function () {
  // ── Production override (from config.js) ───────────────────────────
  if (window.API_PRODUCTION_URL) return window.API_PRODUCTION_URL;

  // ── Local development auto-detect ──────────────────────────────────
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://127.0.0.1:8001';
  }

  // ── Same-origin fallback (backend serves the frontend directly) ────
  return '';
})();
