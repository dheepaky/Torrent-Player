import React, { useState } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import * as downloader from '../utils/downloader'
import { CustomPlayer } from './CustomPlayer'
import { PieceMapCanvas } from './PieceMapCanvas'
import { StatusStats } from './StatusStats'
import { Play, Pause, ExternalLink, Download, Link2, X, Check, Film } from 'lucide-react'

export function HeroPlayer({ onOpenExternalPlayer }) {
  const {
    torrent,
    streamingFile,
    isPaused,
    togglePause,
    isTheaterMode,
    cancelTorrent,
  } = useWebTorrent()

  const [copiedLink, setCopiedLink] = useState(false)
  const [saveBtnText, setSaveBtnText] = useState('Save file')

  // Save video
  const handleSaveVideo = () => {
    if (!streamingFile) return
    downloader.saveTorrentFile(streamingFile, null, (text) => {
      setSaveBtnText(text)
    })
  }

  // Copy download link
  const handleCopyLink = () => {
    if (!streamingFile) return
    downloader.copyDownloadLink(streamingFile, (success) => {
      setCopiedLink(success)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  if (!torrent) return null

  const fileName = streamingFile?.name || torrent.name

  return (
    <div
      className={`mx-auto px-4 mt-6 transition-all duration-300 ${
        isTheaterMode ? 'max-w-7xl' : 'max-w-4xl'
      }`}
    >
      <div className="bg-white dark:bg-[#0b0e17] border border-slate-200 dark:border-[#232b3e] rounded-2xl overflow-hidden shadow-md dark:shadow-2xl">
        {/* Custom Video Player with Integrated Controls */}
        <CustomPlayer onOpenExternalPlayer={onOpenExternalPlayer} />

        {/* Prominent File Title & Swarm Actions Header Bar */}
        <div className="bg-slate-50 dark:bg-[#131722] border-t border-slate-200 dark:border-[#232b3e] px-4 sm:px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* File Title - Prominently visible with icon */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base leading-tight truncate tracking-tight"
                title={fileName}
              >
                {fileName}
              </h2>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* Swarm Download Pause / Resume Button */}
            <button
              type="button"
              onClick={togglePause}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs active:scale-95 ${
                isPaused
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                  : 'bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f]'
              }`}
              title="Pause or resume swarm data download (Hotkey: P)"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                  <span>Resume download</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current text-amber-500 dark:text-amber-400" />
                  <span>Pause download</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onOpenExternalPlayer(streamingFile)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-lg font-semibold transition-all cursor-pointer text-xs active:scale-95"
              title="Stream in VLC, IINA, MPV or PotPlayer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>External player</span>
            </button>

            <button
              type="button"
              onClick={handleSaveVideo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-lg font-semibold transition-all cursor-pointer text-xs active:scale-95"
              title="Save this video to disk via File System Access API"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>{saveBtnText}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-lg font-semibold transition-all cursor-pointer text-xs active:scale-95"
              title="Copy direct HTTP stream download link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied link</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy stream link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={cancelTorrent}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-500/40 border border-slate-200 dark:border-[#2a364f] rounded-lg font-semibold transition-all cursor-pointer text-xs active:scale-95"
              title="Close stream and return to home"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Piece Map Canvas */}
        <PieceMapCanvas />

        {/* Live Torrent Stats */}
        <StatusStats />
      </div>
    </div>
  )
}
