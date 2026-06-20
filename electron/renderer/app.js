// ================================================
// TheyLovePDF Desktop App — Renderer Logic
// Monetization: Free=Online Only, Pro=Full Offline
// ================================================

// ===== TOOLS DATA =====
const TOOLS = [
  // ORGANIZE
  { id:'merge',       cat:'organize', icon:'📄', name:'Merge PDF',        desc:'Combine multiple PDFs into one',       offline:true  },
  { id:'split',       cat:'organize', icon:'✂️', name:'Split PDF',         desc:'Extract specific pages or ranges',     offline:true  },
  { id:'remove-pages',cat:'organize', icon:'🗑️', name:'Remove Pages',     desc:'Delete unwanted pages from PDF',       offline:true  },
  { id:'rotate',      cat:'organize', icon:'🔄', name:'Rotate PDF',        desc:'Rotate all or specific pages',         offline:true  },
  { id:'extract',     cat:'organize', icon:'📋', name:'Extract Pages',     desc:'Save pages as a new PDF',              offline:true  },
  // CONVERT
  { id:'pdf-to-word', cat:'convert',  icon:'📝', name:'PDF to Word',       desc:'Convert PDF to editable .docx',        offline:false },
  { id:'pdf-to-excel',cat:'convert',  icon:'📊', name:'PDF to Excel',      desc:'Extract tables into spreadsheet',      offline:false },
  { id:'pdf-to-jpg',  cat:'convert',  icon:'🖼️', name:'PDF to JPG',       desc:'Convert each page to an image',        offline:false },
  { id:'jpg-to-pdf',  cat:'convert',  icon:'📄', name:'JPG to PDF',        desc:'Combine images into a PDF',            offline:true  },
  { id:'pdf-to-ppt',  cat:'convert',  icon:'📊', name:'PDF to PPT',        desc:'Convert to PowerPoint slides',         offline:false },
  { id:'word-to-pdf', cat:'convert',  icon:'📝', name:'Word to PDF',       desc:'Convert .docx to PDF file',            offline:false },
  // EDIT
  { id:'compress',    cat:'edit',     icon:'🗜️', name:'Compress PDF',     desc:'Reduce file size while keeping quality',offline:true },
  { id:'page-numbers',cat:'edit',     icon:'#️⃣', name:'Add Page Numbers',  desc:'Stamp page numbers on each page',      offline:true  },
  { id:'watermark',   cat:'edit',     icon:'💧', name:'Add Watermark',     desc:'Add text or image watermark',          offline:false },
  { id:'edit-pdf',    cat:'edit',     icon:'✏️', name:'Edit PDF',          desc:'Annotate, highlight, and edit text',   offline:false },
  { id:'header-footer',cat:'edit',    icon:'📑', name:'Header & Footer',   desc:'Add custom header and footer text',    offline:false },
  // SECURITY
  { id:'protect',     cat:'security', icon:'🔐', name:'Protect PDF',       desc:'Password protect your PDF file',       offline:true  },
  { id:'unlock',      cat:'security', icon:'🔓', name:'Unlock PDF',        desc:'Remove password from PDF',             offline:true  },
  { id:'sign',        cat:'security', icon:'✍️', name:'Sign PDF',          desc:'Add digital or drawn signature',       offline:false },
];

// ===== APP STATE =====
const state = {
  isPro: false,
  isOnline: navigator.onLine,
  currentCat: 'all',
  selectedFiles: [],
  recentFiles: [],
  lastOutputPath: '',
};

// ===== INIT =====
async function init() {
  await checkProStatus();
  updateConnectionUI();
  renderTools('all');
  updateNavCounts();
  loadRecentFiles();
  setupEventListeners();
  setupSearchInput();
  setupDropZone();
}

