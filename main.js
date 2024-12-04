const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;

function createMainWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[Main Process] Preload script path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Main Process] Running in development mode');
    const waitOn = require('wait-on');
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

ipcMain.handle('close-app', () => {
  console.log('[close-app] Closing the application');
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('minimize-app', () => {
  console.log('[minimize-app] Minimizing the application');
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-app', () => {
  console.log('[maximize-app] Maximizing the application');
  if (mainWindow) mainWindow.maximize();
});

ipcMain.handle('restore-app', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      console.log('[restore-app] Window is minimized. Restoring...');
      mainWindow.restore();
    } else if (mainWindow.isMaximized()) {
      console.log('[restore-app] Window is maximized. Unmaximizing...');
      mainWindow.unmaximize();
    } else {
      console.log('[restore-app] Window is in normal state. Focusing...');
      mainWindow.focus();
    }
  } else {
    console.error('[restore-app] No mainWindow instance found.');
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