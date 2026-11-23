import React, { useState } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import {
  Play,
  Sparkles,
  Smartphone,
  Server,
  Laptop,
  Wifi,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react'

export function InstructionsSection() {
  const { downloadTorrent, torrent, backend } = useWebTorrent()
  const [showTips, setShowTips] = useState(true)

  if (torrent) return null

  const exampleUrl = 'https://webtorrent.io/torrents/sintel.torrent'

  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4 text-sm sm:text-base">
      {/* How to Stream Any Torrent & Mobile Tips Guide */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/25 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                How to Stream Any Magnet Link &amp; Mobile Phone Tips
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {backend?.isConnected
                  ? '✅ Streaming Engine is active. All standard BitTorrent swarms enabled!'
                  : 'Pure browser mode streams WebRTC torrents. Follow these tips for regular torrents:'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            title="Toggle tips"
          >
            {showTips ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {showTips && (
          <div className="mt-3.5 pt-3.5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            {/* Step 1: Native Desktop App */}
            <div className="bg-white dark:bg-[#111624] p-3.5 rounded-xl border border-slate-200 dark:border-[#222b40] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1 text-xs sm:text-sm">
                  <Laptop className="w-4 h-4 text-amber-500" />
                  <span>1. Native Desktop App (TCP/UDP Swarms)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  99% of magnet links use standard BitTorrent swarms. Use the <strong>Torrent Player Desktop App</strong> (.exe / .AppImage) with built-in engine to stream all movies with zero configuration!
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-medium">
                ✓ Built-in high-speed engine — zero terminal commands needed!
              </div>
            </div>

            {/* Step 2: Stream on Mobile Phone */}
            <div className="bg-white dark:bg-[#111624] p-3.5 rounded-xl border border-slate-200 dark:border-[#222b40] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1 text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>2. Stream on Mobile Phone (Same Wi-Fi)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Connect your phone (iPhone or Android) to the same Wi-Fi as your computer running the app, then open the local Wi-Fi URL from <strong>Settings ⚙️</strong>:
                </p>
              </div>

              <div className="bg-slate-900 text-sky-400 font-mono text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 break-all font-semibold">
                http://&lt;your-pc-ip&gt;:4000
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero device storage used — stream in RAM!</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input formats box */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm dark:shadow-lg">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Supported input formats</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            Paste any of the following directly into the stream bar or drop files anywhere onto this window:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold text-xs sm:text-sm">Magnet link</span>
            <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5">
              magnet:?xt=urn:btih:...
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold text-xs sm:text-sm">Torrent file</span>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Drag &amp; drop .torrent file directly
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold text-xs sm:text-sm">Info hash</span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              40-character hexadecimal infohash
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold text-xs sm:text-sm">Direct torrent URL</span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              https://...file.torrent link
            </span>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-200 dark:border-[#232b3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            Want to test playback right now?
          </span>
          <button
            type="button"
            onClick={() => downloadTorrent(exampleUrl)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2030] hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-800 dark:text-amber-300 font-bold border border-slate-200 dark:border-[#2a364f] transition-all cursor-pointer text-xs sm:text-sm self-start sm:self-auto active:scale-95"
          >
            <Play className="w-4 h-4 fill-current text-amber-500 dark:text-amber-400" />
            <span>Play Sintel open movie</span>
          </button>
        </div>
      </div>
    </div>
  )
}
