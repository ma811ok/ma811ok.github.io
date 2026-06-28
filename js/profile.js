/**
 * modelhead - Profile Page
 * User self-service profile management and session history.
 */

(function () {
  'use strict';

  const API_BASE = window.API_BASE || '';

  // ── DOM Elements ──────────────────────────────────────────────────────

  const elements = {
    // Profile display
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profilePlatform: document.getElementById('profilePlatform'),
    profileMemberSince: document.getElementById('profileMemberSince'),
    profileLoginCount: document.getElementById('profileLoginCount'),
    profileTaskCount: document.getElementById('profileTaskCount'),

    // Edit form
    profileForm: document.getElementById('profileForm'),
    editNickname: document.getElementById('editNickname'),
    editAvatar: document.getElementById('editAvatar'),
    profileSuccess: document.getElementById('profileSuccess'),
    profileError: document.getElementById('profileError'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),

    // Password form
    passwordCard: document.getElementById('passwordCard'),
    passwordForm: document.getElementById('passwordForm'),
    oldPassword: document.getElementById('oldPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    passwordSuccess: document.getElementById('passwordSuccess'),
    passwordError: document.getElementById('passwordError'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),

    // Sessions
    sessionsLoading: document.getElementById('sessionsLoading'),
    sessionsEmpty: document.getElementById('sessionsEmpty'),
    sessionsList: document.getElementById('sessionsList'),
  };

  // ── Load Profile ──────────────────────────────────────────────────────

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await res.json();
      const user = data.user;
      renderProfile(user);
    } catch (err) {
      console.error('Profile load error:', err);
      elements.profileName.textContent = 'Error loading profile';
    }
  }

  function renderProfile(user) {
    // Avatar
    const initial = (user.nickname || user.email || '?').charAt(0).toUpperCase();
    elements.profileAvatar.textContent = initial;

    // Info
    elements.profileName.textContent = user.nickname || 'No nickname set';
    elements.profileEmail.textContent = user.email || user.openid || '-';
    elements.profilePlatform.textContent = user.platform;
    elements.profilePlatform.className = `platform-badge platform-${user.platform}`;

    // Member since
    if (user.created_at) {
      const d = new Date(user.created_at);
      elements.profileMemberSince.textContent = `Member since ${d.toLocaleDateString('zh-CN')}`;
    }

    // Stats
    elements.profileLoginCount.textContent = user.login_count || 0;
    elements.profileTaskCount.textContent = user.task_count || 0;

    // Fill edit form
    elements.editNickname.value = user.nickname || '';
    elements.editAvatar.value = user.avatar_url || '';

    // Hide password card for WeChat users
    if (user.platform === 'wechat') {
      elements.passwordCard.style.display = 'none';
    }
  }

  // ── Update Profile ────────────────────────────────────────────────────

  async function updateProfile(nickname, avatarUrl) {
    const res = await fetch(`${API_BASE}/api/user/me`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: nickname || null,
        avatar_url: avatarUrl || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Update failed');
    }

    const data = await res.json();
    // Update stored user info
    setUser(data.user);
    return data.user;
  }

  // ── Change Password ───────────────────────────────────────────────────

  async function changePassword(oldPassword, newPassword) {
    const res = await fetch(`${API_BASE}/api/user/me/password`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Password change failed');
    }

    return await res.json();
  }

  // ── Load Sessions ─────────────────────────────────────────────────────

  async function loadSessions() {
    try {
      const res = await fetch(`${API_BASE}/api/user/me/tasks`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await res.json();
      renderSessions(data.tasks);
    } catch (err) {
      console.error('Sessions load error:', err);
      elements.sessionsLoading.textContent = 'Failed to load sessions';
    }
  }

  function renderSessions(tasks) {
    elements.sessionsLoading.style.display = 'none';

    if (!tasks || tasks.length === 0) {
      elements.sessionsEmpty.style.display = '';
      return;
    }

    elements.sessionsEmpty.style.display = 'none';
    elements.sessionsList.innerHTML = tasks.map(task => `
      <div class="session-item">
        <div class="session-info">
          <div class="session-id">${escapeHtml(task.session_id)}</div>
          <div class="session-meta">
            <span class="session-status status-${task.status}">${task.status}</span>
            <span class="session-date">${formatDate(task.created_at)}</span>
            <span class="session-files">${task.input_count} file(s)</span>
          </div>
        </div>
        <div class="session-actions">
          ${task.has_stl ? `
            <a href="${task.download_url}" class="btn-sm btn-download" download>Download STL</a>
            <a href="${task.view_url}" class="btn-sm btn-view">View 3D</a>
          ` : ''}
          ${task.has_3mf ? '<span class="badge-3mf">3MF</span>' : ''}
          ${task.has_cartoon ? '<span class="badge-cartoon">Cartoon</span>' : ''}
        </div>
      </div>
    `).join('');
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function showButtonLoading(btn) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    if (text) text.style.display = 'none';
    if (spinner) spinner.style.display = '';
    btn.disabled = true;
  }

  function hideButtonLoading(btn) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    if (text) text.style.display = '';
    if (spinner) spinner.style.display = 'none';
    btn.disabled = false;
  }

  // ── Event Listeners ───────────────────────────────────────────────────

  // Profile form
  elements.profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.profileSuccess.style.display = 'none';
    elements.profileError.style.display = 'none';

    showButtonLoading(elements.saveProfileBtn);

    try {
      const nickname = elements.editNickname.value.trim();
      const avatarUrl = elements.editAvatar.value.trim();
      const user = await updateProfile(nickname, avatarUrl);
      renderProfile(user);
      elements.profileSuccess.style.display = '';
      updateAuthUI();
    } catch (err) {
      elements.profileError.textContent = err.message;
      elements.profileError.style.display = '';
    } finally {
      hideButtonLoading(elements.saveProfileBtn);
    }
  });

  // Password form
  elements.passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.passwordSuccess.style.display = 'none';
    elements.passwordError.style.display = 'none';

    const oldPwd = elements.oldPassword.value;
    const newPwd = elements.newPassword.value;
    const confirmPwd = elements.confirmPassword.value;

    if (newPwd !== confirmPwd) {
      elements.passwordError.textContent = 'New passwords do not match';
      elements.passwordError.style.display = '';
      return;
    }

    if (newPwd.length < 8) {
      elements.passwordError.textContent = 'New password must be at least 8 characters';
      elements.passwordError.style.display = '';
      return;
    }

    showButtonLoading(elements.changePasswordBtn);

    try {
      await changePassword(oldPwd, newPwd);
      elements.passwordSuccess.style.display = '';
      elements.passwordForm.reset();
    } catch (err) {
      elements.passwordError.textContent = err.message;
      elements.passwordError.style.display = '';
    } finally {
      hideButtonLoading(elements.changePasswordBtn);
    }
  });

  // ── Initialize ────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
      redirectToLogin();
      return;
    }
    loadProfile();
    loadSessions();
  });
})();
