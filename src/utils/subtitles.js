// Subtitle parser and track manager for HTML5 video

let activeBlobUrls = []

export function srtToVtt(srtContent) {
  if (!srtContent) return 'WEBVTT\n\n'
  // Normalize newlines and strip BOM
  let text = srtContent.replace(/^\uFEFF/, '').replace(/\r\n|\r/g, '\n')
  // Replace comma in timestamps: 00:00:01,000 --> 00:00:01.000
  text = text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
  return `WEBVTT\n\n${text}`
}

export function cleanSubtitleTracks(video) {
  if (!video) return
  const tracks = video.querySelectorAll('track')
  tracks.forEach((track) => {
    if (track.src && track.src.startsWith('blob:')) {
      URL.revokeObjectURL(track.src)
    }
    track.remove()
  })
  for (const url of activeBlobUrls) {
    URL.revokeObjectURL(url)
  }
  activeBlobUrls = []
}

export function attachSubtitleTrack(
  video,
  vttOrSrtContent,
  label = 'Subtitles',
  lang = 'en',
  isDefault = true
) {
  if (!video || !vttOrSrtContent) return null

  let vttText = vttOrSrtContent
  if (!vttOrSrtContent.trim().startsWith('WEBVTT')) {
    vttText = srtToVtt(vttOrSrtContent)
  }

  const blob = new Blob([vttText], { type: 'text/vtt' })
  const blobUrl = URL.createObjectURL(blob)
  activeBlobUrls.push(blobUrl)

  const track = document.createElement('track')
  track.kind = 'subtitles'
  track.label = label
  track.srclang = lang
  track.src = blobUrl
  track.default = isDefault

  video.appendChild(track)

  if (isDefault && video.textTracks && video.textTracks.length > 0) {
    const lastTrack = video.textTracks[video.textTracks.length - 1]
    lastTrack.mode = 'showing'
  }

  return track
}

export function findTorrentSubtitles(torrent, videoFile) {
  if (!torrent || !torrent.files) return []
  const subExts = ['.srt', '.vtt']
  return torrent.files.filter((f) =>
    subExts.some((ext) => f.name.toLowerCase().endsWith(ext))
  )
}

export async function loadSubtitleFromTorrentFile(file) {
  try {
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(buffer)
  } catch (e) {
    console.error('Failed to load subtitle from torrent file:', e)
    return null
  }
}
