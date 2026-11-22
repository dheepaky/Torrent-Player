import React, { useState, useEffect } from 'react'
import {
  Smartphone,
  Server,
  Download,
  Wifi,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react'
import { useWebTorrent } from '../context/WebTorrentContext'

export function MobileNoticeBanner({ onOpenInstallApp }) {
  const { backendInfo, torrent } = useWebTorrent()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  useEffect(() => {
    // Detect mobile user agent or small viewport
    const ua = navigator.userAgent || ''
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth < 768
    setIsMobileDevice(isMobile)

    const dismissed = sessionStorage.getItem('dismiss_mobile_notice')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('dismiss_mobile_notice', 'true')
  }

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npm run server')
    setCopiedCmd(true)
    setTimeout(() => setCopiedCmd(false), 2000)
  }

  if (isDismissed || torrent) return null

  return (
    <div className="max-w-3xl mx-auto px-4 mt-3 sm:mt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-amber-500/10 border border-amber-500/30 dark:border-amber-500/25 p-4 sm:p-5 shadow-sm text-xs sm:text-sm text-slate-800 dark:text-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Smartphone className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Mobile Users Notice
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Important Tips
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Pure mobile browsers connect to WebRTC torrents. To stream{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                  ANY regular magnet link or movie
                </strong>{' '}
                on your phone with zero storage used, use our local streaming server or install the app!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Toggle instructions"
            >
              <span>{isExpanded ? 'Hide' : 'How to use'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss notice"
              aria-label="Dismiss notice"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Action Guide */}
        {isExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
            {/* Method A: Local Streaming Engine (Port 4000) */}
            <div className="bg-white/90 dark:bg-[#0e1320] p-3.5 rounded-xl border border-slate-200 dark:border-[#222b40] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                <Server className="w-4 h-4 text-amber-500" />
                <span>1. Stream via PC Server (Port 4000)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
                Run the streaming engine on your computer:
              </p>
              <div className="flex items-center justify-between bg-slate-900 text-amber-400 font-mono text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800">
                <span>npm run server</span>
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className="hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 ml-2 font-sans font-semibold"
                >
                  {copiedCmd ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Then connect your phone to the same Wi-Fi and open{' '}
                <span className="font-mono text-amber-500 font-bold">
                  http://&lt;pc-ip&gt;:4000
                </span>
                .
              </p>
            </div>

            {/* Method B: Install App / PWA */}
            <div className="bg-white/90 dark:bg-[#0e1320] p-3.5 rounded-xl border border-slate-200 dark:border-[#222b40] space-y-2 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <Download className="w-4 h-4 text-sky-500" />
                  <span>2. Install as Mobile Web App (PWA)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
                  Install this site directly onto your phone screen with no app store download:
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-500">Android:</span>
                    <span>Tap browser menu (⋮) → "Add to Home screen"</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sky-400">iPhone / iPad:</span>
                    <span>Tap Share (⎋) → "Add to Home Screen"</span>
                  </div>
                </div>

                {onOpenInstallApp && (
                  <button
                    type="button"
                    onClick={onOpenInstallApp}
                    className="mt-3 w-full py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open 1-Click Install Guide</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Zero device storage used — stream in RAM!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
