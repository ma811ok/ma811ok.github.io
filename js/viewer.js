/**
 * modelhead - 3D Model Viewer
 * Three.js based STL/OBJ/GLTF viewer with OrbitControls.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── DOM refs ──
const fileInput = document.getElementById('modelFileInput');
const fileNameEl = document.getElementById('fileName');
const canvasWrapper = document.getElementById('viewerCanvasWrapper');
const placeholder = document.getElementById('viewerPlaceholder');
const modelInfoCard = document.getElementById('modelInfoCard');
const infoFormat = document.getElementById('infoFormat');
const infoSize = document.getElementById('infoSize');

const btnAutoRotate = document.getElementById('btnAutoRotate');
const btnWireframe = document.getElementById('btnWireframe');
const btnResetView = document.getElementById('btnResetView');
const btnResetModel = document.getElementById('btnResetModel');

// ── Three.js setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera
const camera = new THREE.PerspectiveCamera(45, canvasWrapper.clientWidth / canvasWrapper.clientHeight, 0.1, 1000);
camera.position.set(4, 3, 6);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasWrapper.clientWidth, canvasWrapper.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasWrapper.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 20;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 2.0;

// ── Lighting ──
// Ambient
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

// Main directional light
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 1, 4);
scene.add(fillLight);

// Rim light
const rimLight = new THREE.DirectionalLight(0x8888ff, 0.4);
rimLight.position.set(0, -2, -5);
scene.add(rimLight);

// Optional: Grid helper
const gridHelper = new THREE.GridHelper(6, 12, 0x444477, 0x333366);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ── Model state ──
let currentModel = null;
let isWireframe = false;

// ── Helpers ──

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'stl') return 'STL';
  if (ext === 'obj') return 'OBJ';
  if (ext === 'glb') return 'GLB';
  if (ext === 'gltf') return 'GLTF';
  return ext.toUpperCase();
}

// ── Load model ──

function loadModel(file) {
  const format = getFormat(file.name);
  const ext = file.name.split('.').pop().toLowerCase();

  if (!['stl', 'obj', 'glb', 'gltf'].includes(ext)) {
    alert(i18nUnsupported());
    return;
  }

  // Show loading state
  placeholder.innerHTML = '<div class="placeholder-icon" style="animation: spin 1s linear infinite;">⏳</div><p>Loading model...</p>';
  placeholder.style.display = 'flex';

  // Remove previous model
  if (currentModel) {
    scene.remove(currentModel);
    disposeModel(currentModel);
    currentModel = null;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const buffer = e.target.result;

    try {
      if (ext === 'stl') {
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshStandardMaterial({
          color: 0x7c72ff,
          roughness: 0.5,
          metalness: 0.1,
          flatShading: false,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        centerAndScale(mesh, geometry);
        scene.add(mesh);
        currentModel = mesh;
      } else if (ext === 'obj') {
        const text = new TextDecoder().decode(buffer);
        const loader = new OBJLoader();
        const obj = loader.parse(text);
        obj.traverse(child => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x7c72ff,
              roughness: 0.5,
              metalness: 0.1,
              side: THREE.DoubleSide,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        centerAndScale(obj);
        scene.add(obj);
        currentModel = obj;
      } else if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader();
        loader.parse(buffer, '', function (gltf) {
          gltf.scene.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          centerAndScale(gltf.scene);
          scene.add(gltf.scene);
          currentModel = gltf.scene;
          onModelLoaded(file, format);
        }, function (error) {
          console.error('GLTF parse error:', error);
          showError('Failed to parse GLTF/GLB file.');
        });
        return; // async callback
      }

      onModelLoaded(file, format);
    } catch (err) {
      console.error('Load error:', err);
      showError('Failed to load model: ' + err.message);
    }
  };

  reader.onerror = function () {
    showError('Failed to read file.');
  };

  if (ext === 'obj' || ext === 'stl') {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function centerAndScale(obj, geometry) {
  // Compute bounding box
  let box;
  if (geometry) {
    geometry.computeBoundingBox();
    box = geometry.boundingBox;
  } else {
    const bbox = new THREE.Box3().setFromObject(obj);
    box = bbox;
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Normalize scale: longest side ≈ 3 units
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 3 / maxDim : 1;

  obj.position.sub(center.clone().multiplyScalar(scale));
  obj.scale.set(scale, scale, scale);

  // Update controls target to model center
  controls.target.set(0, 0, 0);
}

function disposeModel(obj) {
  obj.traverse(child => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

function onModelLoaded(file, format) {
  // Hide placeholder
  placeholder.style.display = 'none';

  // Update file name
  fileNameEl.textContent = file.name;

  // Update model info
  infoFormat.textContent = format;
  infoSize.textContent = formatFileSize(file.size);
  modelInfoCard.style.display = 'block';

  // Reset wireframe state
  isWireframe = false;
  btnWireframe.classList.remove('active');
}

function showError(msg) {
  placeholder.innerHTML = `<div class="placeholder-icon" style="color:#d32f2f;">✗</div><p style="color:#d32f2f;">${msg}</p>`;
  placeholder.style.display = 'flex';
}

function i18nUnsupported() {
  // Simple i18n inline since this module runs after i18n.js
  const lang = document.documentElement.lang || 'en';
  return lang.startsWith('zh')
    ? '不支持的文件格式。请选择 STL、OBJ、GLB 或 GLTF 文件。'
    : 'Unsupported file format. Please select an STL, OBJ, GLB, or GLTF file.';
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

// ── File input ──

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    loadModel(fileInput.files[0]);
  }
});

// Drag & drop support
canvasWrapper.addEventListener('dragover', (e) => {
  e.preventDefault();
  canvasWrapper.style.outline = '2px solid var(--accent)';
});

canvasWrapper.addEventListener('dragleave', () => {
  canvasWrapper.style.outline = '';
});

canvasWrapper.addEventListener('drop', (e) => {
  e.preventDefault();
  canvasWrapper.style.outline = '';
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    loadModel(files[0]);
  }
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

// Also watch for container size changes (e.g. toolbar wrapping)
const resizeObserver = new ResizeObserver(() => onResize());
resizeObserver.observe(canvasWrapper);

// ── Render loop ──

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// ── Initial resize ──
setTimeout(onResize, 100);