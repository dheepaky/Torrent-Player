import React from 'react'
import { Info, X } from 'lucide-react'

export function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              About Torrent Player
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed flex-1">
          <p>
            <strong className="text-slate-900 dark:text-white">Torrent Player</strong> is a browser-based torrent streaming application designed for immediate playback without installing desktop torrent clients or browser plugins.
          </p>

          <div className="p-3.5 bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1f273b] rounded-xl space-y-1.5 text-xs">
            <h4 className="font-bold text-amber-700 dark:text-amber-300">How WebRTC peers work:</h4>
            <p className="text-slate-800 dark:text-slate-200">
              In a browser environment, connections are established directly with peers that support <strong>WebRTC</strong>.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Supported clients include WebTorrent Desktop, Brave Browser, Vuze, and libtorrent-based clients with WebTorrent support enabled.
            </p>
          </div>

          <p className="text-slate-700 dark:text-slate-300">
            No servers store, stream, or log your media activity.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] flex justify-end bg-slate-50 dark:bg-[#0b0e17]/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-transparent text-xs font-semibold rounded-lg cursor-pointer transition-colors active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
