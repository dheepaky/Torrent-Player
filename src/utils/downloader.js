// Universal Cross-Browser Downloader for WebTorrent files with Pause/Resume & Link Copying

const activeDownloads = new Map() // file.path -> controller

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return parseFloat((bytes / Math.pow(1000, i)).toFixed(1)) + ' ' + units[i]
}

export function getMimeType(fileName) {
  if (!fileName) return 'video/mp4'
  const ext = fileName.split('.').pop().toLowerCase()
  const map = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    ts: 'video/mp2t',
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    srt: 'application/x-subrip',
    vtt: 'text/vtt',
  }
  return map[ext] || 'video/mp4'
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  const chunkSize = 8192
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len))
    binary += String.fromCharCode.apply(null, chunk)
  }
  return window.btoa(binary)
}

export function getDownloadUrl(file, torrent = null) {
  if (!file) return ''
  try {
    const path = file.streamURL
    // If it's a real HTTP/HTTPS stream URL and not an internal appassets WebView URL
    if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
      if (!path.includes('appassets.androidplatform.net')) {
        return path
      }
    }

    // If there is a public origin and relative stream path
    if (path && !path.startsWith('http://') && !path.startsWith('https://')) {
      const origin = window.location.origin
      if (origin && !origin.includes('appassets.androidplatform.net') && !origin.startsWith('file:')) {
        return `${origin}${path}`
      }
    }

    // In Android APK or pure browser WebTorrent without backend:
    // Generate valid, playable player web link!
    const targetTorrent = torrent || file._torrent
    const infoHash = targetTorrent?.infoHash || file.infoHash
    const magnet = targetTorrent?.magnetURI || file.magnetURI

    const liveBase =
      typeof window !== 'undefined' &&
      window.location.origin &&
      !window.location.origin.includes('appassets.androidplatform.net') &&
      !window.location.origin.startsWith('file:')
        ? window.location.origin
        : 'https://online-torrent-player.onrender.com'

    if (infoHash) {
      return `${liveBase}/#${infoHash}`
    }
    if (magnet) {
      return `${liveBase}/#${encodeURIComponent(magnet)}`
    }

    return ''
  } catch {
    return ''
  }
}

export function copyDownloadLink(file, callback, torrent = null) {
  const url = getDownloadUrl(file, torrent)
  if (!url) {
    if (callback) callback(false, '')
    return
  }

  // 1. Android Native App Bridge
  if (typeof window !== 'undefined' && window.Android && typeof window.Android.copyToClipboard === 'function') {
    try {
      window.Android.copyToClipboard(url)
      if (callback) callback(true, url)
      return
    } catch {}
  }

  // 2. Standard Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        if (callback) callback(true, url)
      })
      .catch(() => {
        fallbackCopy(url, callback)
      })
  } else {
    fallbackCopy(url, callback)
  }
}

function fallbackCopy(text, callback) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (callback) callback(success, text)
  } catch {
    if (callback) callback(false, text)
  }
}

export function pauseAllFileDownloads() {
  for (const ctrl of activeDownloads.values()) {
    ctrl.pause()
  }
}

export function resumeAllFileDownloads() {
  for (const ctrl of activeDownloads.values()) {
    ctrl.resume()
  }
}

export function getActiveDownload(filePath) {
  return activeDownloads.get(filePath) || null
}

