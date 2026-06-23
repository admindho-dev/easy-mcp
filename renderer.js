// DOM Elements
const btnAgentAntigravity = document.getElementById('btnAgentAntigravity');
const btnAgentClaude = document.getElementById('btnAgentClaude');
const btnAgentOpenAI = document.getElementById('btnAgentOpenAI');

const btnDbPostgres = document.getElementById('btnDbPostgres');
const btnDbMysql = document.getElementById('btnDbMysql');

const dbHost = document.getElementById('dbHost');
const dbPort = document.getElementById('dbPort');
const dbUser = document.getElementById('dbUser');
const dbPassword = document.getElementById('dbPassword');
const dbName = document.getElementById('dbName');
const mcpKey = document.getElementById('mcpKey');
const chkReadOnly = document.getElementById('chkReadOnly');
const chkSsl = document.getElementById('chkSsl');
const sslToggleWrapper = document.getElementById('sslToggleWrapper');

const txtConfigPath = document.getElementById('txtConfigPath');
const btnSelectPath = document.getElementById('btnSelectPath');
const fileStatus = document.getElementById('fileStatus');

const btnImpactConfig = document.getElementById('btnImpactConfig');
const btnCopyJson = document.getElementById('btnCopyJson');
const jsonPreview = document.getElementById('jsonPreview');
const envBadge = document.getElementById('envBadge');
const explanationText = document.getElementById('explanationText');

// Application State
let defaultPaths = {};
let selectedAgent = 'antigravity';
let selectedDb = 'postgresql';
let existingFileContent = null;
let pathCheckTimeout = null;

// Initialize App
window.addEventListener('DOMContentLoaded', async () => {
  // Load Env / User Info
  try {
    const envInfo = await window.api.getEnvInfo();
    envBadge.querySelector('.text').textContent = `${envInfo.username} (${envInfo.platform})`;
  } catch (err) {
    envBadge.querySelector('.text').textContent = 'Conectado';
  }

  // Load standard configuration paths
  try {
    defaultPaths = await window.api.getDefaultPaths();
    txtConfigPath.value = defaultPaths[selectedAgent];
    await checkPathStatus(defaultPaths[selectedAgent]);
  } catch (err) {
    showToast('Error', 'No se pudieron recuperar las rutas por defecto.', 'error');
  }

  // Bind Listeners
  setupEventListeners();
  updateFormDefaults();
  updatePreview();
});

// Setup Events
function setupEventListeners() {
  // Agent Selection Card Clicks
  document.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', async () => {
      document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedAgent = card.dataset.agent;
      
      // Update target config path
      if (defaultPaths[selectedAgent]) {
        txtConfigPath.value = defaultPaths[selectedAgent];
        await checkPathStatus(txtConfigPath.value);
      }
      updatePreview();
    });
  });

  // DB Selection Card Clicks
  document.querySelectorAll('.db-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.db-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedDb = card.dataset.db;
      
      updateFormDefaults();
      updatePreview();
    });
  });

  // Form Inputs
  const formInputs = [dbHost, dbPort, dbUser, dbPassword, dbName, mcpKey, chkReadOnly, chkSsl];
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      updatePreview();
    });
  });

  // Path Change with Debounce
  txtConfigPath.addEventListener('input', () => {
    clearTimeout(pathCheckTimeout);
    pathCheckTimeout = setTimeout(() => {
      checkPathStatus(txtConfigPath.value);
    }, 500);
  });

  // Browse Path Button
  btnSelectPath.addEventListener('click', async () => {
    const currentPath = txtConfigPath.value || defaultPaths[selectedAgent] || '';
    const selectedPath = await window.api.selectFile(currentPath);
    if (selectedPath) {
      txtConfigPath.value = selectedPath;
      await checkPathStatus(selectedPath);
      updatePreview();
    }
  });

  // Copy Preview to Clipboard
  btnCopyJson.addEventListener('click', () => {
    const text = jsonPreview.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copiado', 'Configuración JSON copiada al portapapeles.', 'success');
    }).catch(err => {
      showToast('Error', 'No se pudo copiar.', 'error');
    });
  });

  // Impact Config Button
  btnImpactConfig.addEventListener('click', handleImpactConfig);
}

// Update default fields based on selected Database
function updateFormDefaults() {
  if (selectedDb === 'postgresql') {
    dbPort.value = '5432';
    dbPort.placeholder = '5432';
    dbUser.value = 'postgres';
    mcpKey.value = 'postgres-db';
    sslToggleWrapper.classList.remove('hidden');
    explanationText.innerHTML = `
      Se agregará el servidor en el bloque <code>mcpServers</code>. 
      Utiliza el paquete oficial <code>@modelcontextprotocol/server-postgres</code> vía NPX.
      Si el archivo existe, <strong>se preservará la configuración de otros servidores</strong>.
    `;
  } else {
    dbPort.value = '3306';
    dbPort.placeholder = '3306';
    dbUser.value = 'root';
    mcpKey.value = 'mysql-db';
    sslToggleWrapper.classList.add('hidden');
    explanationText.innerHTML = `
      Se agregará el servidor en el bloque <code>mcpServers</code>.
      Utiliza el paquete seguro <code>@yukihito/mysql-mcp-server</code> vía NPX con variables de entorno.
      Si el archivo existe, <strong>se preservará la configuración de otros servidores</strong>.
    `;
  }
}

