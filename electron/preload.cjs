const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: (opts) => ipcRenderer.invoke('open-file-dialog', opts),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // Theme updates for titlebar
  setTheme: (isDark) => ipcRenderer.send('set-theme', isDark),

  // Pro token check (monetization)
  getOfflineToken: () => ipcRenderer.invoke('get-offline-token'),

  // PDF Processing
  processPDF: (payload) => ipcRenderer.invoke('process-pdf', payload),

  // OS file open (double-click PDF)
  onOpenFile: (callback) => ipcRenderer.on('open-file', (_event, filePath) => callback(filePath)),

  // Auto-updater
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),
});
