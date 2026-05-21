/**
 * modelhead - i18n Translation System
 * Supports Chinese (zh) and English (en). Default: Chinese.
 * Language selection persists in localStorage.
 */

const LANG_KEY = 'modelhead_lang';

const TRANSLATIONS = {
  zh: {
    // Page
    'pageTitleRapid': 'modelhead - 3D 头部重建（快速模式）',
    'pageTitlePro': 'modelhead - 3D 头部重建（专业模式）',
    'badgeRapid': '快速',
    'badgePro': '专业',
    'subtitleRapid': '上传一张<strong>正面照片</strong>，在一分钟内获得可用于3D打印的STL模型。',
    'subtitlePro': '上传<strong>多张照片</strong>（正面、背面、左侧、右侧），获得高质量的可3D打印STL模型。',
    'navToPro': '切换到专业模式（多视图）',
    'navToRapid': '切换到快速模式（单张照片）',
    'selectLang': '语言',

    // Upload section
    'name': '姓名：',
    'namePlaceholder': '请输入您的姓名',
    'uploadTitleRapid': '📸 上传照片',
    'uploadTitlePro': '📸 上传照片',
    'viewHintRapid': '上传一张人物头部正面照片。',
    'viewHintPro': '上传各个角度的照片。正面照为必填，其它角度可提高质量。',

    // View labels
    'viewFront': '正面',
    'viewBack': '背面',
    'viewLeft': '左侧',
    'viewRight': '右侧',
    'required': '必填',
    'optional': '可选',
    'dropText': '点击或拖拽照片',
    'dropTextShort': '点击或拖拽',
    'change': '更换',

    // Options
    'maxSize': '最大尺寸：',
    'repairMesh': '修复网格（防水）',

    // Buttons
    'reconstruct': '生成 3D 模型',
    'reconstructing': '生成中...',
    'viewStl': '🧊 查看 STL',
    'loadingModel': '正在加载 3D 模型...',

    // Result
    'result': '结果',
    'downloadStl': '⬇ 下载 STL',
    'statVertices': '顶点数',
    'statFaces': '面数',
    'statWatertight': '防水',
    'statFileSize': '文件大小',

    // Error
    'error': '⚠️ 错误',

    // Footer
    'footerRapid': '由 <strong>Tencent Hunyuan3D Rapid</strong> 提供支持 — modelhead v1.2',
    'footerPro': '由 <strong>Tencent Hunyuan3D Pro</strong> 提供支持 — modelhead v1.2',

    // Status messages
    'statusConnecting': '正在连接服务器...',
    'statusConnected': '✓ 服务器已连接',
    'statusUnhealthy': '✗ 服务器异常（',
    'statusCannotReach': '✗ 无法连接服务器。请启动后端：uvicorn backend.server:app --reload --port 8001',

    // Errors from app.js
    'errEnterName': '请输入您的姓名。',
    'errUnsupportedType': '不支持 {view} 视图的文件类型。请使用 JPEG、PNG 或 WebP 格式。',
    'errServerError': '服务器错误（{code}）',

    // Result table values
    'yes': '是',
    'no': '否',

    // Viewer page
    'pageTitleViewer': 'modelhead - 3D 模型查看器',
    'subtitleViewer': '上传并查看 3D 模型文件（STL、OBJ、GLB/GLTF）。',
    'backToResult': '返回',
    'navToViewer': '切换到查看器',
    'footerViewer': '由 <strong>Three.js</strong> 提供支持 — modelhead v1.2',
    'uploadModelBtn': '📂 选择 3D 模型文件',
    'noFileSelected': '未选择文件',
    'viewerHint': '支持 STL、OBJ、GLB/GLTF 格式。',
    'viewerPlaceholder': '上传 3D 模型即可预览',
    'modelInfo': '模型信息',
    'statFormat': '格式',
    'statFileSize': '文件大小',
    'autoRotate': '⟳ 自动旋转',
    'wireframe': '◇ 线框',
    'resetView': '⌖ 重置视角',
    'resetModel': '⤺ 居中模型',

    // Print-to-Printer
    'printToPrinter': '🖨️ 发送到打印机',
    'printing': '正在发送到打印机...',
    'printSuccess': '✅ 已发送到打印机！',
    'printFailed': '❌ 发送失败',
    'sendToPrinter': '发送到打印机',
    'printHint': '直接将3D模型发送到您的Bambu Lab打印机。',
    'sendToPrinterBtn': '🖨️ 发送到打印机',

    // Slice to 3MF
    'sliceModel': '🔪 切片为 3MF',
    'slicing': '正在切片...',
    'sliceSuccess': '✅ 切片成功！文件路径：',
    'sliceFailed': '❌ 切片失败',

    // Model Details
    'modelDetails': '📋 模型详情',
    'loadingDetails': '正在加载详情...',
    'detailInfill': '填充密度',
    'detailPrintTime': '打印时间',
    'detailFilament': '耗材用量',
    'detailFilamentCost': '耗材费用',
    'detailDimensions': '模型尺寸',
    'detail3mfPath': '3MF 文件路径',

    // Image Enhancement page
    'pageTitleEnhance': 'modelhead - 图像增强',
    'subtitleEnhance': '上传一张<strong>图片</strong>，通过AI增强后下载结果。',
    'navToRapid': '切换到快速模式（单张照片 → 3D）',
    'uploadTitleEnhance': '🖼️ 上传图片',
    'viewHintEnhance': '上传一张需要增强的图片。增强结果将显示在下方。',
    'viewImage': '图片',
    'enhance': '增强图片',
    'originalImage': '原始',
    'enhancedImage': '增强',
    'downloadImage': '⬇ 下载图片',
    'reconstructFromEnhanced': '🖼️ 用增强图片生成3D模型',
    'footerEnhance': '由 <strong>AI 图像增强</strong> 提供支持 — modelhead v1.2',
    'enhanceInvalidFile': '请选择图片文件（JPEG、PNG 或 WebP）。',
    'enhanceReady': '图片已就绪。点击"增强图片"继续。',
    'enhanceEnterName': '请先输入您的姓名。',
    'enhanceProcessing': '正在增强图片，请稍候...',
    'enhanceSuccess': '图片增强成功！',
    'enhanceFailed': '增强失败：',
    'enhanceNoResultUrl': '服务器未返回增强图片的URL。',
    'enhanceUnknownError': '未知错误',
    'promptLabel': '提示词（可选）：',
    'promptPlaceholder': '描述你想要的风格...',
    'removeBg': '擦除背景',
  },

  en: {
    // Page
    'pageTitleRapid': 'modelhead - 3D Head Reconstruction (Rapid)',
    'pageTitlePro': 'modelhead - 3D Head Reconstruction (Pro)',
    'badgeRapid': 'Rapid',
    'badgePro': 'Pro',
    'subtitleRapid': 'Upload a <strong>single front photo</strong> and get a 3D-printable STL model back in under a minute.',
    'subtitlePro': 'Upload <strong>multiple photos</strong> (front, back, left, right) for a high-quality 3D-printable STL model.',
    'navToPro': 'Switch to Pro (multi-view)',
    'navToRapid': 'Switch to Rapid (single photo)',
    'selectLang': 'Language',

    // Upload section
    'name': 'Name:',
    'namePlaceholder': 'Please input your name',
    'uploadTitleRapid': '📸 Upload Photo',
    'uploadTitlePro': '📸 Upload Photos',
    'viewHintRapid': 'Upload a front-facing photo of the person\'s head.',
    'viewHintPro': 'Upload photos from all available angles. Front view is required; additional views improve quality.',

    // View labels
    'viewFront': 'Front',
    'viewBack': 'Back',
    'viewLeft': 'Left',
    'viewRight': 'Right',
    'required': 'Required',
    'optional': 'Optional',
    'dropText': 'Click or drag a photo',
    'dropTextShort': 'Click or drag',
    'change': 'Change',

    // Options
    'maxSize': 'Max size:',
    'repairMesh': 'Repair mesh (watertight)',

    // Buttons
    'reconstruct': 'Reconstruct 3D Model',
    'reconstructing': 'Reconstructing...',
    'viewStl': '🧊 View STL',
    'loadingModel': 'Loading 3D model...',

    // Result
    'result': 'Result',
    'downloadStl': '⬇ Download STL',
    'statVertices': 'Vertices',
    'statFaces': 'Faces',
    'statWatertight': 'Watertight',
    'statFileSize': 'File size',

    // Error
    'error': '⚠️ Error',

    // Footer
    'footerRapid': 'Powered by <strong>Tencent Hunyuan3D Rapid</strong> — modelhead v1.2',
    'footerPro': 'Powered by <strong>Tencent Hunyuan3D Pro</strong> — modelhead v1.2',

    // Status messages
    'statusConnecting': 'Connecting to server...',
    'statusConnected': '✓ Server connected',
    'statusUnhealthy': '✗ Server unhealthy (',
    'statusCannotReach': '✗ Cannot reach server. Start backend: uvicorn backend.server:app --reload --port 8001',

    // Errors from app.js
    'errEnterName': 'Please enter your name.',
    'errUnsupportedType': 'Unsupported file type for {view} view. Use JPEG, PNG, or WebP.',
    'errServerError': 'Server error ({code})',

    // Result table values
    'yes': 'Yes',
    'no': 'No',

    // Viewer page
    'pageTitleViewer': 'modelhead - 3D Model Viewer',
    'subtitleViewer': 'Upload and inspect 3D model files (STL, OBJ, GLB/GLTF).',
    'backToResult': 'Back',
    'navToViewer': 'Switch to Viewer',
    'footerViewer': 'Powered by <strong>Three.js</strong> — modelhead v1.2',
    'uploadModelBtn': '📂 Choose 3D Model File',
    'noFileSelected': 'No file selected',
    'viewerHint': 'Supports STL, OBJ, GLB/GLTF formats.',
    'viewerPlaceholder': 'Upload a 3D model to preview',
    'modelInfo': 'Model Info',
    'statFormat': 'Format',
    'statFileSize': 'File size',
    'autoRotate': '⟳ Auto-rotate',
    'wireframe': '◇ Wireframe',
    'resetView': '⌖ Reset view',
    'resetModel': '⤺ Center model',

    // Print-to-Printer
    'printToPrinter': '🖨️ Send to Printer',
    'printing': 'Sending to printer...',
    'printSuccess': '✅ Sent to printer!',
    'printFailed': '❌ Send failed',
    'sendToPrinter': 'Send to Printer',
    'printHint': 'Send this 3D model directly to your Bambu Lab printer.',
    'sendToPrinterBtn': '🖨️ Send to Printer',

    // Slice to 3MF
    'sliceModel': '🔪 Slice to 3MF',
    'slicing': 'Slicing...',
    'sliceSuccess': '✅ Sliced successfully! File path:',
    'sliceFailed': '❌ Slice failed',

    // Model Details
    'modelDetails': '📋 Model Details',
    'loadingDetails': 'Loading details...',
    'detailInfill': 'Infill Density',
    'detailPrintTime': 'Print Time',
    'detailFilament': 'Filament Usage',
    'detailFilamentCost': 'Filament Cost',
    'detailDimensions': 'Dimensions',
    'detail3mfPath': '3MF File Path',

    // Image Enhancement page
    'pageTitleEnhance': 'modelhead - Image Enhancement',
    'subtitleEnhance': 'Upload an <strong>image</strong>, enhance it with AI, then download the result.',
    'uploadTitleEnhance': '🖼️ Upload Image',
    'viewHintEnhance': 'Upload an image to enhance. The result will be shown below.',
    'viewImage': 'Image',
    'enhance': 'Enhance Image',
    'originalImage': 'Original',
    'enhancedImage': 'Enhanced',
    'downloadImage': '⬇ Download Image',
    'reconstructFromEnhanced': '🖼️ Use Image to Generate 3D Model',
    'footerEnhance': 'Powered by <strong>AI Image Enhancement</strong> — modelhead v1.2',
    'enhanceInvalidFile': 'Please select an image file (JPEG, PNG, or WebP).',
    'enhanceReady': 'Image ready. Click "Enhance Image" to proceed.',
    'enhanceEnterName': 'Please enter your name first.',
    'enhanceProcessing': 'Enhancing image, please wait...',
    'enhanceSuccess': 'Image enhanced successfully!',
    'enhanceFailed': 'Enhancement failed: ',
    'enhanceNoResultUrl': 'No enhanced image URL returned from server.',
    'enhanceUnknownError': 'Unknown error',
    'promptLabel': 'Prompt (optional):',
    'promptPlaceholder': 'Describe the style you want...',
    'removeBg': 'Erase Background',
  },
};

