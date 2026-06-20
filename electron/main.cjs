const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'TheyLovePDF Toolkit',
    webPreferences: {
      // Security configurations
      nodeIntegration: false, // Prevent RCE vulnerabilities
      contextIsolation: true, // Isolate context from preload script
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true // Enforce SOP
    }
  });

  // Load the React Vite app (in production it loads from dist, in dev from localhost)
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle double-clicked files
  const args = process.argv;
  if (args.length >= 2) {
    const filePath = args[args.length - 1];
    if (filePath.toLowerCase().endsWith('.pdf')) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('open-file', filePath);
      });
    }
  }

  // Auto updater logic
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
}

// Handle file open from OS while app is already running (macOS)
app.on('open-file', (event, path) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('open-file', path);
  }
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Check for file passed to second instance (Windows)
      if (commandLine.length >= 2) {
        const filePath = commandLine[commandLine.length - 1];
        if (filePath.toLowerCase().endsWith('.pdf')) {
          mainWindow.webContents.send('open-file', filePath);
        }
      }
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC listeners for the smart trick logic
ipcMain.handle('get-offline-token', async (event) => {
  // Store offline tokens using electron-store or safe storage
  // Mocked for architecture setup
  return null; 
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