async function fallbackBlobNative(file, mimeType, updateUI, downloadCtrl) {
  const saveBlob = async (blob) => {
    if (!blob) return
    const started = window.Android.startNativeDownload(file.name, mimeType)
    if (!started) return

    const chunkSize = 64 * 1024 // 64 KB slices
    const total = blob.size
    let offset = 0

    while (offset < total) {
      if (downloadCtrl.cancelled) {
        if (window.Android.abortNativeDownload) window.Android.abortNativeDownload()
        return
      }
      while (downloadCtrl.isPaused) {
        await new Promise((r) => setTimeout(r, 200))
        if (downloadCtrl.cancelled) break
      }

      const slice = blob.slice(offset, Math.min(offset + chunkSize, total))
      const arrayBuffer = await slice.arrayBuffer()
      const b64 = arrayBufferToBase64(arrayBuffer)
      window.Android.writeNativeChunk(b64)

      offset += arrayBuffer.byteLength
      const pct = total > 0 ? Math.round((offset / total) * 100) : 0
      if (!downloadCtrl.isPaused) {
        updateUI(`⚡ ${pct}%`, false, false)
      }
    }

    window.Android.finishNativeDownload(file.name)
    activeDownloads.delete(file.path)
    updateUI('✓ Saved to Downloads', false, true)
    setTimeout(() => updateUI('⚡ Save', false, true), 3000)
  }

  if (typeof file.getBlob === 'function') {
    file.getBlob((err, blob) => {
      if (!err && blob) saveBlob(blob)
      else updateUI('Failed', false, true)
    })
  } else if (typeof file.getBlobURL === 'function') {
    file.getBlobURL((err, url) => {
      if (!err && url) {
        fetch(url)
          .then((r) => r.blob())
          .then(saveBlob)
          .catch(() => updateUI('Failed', false, true))
      } else {
        updateUI('Failed', false, true)
      }
    })
  } else {
    updateUI('Failed', false, true)
  }
}

