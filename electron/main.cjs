const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: 'TheyLovePDF',
    backgroundColor: '#0c0c18',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    }
  });

  // ✅ LOAD DEDICATED DESKTOP UI (not the website)
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Handle double-clicked PDF files on startup
  const args = process.argv;
  if (args.length >= 2) {
    const filePath = args[args.length - 1];
    if (filePath && filePath.toLowerCase().endsWith('.pdf') && fs.existsSync(filePath)) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('open-file', filePath);
      });
    }
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle('TheyLovePDF');
  });

  // Auto-updater
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => mainWindow.webContents.send('update_available'));
    autoUpdater.on('update-downloaded', () => mainWindow.webContents.send('update_downloaded'));
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const filePath = commandLine[commandLine.length - 1];
      if (filePath && filePath.toLowerCase().endsWith('.pdf')) {
        mainWindow.webContents.send('open-file', filePath);
      }
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) mainWindow.webContents.send('open-file', filePath);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// IPC HANDLERS — PDF Processing
// ==========================================

ipcMain.handle('open-file-dialog', async (event, opts = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: opts.multiSelections
      ? ['openFile', 'multiSelections']
      : ['openFile', 'multiSelections'],
    filters: opts.filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.canceled ? null : result.filePaths;
});

ipcMain.handle('open-folder', async (event, filePath) => {
  if (filePath) shell.showItemInFolder(filePath);
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-offline-token', async () => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'pro_token.json');
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      // Validate token (in production: verify signature with your server's public key)
      if (data && data.isPro && data.expires && data.expires > Date.now()) {
        return { isPro: true };
      }
    }
  } catch (e) {}
  return { isPro: false };
});

ipcMain.handle('process-pdf', async (event, payload) => {
  try {
    const { PDFDocument, degrees, rgb, StandardFonts, PageSizes } = require('pdf-lib');

    switch (payload.action) {

      case 'merge': {
        const merged = await PDFDocument.create();
        for (const filePath of payload.files) {
          const bytes = fs.readFileSync(filePath);
          const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await merged.copyPages(doc, doc.getPageIndices());
          pages.forEach(p => merged.addPage(p));
        }
        const outBytes = await merged.save();
        const outPath = getOutputPath(payload.files[0], '_merged');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'split': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        const totalPages = doc.getPageCount();
        const pages = parsePageRange(payload.range, totalPages);
        if (pages.length === 0) return { success: false, error: 'Invalid page range' };
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(doc, pages.map(p => p - 1));
        copied.forEach(p => newDoc.addPage(p));
        const outBytes = await newDoc.save();
        const outPath = getOutputPath(payload.file, '_split');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'remove-pages': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        const total = doc.getPageCount();
        const toRemove = new Set(parsePageRange(payload.range, total).map(p => p - 1));
        const keepIndices = doc.getPageIndices().filter(i => !toRemove.has(i));
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(doc, keepIndices);
        copied.forEach(p => newDoc.addPage(p));
        const outBytes = await newDoc.save();
        const outPath = getOutputPath(payload.file, '_removed');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'rotate': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        doc.getPages().forEach(page => {
          const current = page.getRotation().angle;
          page.setRotation(degrees(current + payload.degrees));
        });
        const outBytes = await doc.save();
        const outPath = getOutputPath(payload.file, '_rotated');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'compress': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        const outBytes = await doc.save({ useObjectStreams: true });
        const outPath = getOutputPath(payload.file, '_compressed');
        fs.writeFileSync(outPath, outBytes);
        const origSize = bytes.length;
        const newSize = outBytes.length;
        console.log(`Compressed: ${origSize} → ${newSize} bytes (${Math.round((1 - newSize/origSize)*100)}% reduction)`);
        return { success: true, outputPath: outPath };
      }

      case 'page-numbers': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const pages = doc.getPages();
        const total = pages.length;
        pages.forEach((page, i) => {
          const { width } = page.getSize();
          page.drawText(`${i + 1} / ${total}`, {
            x: width / 2 - 20,
            y: 18,
            size: 10,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        });
        const outBytes = await doc.save();
        const outPath = getOutputPath(payload.file, '_numbered');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'protect': {
        const bytes = fs.readFileSync(payload.file);
        const doc = await PDFDocument.load(bytes);
        // pdf-lib supports basic encryption
        const outBytes = await doc.save({
          userPassword: payload.password,
          ownerPassword: payload.password + '_owner',
        });
        const outPath = getOutputPath(payload.file, '_protected');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      case 'unlock': {
        const bytes = fs.readFileSync(payload.file);
        try {
          const doc = await PDFDocument.load(bytes, {
            password: payload.password,
            ignoreEncryption: false
          });
          const outBytes = await doc.save();
          const outPath = getOutputPath(payload.file, '_unlocked');
          fs.writeFileSync(outPath, outBytes);
          return { success: true, outputPath: outPath };
        } catch (e) {
          return { success: false, error: 'Wrong password or file is not encrypted.' };
        }
      }

      case 'jpg-to-pdf': {
        const newDoc = await PDFDocument.create();
        for (const imgPath of payload.files) {
          const imgBytes = fs.readFileSync(imgPath);
          const ext = path.extname(imgPath).toLowerCase();
          let img;
          if (ext === '.png') {
            img = await newDoc.embedPng(imgBytes);
          } else {
            img = await newDoc.embedJpg(imgBytes);
          }
          const page = newDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const outBytes = await newDoc.save();
        const outPath = getOutputPath(payload.files[0], '_converted').replace(/\.(jpg|jpeg|png)$/i, '.pdf');
        fs.writeFileSync(outPath, outBytes);
        return { success: true, outputPath: outPath };
      }

      default:
        return { success: false, error: 'Unknown action: ' + payload.action };
    }
  } catch (err) {
    console.error('PDF Processing Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// ==========================================
// HELPERS
// ==========================================

function getOutputPath(inputPath, suffix) {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  return path.join(dir, `${base}${suffix}${ext}`);
}

function parsePageRange(rangeStr, total) {
  const pages = new Set();
  rangeStr.split(',').forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = Math.max(1, start); i <= Math.min(total, end); i++) pages.add(i);
    } else {
      const n = parseInt(part);
      if (n >= 1 && n <= total) pages.add(n);
    }
  });
  return Array.from(pages).sort((a, b) => a - b);
}
