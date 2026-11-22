// LocalStorage manager for Torrent Player settings and watch history

export const SETTINGS_KEY = 'magnet_player_settings'
export const HISTORY_KEY = 'magnet_player_history'

export const DEFAULT_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
  'wss://tracker.files.fm:7073/announce',
  'wss://tracker.novage.com.ua',
]

export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

export const DEFAULT_SETTINGS = {
  trackers: DEFAULT_TRACKERS,
  iceServers: DEFAULT_ICE_SERVERS,
  maxConns: 55,
  autoResume: true,
  audioBoost: 1.0,
  theaterMode: false,
}

/**
 * Enriches a magnet link or info hash by injecting WebSocket trackers
 * so browser WebRTC peers can be found even if the original magnet only had UDP/HTTP trackers.
 */
export function enrichTorrentIdentifier(torrentId, customTrackers = []) {
  if (!torrentId || typeof torrentId !== 'string') return torrentId
  const trimmed = torrentId.trim()

  const allTrackers = [
    ...new Set([
      ...(Array.isArray(customTrackers) ? customTrackers : []),
      ...DEFAULT_TRACKERS,
    ]),
  ]

  // If it's a 40-character hexadecimal infohash
  if (/^[0-9a-fA-F]{40}$/.test(trimmed)) {
    const trParams = allTrackers
      .map((t) => `&tr=${encodeURIComponent(t)}`)
      .join('')
    return `magnet:?xt=urn:btih:${trimmed}${trParams}`
  }

  // If it's a magnet link
  if (trimmed.startsWith('magnet:?')) {
    let result = trimmed
    for (const tracker of allTrackers) {
      const encoded = encodeURIComponent(tracker)
      if (!result.includes(encoded) && !result.includes(tracker)) {
        result += `&tr=${encoded}`
      }
    }
    return result
  }

  return trimmed
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    // Filter out invalid or dead trackers that may have been cached in localStorage
    const savedTrackers = Array.isArray(parsed.trackers) && parsed.trackers.length > 0
      ? parsed.trackers.filter(
          (t) =>
            typeof t === 'string' &&
            (t.startsWith('wss://') || t.startsWith('ws://')) &&
            !t.includes('btorrent.xyz')
        )
      : []

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      trackers: savedTrackers.length > 0 ? savedTrackers : DEFAULT_TRACKERS,
      iceServers:
        Array.isArray(parsed.iceServers) && parsed.iceServers.length > 0
          ? parsed.iceServers
          : DEFAULT_ICE_SERVERS,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } catch (e) {
    console.error('Failed to reset settings:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getHistoryItem(infoHash) {
  if (!infoHash) return null
  const history = getHistory()
  return (
    history.find(
      (item) => item.infoHash?.toLowerCase() === infoHash.toLowerCase()
    ) || null
  )
}

export function saveHistoryItem(item) {
  if (!item || !item.infoHash) return
  try {
    let history = getHistory()
    history = history.filter(
      (h) => h.infoHash?.toLowerCase() !== item.infoHash.toLowerCase()
    )
    history.unshift({
      infoHash: item.infoHash,
      name: item.name || 'Untitled Torrent',
      fileName: item.fileName || '',
      size: item.size || 0,
      currentTime: item.currentTime || 0,
      duration: item.duration || 0,
      progress: item.progress || 0,
      lastPlayed: Date.now(),
    })
    if (history.length > 20) history = history.slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save history item:', e)
  }
}

export function updateHistoryProgress(infoHash, currentTime, duration, progress) {
  if (!infoHash) return
  try {
    const history = getHistory()
    const item = history.find(
      (h) => h.infoHash?.toLowerCase() === infoHash.toLowerCase()
    )
    if (item) {
      item.currentTime = currentTime
      if (duration) item.duration = duration
      if (progress !== undefined) item.progress = progress
      item.lastPlayed = Date.now()
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  } catch (e) {
    console.error('Failed to update history:', e)
  }
}

export function deleteHistoryItem(infoHash) {
  if (!infoHash) return
  try {
    let history = getHistory()
    history = history.filter(
      (h) => h.infoHash?.toLowerCase() !== infoHash.toLowerCase()
    )
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (e) {
    console.error('Failed to delete history item:', e)
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (e) {
    console.error('Failed to clear history:', e)
  }
}

export function clearLocalStorage() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch (e) {
    console.error('Failed to clear localStorage:', e)
  }
}

export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    } catch {
      return { usage: 0, quota: 0 }
    }
  }
  return { usage: 0, quota: 0 }
}

export async function clearAllStorage() {
  clearLocalStorage()

  if (navigator.storage && navigator.storage.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory()
      if (root.entries) {
        for await (const [name] of root.entries()) {
          try {
            await root.removeEntry(name, { recursive: true })
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Could not clear OPFS:', e)
    }
  }

  if (window.indexedDB && indexedDB.databases) {
    try {
      const dbs = await indexedDB.databases()
      for (const db of dbs) {
        if (db.name) {
          try {
            indexedDB.deleteDatabase(db.name)
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Could not clear IndexedDB:', e)
    }
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys()
      for (const key of keys) {
        try {
          await caches.delete(key)
        } catch {}
      }
    } catch (e) {
      console.warn('Could not clear caches:', e)
    }
  }
}
