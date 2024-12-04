const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  set: (key, value) => ipcRenderer.invoke('store-set', { key, value }),
  get: (key) => ipcRenderer.invoke('store-get', key),
  delete: (key) => {
    console.log('Preload delete called with key:', key);
    return ipcRenderer.invoke('store-delete', key);
  },
  clear: () => ipcRenderer.invoke('store-clear'),
});

contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    invoke: (channel, args) => ipcRenderer.invoke(channel, args),
    on: (channel, listener) => ipcRenderer.on(channel, listener),
    removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  },
  showNotification: (title, body) => {
    console.log('showNotification called in preload.js:', title, body);
    ipcRenderer.invoke('show-notification', { title, body });
  },
  windowReady: () => {
    ipcRenderer.invoke('window-ready');
  },
});