import React, { useState } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import { formatBytes, getFileIcon, isPlayableMedia } from '../utils/format'
import * as downloader from '../utils/downloader'
import { Folder, ChevronDown, Play, Download, Link2, Tv, Check } from 'lucide-react'

export function FilePicker({ onOpenExternalPlayer }) {
  const { torrent, streamingFile, playFile } = useWebTorrent()
  const [isExpanded, setIsExpanded] = useState(false)
  const [downloadStates, setDownloadStates] = useState({}) // path -> text

  if (!torrent || !torrent.files || torrent.files.length === 0) return null

  const sortedFiles = [...torrent.files].sort((a, b) => b.length - a.length)

  const handleSave = (file) => {
    downloader.saveTorrentFile(file, null, (text) => {
      setDownloadStates((prev) => ({ ...prev, [file.path]: text }))
    })
  }

  const handleCopyLink = (file) => {
    downloader.copyDownloadLink(file, (success) => {
      setDownloadStates((prev) => ({
        ...prev,
        [file.path]: success ? 'Copied' : 'Failed',
      }))
      setTimeout(() => {
        setDownloadStates((prev) => {
          const next = { ...prev }
          delete next[file.path]
          return next
        })
      }, 2000)
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-5">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-4 flex items-center justify-between text-left text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2030] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Files in torrent</span>
            <span className="text-xs bg-slate-100 dark:bg-[#1a2030] border border-slate-200 dark:border-[#2a364f] text-slate-700 dark:text-slate-300 font-mono px-2.5 py-0.5 rounded-full font-bold">
              {torrent.files.length}
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Files List */}
        {isExpanded && (
          <ul className="divide-y divide-slate-100 dark:divide-[#232b3e] max-h-80 overflow-y-auto">
            {sortedFiles.map((file, idx) => {
              const isCurrent = streamingFile?.path === file.path
              const playable = isPlayableMedia(file.name)
              const saveText = downloadStates[file.path] || 'Save'
              const isCopied = downloadStates[file.path] === 'Copied'

              return (
                <li
                  key={idx}
                  className={`px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-[#181f2f] transition-colors ${
                    isCurrent ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg shrink-0">
                      {getFileIcon(file.name)}
                    </span>
                    <div className="truncate">
                      <p
                        className={`truncate font-bold ${
                          isCurrent
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-200'
                        }`}
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <span className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium">
                        {formatBytes(file.length)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {playable && (
                      <button
                        type="button"
                        onClick={() => playFile(file)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Stream this file now"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSave(file)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
                      title="Save file to disk"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{saveText}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(file)}
                      className="p-2 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2a364f] rounded-lg text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                      title="Copy stream link"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Link2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>

                    {playable && (
                      <button
                        type="button"
                        onClick={() => onOpenExternalPlayer(file)}
                        className="p-2 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-[#2a364f] rounded-lg text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                        title="Open in VLC / External Player"
                      >
                        <Tv className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
