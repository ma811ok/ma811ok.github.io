// === API Configuration — Change the URL below to your backend address ===
//
// How to use:
//   1. Local dev:     leave as-is (auto-detects localhost → http://127.0.0.1:8001)
//   2. Quick tunnel:  paste your trycloudflare URL below, e.g.:
//                     PRODUCTION_URL = 'https://my-tunnel.trycloudflare.com';
//   3. Your domain:   point to your named tunnel, e.g.:
//                     PRODUCTION_URL = 'https://api.modelhead.com';
//
// All HTML pages load this script BEFORE their own <script> tags.
// It sets window.API_BASE which app.js, image_enhance.js, and view_model.js read.

window.API_BASE = (function () {
  // ── Production override ──────────────────────────────────────────────
  // Paste your Cloudflare Tunnel or domain URL here:
  var PRODUCTION_URL = 'https://snapshot-viewers-papers-statement.trycloudflare.com';

  if (PRODUCTION_URL) return PRODUCTION_URL;

  // ── Local development auto-detect ───────────────────────────────────
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://127.0.0.1:8001';
  }

  // ── Same-origin fallback (when backend serves the frontend directly) ─
  return '';
