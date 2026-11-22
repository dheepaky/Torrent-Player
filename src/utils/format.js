export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'kB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return parseFloat((bytes / Math.pow(1000, i)).toFixed(1)) + ' ' + units[i]
}

export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0 seconds'
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  return `${Math.round(seconds / 86400)} days`
}

export function isPlayableMedia(filename) {
  if (!filename) return false
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return ['.mp4', '.m4v', '.webm', '.mkv', '.avi', '.mov', '.mp3', '.ogg', '.wav', '.flac', '.aac'].includes(ext)
}

export function getFileIcon(filename) {
  if (!filename) return '📦'
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  if (['.mp4', '.m4v', '.webm', '.mkv', '.avi', '.mov'].includes(ext)) return '🎬'
  if (['.mp3', '.ogg', '.wav', '.flac', '.aac'].includes(ext)) return '🎵'
  if (['.srt', '.vtt', '.sub'].includes(ext)) return '💬'
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return '🖼️'
  if (['.nfo', '.txt', '.pdf'].includes(ext)) return '📄'
  return '📦'
}
