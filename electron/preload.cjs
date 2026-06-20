const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for files passed via OS double-click
  onOpenFile: (callback) => ipcRenderer.on('open-file', (_event, filePath) => callback(filePath)),
  
  // Smart trick: fetch offline token from safe storage
  getOfflineToken: () => ipcRenderer.invoke('get-offline-token'),
  
  // Auto-updater events
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app')
});
