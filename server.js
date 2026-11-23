import express from 'express'
import cors from 'cors'
import WebTorrent from 'webtorrent'
import pump from 'pump'
import rangeParser from 'range-parser'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

// Catch premature closes from browser seeking to prevent process crashes
process.on('uncaughtException', (err) => {
  if (
    err.code === 'PREMATURE_CLOSE' ||
    err.code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    err.message?.includes('Writable stream closed') ||
    err.message?.includes('Premature close')
  ) {
    return // Browser closed video connection while buffering, completely normal
  }
  console.error('[Process uncaughtException]:', err)
})

process.on('unhandledRejection', (reason) => {
  if (
    reason?.code === 'PREMATURE_CLOSE' ||
    reason?.message?.includes('Writable stream closed')
  ) {
    return
  }
  console.error('[Process unhandledRejection]:', reason)
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env.PORT || '4000', 10)
const HOST = process.env.HOST || '0.0.0.0'
const CACHE_DIR =
  process.env.TORRENT_CACHE_DIR || path.join(os.tmpdir(), 'torrent-player-cache')

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Global WebTorrent client with high connection limits for fast swarm downloads
const client = new WebTorrent({
  dht: true,
  lsd: true,
  utp: true,
  maxConns: 120, // High peer limit for faster speed
})

client.on('error', (err) => {
  console.error('[WebTorrent Engine] Client error:', err.message)
})

// Initialize WebTorrent's official built-in streaming server
const torrentServer = client.createServer({
  pathname: '/webtorrent',
  origin: '*',
})

// Public high-speed BitTorrent trackers (UDP, HTTP, and WebSocket)
const DEFAULT_ANNOUNCE = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'udp://tracker.altrosky.nl:2710/announce',
  'udp://tracker.cyberia.is:6969/announce',
  'udp://tracker.birkenwald.de:6969/announce',
  'udp://tracker.moeking.me:6969/announce',
  'http://tracker.opentrackr.org:1337/announce',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
  'wss://tracker.files.fm:7073/announce',
]

/**
 * Injects UDP and WebSocket trackers into magnet URI or 40-char infohash
 * so peer discovery starts immediately without waiting for DHT bootstrap.
 */
function enrichTorrentIdentifier(torrentId) {
  if (typeof torrentId !== 'string') return torrentId
  const trimmed = torrentId.trim()

  // 40-character hexadecimal infohash
  if (/^[0-9a-fA-F]{40}$/.test(trimmed)) {
    const tr = DEFAULT_ANNOUNCE.map((t) => `&tr=${encodeURIComponent(t)}`).join('')
    return `magnet:?xt=urn:btih:${trimmed}${tr}`
  }

  // Magnet link
  if (trimmed.startsWith('magnet:?')) {
    let res = trimmed
    for (const t of DEFAULT_ANNOUNCE) {
      const enc = encodeURIComponent(t)
      if (!res.includes(enc) && !res.includes(t)) {
        res += `&tr=${enc}`
      }
    }
    return res
  }

  return trimmed
}

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.ts': 'video/mp2t',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.srt': 'text/plain',
  '.vtt': 'text/vtt',
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces()
  const addresses = []
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }
  return addresses
}

const app = express()

// Allow Cross-Origin and Private Network Access (so HTTPS sites like GitHub Pages can talk to local engine)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  next()
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Pass WebTorrent built-in server requests safely through wrapRequest
app.use((req, res, next) => {
  if (req.url.startsWith('/webtorrent')) {
    try {
      torrentServer.wrapRequest(req, res)
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).send('Streaming error')
      }
    }
  } else {
    next()
  }
})

// 1. Health check & Engine Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'node-webtorrent',
    version: '2.1.0',
    capabilities: ['tcp', 'udp', 'dht', 'pex', 'webrtc'],
    activeTorrents: client.torrents.length,
    cacheDir: CACHE_DIR,
    localIps: getLocalNetworkAddresses(),
    port: PORT,
  })
})

// 2. Network info for mobile pairing
app.get('/api/network', (req, res) => {
  const ips = getLocalNetworkAddresses()
  res.json({
    port: PORT,
    ips,
    urls: ips.map((ip) => `http://${ip}:${PORT}`),
  })
})

function serializeTorrent(t) {
  return {
    infoHash: t.infoHash,
    name: t.name,
    length: t.length,
    numPeers: t.numPeers,
    progress: t.progress,
    downloadSpeed: t.downloadSpeed,
    uploadSpeed: t.uploadSpeed,
    downloaded: t.downloaded,
    isDone: t.done,
    isPaused: !!t._userPaused,
    files: t.files.map((f, idx) => ({
      index: idx,
      name: f.name,
      path: f.path,
      length: f.length,
      streamURL: `/api/torrent/stream?infoHash=${t.infoHash}&fileIndex=${idx}`,
    })),
  }
}

