// External Player integration (VLC, IINA, PotPlayer, MPV, M3U)

export function getStreamUrl(file) {
  if (!file) return ''
  try {
    const path = file.streamURL
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${window.location.origin}${path}`
  } catch {
    return ''
  }
}

export function openInVlc(file) {
  const url = getStreamUrl(file)
  if (!url) return
  window.location.href = `vlc://${url}`
}

export function openInIina(file) {
  const url = getStreamUrl(file)
  if (!url) return
  window.location.href = `iina://weblink?url=${encodeURIComponent(url)}`
}

export function openInPotPlayer(file) {
  const url = getStreamUrl(file)
  if (!url) return
  window.location.href = `potplayer://${url}`
}

export function downloadM3u(file) {
  const url = getStreamUrl(file)
  if (!url) return

  const m3uContent = `#EXTM3U\n#EXTINF:-1,${file.name}\n${url}\n`
  const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' })
  const blobUrl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `${file.name}.m3u`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

export function copyStreamUrl(file, callback) {
  const url = getStreamUrl(file)
  if (!url) return
  navigator.clipboard
    .writeText(url)
    .then(() => {
      if (callback) callback(true, url)
    })
    .catch(() => {
      if (callback) callback(false, url)
    })
}
