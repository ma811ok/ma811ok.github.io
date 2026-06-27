/**
 * image_enhance.js
 * Image enhancement page logic:
 * - Image upload via drag-and-drop or file picker
 * - Preview uploaded image
 * - Submit to backend API for enhancement
 * - Display original and enhanced results side-by-side
 * - Download the enhanced result image
 */

(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────────────────────────
  const dropZone    = document.getElementById('dropZone');
  const dropContent = document.getElementById('dropContent');
  const preview     = document.getElementById('preview');
  const previewImg  = document.getElementById('previewImage');
  const fileInput   = document.getElementById('fileInput');
  const enhanceBtn  = document.getElementById('enhanceBtn');
  const statusEl    = document.getElementById('status');
  const userNameEl  = document.getElementById('userName');

  const resultCard   = document.getElementById('resultCard');
  const enhancedImg  = document.getElementById('enhancedImageDisplay');
  const downloadBtn  = document.getElementById('downloadBtn');

  let uploadedFile = null;
  let enhancedUrl = null;
  let enhancedSessionId = null;
  let enhancedUserName = null;

  // ── Helpers ─────────────────────────────────────────────────────────────
  function setStatus(msg, isError) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.classList.toggle('error', !!isError);
    }
  }

  function setLoading(loading) {
    if (!enhanceBtn) return;
    const btnText = enhanceBtn.querySelector('.btn-text');
    const spinner = enhanceBtn.querySelector('.spinner');
    enhanceBtn.disabled = loading;
    if (loading) {
      if (btnText) btnText.style.display = 'none';
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      if (btnText) btnText.style.display = '';
      if (spinner) spinner.style.display = 'none';
    }
  }

  function updateButtonState() {
    if (!enhanceBtn) return;
    const hasName = userNameEl && userNameEl.value.trim().length > 0;
    enhanceBtn.disabled = !uploadedFile || !hasName;
  }

  // ── File handling ───────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus(__('enhanceInvalidFile'), true);
      return;
    }
    uploadedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      dropContent.style.display = 'none';
      preview.style.display = 'flex';
      setStatus(__('enhanceReady'));
    };
    reader.readAsDataURL(file);
    updateButtonState();
  }

  // ── Event listeners ─────────────────────────────────────────────────────
  dropZone.addEventListener('click', function (e) {
    if (e.target.classList.contains('view-change-btn')) {
      // Change button
      uploadedFile = null;
      previewImg.src = '';
      preview.style.display = 'none';
      dropContent.style.display = '';
      fileInput.value = '';
      updateButtonState();
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  userNameEl.addEventListener('input', updateButtonState);

  // ── API call ────────────────────────────────────────────────────────────
  enhanceBtn.addEventListener('click', async function () {
    if (!uploadedFile) return;
    const userName = userNameEl.value.trim();
    if (!userName) {
      setStatus(__('enhanceEnterName'), true);
      return;
    }

    setLoading(true);
    setStatus(__('enhanceProcessing'));

    const formData = new FormData();
    formData.append('file_image', uploadedFile);
    formData.append('user_name', userName);
    const removeBg = document.getElementById('removeBgCheckbox');
    if (removeBg && removeBg.checked) {
      formData.append('remove_bg', 'true');
    }
    const promptEl = document.getElementById('promptInput');
    if (promptEl && promptEl.value.trim()) {
      formData.append('prompt', promptEl.value.trim());
    }

    try {
      const apiBase = window.API_BASE || '';
      const endpoint = window.API_ENDPOINT || '/image-enhance';
      // Build headers — include Authorization only when we have a valid token.
      // Invalid/expired tokens are cleared so they don't cause 401 errors.
      const headers = {};
      if (typeof getToken === 'function') {
        const token = getToken();
        if (token) {
          if (typeof isTokenValid === 'function' && isTokenValid(token)) {
            headers['Authorization'] = 'Bearer ' + token;
          } else {
            // Token is stale — clear it so it doesn't interfere
            if (typeof clearToken === 'function') clearToken();
          }
        }
      }

      const url = apiBase + endpoint;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        let errDetail = errText;
        try {
          const errJson = JSON.parse(errText);
          errDetail = errJson.detail || errText;
        } catch (_) { /* use raw text */ }
        throw new Error(errDetail);
      }

      const data = await response.json();

      enhancedUrl = data.enhanced_image_url;
      enhancedSessionId = data.session_id || '';
      enhancedUserName = userName;

      if (!enhancedUrl) {
        throw new Error(__('enhanceNoResultUrl'));
      }

      // Display results
      resultCard.style.display = '';
      enhancedImg.crossOrigin = 'anonymous';
      enhancedImg.src = apiBase + enhancedUrl;
      downloadBtn.href = apiBase + enhancedUrl;
      downloadBtn.download = data.filename || `enhanced_${userName}.jpg`;
      downloadBtn.style.display = '';

      // Show "Reconstruct 3D Model" button
      const reconBtn = document.getElementById('reconstructFromEnhancedBtn');
      if (reconBtn && enhancedSessionId) {
        reconBtn.style.display = '';
      }

      // Scroll to result
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setStatus(__('enhanceSuccess'));
    } catch (err) {
      console.error('Enhancement failed:', err);
      setStatus(__('enhanceFailed') + err.message, true);
    } finally {
      setLoading(false);
    }
  });

  // ── Use enhanced image to generate 3D model ────────────────────────────
  const reconFromEnhancedBtn = document.getElementById('reconstructFromEnhancedBtn');
  if (reconFromEnhancedBtn) {
    reconFromEnhancedBtn.addEventListener('click', async function () {
      if (!enhancedSessionId || !enhancedUserName) return;

      const enhancedImg = document.getElementById('enhancedImageDisplay');
      if (!enhancedImg || !enhancedImg.complete) return;

      // Canvas-convert the enhanced image to a data URL
      // (crossOrigin='anonymous' already set on <img>, so canvas won't be tainted)
      let enhancedDataUrl = enhancedImg.src;
      if (!enhancedDataUrl.startsWith('data:')) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = enhancedImg.naturalWidth || enhancedImg.width;
          canvas.height = enhancedImg.naturalHeight || enhancedImg.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(enhancedImg, 0, 0);
          enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        } catch (e) {
          console.warn('Canvas conversion failed, falling back to blob fetch:', e);
          try {
            const blobResp = await fetch(enhancedDataUrl);
            if (blobResp.ok) {
              const blob = await blobResp.blob();
              enhancedDataUrl = await new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function () { resolve(reader.result); };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (e2) {
            console.warn('Blob fetch also failed, using src as-is:', e2);
          }
        }
      }

      // Clear any stale 3D model result (no STL generated yet)
      sessionStorage.removeItem('modelhead_result');

      // Save upload state so index.html restores front preview + name
      sessionStorage.setItem('modelhead_upload', JSON.stringify({
        views: {
          front: {
            name: 'cartoon.jpg',
            type: 'image/jpeg',
            size: 0,
            lastModified: Date.now(),
            dataUrl: enhancedDataUrl,
          }
        },
        userName: enhancedUserName,
        sessionId: enhancedSessionId,
        scaleMm: '150',
        repair: true,
      }));

      // Redirect to index.html — restoreUploadState will populate name + front image
      window.location.href = 'index.html';
    });
  }

  // ── Health check on load ────────────────────────────────────────────────
  window.addEventListener('load', function () {
    const apiBase = window.API_BASE || '';
    fetch(apiBase + '/health')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.status === 'ok') {
          setStatus(__('statusConnected'));
        } else {
          setStatus(__('statusUnhealthy'), true);
        }
      })
      .catch(function () {
        setStatus(__('statusCannotReach'), true);
      });
  });

})();