// 3. Add Torrent (with instant tracker injection and piece prioritization)
app.post('/api/torrent/add', (req, res) => {
  const { torrentId } = req.body
  if (!torrentId) {
    return res.status(400).json({ error: 'Missing torrentId' })
  }

  const enrichedId = enrichTorrentIdentifier(torrentId)

  // Check if torrent already exists
  const existing = client.torrents.find((t) => {
    if (typeof torrentId === 'string') {
      const trimmed = torrentId.trim().toLowerCase()
      if (t.infoHash.toLowerCase() === trimmed) return true
      if (trimmed.includes(t.infoHash.toLowerCase())) return true
    }
    return false
  })

  if (existing && existing.files && existing.files.length > 0) {
    return res.json({ success: true, torrent: serializeTorrent(existing) })
  }

  let responded = false
  const timeoutMs = 45000
  const timer = setTimeout(() => {
    if (!responded) {
      responded = true
      const candidate = client.get(torrentId)
      if (candidate) {
        return res.json({
          success: true,
          partial: true,
          torrent: {
            infoHash: candidate.infoHash,
            name: candidate.name || 'Resolving metadata…',
            length: candidate.length || 0,
            numPeers: candidate.numPeers,
            files: [],
          },
        })
      }
      res.status(504).json({
        error:
          'Metadata search timed out. Ensure the torrent has active seeders on the swarm.',
      })
    }
  }, timeoutMs)

  try {
    const torrent = client.add(
      enrichedId,
      {
        path: CACHE_DIR,
        announce: DEFAULT_ANNOUNCE,
        destroyStoreOnDestroy: true,
        maxWebConns: 20,
      },
      (t) => {
        if (!responded) {
          responded = true
          clearTimeout(timer)

          // Prioritize first and last pieces for container header parsing (moov atom)
          if (t.files && t.files.length > 0) {
            const largest = t.files.reduce((a, b) => (b.length > a.length ? b : a))
            if (largest && largest._startPiece !== undefined && largest._endPiece !== undefined) {
              const startLookahead = Math.min(largest._endPiece, largest._startPiece + 5)
              const endLookahead = Math.max(largest._startPiece, largest._endPiece - 3)
              try {
                t.critical(largest._startPiece, startLookahead)
                t.critical(endLookahead, largest._endPiece)
              } catch {}
            }
          }

          res.json({ success: true, torrent: serializeTorrent(t) })
        }
      }
    )

    torrent.on('error', (err) => {
      console.error('[WebTorrent Engine] Torrent error:', err.message)
      if (!responded) {
        responded = true
        clearTimeout(timer)
        res.status(500).json({ error: err.message })
      }
    })
  } catch (err) {
    clearTimeout(timer)
    if (!responded) {
      responded = true
      res.status(500).json({ error: err.message })
    }
  }
})

// 4. Fallback HTTP Range-Based Video Streaming Endpoint using 'pump'
app.get('/api/torrent/stream', (req, res) => {
  const { infoHash, fileIndex } = req.query
  if (!infoHash) {
    return res.status(400).send('Missing infoHash parameter')
  }

  const torrent = client.torrents.find(
    (t) => t.infoHash.toLowerCase() === String(infoHash).toLowerCase()
  )
  if (!torrent) {
    return res.status(404).send('Torrent not found or cancelled')
  }

  let file = null
  if (fileIndex !== undefined && fileIndex !== null) {
    const idx = parseInt(fileIndex, 10)
    file = torrent.files[idx]
  }

  if (!file) {
    file = torrent.files.reduce((largest, f) => {
      return !largest || f.length > largest.length ? f : largest
    }, null)
  }

  if (!file) {
    return res.status(404).send('No playable file found in torrent')
  }

  file.select()

  const fileSize = file.length
  const mimeType = getMimeType(file.name)
  const rangeHeader = req.headers.range

  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', mimeType)
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(file.name)}"`
  )

  if (!rangeHeader) {
    res.setHeader('Content-Length', fileSize)
    res.status(200)

    const readStream = file.createReadStream()
    readStream.on('error', () => {}) // Suppress premature close error
    pump(readStream, res, () => {})
    return
  }

  const parsed = rangeParser(fileSize, rangeHeader)

  if (parsed === -1) {
    res.setHeader('Content-Range', `bytes */${fileSize}`)
    return res.status(416).end()
  }

  if (parsed === -2 || !Array.isArray(parsed) || parsed.length === 0) {
    res.setHeader('Content-Length', fileSize)
    res.status(200)

    const readStream = file.createReadStream()
    readStream.on('error', () => {})
    pump(readStream, res, () => {})
    return
  }

  const { start, end } = parsed[0]
  // 4 MB chunk window ensures instant start and prevents massive blocking range downloads
  const MAX_CHUNK = 4 * 1024 * 1024
  const streamEnd = Math.min(end, start + MAX_CHUNK - 1)
  const chunkSize = streamEnd - start + 1

  // Prioritize requested pieces immediately in the swarm
  if (torrent.pieceLength) {
    const fileOffset = file.offset || 0
    const startPiece = Math.floor((fileOffset + start) / torrent.pieceLength)
    const endPiece = Math.floor((fileOffset + streamEnd) / torrent.pieceLength)
    try {
      const totalPieces = torrent.pieces?.length || 1
      torrent.critical(startPiece, Math.min(endPiece + 2, totalPieces - 1))
    } catch {}
  }

  res.status(206)
  res.setHeader('Content-Range', `bytes ${start}-${streamEnd}/${fileSize}`)
  res.setHeader('Content-Length', chunkSize)

  const readStream = file.createReadStream({ start, end: streamEnd })
  readStream.on('error', () => {}) // Safely ignore premature close on player seek
  pump(readStream, res, () => {})
})