// ===== PRO CHECK (Monetization Core) =====
async function checkProStatus() {
  try {
    const token = await window.electronAPI.getOfflineToken();
    state.isPro = token && token.isPro === true;
  } catch (e) {
    state.isPro = false;
  }

  // Update UI based on plan
  const badge = document.getElementById('planBadge');
  const proCard = document.getElementById('proUpgradeCard');
  if (state.isPro) {
    badge.textContent = 'PRO';
    badge.classList.add('pro');
    if (proCard) proCard.style.display = 'none';
  }

  // SMART TRICK: Block free users if offline
  if (!state.isOnline && !state.isPro) {
    showOfflineModal();
  }
}

// ===== CONNECTION MONITORING (Smart Trick) =====
function setupEventListeners() {
  window.addEventListener('offline', () => {
    state.isOnline = false;
    updateConnectionUI();
    // Block free users immediately when internet goes down
    if (!state.isPro) {
      showOfflineModal();
    }
  });

  window.addEventListener('online', () => {
    state.isOnline = true;
    updateConnectionUI();
    hideOfflineModal();
  });

  // Upgrade buttons
  document.getElementById('upgradeBtn').onclick = openUpgradePage;
  document.getElementById('sidebarUpgradeBtn').onclick = openUpgradePage;
  document.getElementById('retryBtn').onclick = retryConnection;
  document.getElementById('openFolderBtn').onclick = openOutputFolder;
  document.getElementById('closeSuccessBtn').onclick = closeSuccessModal;
  document.getElementById('confirmSplitBtn').onclick = confirmSplit;
  document.getElementById('cancelSplitBtn').onclick = () => hideModal('splitModal');
  document.getElementById('cancelRotateBtn').onclick = () => hideModal('rotateModal');

  // Rotate buttons
  document.querySelectorAll('.rotate-btn').forEach(btn => {
    btn.onclick = () => confirmRotate(parseInt(btn.dataset.deg));
  });
}

function updateConnectionUI() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  dot.className = 'status-dot ' + (state.isOnline ? 'green' : 'red');
  text.textContent = state.isOnline ? 'Online' : 'Offline';
}

function retryConnection() {
  state.isOnline = navigator.onLine;
  if (state.isOnline) {
    hideOfflineModal();
    updateConnectionUI();
  } else {
    // Flash the modal briefly to indicate retry
    const modal = document.getElementById('offlineModal');
    modal.style.opacity = '0.7';
    setTimeout(() => modal.style.opacity = '1', 200);
  }
}

// ===== MODALS =====
function showOfflineModal() { document.getElementById('offlineModal').style.display = 'flex'; }
function hideOfflineModal() { document.getElementById('offlineModal').style.display = 'none'; }

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

function showProcessing(title = 'Processing...', desc = 'Please wait.') {
  document.getElementById('processingTitle').textContent = title;
  document.getElementById('processingDesc').textContent = desc;
  document.getElementById('progressBar').style.width = '0%';
  showModal('processingModal');
  animateProgress();
}

function hideProcessing() { hideModal('processingModal'); }

function animateProgress() {
  let w = 0;
  const bar = document.getElementById('progressBar');
  const interval = setInterval(() => {
    w = Math.min(w + Math.random() * 15, 90);
    bar.style.width = w + '%';
    if (w >= 90) clearInterval(interval);
  }, 200);
}

function finishProgress() {
  document.getElementById('progressBar').style.width = '100%';
  setTimeout(hideProcessing, 400);
}

function showSuccess(filePath) {
  state.lastOutputPath = filePath;
  document.getElementById('successPath').textContent = filePath;
  showModal('successModal');
}
function closeSuccessModal() { hideModal('successModal'); }

function openOutputFolder() {
  if (state.lastOutputPath) window.electronAPI.openFolder(state.lastOutputPath);
  closeSuccessModal();
}

function openUpgradePage() {
  window.electronAPI.openExternal('https://www.theylovepdf.com/pricing?ref=desktop');
}

function openSettings() {
  window.electronAPI.openExternal('https://www.theylovepdf.com/settings?ref=desktop');
}

