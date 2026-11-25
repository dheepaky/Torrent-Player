import React from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import { HelpCircle, Sparkles, Magnet, FileUp, Hash, Globe } from 'lucide-react'

export function InstructionsSection() {
  const { torrent } = useWebTorrent()

  if (torrent) return null

  const steps = [
    {
      num: '1',
      title: 'Paste or Drop',
      desc: 'Paste a magnet URI, 40-character infohash, or drop any .torrent file onto the page.',
    },
    {
      num: '2',
      title: 'Direct P2P Swarm',
      desc: 'Connects directly to swarm peers with lookahead piece buffering in browser RAM.',
    },
    {
      num: '3',
      title: 'Instant Playback',
      desc: 'Video starts playing immediately. No full download wait, zero permanent disk space used.',
    },
  ]

  const formats = [
    { name: 'Magnet link', example: 'magnet:?xt=urn:btih:...', icon: Magnet },
    { name: 'Torrent file', example: '.torrent drag & drop', icon: FileUp },
    { name: 'Info hash', example: '40-char hexadecimal', icon: Hash },
    { name: 'Direct URL', example: 'https://...file.torrent', icon: Globe },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
      {/* 3 Simple Steps */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3.5 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>How to Stream in 3 Simple Steps</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1.5"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-xs">
                {step.num}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {step.title}
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Supported Formats</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {formats.map((fmt, i) => {
            const Icon = fmt.icon
            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {fmt.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {fmt.example}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