// Check configuration file status on disk
async function checkPathStatus(filePath) {
  const fileStatusDot = fileStatus.querySelector('.status-dot');
  const fileStatusText = fileStatus.querySelector('.status-text');

  if (!filePath || filePath.trim() === '') {
    fileStatusDot.className = 'status-dot error';
    fileStatusText.textContent = 'Ruta vacía';
    existingFileContent = null;
    return;
  }

  fileStatusDot.className = 'status-dot warning';
  fileStatusText.textContent = 'Comprobando...';

  try {
    const status = await window.api.readConfig(filePath);
    if (status.error) {
      fileStatusDot.className = 'status-dot error';
      fileStatusText.textContent = `Error: ${status.error}`;
      existingFileContent = null;
    } else if (status.exists) {
      existingFileContent = status.content || {};
      const numServers = (existingFileContent.mcpServers ? Object.keys(existingFileContent.mcpServers).length : 0);
      fileStatusDot.className = 'status-dot success';
      fileStatusText.textContent = `El archivo existe y contiene ${numServers} servidores. Se fusionará de forma segura.`;
    } else {
      existingFileContent = null;
      fileStatusDot.className = 'status-dot warning';
      fileStatusText.textContent = `El archivo no existe. Se creará uno nuevo en: ${status.resolvedPath}`;
    }
  } catch (err) {
    fileStatusDot.className = 'status-dot error';
    fileStatusText.textContent = 'Error al leer el estado del archivo';
    existingFileContent = null;
  }
}

// Generate the specific MCP server block for the active configuration
function generateServerConfig() {
  const host = dbHost.value || 'localhost';
  const port = dbPort.value || (selectedDb === 'postgresql' ? '5432' : '3306');
  const user = dbUser.value || '';
  const password = dbPassword.value || '';
  const database = dbName.value || '';
  const isSsl = chkSsl.checked;

  if (selectedDb === 'postgresql') {
    // Escape components for connection string
    const userPart = user ? encodeURIComponent(user) : '';
    const passPart = password ? `:${encodeURIComponent(password)}` : '';
    const credentials = (userPart || passPart) ? `${userPart}${passPart}@` : '';
    const hostPort = `${host}:${port}`;
    const dbPart = database ? `/${encodeURIComponent(database)}` : '';
    const queryPart = isSsl ? '?sslmode=require' : '';
    
    const connectionString = `postgresql://${credentials}${hostPort}${dbPart}${queryPart}`;

    return {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-postgres",
        connectionString
      ]
    };
  } else {
    // MySQL uses environment variables for configuration
    return {
      command: "npx",
      args: [
        "-y",
        "@yukihito/mysql-mcp-server@latest"
      ],
      env: {
        MYSQL_HOST: host,
        MYSQL_PORT: port,
        MYSQL_USER: user,
        MYSQL_PASSWORD: password,
        MYSQL_DATABASE: database
      }
    };
  }
}

// Update the right-side Live JSON Preview
function updatePreview() {
  const keyName = mcpKey.value.trim() || (selectedDb === 'postgresql' ? 'postgres-db' : 'mysql-db');
  const serverConfig = generateServerConfig();
  
  // Clone existing config or create blank
  let previewObj = {};
  
  if (existingFileContent) {
    previewObj = JSON.parse(JSON.stringify(existingFileContent));
  }
  
  if (!previewObj.mcpServers) {
    previewObj.mcpServers = {};
  }
  
  previewObj.mcpServers[keyName] = serverConfig;
  
  jsonPreview.textContent = JSON.stringify(previewObj, null, 2);
}

// Handle the "Impactar Configuración" button submission
async function handleImpactConfig() {
  const filePath = txtConfigPath.value.trim();
  const keyName = mcpKey.value.trim();

  if (!filePath) {
    showToast('Error de Validación', 'Por favor ingresa una ruta de configuración válida.', 'error');
    return;
  }
  if (!keyName) {
    showToast('Error de Validación', 'Por favor ingresa una clave única de configuración (ID en Configuración).', 'error');
    return;
  }

  // Visual state: Loading
  const spinner = btnImpactConfig.querySelector('.spinner');
  const btnText = btnImpactConfig.querySelector('.btn-text');
  btnImpactConfig.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Guardando configuración...';

  try {
    // 1. Fetch current on-disk version to make sure we don't drop concurrent edits
    const status = await window.api.readConfig(filePath);
    let finalConfig = {};

    if (status.exists && status.content) {
      finalConfig = status.content;
    }

    if (!finalConfig.mcpServers) {
      finalConfig.mcpServers = {};
    }

    // 2. Insert or update our server config
    finalConfig.mcpServers[keyName] = generateServerConfig();

    // 3. Write back to disk
    const result = await window.api.writeConfig(filePath, finalConfig);

    if (result.success) {
      showToast('Configuración Impactada', `Configuración guardada de manera exitosa en ${result.resolvedPath}`, 'success');
      // Refresh state
      await checkPathStatus(filePath);
      updatePreview();
    } else {
      showToast('Error de Escritura', `No se pudo guardar la configuración: ${result.error}`, 'error');
    }
  } catch (err) {
    showToast('Error Inesperado', err.message, 'error');
  } finally {
    // Visual state: Reset
    btnImpactConfig.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Impactar en Configuración del Agente';
  }
}

// Toast notification helper
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  // Bind close action
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto remove after 5s
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}