// ── Current language ──
let currentLang = localStorage.getItem(LANG_KEY) || 'zh';

// ── Translation function ──
function __(key, replacements = {}) {
  const langData = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
  let text = langData[key];
  if (text === undefined) {
    // Fallback to English, then to the key itself
    text = TRANSLATIONS.en[key] || key;
  }
  // Replace placeholders like {view}, {code}
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

// ── Set language ──
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  translatePage();
}

// ── Translate all elements with data-i18n ──
function translatePage() {
  // data-i18n on element content (innerHTML)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = __(key);
  });

  // data-i18n-placeholder on input placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = __(key);
  });

  // data-i18n-value on button text/spans
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    el.textContent = __(key);
  });

  // data-i18n-title on elements with title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = __(key);
  });
}

// ── Build language dropdown ──
function createLangDropdown() {
  const select = document.createElement('select');
  select.id = 'langSelect';
  select.className = 'lang-select';
  select.innerHTML = `
    <option value="zh">中文</option>
    <option value="en">English</option>
  `;
  select.value = currentLang;
  select.addEventListener('change', () => setLanguage(select.value));

  // Insert inside <h1> after "modelhead" text
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.appendChild(select);
  }
}

// ── Initialize on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  createLangDropdown();
  setLanguage(currentLang);
});