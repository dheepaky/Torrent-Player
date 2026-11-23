import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { fork } from 'child_process'
import http from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null
let serverProcess = null
const PORT = process.env.PORT || 4000

function checkServerReady(port = PORT) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      if (res.statusCode === 200) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function startServerIfNeeded() {
  const isAlreadyRunning = await checkServerReady(PORT)
  if (isAlreadyRunning) {
    console.log(`[Electron] Backend server already running on port ${PORT}`)
    return true
  }

  console.log(`[Electron] Starting background streaming engine on port ${PORT}…`)

  // Resolve path to server.js
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js')
    : path.join(__dirname, '..', 'server.js')

  const fallbackPath = path.join(__dirname, '..', 'server.js')
  const finalServerPath = fs.existsSync(serverPath) ? serverPath : fallbackPath

  serverProcess = fork(finalServerPath, [], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: '0.0.0.0',
    },
    stdio: 'inherit',
  })

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start server process:', err)
  })

  serverProcess.on('exit', (code) => {
    console.log(`[Electron] Server process exited with code ${code}`)
  })

  // Poll until server is ready (up to 15 seconds)
  const startTime = Date.now()
  while (Date.now() - startTime < 15000) {
    const ready = await checkServerReady(PORT)
    if (ready) {
      console.log(`[Electron] Streaming engine is ready on port ${PORT}`)
      return true
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  console.warn('[Electron] Server took longer than expected to report ready.')
  return false
}

async function createWindow() {
  const iconPath = path.join(__dirname, '..', 'public', 'favicon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 580,
    title: 'Torrent Player',
    icon: iconPath,
    backgroundColor: '#0b0e17',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle external links in native system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  const targetUrl = process.env.ELECTRON_START_URL || `http://localhost:${PORT}`
  console.log(`[Electron] Loading UI from: ${targetUrl}`)
  mainWindow.loadURL(targetUrl)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  await startServerIfNeeded()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    console.log('[Electron] Shutting down backend streaming engine…')
    serverProcess.kill('SIGTERM')
    serverProcess = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM')
    } catch {}
    serverProcess = null
  }
})
