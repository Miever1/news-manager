const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  set: (key, value) => ipcRenderer.invoke('store-set', { key, value }),
  get: (key) => ipcRenderer.invoke('store-get', { key }),
  delete: (key) => ipcRenderer.invoke('store-delete', { key }),
  clear: () => ipcRenderer.invoke('store-clear'),
});

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  },
  showNotification: (title, body) => {
    console.log('showNotification called in preload.js:', title, body);
    ipcRenderer.invoke('show-notification', { title, body });
  }
});