export async function saveTorrentFile(file, buttonElement, statusCallback) {
  if (!file) return

  const updateUI = (text, isPaused = false, isDone = false) => {
    if (buttonElement) {
      buttonElement.textContent = text
    }
    if (statusCallback) statusCallback(text, isPaused, isDone)
  }

  // Toggle pause/resume if this file is already downloading
  if (activeDownloads.has(file.path)) {
    const ctrl = activeDownloads.get(file.path)
    if (ctrl.isPaused) {
      ctrl.resume()
    } else {
      ctrl.pause()
    }
    return
  }

  const downloadCtrl = {
    isPaused: false,
    cancelled: false,
    pause() {
      this.isPaused = true
      updateUI('▶ Resume', true, false)
    },
    resume() {
      this.isPaused = false
      updateUI('⏳ Saving...', false, false)
    },
    cancel() {
      this.cancelled = true
      activeDownloads.delete(file.path)
    },
  }

  activeDownloads.set(file.path, downloadCtrl)

  const streamUrl = getDownloadUrl(file)
  const isAppAssets = typeof window !== 'undefined' && window.location.origin.includes('appassets.androidplatform.net')
  const isRealHttp = streamUrl && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) && !isAppAssets

  // 1. Native Android App Stream Downloader (Saves directly to Android /Downloads via MediaStore)
  if (typeof window !== 'undefined' && window.Android && typeof window.Android.startNativeDownload === 'function') {
    const mimeType = getMimeType(file.name)
    const started = window.Android.startNativeDownload(file.name, mimeType)
    if (started) {
      updateUI('⏳ Saving...', false, false)

      const saveNativeChunk = (uint8Chunk) => {
        const b64 = arrayBufferToBase64(uint8Chunk.buffer ? uint8Chunk.buffer : uint8Chunk)
        window.Android.writeNativeChunk(b64)
      }

      if (typeof file.createReadStream === 'function') {
        try {
          const stream = file.createReadStream()
          let written = 0
          const total = file.length || 0

          stream.on('data', (chunk) => {
            if (downloadCtrl.cancelled) {
              stream.destroy()
              if (window.Android.abortNativeDownload) window.Android.abortNativeDownload()
              return
            }
            saveNativeChunk(chunk)
            written += chunk.length
            const pct = total > 0 ? Math.round((written / total) * 100) : 0
            if (!downloadCtrl.isPaused) {
              updateUI(`⚡ ${pct}%`, false, false)
            }
          })

          stream.on('end', () => {
            if (downloadCtrl.cancelled) return
            window.Android.finishNativeDownload(file.name)
            activeDownloads.delete(file.path)
            updateUI('✓ Saved to Downloads', false, true)
            setTimeout(() => updateUI('⚡ Save', false, true), 3000)
          })

          stream.on('error', (err) => {
            console.warn('[Downloader] Native stream error, trying blob fallback:', err)
            if (window.Android.abortNativeDownload) window.Android.abortNativeDownload()
            fallbackBlobNative(file, mimeType, updateUI, downloadCtrl)
          })

          return
        } catch (err) {
          console.warn('[Downloader] createReadStream setup error:', err)
          if (window.Android.abortNativeDownload) window.Android.abortNativeDownload()
        }
      }

      fallbackBlobNative(file, mimeType, updateUI, downloadCtrl)
      return
    }
  }

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  // 2. Desktop Chromium: File System Access API
  if (!isMobile && 'showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: file.name,
      })
      const writable = await handle.createWritable()

      updateUI('⏳ Saving...', false, false)

      const stream = file.createReadStream()
      const reader = stream[Symbol.asyncIterator]
        ? stream[Symbol.asyncIterator]()
        : null

      if (reader) {
        let written = 0
        const total = file.length

        while (true) {
          if (downloadCtrl.cancelled) {
            await writable.abort()
            break
          }

          while (downloadCtrl.isPaused) {
            await new Promise((r) => setTimeout(r, 200))
            if (downloadCtrl.cancelled) break
          }

          const { done, value } = await reader.next()
          if (done) break

          await writable.write(value)
          written += value.length

          const pct = total > 0 ? Math.round((written / total) * 100) : 0
          if (!downloadCtrl.isPaused) {
            updateUI(`⚡ ${pct}%`, false, false)
          }
        }

        await writable.close()
        activeDownloads.delete(file.path)
        updateUI('✓ Saved', false, true)
        setTimeout(() => updateUI('⚡ Save', false, true), 3000)
        return
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        activeDownloads.delete(file.path)
        updateUI('⚡ Save', false, true)
        return
      }
      console.warn('File System Access API failed, falling back:', e)
    }
  }

  // Helper to trigger download via anchor
  const triggerAnchor = (url) => {
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        try {
          a.remove()
        } catch {}
      }, 1000)
    } catch (e) {
      console.error('Trigger anchor error:', e)
      window.open(url, '_blank')
    }
  }

  // 3. Fallback: streamURL download (Node.js engine, ServiceWorker or Wi-Fi engine)
  if (isRealHttp) {
    try {
      updateUI('⏳ Saving...', false, false)
      triggerAnchor(streamUrl)
      activeDownloads.delete(file.path)
      updateUI('✓ Downloading', false, true)
      setTimeout(() => updateUI('⚡ Save', false, true), 3000)
      return
    } catch (e) {
      console.warn('StreamURL anchor download failed:', e)
    }
  }

  // 4. Fallback: In-browser WebTorrent Blob download
  updateUI('⏳ Preparing...', false, false)

  const handleBlobURL = (blobUrl) => {
    triggerAnchor(blobUrl)
    activeDownloads.delete(file.path)
    updateUI('✓ Saved', false, true)
    setTimeout(() => updateUI('⚡ Save', false, true), 3000)

    // Keep object URL alive for mobile browsers before revoking
    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl)
      } catch {}
    }, 60000)
  }

  if (typeof file.getBlobURL === 'function') {
    file.getBlobURL((err, url) => {
      if (err || !url) {
        console.error('Blob URL generation error:', err)
        activeDownloads.delete(file.path)
        updateUI('Failed', false, true)
        setTimeout(() => updateUI('⚡ Save', false, true), 3000)
        return
      }
      handleBlobURL(url)
    })
    return
  }

  if (typeof file.getBlob === 'function') {
    file.getBlob((err, blob) => {
      if (err || !blob) {
        console.error('Blob generation error:', err)
        activeDownloads.delete(file.path)
        updateUI('Failed', false, true)
        setTimeout(() => updateUI('⚡ Save', false, true), 3000)
        return
      }
      const url = URL.createObjectURL(blob)
      handleBlobURL(url)
    })
    return
  }

  // Fallback for custom file objects
  activeDownloads.delete(file.path)
  updateUI('Failed', false, true)
  setTimeout(() => updateUI('⚡ Save', false, true), 3000)
}
