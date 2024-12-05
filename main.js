// const { app, BrowserWindow, Notification } = require('electron');
// const path = require('path');
// const Store = require('electron-store');
// const { ipcMain, dialog } = require('electron');

import { app, BrowserWindow, Notification, ipcMain, dialog} from 'electron';
import path from 'path';
import fs from 'fs';
import waitOn from 'wait-on';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


ipcMain.handle('import-article', async (event, body) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' };
  }

  const filePath = result.filePaths[0];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const article = JSON.parse(fileContent);
    return { success: true, article };
  } catch (error) {
    return { success: false, error: `Failed to read file: ${error.message}` };
  }
});

ipcMain.handle('export-article', async (event, jsonData) => {
    // const { dialog } = require('electron');
    // const fs = require('fs');

    const result = await dialog.showSaveDialog({
        title: 'Save Article',
        defaultPath: 'article.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled) {
        return { success: false, error: 'Save operation canceled by user' };
    }

    const filePath = result.filePath;
    try {
        fs.writeFileSync(filePath, jsonData, 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, error: `Failed to write file: ${error.message}` };
    }
});


const store = new Store();
let mainWindow;

function createMainWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[Main Process] Preload script path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: true,
    transparent: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Main Process] Running in development mode');
    // const waitOn = require('wait-on');
    waitOn({ resources: ['http://localhost:4200'], timeout: 60000 }, (err) => {
      if (err) {
        console.error('[Main Process] Angular server not ready:', err);
        app.quit();
      } else {
        mainWindow.loadURL('http://localhost:4200')
          .then(() => console.log('[Main Process] Loaded Angular server successfully'))
          .catch(err => {
            console.error('[Main Process] Failed to load Angular server URL:', err.message, err.stack);
            app.quit();
          });
        mainWindow.webContents.openDevTools();
      }
    });
  } else {
    console.log('[Main Process] Running in production mode');
    const filePath = path.join(__dirname, 'dist/news-manager-project/browser/index.html');
    mainWindow.loadFile(filePath)
      .then(() => console.log('[Main Process] Loaded production file successfully'))
      .catch(err => {
        console.error('[Main Process] Failed to load production file:', err.message, err.stack);
        app.quit();
      });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main Process] DOM has finished loading, applying custom styles');
    mainWindow.webContents.executeJavaScript(`
      function applyCustomStyles() {
        const style = document.createElement('style');
        style.textContent = \`
          * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -ms-user-select: none !important;
            -moz-user-select: none !important;
          }
          a, button, input, textarea {
            cursor: default !important;
          }
        \`;
        document.head.appendChild(style);
      }
  
      applyCustomStyles();
  
      const observer = new MutationObserver(() => applyCustomStyles());
      observer.observe(document.body, { childList: true, subtree: true });
    `);
  });

  mainWindow.on('closed', () => {
    console.log('[Main Process] MainWindow closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Main Process] Failed to load ${validatedURL}: ${errorDescription} (code: ${errorCode})`);
  });
}

// IPC Handlers
ipcMain.handle('window-ready', () => {
  if (mainWindow) {
    console.log('[window-ready] Window is ready');
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  } else {
    console.error('[window-ready] No mainWindow instance found.');
  }
});

ipcMain.handle('show-notification', async (_, { title, body }) => {
  if (Notification.isSupported()) {
    console.log('[show-notification] Showing notification:', { title, body });
    new Notification({ title, body }).show();
    return { success: true };
  } else {
    console.error('[show-notification] Notifications are not supported on this platform.');
    return { success: false, error: 'Notifications not supported on this platform.' };
  }
});

ipcMain.handle('store-set', async (_, { key, value }) => {
  try {
    store.set(key, value);
    console.log(`[store-set] Key "${key}" set successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[store-set] Error setting key "${key}":`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('store-get', async (_, key) => {
  try {
    const value = store.get(key);
    console.log(`[store-get] Key "${key}" retrieved successfully`);
    return { success: true, value };
  } catch (error) {
    console.error(`[store-get] Error retrieving key "${key}":`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('store-delete', async (_, key) => {
  if (typeof key !== 'string') {
    return { success: false, error: 'Invalid key type. Key must be a string.' };
  }

  try {
    store.delete(key);
    console.log(`[store-delete] Key "${key}" deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[store-delete] Error deleting key "${key}":`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('store-clear', async () => {
  try {
    store.clear();
    console.log('[store-clear] Store cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('[store-clear] Error clearing store:', error);
    return { success: false, error: error.message };
  }
});


// Application Lifecycle
app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('[App] All windows closed. Quitting application.');
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('[App] Activating and creating a new window');
    createMainWindow();
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Main Process] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main Process] Unhandled Rejection:', reason);
});