// 5. Live Torrent Statistics (Peers, Progress, Speed, Piece Bitfield)
app.get('/api/torrent/stats', (req, res) => {
  const { infoHash } = req.query
  if (!infoHash) {
    return res.status(400).json({ error: 'Missing infoHash' })
  }

  const torrent = client.torrents.find(
    (t) => t.infoHash.toLowerCase() === String(infoHash).toLowerCase()
  )

  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found' })
  }

  const pieces = []
  if (torrent.pieces && torrent.pieces.length > 0) {
    for (let i = 0; i < torrent.pieces.length; i++) {
      const isDownloaded = torrent.bitfield ? torrent.bitfield.get(i) : false
      const piece = torrent.pieces[i]
      const isPartial = piece && piece.missing < piece.length
      pieces.push(isDownloaded ? 2 : isPartial ? 1 : 0)
    }
  }

  res.json({
    infoHash: torrent.infoHash,
    name: torrent.name,
    numPeers: torrent.numPeers,
    progress: torrent.progress,
    downloaded: torrent.downloaded,
    total: torrent.length,
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    timeRemaining: torrent.timeRemaining,
    isDone: torrent.done,
    isPaused: !!torrent._userPaused,
    pieces,
  })
})

// 6. Pause Torrent Swarm
app.post('/api/torrent/pause', (req, res) => {
  const { infoHash } = req.body
  const torrent = client.torrents.find(
    (t) => t.infoHash.toLowerCase() === String(infoHash).toLowerCase()
  )
  if (!torrent) return res.status(404).json({ error: 'Torrent not found' })

  torrent._userPaused = true
  if (torrent.pieces && torrent.pieces.length > 0) {
    torrent.deselect(0, torrent.pieces.length - 1, false)
  }
  res.json({ success: true, isPaused: true })
})

// 7. Resume Torrent Swarm
app.post('/api/torrent/resume', (req, res) => {
  const { infoHash } = req.body
  const torrent = client.torrents.find(
    (t) => t.infoHash.toLowerCase() === String(infoHash).toLowerCase()
  )
  if (!torrent) return res.status(404).json({ error: 'Torrent not found' })

  torrent._userPaused = false
  if (torrent.pieces && torrent.pieces.length > 0) {
    torrent.select(0, torrent.pieces.length - 1, 0)
  }
  res.json({ success: true, isPaused: false })
})

// 8. Cancel & Clean Torrent Cache
app.post('/api/torrent/cancel', (req, res) => {
  const { infoHash } = req.body
  if (!infoHash) {
    for (const t of [...client.torrents]) {
      try {
        client.remove(t, { destroyStore: true })
      } catch {}
    }
    return res.json({ success: true, message: 'All active torrents cancelled' })
  }

  const torrent = client.torrents.find(
    (t) => t.infoHash.toLowerCase() === String(infoHash).toLowerCase()
  )
  if (torrent) {
    try {
      client.remove(torrent, { destroyStore: true })
    } catch {}
  }
  res.json({ success: true, infoHash })
})

// 9. Wipe / Clean all cached torrent storage
app.post('/api/storage/clear', (req, res) => {
  for (const t of [...client.torrents]) {
    try {
      client.remove(t, { destroyStore: true })
    } catch {}
  }
  try {
    const files = fs.readdirSync(CACHE_DIR)
    for (const file of files) {
      fs.rmSync(path.join(CACHE_DIR, file), { recursive: true, force: true })
    }
    res.json({ success: true, message: 'Torrent cache cleared' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 10. Serve built static production files if available
const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, HOST, () => {
  console.log('========================================================')
  console.log(`🚀 Torrent Player Engine listening on http://${HOST}:${PORT}`)
  console.log('📡 Full BitTorrent TCP/UDP/DHT peer discovery enabled!')
  console.log(`📁 Cache Directory: ${CACHE_DIR}`)
  const ips = getLocalNetworkAddresses()
  if (ips.length > 0) {
    console.log('📱 Mobile devices on the same Wi-Fi can connect to:')
    ips.forEach((ip) => console.log(`   http://${ip}:${PORT}`))
  }
  console.log('========================================================')
})
