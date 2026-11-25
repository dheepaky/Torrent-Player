// Lightweight Canvas-based piece map visualizer for WebTorrent (throttled for high performance)

let timerId = null

export function renderPieceMap(canvas, torrent) {
  if (!canvas || !torrent || !torrent.pieces || torrent.pieces.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const numPieces = torrent.pieces.length
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  // Background
  ctx.fillStyle = '#0f172a' // slate-900
  ctx.fillRect(0, 0, width, height)

  const pieceWidth = width / numPieces

  // Colors
  const colorDone = '#38bdf8' // sky-400
  const colorPartial = '#facc15' // yellow-400
  const colorPending = '#334155' // slate-700

  for (let i = 0; i < numPieces; i++) {
    const x = i * pieceWidth
    const w = Math.max(pieceWidth, 1)

    const isDone = torrent.bitfield ? torrent.bitfield.get(i) : false
    if (isDone) {
      ctx.fillStyle = colorDone
    } else {
      const piece = torrent.pieces[i]
      if (piece && piece.missing < piece.length) {
        ctx.fillStyle = colorPartial
      } else {
        ctx.fillStyle = colorPending
      }
    }

    ctx.fillRect(x, 0, w, height)
  }
}

export function startPieceMapAnimation(canvas, torrent) {
  stopPieceMapAnimation()
  if (!canvas || !torrent) return

  // Render once immediately
  renderPieceMap(canvas, torrent)

  // Throttle updates to once per second to keep CPU at ~0%
  timerId = setInterval(() => {
    if (torrent.destroyed || torrent.paused) {
      stopPieceMapAnimation()
      return
    }
    renderPieceMap(canvas, torrent)
    if (torrent.done) {
      stopPieceMapAnimation()
    }
  }, 1000)
}

export function stopPieceMapAnimation() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}
