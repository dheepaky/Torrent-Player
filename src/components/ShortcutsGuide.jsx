import React, { memo } from 'react'
import { Command } from 'lucide-react'

export const ShortcutsGuide = memo(function ShortcutsGuide() {
  const shortcuts = [
    { key: 'Hold Player', desc: 'Hold for 2x speed' },
    { key: 'Space / K', desc: 'Play or pause video' },
    { key: '← / →', desc: 'Seek 5 seconds' },
    { key: '↑ / ↓', desc: 'Volume up or down' },
    { key: 'F', desc: 'Toggle fullscreen' },
    { key: 'M', desc: 'Mute or unmute' },
    { key: 'T', desc: 'Theater mode' },
    { key: 'P', desc: 'Pause/resume download' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg">
        <h3 className="text-xs font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
          <Command className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Playback shortcuts &amp; gestures</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#0e121d] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1f273b]"
            >
              <span className="text-slate-700 dark:text-slate-300 text-[11px] truncate font-medium">{sc.desc}</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-[#1a2030] border border-slate-200 dark:border-[#2a364f] rounded-md text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px] shadow-xs shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
