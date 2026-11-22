import React, { useState } from 'react'
import * as externalPlayer from '../../utils/externalPlayer'
import { Tv, X, Copy, Check, ExternalLink } from 'lucide-react'

export function ExternalPlayerModal({ file, isOpen, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !file) return null

  const streamUrl = externalPlayer.getStreamUrl(file)

  const handleCopy = () => {
    externalPlayer.copyStreamUrl(file, (success) => {
      setCopied(success)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <Tv className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              External Desktop Players
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
            Stream <strong className="text-slate-900 dark:text-white font-mono">{file.name}</strong> directly in external desktop media players for hardware acceleration and broad audio codec support (AC3, DTS, MKV):
          </p>

          {/* Quick Launch Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => externalPlayer.openInVlc(file)}
              className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] hover:bg-slate-100 dark:hover:bg-[#182030] border border-slate-200 dark:border-[#1f273b] hover:border-amber-500/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-95"
            >
              <span className="text-2xl">🟠</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Open in VLC
                </p>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  vlc:// protocol launch
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => externalPlayer.downloadM3u(file)}
              className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] hover:bg-slate-100 dark:hover:bg-[#182030] border border-slate-200 dark:border-[#1f273b] hover:border-amber-500/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-95"
            >
              <span className="text-2xl">📥</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Download .M3U
                </p>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  VLC / MPV / IINA playlist
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => externalPlayer.openInIina(file)}
              className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] hover:bg-slate-100 dark:hover:bg-[#182030] border border-slate-200 dark:border-[#1f273b] hover:border-amber-500/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-95"
            >
              <span className="text-2xl">🍎</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Open in IINA
                </p>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  macOS native player
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => externalPlayer.openInPotPlayer(file)}
              className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] hover:bg-slate-100 dark:hover:bg-[#182030] border border-slate-200 dark:border-[#1f273b] hover:border-amber-500/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group active:scale-95"
            >
              <span className="text-2xl">🟡</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Open in PotPlayer
                </p>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Windows player
                </span>
              </div>
            </button>
          </div>

          {/* Raw Network Stream URL */}
          <div className="bg-slate-50 dark:bg-[#0b0e17] p-3.5 rounded-xl border border-slate-200 dark:border-[#1f273b] space-y-2">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Raw network stream URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={streamUrl}
                className="w-full bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-lg px-3 py-1.5 font-mono text-xs text-slate-800 dark:text-slate-300 select-all focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shrink-0 active:scale-95 inline-flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Paste into VLC &rarr; Media &rarr; Open Network Stream
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-xs">
            💡 <em>Keep this browser tab open to continue seeding the stream to your external desktop player.</em>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] flex justify-end bg-slate-50 dark:bg-[#0b0e17]/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold rounded-lg cursor-pointer transition-colors active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
