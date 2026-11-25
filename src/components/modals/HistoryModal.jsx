import React, { useState, useEffect } from 'react'
import * as storage from '../../utils/storage'
import { formatBytes, formatDuration } from '../../utils/format'
import { useWebTorrent } from '../../context/WebTorrentContext'
import { Clock, X, Play, Trash2 } from 'lucide-react'

export function HistoryModal({ isOpen, onClose }) {
  const { downloadTorrent } = useWebTorrent()
  const [historyItems, setHistoryItems] = useState([])

  const refresh = () => {
    setHistoryItems(storage.getHistory())
  }

  useEffect(() => {
    if (isOpen) refresh()
  }, [isOpen])

  if (!isOpen) return null

  const handleResume = (item) => {
    onClose()
    downloadTorrent(item.infoHash, {
      targetFileName: item.fileName,
      resumeTime: item.currentTime,
    })
  }

  const handleDelete = (infoHash, e) => {
    e.stopPropagation()
    storage.deleteHistoryItem(infoHash)
    refresh()
  }

  const handleClear = () => {
    if (window.confirm('Clear all playback history?')) {
      storage.clearHistory()
      refresh()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Streams
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {historyItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1a2030] border border-slate-200 dark:border-[#2a364f] flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">No recent streams yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Videos you watch will appear here so you can resume anytime.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {historyItems.map((item, idx) => {
                const progressPct =
                  item.duration && item.currentTime
                    ? Math.round((item.currentTime / item.duration) * 100)
                    : 0

                return (
                  <li
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1f273b] rounded-xl hover:border-amber-500/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate"
                        title={item.name || item.fileName || item.infoHash}
                      >
                        {item.name || item.fileName || item.infoHash}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {formatDuration(item.currentTime)} /{' '}
                          {formatDuration(item.duration)} ({progressPct}%)
                        </span>
                        {item.size > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{formatBytes(item.size)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResume(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.infoHash, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <button
            type="button"
            disabled={historyItems.length === 0}
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all history
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors active:scale-95 border border-slate-200 dark:border-transparent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
