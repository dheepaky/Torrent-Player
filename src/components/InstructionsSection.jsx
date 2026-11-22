import React from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import { Play, Sparkles } from 'lucide-react'

export function InstructionsSection() {
  const { downloadTorrent, torrent } = useWebTorrent()

  if (torrent) return null

  const exampleUrl = 'https://webtorrent.io/torrents/sintel.torrent'

  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 text-sm">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm dark:shadow-lg">
        <div>
          <h3 className="text-xs font-bold text-slate-950 dark:text-white mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Supported input formats</span>
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Paste any of the following directly into the stream bar or drop files anywhere onto this window:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold">Magnet link</span>
            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-medium truncate mt-0.5">
              magnet:?xt=urn:btih:...
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold">Torrent file</span>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Drag &amp; drop .torrent file directly
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold">Info hash</span>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              40-character hexadecimal infohash
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex flex-col justify-center">
            <span className="text-slate-950 dark:text-white font-bold">Direct torrent URL</span>
            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              https://...file.torrent link
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-[#232b3e] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            Want to test playback right now?
          </span>
          <button
            type="button"
            onClick={() => downloadTorrent(exampleUrl)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a2030] hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-800 dark:text-amber-300 font-semibold border border-slate-200 dark:border-[#2a364f] transition-all cursor-pointer text-xs self-start sm:self-auto active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-500 dark:text-amber-400" />
            <span>Play Sintel open movie</span>
          </button>
        </div>
      </div>
    </div>
  )
}
