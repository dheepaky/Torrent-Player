import React, { useEffect } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import * as piecemap from '../utils/piecemap'

export function PieceMapCanvas() {
  const { canvasRef, torrent } = useWebTorrent()

  useEffect(() => {
    if (canvasRef.current && torrent) {
      piecemap.startPieceMapAnimation(canvasRef.current, torrent)
    }
    return () => {
      piecemap.stopPieceMapAnimation()
    }
  }, [canvasRef, torrent])

  return (
    <div className="bg-[#0e121d] px-4 py-2 border-t border-[#232b3e]">
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
        <span className="font-semibold text-slate-300">
          Piece availability
        </span>
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            Downloaded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            Downloading
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />
            Pending
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={14}
        className="w-full h-3 rounded bg-[#07090f] block"
      />
    </div>
  )
}
