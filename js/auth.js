/**
 * modelhead - Auth Module
 * Manages JWT token storage and provides helpers for authenticated API calls.
 *
 * Backend endpoints:
 *   POST /api/auth/web/login    — email + password -> JWT
 *   POST /api/auth/web/register — email + password + nickname -> JWT
 *   GET  /api/auth/me           — get current user profile (needs Bearer token)
 */

const TOKEN_KEY = 'modelhead_token';
const USER_KEY = 'modelhead_user';

// ── Token management ──

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Token validation ──

/**
 * Check whether a JWT token is expired (or will expire within
 * the given grace period in seconds). Returns true when the
 * token is valid, false when it is expired or malformed.
 *
 * The check happens entirely client-side by base64-decoding the
 * JWT payload — no network request needed.
 */
function isTokenValid(token, graceSeconds) {
  if (!token) return false;
  graceSeconds = graceSeconds || 60; // default 60 s grace
  try {
    // JWT format: header.payload.signature
    var parts = token.split('.');
    if (parts.length !== 3) return false;

    // Payload is the second part, base64url-encoded
    var payload = parts[1];
    // Replace URL-safe chars and pad
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) payload += '=';

    // Decode base64
    var decoded = atob(payload);
    var obj = JSON.parse(decoded);
    var exp = obj.exp; // seconds since epoch

    if (!exp) return false; // no expiry claim — treat as invalid
    var nowSec = Math.floor(Date.now() / 1000);
    return nowSec + graceSeconds < exp;
  } catch (_) {
    return false;
  }
}

// ── User info management ──

function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Auth state ──

function isLoggedIn() {
  const token = getToken();
  return token && isTokenValid(token);
}

// ── Auth headers for fetch calls ──

function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: 'Bearer ' + token };
}

// ── Login ──

async function login(email, password) {
  const API_BASE = window.API_BASE || '';
  const res = await fetch(`${API_BASE}/api/auth/web/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  setToken(data.token);
  setUser(data.user);
  return data;
}

// ── Register ──

async function register(email, password, nickname) {
  const API_BASE = window.API_BASE || '';
  const res = await fetch(`${API_BASE}/api/auth/web/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname: nickname || '' }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }

  setToken(data.token);
  setUser(data.user);
  return data;
}

// ── Fetch current user profile ──

async function fetchCurrentUser() {
  const API_BASE = window.API_BASE || '';
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    clearToken();
    return null;
  }

  const data = await res.json();
  setUser(data.user);
  return data.user;
}

// ── Logout ──

function logout() {
  clearToken();
  // Redirect to login page if we're on an auth-required page
  const currentPath = window.location.pathname;
  if (currentPath.endsWith('/login.html') || currentPath === '/' || currentPath.endsWith('/index.html')) {
    return;
  }
  // Reload current page — pages should detect auth state change
  window.location.reload();
}

// ── Update navigation UI with auth state ──

function updateAuthUI() {
  const authNav = document.getElementById('menuAuth') || document.getElementById('authNav');
  if (!authNav) return;

  const user = getUser();
  const loggedIn = isLoggedIn();

  if (loggedIn && user) {
    authNav.innerHTML = `
      <span class="auth-user">${escapeHtml(user.nickname || user.email || user.id)}</span>
      <button class="auth-btn auth-logout-btn" onclick="handleLogout()" data-i18n="authLogout">Logout</button>
    `;
  } else {
    authNav.innerHTML = `
      <a href="login.html" class="auth-btn auth-login-btn" data-i18n="authLogin">Login</a>
    `;
  }

  // Re-translate if i18n is loaded
  if (typeof translatePage === 'function') {
    translatePage();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function handleLogout() {
  logout();
  updateAuthUI();
  fillUserName();
}

// ── Auto-fill username from logged-in user ──

function fillUserName() {
  const user = getUser();
  const nameInput = document.getElementById('userName');
  if (!nameInput) return;

  if (user) {
    const displayName = user.nickname || user.email || user.id || '';
    nameInput.value = displayName;
    nameInput.readOnly = true;
    // Dispatch input event so button-enable listeners fire
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    nameInput.value = '';
    nameInput.readOnly = false;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ── Initialize on DOM ready ──

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  fillUserName();
});