// ===== CATEGORY SWITCHING =====
function switchCat(cat, btn) {
  state.currentCat = cat;
  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const recentWrap = document.getElementById('recentWrap');
  const toolsGrid = document.getElementById('toolsGrid');
  const sectionHeader = document.querySelector('.section-header');

  if (cat === 'recent') {
    recentWrap.style.display = 'block';
    toolsGrid.style.display = 'none';
    sectionHeader.style.display = 'none';
    renderRecent();
  } else {
    recentWrap.style.display = 'none';
    toolsGrid.style.display = 'grid';
    sectionHeader.style.display = 'flex';
    renderTools(cat);
  }
}

// ===== RENDER TOOLS =====
function renderTools(cat, searchQuery = '') {
  let tools = cat === 'all' ? TOOLS : TOOLS.filter(t => t.cat === cat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    tools = TOOLS.filter(t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
  }

  const titles = { all: 'All Tools', organize: 'Organize', convert: 'Convert', edit: 'Edit & Enhance', security: 'Security' };
  const subs = {
    all: `${tools.length} tools available`,
    organize: 'Merge, split, reorder your PDF pages',
    convert: 'Convert PDFs to and from other formats',
    edit: 'Edit, compress and enhance your PDFs',
    security: 'Protect and secure your PDF files',
  };
  document.getElementById('sectionTitle').textContent = searchQuery ? `Results for "${searchQuery}"` : (titles[cat] || cat);
  document.getElementById('sectionSub').textContent = searchQuery ? `${tools.length} tools found` : subs[cat];

  const grid = document.getElementById('toolsGrid');
  if (tools.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <p>No tools found for "${searchQuery}"</p>
    </div>`;
    return;
  }

  grid.innerHTML = tools.map(tool => {
    const offlineLabel = tool.offline
      ? '<span class="tool-badge">✅ Offline OK</span>'
      : '<span class="tool-badge online-only">🌐 Online Only</span>';

    return `
    <div class="tool-card ${!tool.offline ? 'online-only' : ''}" onclick="handleToolClick('${tool.id}')">
      <div class="tool-icon">${tool.icon}</div>
      <div>
        <div class="tool-name">${tool.name}</div>
        <div class="tool-desc">${tool.desc}</div>
      </div>
      ${offlineLabel}
    </div>`;
  }).join('');
}

function updateNavCounts() {
  const cats = ['organize', 'convert', 'edit', 'security'];
  document.getElementById('count-all').textContent = TOOLS.length;
  cats.forEach(cat => {
    const el = document.getElementById('count-' + cat);
    if (el) el.textContent = TOOLS.filter(t => t.cat === cat).length;
  });
}

// ===== SEARCH =====
function setupSearchInput() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    document.getElementById('recentWrap').style.display = 'none';
    document.getElementById('toolsGrid').style.display = 'grid';
    document.querySelector('.section-header').style.display = 'flex';
    renderTools('all', q);
  });
}

// ===== DROP ZONE =====
function setupDropZone() {
  const zone = document.getElementById('dropZone');
  const target = document.getElementById('dropTarget');

  zone.addEventListener('click', browseFiles);
  target.addEventListener('click', e => e.stopPropagation());

  ['dragenter', 'dragover'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
    });
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (files.length > 0) {
      addFiles(files.map(f => f.path));
    }
  });

  // Listen for files opened via OS double-click
  if (window.electronAPI && window.electronAPI.onOpenFile) {
    window.electronAPI.onOpenFile((filePath) => {
      if (filePath) addFiles([filePath]);
    });
  }
}

async function browseFiles() {
  try {
    const paths = await window.electronAPI.openFileDialog();
    if (paths && paths.length > 0) addFiles(paths);
  } catch(e) { console.error(e); }
}

function addFiles(paths) {
  state.selectedFiles = [...new Set([...state.selectedFiles, ...paths])];
  renderFilesBar();
}

function clearFiles() {
  state.selectedFiles = [];
  renderFilesBar();
}

function renderFilesBar() {
  const bar = document.getElementById('filesBar');
  const list = document.getElementById('filesList');
  if (state.selectedFiles.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  list.innerHTML = state.selectedFiles.map((f, i) => {
    const name = f.split(/[\\/]/).pop();
    return `<div class="file-chip">
      📄 <span title="${name}">${name}</span>
      <button class="file-remove" onclick="removeFile(${i})">×</button>
    </div>`;
  }).join('');
}

function removeFile(index) {
  state.selectedFiles.splice(index, 1);
  renderFilesBar();
}

// ===== TOOL CLICK HANDLER =====
async function handleToolClick(toolId) {
  const tool = TOOLS.find(t => t.id === toolId);
  if (!tool) return;

  // Online-only tools → open in browser
  if (!tool.offline) {
    const urlMap = {
      'pdf-to-word': '/tools/pdf-to-word',
      'pdf-to-excel': '/tools/pdf-to-excel',
      'pdf-to-jpg': '/tools/pdf-to-jpg',
      'pdf-to-ppt': '/tools/pdf-to-ppt',
      'word-to-pdf': '/tools/word-to-pdf',
      'watermark': '/tools/add-watermark',
      'edit-pdf': '/tools/edit-pdf',
      'header-footer': '/tools/header-footer',
      'sign': '/tools/sign-pdf',
    };
    const path = urlMap[toolId] || '/tools';
    window.electronAPI.openExternal('https://www.theylovepdf.com' + path + '?ref=desktop-app');
    return;
  }

  // Offline tools — check if user can use them
  if (!state.isOnline && !state.isPro) {
    showOfflineModal();
    return;
  }

  // Ensure we have files
  if (toolId !== 'merge' && state.selectedFiles.length === 0) {
    const paths = await window.electronAPI.openFileDialog();
    if (!paths || paths.length === 0) return;
    addFiles(paths);
  }
  if (toolId === 'merge' && state.selectedFiles.length < 2) {
    const paths = await window.electronAPI.openFileDialog({ multiSelections: true });
    if (!paths || paths.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }
    addFiles(paths);
  }

  // Route to specific tool
  switch (toolId) {
    case 'merge':       await processMerge(); break;
    case 'split':       showSplitModal(); break;
    case 'remove-pages': await processRemovePages(); break;
    case 'rotate':      showRotateModal(); break;
    case 'extract':     showSplitModal(); break;
    case 'compress':    await processCompress(); break;
    case 'page-numbers': await processPageNumbers(); break;
    case 'protect':     await processProtect(); break;
    case 'unlock':      await processUnlock(); break;
    case 'jpg-to-pdf':  await processJpgToPdf(); break;
    default:
      window.electronAPI.openExternal('https://www.theylovepdf.com/tools?ref=desktop');
  }
}

// ===== PDF PROCESSING FUNCTIONS =====

async function processMerge() {
  const files = state.selectedFiles.filter(f => f.toLowerCase().endsWith('.pdf'));
  if (files.length < 2) { alert('Select at least 2 PDF files.'); return; }
  showProcessing('Merging PDFs...', `Combining ${files.length} files into one.`);
  try {
    const result = await window.electronAPI.processPDF({ action: 'merge', files });
    finishProgress();
    if (result.success) {
      addToRecent(files);
      showSuccess(result.outputPath);
    } else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

function showSplitModal() { showModal('splitModal'); }

async function confirmSplit() {
  const range = document.getElementById('splitRangeInput').value.trim();
  if (!range) { alert('Enter page ranges.'); return; }
  hideModal('splitModal');
  const file = state.selectedFiles[0];
  showProcessing('Splitting PDF...', `Extracting pages: ${range}`);
  try {
    const result = await window.electronAPI.processPDF({ action: 'split', file, range });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

function showRotateModal() { showModal('rotateModal'); }

async function confirmRotate(degrees) {
  hideModal('rotateModal');
  const file = state.selectedFiles[0];
  showProcessing('Rotating PDF...', `Rotating pages by ${degrees}°`);
  try {
    const result = await window.electronAPI.processPDF({ action: 'rotate', file, degrees });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processRemovePages() {
  const pageStr = prompt('Enter page numbers to remove (e.g. 1, 3, 5-7):');
  if (!pageStr) return;
  const file = state.selectedFiles[0];
  showProcessing('Removing pages...', `Removing pages: ${pageStr}`);
  try {
    const result = await window.electronAPI.processPDF({ action: 'remove-pages', file, range: pageStr });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processCompress() {
  const file = state.selectedFiles[0];
  showProcessing('Compressing PDF...', 'Optimizing file size...');
  try {
    const result = await window.electronAPI.processPDF({ action: 'compress', file });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processPageNumbers() {
  const file = state.selectedFiles[0];
  showProcessing('Adding page numbers...', 'Stamping page numbers on each page...');
  try {
    const result = await window.electronAPI.processPDF({ action: 'page-numbers', file });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processProtect() {
  const password = prompt('Enter password to protect this PDF:');
  if (!password) return;
  const file = state.selectedFiles[0];
  showProcessing('Protecting PDF...', 'Adding password encryption...');
  try {
    const result = await window.electronAPI.processPDF({ action: 'protect', file, password });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processUnlock() {
  const password = prompt('Enter the PDF password to unlock it:');
  if (password === null) return;
  const file = state.selectedFiles[0];
  showProcessing('Unlocking PDF...', 'Removing password protection...');
  try {
    const result = await window.electronAPI.processPDF({ action: 'unlock', file, password });
    finishProgress();
    if (result.success) { addToRecent([file]); showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

async function processJpgToPdf() {
  const paths = await window.electronAPI.openFileDialog({ filters: [{ name: 'Images', extensions: ['jpg','jpeg','png'] }] });
  if (!paths || paths.length === 0) return;
  showProcessing('Creating PDF from images...', `Processing ${paths.length} image(s)...`);
  try {
    const result = await window.electronAPI.processPDF({ action: 'jpg-to-pdf', files: paths });
    finishProgress();
    if (result.success) { showSuccess(result.outputPath); }
    else { alert('Error: ' + result.error); }
  } catch(e) { finishProgress(); alert('Error: ' + e.message); }
}

// ===== RECENT FILES =====
function addToRecent(filePaths) {
  const now = Date.now();
  filePaths.forEach(f => {
    state.recentFiles = state.recentFiles.filter(r => r.path !== f);
    state.recentFiles.unshift({ path: f, time: now });
  });
  state.recentFiles = state.recentFiles.slice(0, 20);
  saveRecentFiles();
}

function saveRecentFiles() {
  try { localStorage.setItem('recentFiles', JSON.stringify(state.recentFiles)); } catch(e){}
}

function loadRecentFiles() {
  try {
    const saved = localStorage.getItem('recentFiles');
    if (saved) state.recentFiles = JSON.parse(saved);
  } catch(e){ state.recentFiles = []; }
}

function clearRecent() {
  state.recentFiles = [];
  saveRecentFiles();
  renderRecent();
}

function renderRecent() {
  const list = document.getElementById('recentList');
  if (state.recentFiles.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📂</div>
      <p>No recent files yet. Start processing a PDF!</p>
    </div>`;
    return;
  }
  list.innerHTML = state.recentFiles.map(r => {
    const name = r.path.split(/[\\/]/).pop();
    const ago = timeAgo(r.time);
    return `<div class="recent-item" onclick="addFiles(['${r.path.replace(/\\/g, '\\\\')}'])">
      <div class="recent-icon">📄</div>
      <div class="recent-info">
        <div class="recent-name" title="${r.path}">${name}</div>
        <div class="recent-meta">${ago}</div>
      </div>
      <div class="recent-action">Open →</div>
    </div>`;
  }).join('');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

// ===== UPDATER NOTIFICATIONS =====
if (window.electronAPI) {
  window.electronAPI.onUpdateAvailable(() => {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#4f6ef7;color:#fff;text-align:center;padding:8px;font-size:13px;z-index:9999;';
    bar.innerHTML = '🎉 A new update is available! <button onclick="window.electronAPI.restartApp()" style="margin-left:12px;background:white;color:#4f6ef7;border:none;border-radius:4px;padding:3px 10px;font-weight:700;cursor:pointer;">Install & Restart</button>';
    document.body.prepend(bar);
  });
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
