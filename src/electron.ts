import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import axios from 'axios';
import qs from 'qs';

import CONSTS from './constants';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 928,
    webPreferences: {
      preload: join(__dirname, '..', 'build', 'preload.js'),
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(join('build', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:1234');
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle(CONSTS.LOGIN_TO_ELECTRON, (event) => {
  let authWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });
  authWindow.loadURL(`https://github.com/login/oauth/authorize?client_id=${CONSTS.GITHUB_CLIENT_ID}`);
  authWindow.on('closed', () => {
    authWindow = null;
  });
  const handleRedirectUrl = async (url) => {
    if (url.startsWith('https://github.com/tylerlong/image-hosting/?code=')) {
      authWindow.close();
      const code = url.split('=')[1];
      const r = await axios.post(
        'https://github.com/login/oauth/access_token',
        qs.stringify({
          client_id: CONSTS.GITHUB_CLIENT_ID,
          client_secret: CONSTS.GITHUB_CLIENT_SECRET,
          code,
        }),
      );
      event.sender.send(CONSTS.LOGIN_TO_WEB, qs.parse(r.data));
    }
  };
  // the first time auth will trigger will-navigate
  // the second time (and afterwards) auth will trigger will-redirect
  // so we need to handle both will-navigate and will-redirect
  authWindow.webContents.on('will-navigate', (event, url) => {
    handleRedirectUrl(url);
  });
  authWindow.webContents.on('will-redirect', (event, url) => {
    handleRedirectUrl(url);
  });
});
