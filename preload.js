const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDefaultPaths: () => ipcRenderer.invoke('get-default-paths'),
  readConfig: (filePath) => ipcRenderer.invoke('read-config', filePath),
  writeConfig: (filePath, config) => ipcRenderer.invoke('write-config', { filePath, config }),
  selectFile: (defaultPath) => ipcRenderer.invoke('select-file', defaultPath),
  getEnvInfo: () => ipcRenderer.invoke('get-env-info')
});
