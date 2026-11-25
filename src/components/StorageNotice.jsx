import React, { useState } from 'react'
import { HardDrive, Play, Download, ShieldCheck, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export function StorageNotice({ onOpenSettings, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl overflow-hidden shadow-sm dark:shadow-lg transition-all">
        {/* Banner Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                  Storage &amp; streaming cache
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Streaming runs in browser RAM. Files never take up permanent disk space unless saved.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] border border-slate-200 dark:border-[#2a364f] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            aria-label="Toggle storage explanation"
          >
            <span>{isExpanded ? 'Hide' : 'Details'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>
        </div>

        {/* Clear Concepts */}
        {isExpanded && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#0b0e17] grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 text-xs sm:text-sm animate-in fade-in duration-200">
            {/* Concept 1: Memory Streaming */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                  <Play className="w-4.5 h-4.5 fill-current shrink-0" />
                  <span>Streaming in memory</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs sm:text-sm">
                  Video chunks stream into temporary browser RAM only while playing.
                </p>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] p-3 rounded-lg leading-snug">
                Closing this tab frees the streaming cache immediately. No residual file remains on your disk.
              </div>
            </div>

            {/* Concept 2: File Export */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                  <Download className="w-4.5 h-4.5 shrink-0" />
                  <span>Saving to your device</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs sm:text-sm">
                  To keep the video permanently, click <span className="text-slate-950 dark:text-white font-bold">⚡ Save file</span> to export the full video to your downloads.
                </p>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] p-3 rounded-lg leading-snug">
                Incomplete files are canceled and discarded if the tab is closed before reaching 100%.
              </div>
            </div>

            {/* Concept 3: Settings & Local Preferences */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] flex flex-col justify-between space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                  <span>Local preferences</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs sm:text-sm">
                  Only small text items (watch history, resume timestamps, and custom trackers) stay in browser storage.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="w-full text-center px-3.5 py-2 bg-slate-100 dark:bg-[#1a2030] hover:bg-slate-200 dark:hover:bg-[#222b40] text-sky-700 dark:text-sky-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-[#2a364f] rounded-xl transition-all font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Manage local data</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
