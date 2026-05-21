/**
 * modelhead - 3D Head Reconstruction Web Client
 * Communicates with the FastAPI backend
 *
 * Supports both:
 *   - Rapid mode (single front view, POST /reconstruct)
 *   - Pro mode   (multi-view, POST /reconstruct-pro)
 *
 * Configure via globals set in the HTML page:
 *   window.API_ENDPOINT  - e.g. '/reconstruct' or '/reconstruct-pro'
 *   window.VIEWS         - array of view names, e.g. ['front']
 *                          If not set, defaults to ['front','back','left','right']
 */

const API_BASE = window.API_BASE || '';
const API_ENDPOINT = window.API_ENDPOINT || '/reconstruct';
const VIEWS = window.VIEWS || ['front', 'back', 'left', 'right'];

// Will be populated dynamically for views that exist in the DOM
const viewFiles = {};

// DOM references
const reconstructBtn = document.getElementById('reconstructBtn');
const uploadCard = document.getElementById('uploadCard');
const resultCard = document.getElementById('resultCard');
const resultInfo = document.getElementById('resultInfo');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const sliceBtn = document.getElementById('sliceBtn');
const modelDetailsBtn = document.getElementById('modelDetailsBtn');
const statusEl = document.getElementById('status');
const scaleMm = document.getElementById('scaleMm');
const scaleLabel = document.getElementById('scaleLabel');
const repair = document.getElementById('repair');
const userNameInput = document.getElementById('userName');

let downloadUrl = null;
let sessionId = null;
let currentUserName = null;

// ── Helpers ──

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

function showError(msg) {
  resultCard.style.display = 'block';
  resultInfo.innerHTML = '<div class="stat" style="color:#d32f2f;font-weight:600;">' + msg + '</div>';
}

function showResult(info) {
  resultCard.style.display = 'block';
  resultInfo.innerHTML = info;
  resultCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render a list of {label, value} pairs into resultInfo using .stat layout.
 * Skips entries where value is null/undefined/empty.
 */
function displayResultInfo(items) {
  let html = '';
  items.forEach(item => {
    if (item.value != null && item.value !== undefined && item.value !== '') {
      html += '<div class="stat"><span>' + item.label + '</span><span>' + item.value + '</span></div>';
    }
  });
  showResult(html);
}

function setUploading(loading) {
  const btnText = reconstructBtn.querySelector('.btn-text');
  const spinner = reconstructBtn.querySelector('.spinner');
  if (loading) {
    btnText.textContent = __('reconstructing');
    spinner.style.display = 'inline-block';
    reconstructBtn.disabled = true;
  } else {
    btnText.textContent = __('reconstruct');
    spinner.style.display = 'none';
    reconstructBtn.disabled = !viewFiles.front || !userNameInput.value.trim();
  }
}

function updateReconstructBtn() {
  reconstructBtn.disabled = !viewFiles.front || !userNameInput.value.trim();
}

// ── Scale slider ──

if (scaleMm) {
  scaleMm.addEventListener('input', () => {
    scaleLabel.textContent = scaleMm.value + ' mm';
  });
}

// ── View file handling ──

function getViewEls(view) {
  const cap = view.charAt(0).toUpperCase() + view.slice(1);
  return {
    dropZone: document.getElementById('dropZone' + cap),
    dropContent: document.getElementById('dropContent' + cap),
    preview: document.getElementById('preview' + cap),
    previewImage: document.getElementById('previewImage' + cap),
    fileInput: document.getElementById('fileInput' + cap),
  };
}

function handleViewFile(view, file) {
  if (!file) return;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showError(__('errUnsupportedType', { view: view.charAt(0).toUpperCase() + view.slice(1) }));
    return;
  }

  viewFiles[view] = file;
  updateReconstructBtn();
  clearUploadState();

  const els = getViewEls(view);
  const reader = new FileReader();
  reader.onload = (e) => {
    els.previewImage.src = e.target.result;
    els.dropContent.style.display = 'none';
    els.preview.style.display = 'block';
    els.dropZone.style.borderColor = '';
  };
  reader.readAsDataURL(file);
}

