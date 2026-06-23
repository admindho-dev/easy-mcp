const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Easy MCP Database Configurator',
    autoHideMenuBar: true,
    backgroundColor: '#0f172a' // Slate 900
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Helper to expand tilde (~) and resolve paths
function resolvePath(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  // Handle Windows %APPDATA% placeholder if entered literally
  if (filePath.includes('%APPDATA%')) {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return filePath.replace('%APPDATA%', appData);
  }
  return path.resolve(filePath);
}

// IPC Handlers
ipcMain.handle('get-default-paths', async () => {
  const home = os.homedir();
  const platform = process.platform;

  let claudePath = '';
  if (platform === 'win32') {
    claudePath = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'darwin') {
    claudePath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux or other
    claudePath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }

  return {
    antigravity: path.join(home, '.gemini', 'antigravity-cli', 'mcp_config.json'),
    claude: claudePath,
    openai: path.join(home, '.config', 'openai', 'mcp_config.json')
  };
});

ipcMain.handle('read-config', async (event, filePath) => {
  try {
    const fullPath = resolvePath(filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false, content: null, resolvedPath: fullPath };
    }
    const data = fs.readFileSync(fullPath, 'utf8');
    let parsedData = {};
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      return { exists: true, content: null, error: 'JSON malformado en el archivo existente', resolvedPath: fullPath };
    }
    return { exists: true, content: parsedData, resolvedPath: fullPath };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('write-config', async (event, { filePath, config }) => {
  try {
    const fullPath = resolvePath(filePath);
    const dir = path.dirname(fullPath);

    // Create directories if they do not exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true, resolvedPath: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-file', async (event, defaultPath) => {
  const resolvedDefault = resolvePath(defaultPath);
  const result = await dialog.showOpenDialog({
    title: 'Seleccionar archivo de configuración MCP',
    defaultPath: fs.existsSync(resolvedDefault) ? resolvedDefault : os.homedir(),
    properties: ['openFile', 'createDirectory'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-env-info', async () => {
  return {
    username: os.userInfo().username,
    platform: process.platform
  };
});
