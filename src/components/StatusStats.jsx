import React, { useState } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import { formatBytes, formatDuration } from '../utils/format'
import { Copy, Check, Play, Pause, Link2, Share2 } from 'lucide-react'

export function StatusStats() {
  const { torrent, streamingFile, stats, isPaused, togglePause } = useWebTorrent()
  const [copied, setCopied] = useState(false)

  if (!torrent) return null

  const shareUrl = `${window.location.origin}${window.location.pathname}#${torrent.infoHash}`

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fileName = streamingFile?.name || torrent.name

  return (
    <div className="bg-slate-50 dark:bg-[#131722] border-t border-slate-200 dark:border-[#232b3e] p-3.5 sm:p-4 text-xs text-slate-700 dark:text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
      {/* 1. Swarm Status & Active File */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={togglePause}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
            isPaused
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
          }`}
          title={isPaused ? 'Resume swarm data download (P)' : 'Pause swarm data download (P)'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 fill-current text-amber-600 dark:text-amber-400" />
          ) : (
            <Pause className="w-3 h-3 fill-current text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{isPaused ? 'Paused' : 'Downloading'}</span>
        </button>

        <span
          className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm flex-1 min-w-0"
          title={fileName}
        >
          {fileName}
        </span>

        <span className="text-slate-400 dark:text-slate-600 shrink-0">•</span>

        <span className="text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap shrink-0">
          {stats.numPeers} {stats.numPeers === 1 ? 'peer' : 'peers'}
        </span>
      </div>

      {/* 2. Download Progress & Remaining */}
      <div className="md:text-center text-slate-800 dark:text-slate-200 text-xs">
        <span className="font-mono text-slate-950 dark:text-white font-bold">
          {formatBytes(stats.downloaded)}
        </span>{' '}
        of{' '}
        <span className="font-mono text-slate-950 dark:text-white font-bold">
          {formatBytes(stats.total)}
        </span>{' '}
        <span className="text-slate-400 dark:text-slate-500">•</span>{' '}
        <span className="text-amber-700 dark:text-amber-400 font-bold">
          {stats.isDone
            ? 'Completed'
            : `${formatDuration(stats.timeRemaining)} left`}
        </span>
      </div>

      {/* 3. Live Speeds & Elegant Share Link Pill */}
      <div className="flex flex-col sm:flex-row md:flex-col sm:items-center md:items-end justify-between sm:justify-end gap-2">
        <div className="font-mono text-xs font-semibold shrink-0">
          <span className="text-emerald-600 dark:text-emerald-400">
            ↓ {formatBytes(stats.downloadSpeed)}/s
          </span>{' '}
          <span className="text-slate-400 dark:text-slate-600">/</span>{' '}
          <span className="text-sky-600 dark:text-sky-400">
            {formatBytes(stats.uploadSpeed)}/s ↑
          </span>
        </div>

        {/* Elegant Integrated Share Pill */}
        <div className="inline-flex items-center bg-white dark:bg-[#0b0e17] border border-slate-200 dark:border-[#232b3e] rounded-xl p-1 shadow-2xs max-w-full">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px] sm:max-w-[170px]">
            <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{shareUrl.replace(/^https?:\/\//, '')}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyShare}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
            }`}
            title="Copy shareable stream link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-950" />
                <span>Share link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