// Setup each view that has DOM elements
VIEWS.forEach(view => {
  const els = getViewEls(view);
  // Skip if this view doesn't exist in the DOM
  if (!els.dropZone) return;

  viewFiles[view] = null;

  // Click to browse
  els.dropZone.addEventListener('click', () => els.fileInput.click());

  els.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleViewFile(view, e.target.files[0]);
  });

  // Click on change button (inside preview)
  const changeBtn = els.preview ? els.preview.querySelector('.view-change-btn') : null;
  if (changeBtn) {
    changeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewFiles[view] = null;
      updateReconstructBtn();
      els.dropContent.style.display = 'block';
      els.preview.style.display = 'none';
      els.fileInput.value = '';
      clearUploadState();
    });
  }

  // Drag & drop
  els.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropZone.classList.add('drag-over');
  });
  els.dropZone.addEventListener('dragleave', () => {
    els.dropZone.classList.remove('drag-over');
  });
  els.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleViewFile(view, e.dataTransfer.files[0]);
  });
});

// ── Reconstruct button ──

// Re-enable button when userName changes
if (userNameInput) {
  userNameInput.addEventListener('input', updateReconstructBtn);
}

reconstructBtn.addEventListener('click', async () => {
  if (!viewFiles.front) return;
  const userName = userNameInput ? userNameInput.value.trim() : '';
  if (!userName) {
    showError(__('errEnterName'));
    return;
  }

  setUploading(true);
  resultCard.style.display = 'none';

  const formData = new FormData();
  // Append each view file with its form field name
  VIEWS.forEach(view => {
    if (viewFiles[view]) {
      formData.append('file_' + view, viewFiles[view], view + '.' + viewFiles[view].name.split('.').pop());
    }
  });
  formData.append('user_name', userName);
  formData.append('scale_mm', scaleMm.value);
  formData.append('repair', repair.checked ? 'true' : 'false');
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  // Pro-only parameters (sent always; Rapid ignores extras)
  formData.append('model_version', '3.0');
  formData.append('generate_type', 'Normal');
  formData.append('face_count', '500000');

  try {
    const response = await fetch(`${API_BASE}${API_ENDPOINT}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let detail = __('errServerError', { code: response.status });
      try {
        const body = await response.json();
        if (body.detail) detail = body.detail;
      } catch (_) {}
      const err = new Error(detail);
      err.status = response.status;
      throw err;
    }

    // Parse JSON response
    const data = await response.json();
    downloadUrl = data.download_url;
    currentUserName = userName;
    if (downloadUrl) {
      const m = downloadUrl.match(/\/data\/[^/]+\/([a-f0-9]+)\//);
      sessionId = m ? m[1] : '';
    }

    const watertightDisplay = data.is_watertight === true ? __('yes') : (data.is_watertight === false ? __('no') : data.is_watertight);
    const fileSizeKB = (data.file_size_bytes / 1024).toFixed(1);

    showResult(`
      <div class="stat"><span>${__('statVertices')}</span><span>${data.vertices || 'N/A'}</span></div>
      <div class="stat"><span>${__('statFaces')}</span><span>${data.faces || 'N/A'}</span></div>
      <div class="stat"><span>${__('statWatertight')}</span><span>${watertightDisplay}</span></div>
      <div class="stat"><span>${__('statFileSize')}</span><span>${fileSizeKB} KB</span></div>
    `);

    // Set up download STL button
    downloadBtn.href = downloadUrl;
    downloadBtn.download = data.filename || `modelhead_${Date.now()}.stl`;

    // Set up "View STL" button
    const viewBtn = document.getElementById('viewModelBtn');
    if (viewBtn) {
      viewBtn.style.display = 'inline-block';
      // Save current upload state AND result state to sessionStorage before navigating away
      saveUploadState();
      const { origin, pathname } = window.location;
      viewBtn.href = 'view_model.html?url=' + encodeURIComponent(downloadUrl) + '&from=' + encodeURIComponent(pathname);
    }

    // Set up "Send to Printer" button
    if (printBtn) {
      printBtn.style.display = 'inline-block';
      printBtn.textContent = __('printToPrinter');
      printBtn.disabled = false;
    }

    // Set up "Slice to 3MF" button
    if (sliceBtn) {
      sliceBtn.style.display = 'inline-block';
      sliceBtn.textContent = __('sliceModel');
      sliceBtn.disabled = false;
    }

    // Set up "Model Details" button
    if (modelDetailsBtn) {
      modelDetailsBtn.style.display = 'inline-block';
      modelDetailsBtn.textContent = __('modelDetails');
      modelDetailsBtn.disabled = false;
    }

    // Save result state so it can be restored when returning from view_model
    const resultState = {
      downloadUrl,
      filename: data.filename,
      vertices: data.vertices,
      faces: data.faces,
      isWatertight: data.is_watertight,
      fileSizeBytes: data.file_size_bytes,
      downloadedFilename: data.filename || `modelhead_${Date.now()}.stl`,
      sessionId,
      userName: currentUserName,
    };
    sessionStorage.setItem('modelhead_result', JSON.stringify(resultState));
  } catch (err) {
    showError(err.message);
  } finally {
    setUploading(false);
  }
});

// ── Restore result state from sessionStorage (returning from view_model) ──

function restoreResultState() {
  const saved = sessionStorage.getItem('modelhead_result');
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    downloadUrl = data.downloadUrl;
    sessionId = data.sessionId || '';
    currentUserName = data.userName || '';
    // Also re-extract sessionId from downloadUrl as a fallback
    if (!sessionId && downloadUrl) {
      const m = downloadUrl.match(/\/data\/[^/]+\/([a-f0-9]+)\//);
      if (m) sessionId = m[1];
    }

    const watertightDisplay = data.isWatertight === true ? __('yes') : (data.isWatertight === false ? __('no') : data.isWatertight);
    const fileSizeKB = (data.fileSizeBytes / 1024).toFixed(1);

    showResult(`
      <div class="stat"><span>${__('statVertices')}</span><span>${data.vertices || 'N/A'}</span></div>
      <div class="stat"><span>${__('statFaces')}</span><span>${data.faces || 'N/A'}</span></div>
      <div class="stat"><span>${__('statWatertight')}</span><span>${watertightDisplay}</span></div>
      <div class="stat"><span>${__('statFileSize')}</span><span>${fileSizeKB} KB</span></div>
    `);

    downloadBtn.href = data.downloadUrl;
    downloadBtn.download = data.downloadedFilename || `modelhead_${Date.now()}.stl`;

    const viewBtn = document.getElementById('viewModelBtn');
    if (viewBtn) {
      viewBtn.style.display = 'inline-block';
      viewBtn.href = 'view_model.html?url=' + encodeURIComponent(data.downloadUrl) + '&from=' + encodeURIComponent(window.location.pathname);
    }

    // Restore print button
    if (printBtn) {
      printBtn.style.display = 'inline-block';
      printBtn.textContent = __('printToPrinter');
      printBtn.disabled = false;
    }

    // Restore slice button
    if (sliceBtn) {
      sliceBtn.style.display = 'inline-block';
      sliceBtn.textContent = __('sliceModel');
      sliceBtn.disabled = false;
    }

    // Restore model details button
    if (modelDetailsBtn) {
      modelDetailsBtn.style.display = 'inline-block';
      modelDetailsBtn.textContent = __('modelDetails');
      modelDetailsBtn.disabled = false;
    }
  } catch (_) {
    // ignore corrupt data
  }
}

// ── Save / Restore full upload state (including images, name, options) ──

function saveUploadState() {
  const viewsData = {};
  VIEWS.forEach(view => {
    const file = viewFiles[view];
    if (file) {
      const els = getViewEls(view);
      const src = els.previewImage ? els.previewImage.src : null;
      if (src && src.startsWith('data:')) {
        viewsData[view] = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          dataUrl: src,
        };
      }
    }
  });

  const state = {
    views: viewsData,
    userName: userNameInput ? userNameInput.value : '',
    scaleMm: scaleMm ? scaleMm.value : '150',
    repair: repair ? repair.checked : true,
  };
  sessionStorage.setItem('modelhead_upload', JSON.stringify(state));
}

function clearUploadState() {
  sessionStorage.removeItem('modelhead_upload');
}

function restoreUploadState() {
  const saved = sessionStorage.getItem('modelhead_upload');
  if (!saved) return;

  try {
    const state = JSON.parse(saved);

    // Restore session ID (from image_enhance redirect)
    if (state.sessionId) {
      sessionId = state.sessionId;
    }

    // Restore form fields
    if (userNameInput && state.userName) {
      userNameInput.value = state.userName;
    }
    if (scaleMm && state.scaleMm) {
      scaleMm.value = state.scaleMm;
      if (scaleLabel) scaleLabel.textContent = state.scaleMm + ' mm';
    }
    if (repair) {
      repair.checked = state.repair;
    }

    // Restore each view's preview and reconstruct File objects from data URLs
    let anyViewRestored = false;
    VIEWS.forEach(view => {
      const vd = state.views && state.views[view];
      if (!vd || !vd.dataUrl) return;

      const els = getViewEls(view);
      if (!els.dropZone) return;

      // Restore preview image
      els.previewImage.src = vd.dataUrl;
      els.dropContent.style.display = 'none';
      els.preview.style.display = 'block';
      els.dropZone.style.borderColor = '';

      // Reconstruct a File object from the data URL so it can be re-submitted
      const mimeType = vd.type || 'image/jpeg';
      const isDataUrl = vd.dataUrl.startsWith('data:');
      if (isDataUrl) {
        const byteString = atob(vd.dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const file = new File([blob], vd.name || `${view}.jpg`, {
          type: mimeType,
          lastModified: vd.lastModified || Date.now(),
        });
        viewFiles[view] = file;
        anyViewRestored = true;
      } else {
        // Remote URL fallback — create a minimal placeholder File so the
        // reconstruct button is enabled (preview is already visible).
        // The user can click Change to replace with a proper file if needed.
        const emptyBlob = new Blob([], { type: mimeType });
        viewFiles[view] = new File([emptyBlob], vd.name || `${view}.jpg`, {
          type: mimeType,
          lastModified: vd.lastModified || Date.now(),
        });
        anyViewRestored = true;
      }
    });

    if (anyViewRestored) {
      updateReconstructBtn();
    }
  } catch (_) {
    // Ignore corrupt data
  }
}

// Clear saved upload state when user changes inputs
function setupUploadStateClear() {
  if (userNameInput) {
    userNameInput.addEventListener('input', clearUploadState);
  }
  if (scaleMm) {
    scaleMm.addEventListener('input', clearUploadState);
  }
  if (repair) {
    repair.addEventListener('change', clearUploadState);
  }
}

// ── Print to Printer button ──

if (printBtn) {
  printBtn.addEventListener('click', async () => {
    if (printBtn.disabled) return;

    const userName = userNameInput ? userNameInput.value.trim() : '';
    // Extract session_id from downloadUrl: /data/{name}/{session_id}/output/final.stl
    let sessionId = '';
    if (downloadUrl) {
      const m = downloadUrl.match(/\/data\/[^/]+\/([a-f0-9]+)\//);
      if (m) sessionId = m[1];
    }
    printBtn.disabled = true;
    printBtn.textContent = __('printing');

    try {
      const res = await fetch(`${API_BASE}/api/print-to-printer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName || 'unknown', session_id: sessionId }),
      });

      if (!res.ok) {
        let detail = __('errServerError', { code: res.status });
        try {
          const body = await res.json();
          if (body.detail) detail = body.detail;
        } catch (_) {}
        const err = new Error(detail);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      printBtn.textContent = __('printSuccess');
      printBtn.style.background = '#4caf50';

      // Reset after 3 seconds
      setTimeout(() => {
        printBtn.textContent = __('printToPrinter');
        printBtn.style.background = '#ff7043';
        printBtn.disabled = false;
      }, 3000);
    } catch (err) {
      printBtn.textContent = __('printFailed');
      printBtn.style.background = '#d32f2f';
      showError(err.message);

      // Reset after 4 seconds
      setTimeout(() => {
        printBtn.textContent = __('printToPrinter');
        printBtn.style.background = '#ff7043';
        printBtn.disabled = false;
      }, 4000);
    }
  });
}

