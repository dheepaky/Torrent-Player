// Universal Cross-Browser Downloader for WebTorrent files with Pause/Resume & Link Copying

const activeDownloads = new Map() // file.path -> controller

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return parseFloat((bytes / Math.pow(1000, i)).toFixed(1)) + ' ' + units[i]
}

export function getDownloadUrl(file) {
  if (!file) return ''
  try {
    const path = file.streamURL
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${window.location.origin}${path}`
  } catch {
    return ''
  }
}

export function copyDownloadLink(file, callback) {
  const url = getDownloadUrl(file)
  if (!url) {
    if (callback) callback(false, '')
    return
  }

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

  // Try File System Access API
  if ('showSaveFilePicker' in window) {
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

  // Fallback: standard anchor download using streamURL or blob
  try {
    updateUI('⏳ Saving...', false, false)
    const streamUrl = getDownloadUrl(file)
    if (streamUrl) {
      const a = document.createElement('a')
      a.href = streamUrl
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      activeDownloads.delete(file.path)
      updateUI('✓ Downloading', false, true)
      setTimeout(() => updateUI('⚡ Save', false, true), 3000)
      return
    }

    // Direct blob download
    file.getBlob((err, blob) => {
      activeDownloads.delete(file.path)
      if (err || !blob) {
        console.error('Blob generation error:', err)
        updateUI('Failed', false, true)
        setTimeout(() => updateUI('⚡ Save', false, true), 3000)
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      updateUI('✓ Saved', false, true)
      setTimeout(() => updateUI('⚡ Save', false, true), 3000)
    })
  } catch (err) {
    console.error('Download error:', err)
    activeDownloads.delete(file.path)
    updateUI('Failed', false, true)
    setTimeout(() => updateUI('⚡ Save', false, true), 3000)
  }
}
