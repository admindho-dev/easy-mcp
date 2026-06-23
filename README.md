# Easy MCP - Configurador de Bases de Datos para Agentes de IA

Esta es una aplicación de escritorio multiplataforma desarrollada en **Electron** y **HTML5/Vanilla CSS/JS** para configurar fácilmente servidores MCP (Model Context Protocol) para conectar tus bases de datos (inicialmente **PostgreSQL** y **MySQL**) con diferentes agentes de Inteligencia Artificial como **Antigravity**, **Claude** y **OpenAI**.

La aplicación genera el esquema de configuración JSON necesario y lo fusiona o guarda automáticamente en la carpeta de configuración específica de cada agente.

## Características principales

- **Diseño Premium y Oscuro**: Interfaz moderna con animaciones sutiles, efectos de brillo y estructura intuitiva en pasos.
- **Doble Panel**: Formulario interactivo en el lado izquierdo y vista previa en tiempo real del archivo JSON de destino completo en el lado derecho.
- **Fusión Segura (Merge)**: Si el archivo de configuración de tu agente ya tiene otros servidores MCP activos, la aplicación **preserva tus configuraciones previas** y solo inserta/actualiza el nuevo servidor seleccionado.
- **Escape Seguro de URL**: Para PostgreSQL, escapa correctamente caracteres especiales en usuarios y contraseñas (`encodeURIComponent`) para evitar URLs de conexión inválidas.
- **Variables de Entorno para MySQL**: Para MySQL, utiliza un enfoque seguro pasando los parámetros de conexión (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) como variables de entorno (`env`) dentro de la definición del MCP.
- **Modo de Solo Lectura por Defecto**: Fomenta el uso seguro de agentes de IA reduciendo el riesgo de escrituras accidentales.
- **Soporte Multiplataforma**: Detecta automáticamente las rutas estándar de cada sistema operativo (macOS, Windows, Linux).

---

## Estructura del Proyecto

La aplicación consta de los siguientes archivos:

1. **[package.json](package.json)**: Metadatos, scripts de lanzamiento y devDependencies (Electron).
2. **[main.js](main.js)**: Proceso principal de Electron. Maneja las ventanas nativas e implementa canales IPC seguros para leer, escribir y examinar carpetas de configuración del sistema.
3. **[preload.js](preload.js)**: Puente de seguridad (preload) que expone funciones IPC específicas del sistema de archivos al contexto de la vista.
4. **[index.html](index.html)**: Estructura HTML5 de la aplicación, formularios y paneles dinámicos.
5. **[style.css](style.css)**: Sistema de estilos CSS moderno (Dark Mode, Flexbox/Grid, animaciones y notificaciones flotantes).
6. **[renderer.js](renderer.js)**: Lógica del panel visual, validaciones en tiempo real, codificación de cadenas de conexión e impacto final en disco.

---

## Rutas Estándar Detectadas

La aplicación buscará por defecto estas ubicaciones para cada agente:

- **Antigravity**:
  - `~/.gemini/antigravity-cli/mcp_config.json`
- **Claude Desktop**:
  - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  - **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **OpenAI**:
  - `~/.config/openai/mcp_config.json` (o cualquier otra ruta personalizada que desees seleccionar con el botón "Examinar")

---

## Cómo Ejecutar la Aplicación

Para iniciar el configurador en tu sistema local, sigue los pasos a continuación:

### Requisitos Previos

- Tener instalado **Node.js** (v18 o superior) y **npm**.

### Instrucciones

1. Clona o ve a la carpeta del proyecto:
   ```bash
   cd /home/diego/desarrollo/DreamFactory/easy-mcp
   ```

2. Ejecuta el script de inicio para abrir la aplicación:
   ```bash
   npm start
   ```

   *Nota para Linux: El script de inicio ejecuta Electron con el flag `--no-sandbox` de forma predeterminada para evitar errores de permisos de sandbox SUID en distribuciones Linux.*

---

## Cómo Crear el Instalador para Windows

Para empaquetar la aplicación y crear un instalador ejecutable para Windows (`.exe`), puedes hacerlo de dos formas:

### Opción A: Compilar desde Windows (Recomendado)
1. Copia la carpeta de este proyecto a una máquina con Windows.
2. Abre la consola (PowerShell o CMD) en el directorio del proyecto y corre:
   ```powershell
   npm install
   ```
3. Ejecuta el script de empaquetado:
   ```powershell
   npm run dist
   ```

### Opción B: Compilación Cruzada desde Linux (Cross-Compilation)
`electron-builder` te permite generar los binarios de Windows directamente ejecutando desde Linux:
```bash
npm run dist -- --win
```

### Resultados
En ambos casos, una vez completado el proceso se creará una carpeta llamada `dist/` que contendrá:
- **`EasyMCP Setup 1.0.0.exe`**: El instalador interactivo estándar (NSIS) de Windows.
- **`EasyMCP 1.0.0.exe`**: Una versión portable ejecutable que no requiere instalación.

---

## Recomendaciones de Seguridad

> [!IMPORTANT]
> - **Cuentas de solo lectura**: Recomendamos enfáticamente conectar tus bases de datos usando un rol/usuario de base de datos que tenga **únicamente permisos `SELECT`**. Esto previene que los agentes de IA ejecuten consultas destructivas o alteren tablas.
> - **Entornos Locales/Seguros**: No compartas archivos de configuración que contengan credenciales en texto plano en repositorios públicos.