// ── Slice to 3MF button ──

if (sliceBtn) {
  sliceBtn.addEventListener('click', async () => {
    if (sliceBtn.disabled) return;

    const userName = userNameInput ? userNameInput.value.trim() : '';
    let sessionId = '';
    if (downloadUrl) {
      const m = downloadUrl.match(/\/data\/[^/]+\/([a-f0-9]+)\//);
      if (m) sessionId = m[1];
    }

    sliceBtn.disabled = true;
    sliceBtn.textContent = __('slicing');

    try {
      const res = await fetch(`${API_BASE}/api/slice-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName || 'unknown', session_id: sessionId }),
      });

      if (!res.ok) {
        let detail = __('errServerError', { code: res.status });
        try {
          const body = await res.json();
          if (body.detail) detail = body.detail;
        } catch (_) {}
        const err = new Error(detail);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const fileUrl = data.file_url;
      const fullUrl = window.location.origin + (fileUrl || '');
      displayResultInfo([
        { label: __('sliceSuccess'), value: fileUrl ? '<a href="' + fullUrl + '" target="_blank">' + fullUrl + '</a>' : '' }
      ]);
      sliceBtn.textContent = __('sliceModel');
      sliceBtn.disabled = false;
    } catch (err) {
      sliceBtn.textContent = __('sliceFailed');
      showError(err.message);

      setTimeout(() => {
        sliceBtn.textContent = __('sliceModel');
        sliceBtn.disabled = false;
      }, 4000);
    }
  });
}

// ── Model Details button ──

if (modelDetailsBtn) {
  modelDetailsBtn.addEventListener('click', async () => {
    if (modelDetailsBtn.disabled) return;

    modelDetailsBtn.disabled = true;
    modelDetailsBtn.textContent = __('loadingDetails');

    try {
      const res = await fetch(`${API_BASE}/api/model-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: currentUserName || userNameInput?.value?.trim() || 'unknown',
          session_id: sessionId || '',
        }),
      });

      if (!res.ok) {
        let detail = __('errServerError', { code: res.status });
        try {
          const body = await res.json();
          if (body.detail) detail = body.detail;
        } catch (_) {}
        const err = new Error(detail);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();

      const items = [];
      if (data.sparse_infill_density != null) {
        items.push({ label: __('detailInfill'), value: data.sparse_infill_density });
      }
      if (data.print_time_formatted) {
        items.push({ label: __('detailPrintTime'), value: data.print_time_formatted });
      }
      if (data.filament_grams != null) {
        items.push({ label: __('detailFilament'), value: data.filament_grams + ' g' });
      }
      if (data.filament_cost != null) {
        items.push({ label: __('detailFilamentCost'), value: '¥' + data.filament_cost });
      }
      if (data.dimensions_mm) {
        const d = data.dimensions_mm;
        items.push({ label: __('detailDimensions'), value: d.width + ' × ' + d.depth + ' × ' + d.height + ' mm' });
      }
      if (data.file_path) {
        items.push({ label: __('detail3mfPath'), value: data.file_path });
      }

      displayResultInfo(items);
    } catch (err) {
      showError(err.message);
    } finally {
      modelDetailsBtn.disabled = false;
      modelDetailsBtn.textContent = __('modelDetails');
    }
  });
}

// ── Initialize: restore result and upload state on page load ──
// Wrap in DOMContentLoaded to guarantee all DOM elements exist.
// Also handle bfcache (back-forward cache) restoration via pageshow event.
function initPage() {
  console.log('[app.js] initPage: restoring state. sessionStorage keys:', Object.keys(sessionStorage));
  restoreResultState();
  restoreUploadState();
  setupUploadStateClear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}

// Also handle bfcache (back-forward cache) restoration
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('[app.js] pageshow (bfcache restore): re-running restoreResultState');
    restoreResultState();
  }
});

// ── Health check on startup ──

async function checkHealth() {
  setStatus(__('statusConnecting'), 'loading');
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      setStatus(__('statusConnected'), 'ok');
    } else {
      setStatus(__('statusUnhealthy') + res.status + ')', 'error');
    }
  } catch (_) {
    setStatus(__('statusCannotReach'), 'error');
  }
}

checkHealth();