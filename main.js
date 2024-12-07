import { app, BrowserWindow, Notification, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
// import waitOn from 'wait-on';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
let mainWindow;

let lastExportedFilePath = null;

function createMainWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: true,
    transparent: true,
    title: "Newspapers",
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'public', 'favicon.png'),
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // if (process.env.NODE_ENV === 'development') {
  //   waitOn({ resources: ['http://localhost:4200'], timeout: 60000 }, (err) => {
  //     if (err) {
  //       app.quit();
  //     } else {
  //       mainWindow.loadURL('http://localhost:4200')
  //         .then(() => console.log('[Main Process] Loaded Angular server successfully'))
  //         .catch(err => {
  //           app.quit();
  //         });
  //       mainWindow.webContents.openDevTools();
  //     }
  //   });
  // } else {
  const filePath = path.join(__dirname, 'dist/news-manager-project/browser/index.html');
  mainWindow.loadFile(filePath)
    .then(() => console.log('[Main Process] Loaded production file successfully'))
    .catch(err => {
      console.error('[Main Process] Failed to load production file:', err.message, err.stack);
      app.quit();
    });
  //}

  mainWindow.webContents.on('did-finish-load', () => {
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

ipcMain.handle('export-article', async (event, articleData) => {
  const defaultFileName = (articleData.Title ? articleData.Title : 'article') + '.json';

  const result = await dialog.showSaveDialog({
    title: 'Save Article',
    defaultPath: defaultFileName,
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });

  if (result.canceled) {
    return { success: false, error: 'Save operation canceled by user' };
  }

  const filePath = result.filePath;
  try {
    fs.writeFileSync(filePath, JSON.stringify(articleData, null, 2), 'utf8');
    lastExportedFilePath = filePath; 
    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to write file: ${error.message}` };
  }
});

ipcMain.handle('window-ready', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  } else {
    console.error('[window-ready] No mainWindow instance found.');
  }
});

ipcMain.handle('show-notification', async (_, { title, body, clickAction }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body });
    notification.show();

    notification.on('click', () => {
      if (clickAction === 'openFile') {
        if (lastExportedFilePath) {
          shell.openPath(lastExportedFilePath).then((err) => {
            if (err) {
              console.error('Failed to open file:', err);
            }
          });
        } else {
          console.warn('No file path available to open on notification click.');
        }
      } else if (clickAction === 'scroll') {
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('notification-click');
        }
      }
    });

    return { success: true };
  } else {
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
app.on('ready', () => {
  const loggedInUser = store.get('loggedInUser');

  if (!loggedInUser) {
    console.warn('[Validation] No user data found in config.');
  } else {
    console.log('[Validation] User data loaded:', loggedInUser);
  }
  createMainWindow();
});

app.whenReady().then(() => {
  app.dock.setIcon(path.join(__dirname, 'public', 'favicon.png'));
});

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