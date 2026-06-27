/**
 * modelhead - 3D Model Viewer (URL-based)
 * Loads an STL model from a URL parameter (?url=...) and renders it with Three.js.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
// ── Parse URL params ──
const urlParams = new URLSearchParams(window.location.search);
const modelUrl = urlParams.get('url');
const fromPage = urlParams.get('from') || 'index.html';

// Set back button href
const backBtn = document.getElementById('backToResultBtn');
if (backBtn && fromPage) {
  backBtn.href = fromPage;
}

// ── DOM refs ──
const placeholder = document.getElementById('viewerPlaceholder');
const loadStatus = document.getElementById('loadStatus');
const canvasWrapper = document.getElementById('viewerCanvasWrapper');
const modelInfoCard = document.getElementById('modelInfoCard');
const infoFormat = document.getElementById('infoFormat');
const infoSize = document.getElementById('infoSize');
const infoVertices = document.getElementById('infoVertices');
const infoFaces = document.getElementById('infoFaces');
const errorCard = document.getElementById('errorCard');
const errorMessage = document.getElementById('errorMessage');

const btnAutoRotate = document.getElementById('btnAutoRotate');
const btnWireframe = document.getElementById('btnWireframe');
const btnResetView = document.getElementById('btnResetView');
const btnResetModel = document.getElementById('btnResetModel');

// ── Helpers ──

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showError(msg) {
  errorCard.style.display = 'block';
  errorMessage.textContent = msg;
  placeholder.style.display = 'none';
}

// ── Three.js setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(45, canvasWrapper.clientWidth / canvasWrapper.clientHeight, 0.1, 1000);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasWrapper.clientWidth, canvasWrapper.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasWrapper.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 20;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 2.0;

// ── Lighting ──
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 1, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x8888ff, 0.4);
rimLight.position.set(0, -2, -5);
scene.add(rimLight);

const gridHelper = new THREE.GridHelper(6, 12, 0x444477, 0x333366);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ── Model state ──
let currentModel = null;
let isWireframe = false;

// ── Load model from URL ──
async function loadModelFromUrl(url) {
  if (!url) {
    showError('No model URL specified. Add ?url=/path/to/model.stl to the page URL.');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const fileSize = blob.size;

    const buffer = await blob.arrayBuffer();

    // Parse STL
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    const vertexCount = geometry.attributes.position.count;
    const faceCount = vertexCount / 3;

    // Build mesh
    const material = new THREE.MeshStandardMaterial({
      color: 0x7c72ff,
      roughness: 0.5,
      metalness: 0.1,
      flatShading: false,
      side: THREE.DoubleSide,
    });
    const rootMesh = new THREE.Mesh(geometry, material);
    rootMesh.castShadow = true;
    rootMesh.receiveShadow = true;

    // Center and scale
    const box = new THREE.Box3().setFromObject(rootMesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 3 / maxDim : 1;
    rootMesh.position.sub(center.clone().multiplyScalar(scale));
    rootMesh.scale.set(scale, scale, scale);

    scene.add(rootMesh);
    currentModel = rootMesh;
    controls.target.set(0, 0, 0);

    // Hide placeholder
    placeholder.style.display = 'none';

    // Show info card
    infoFormat.textContent = 'STL';
    infoSize.textContent = formatFileSize(fileSize);
    infoVertices.textContent = vertexCount.toLocaleString();
    infoFaces.textContent = faceCount.toLocaleString();
    modelInfoCard.style.display = 'block';

  } catch (err) {
    console.error('Failed to load model:', err);
    showError('Failed to load 3D model: ' + err.message);
  }
}

// ── Toolbar actions ──

btnAutoRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnAutoRotate.classList.toggle('active');
});

btnWireframe.addEventListener('click', () => {
  isWireframe = !isWireframe;
  btnWireframe.classList.toggle('active');
  if (currentModel) {
    currentModel.traverse(child => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => { m.wireframe = isWireframe; });
        } else {
          child.material.wireframe = isWireframe;
        }
      }
    });
  }
});

btnResetView.addEventListener('click', () => {
  controls.target.set(0, 0, 0);
  camera.position.set(4, 3, 6);
  controls.update();
});

btnResetModel.addEventListener('click', () => {
  controls.target.set(0, 0, 0);
  if (currentModel) {
    currentModel.position.set(0, 0, 0);
  }
  controls.update();
});

// ── Resize ──
function onResize() {
  const w = canvasWrapper.clientWidth;
  const h = canvasWrapper.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onResize);
const resizeObserver = new ResizeObserver(() => onResize());
resizeObserver.observe(canvasWrapper);

// ── Render loop ──
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

setTimeout(onResize, 100);

// ── Load model when ready ──
loadModelFromUrl(modelUrl);

// ── Print-to-Printer ───────────────────────────────────────────────────

// Extract user_name and session_id from the model URL or page params
// The URL format is: viewer.html?url=/data/{user_name}/{session_id}/output/final.stl
let userNameFromUrl = '';
let sessionIdFromUrl = '';

if (modelUrl) {
  // Parse /data/userName/sessionId/output/final.stl
  const m = modelUrl.match(/\/data\/([^/]+)\/([^/]+)\/output\/final\.stl$/);
  if (m) {
    userNameFromUrl = m[1];
    sessionIdFromUrl = m[2];
  }
}

const printCard = document.getElementById('printCard');
const btnSendToPrinter = document.getElementById('btnSendToPrinter');
const printStatus = document.getElementById('printStatus');

// Show the print card only when we have session context
if (userNameFromUrl && sessionIdFromUrl) {
  printCard.style.display = 'block';
}

btnSendToPrinter.addEventListener('click', async () => {
  if (!userNameFromUrl || !sessionIdFromUrl) {
    printStatus.textContent = 'Unable to identify the model session.';
    printStatus.className = 'print-status error';
    return;
  }

  btnSendToPrinter.disabled = true;
  printStatus.textContent = 'Sending to printer...';
  printStatus.className = 'print-status loading';

  try {
    const apiBase = window.API_BASE || '';
    const resp = await fetch(`${apiBase}/api/print-to-printer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: userNameFromUrl,
        session_id: sessionIdFromUrl,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.detail || `Server error: ${resp.status}`);
    }

    printStatus.textContent = data.success
      ? `✅ Sent to printer! ${data.message}`
      : `❌ Failed: ${data.message}`;
    printStatus.className = data.success ? 'print-status success' : 'print-status error';
  } catch (err) {
    console.error('Print-to-printer error:', err);
    printStatus.textContent = `❌ ${err.message}`;
    printStatus.className = 'print-status error';
  } finally {
    btnSendToPrinter.disabled = false;
  }
});
