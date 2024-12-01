const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const waitOn = require('wait-on');
const Store = require('electron-store');

const store = new Store();

ipcMain.handle('store-login', (_, { username, token }) => {
  try {
    console.log('Saving user data to electron-store...');
    store.set('loggedInUser', { username, token });
    console.log('User data saved:', store.get('loggedInUser'));
    return { success: true };
  } catch (error) {
    console.error('Failed to save user credentials:', error);
    return { success: false, error: error.message };
  }
});

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
  });

  if (process.env.NODE_ENV === 'development') {
    waitOn({ resources: ['http://localhost:4200'], timeout: 60000 }, err => {
      if (err) {
        console.error('Error: Angular server not ready. Please ensure "ng serve" is running.', err);
        app.quit();
      } else {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/news-manager-project/browser/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('store-set', (_, { key, value }) => {
  console.log(`Saving to store: ${key} = ${JSON.stringify(value)}`);
  store.set(key, value);
});

ipcMain.handle('store-get', (_, { key }) => {
  const value = store.get(key);
  if (value) {
    console.log(`Reading from store: ${key} = ${JSON.stringify(value)}`);
  } else {
    console.log(`No data found for key: ${key}`);
  }
  return value;
});

ipcMain.handle('store-delete', (_, { key }) => {
  console.log(`Deleting key from store: ${key}`);
  store.delete(key);
});

ipcMain.handle('store-clear', () => {
  console.log('Clearing the store.');
  store.clear();
});

ipcMain.handle('show-notification', async (_, { title, body }) => {
  console.log('Notification request received:', title, body);

  if (Notification.isSupported()) {
    console.log('Showing notification...');
    new Notification({ title, body }).show();
    console.log('Notification sent successfully.');
  } else {
    console.warn('Notifications are not supported in this environment.');
  }
});

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

process.on('uncaughtException', error => {
  console.error('[Main Process] Uncaught Exception:', error);
});

process.on('unhandledRejection', reason => {
  console.error('[Main Process] Unhandled Rejection:', reason);
});

ipcMain.handle('close-app', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('minimize-app', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-app', () => {
  if (mainWindow) {
    mainWindow.maximize();
  }
});

ipcMain.handle('restore-app', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      console.log('Window is minimized. Restoring...');
      mainWindow.restore();
    } else if (mainWindow.isMaximized()) {
      console.log('Window is maximized. Restoring...');
      mainWindow.unmaximize();
    } else {
      console.log('Window is in normal state. Focusing...');
      mainWindow.focus();
    }
  } else {
    console.error('No mainWindow instance found.');
  }
});