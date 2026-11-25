// WebTorrent Singleton Engine for Torrent Player

import * as storage from './storage.js'

// Setup global announce list before WebTorrent instantiation
const settings = storage.loadSettings()
const defaultTrackers = storage.DEFAULT_TRACKERS

window.WEBTORRENT_ANNOUNCE =
  settings.trackers && settings.trackers.length > 0
    ? settings.trackers.filter(
        (u) =>
          (u.startsWith('wss://') || u.startsWith('ws://')) &&
          !u.includes('btorrent.xyz')
      )
    : defaultTrackers

let clientInstance = null
let isServerReady = false
const serverReadyCallbacks = []

export function getClient() {
  if (!clientInstance && typeof window !== 'undefined' && window.WebTorrent) {
    try {
      clientInstance = new window.WebTorrent()
      clientInstance.on('error', (err) => {
        console.error('[WebTorrent Engine] Client error:', err)
      })
    } catch (e) {
      console.error('[WebTorrent Engine] Instantiation failed:', e)
    }
  }
  return clientInstance
}

export function initServiceWorkerServer() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (isServerReady) return Promise.resolve(true)

  if (!('serviceWorker' in navigator)) {
    console.error('[WebTorrent Engine] Service workers are not supported.')
    return Promise.resolve(false)
  }

  return navigator.serviceWorker
    .register('sw.min.js', { scope: './' })
    .then(() => navigator.serviceWorker.ready)
    .then((registration) => {
      const sw =
        registration.active ||
        registration.installing ||
        registration.waiting
      if (sw && sw.state === 'activated') return registration
      return new Promise((resolve) => {
        if (!sw) return resolve(registration)
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve(registration)
        })
      })
    })
    .then((controller) => {
      const client = getClient()
      if (client && !client._server) {
        try {
          client.createServer({ controller })
          console.log('[WebTorrent Engine] Streaming server ready.')
        } catch (e) {
          console.warn('[WebTorrent Engine] createServer note:', e)
        }
      }
      isServerReady = true
      serverReadyCallbacks.forEach((cb) => cb())
      serverReadyCallbacks.length = 0
      return true
    })
    .catch((err) => {
      console.error(
        '[WebTorrent Engine] Service worker registration failed:',
        err
      )
      return false
    })
}

export function onServerReady(cb) {
  if (isServerReady) {
    cb()
  } else {
    serverReadyCallbacks.push(cb)
  }
}
