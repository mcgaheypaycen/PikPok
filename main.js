const { app, BrowserWindow, Menu, dialog, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const ffmpeg = require('ffmpeg-static');

// Set FFmpeg path for Electron
if (ffmpeg) {
  app.commandLine.appendSwitch('ffmpeg-path', ffmpeg);
}

// Enable additional codecs and features
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 800,
    minWidth: 300,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      enableWebCodecs: true
    },
    titleBarStyle: 'hidden',
    frame: false,
    resizable: true,
    show: false,
    backgroundColor: '#000000'
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFolderDialog();
          }
        },
        {
          label: 'Refresh',
          accelerator: 'F5',
          click: () => {
            mainWindow.webContents.send('refresh-videos');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function openFolderDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    mainWindow.webContents.send('folder-selected', folderPath);
  }
}

// IPC handlers
ipcMain.handle('open-folder-dialog', async () => {
    return await openFolderDialog();
});

ipcMain.handle('get-app-data-path', () => {
    return app.getPath('userData');
});

ipcMain.handle('read-likes-file', async () => {
  const userDataPath = app.getPath('userData');
  const likesPath = path.join(userDataPath, 'likes.json');
  
  try {
    const data = await fs.readJson(likesPath);
    return data;
  } catch (error) {
    // File doesn't exist or is invalid, return default structure
    return { videos: [] };
  }
});

ipcMain.handle('write-likes-file', async (event, data) => {
  const userDataPath = app.getPath('userData');
  const likesPath = path.join(userDataPath, 'likes.json');
  
  try {
    await fs.ensureDir(userDataPath);
    await fs.writeJson(likesPath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error writing likes file:', error);
    return false;
  }
});

ipcMain.handle('save-last-folder', async (event, folderPath) => {
  const userDataPath = app.getPath('userData');
  const lastFolderPath = path.join(userDataPath, 'last-folder.txt');
  
  try {
    await fs.ensureDir(userDataPath);
    await fs.writeFile(lastFolderPath, folderPath, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving last folder:', error);
    return false;
  }
});

ipcMain.handle('load-last-folder', async () => {
  const userDataPath = app.getPath('userData');
  const lastFolderPath = path.join(userDataPath, 'last-folder.txt');
  
  try {
    const folderPath = await fs.readFile(lastFolderPath, 'utf8');
    return folderPath.trim();
  } catch (error) {
    // File doesn't exist or is invalid, return null
    return null;
  }
});

ipcMain.handle('check-folder-exists', async (event, folderPath) => {
  try {
    const stats = await fs.stat(folderPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
});

ipcMain.handle('exit-app', () => {
  app.quit();
});

// App event handlers
app.whenReady().then(() => {
  // Register custom protocol for secure file access
  protocol.registerFileProtocol('local-video', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-video://', ''));
    callback(filePath);
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 