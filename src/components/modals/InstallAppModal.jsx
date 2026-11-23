import React, { useState, useEffect } from 'react'
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
} from 'lucide-react'

export function InstallAppModal({ isOpen, onClose, installPrompt }) {
  const [activePlatform, setActivePlatform] = useState('auto')
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detect OS / Platform
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setActivePlatform('ios')
    } else if (/Android/i.test(ua)) {
      setActivePlatform('android')
    } else {
      setActivePlatform('desktop')
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNativeInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight flex items-center gap-1.5">
                <span>Install Torrent Player</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Web App
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Fast, Zero Storage, Native Full-Screen Streaming
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* 1-Click Install CTA if browser supports prompt */}
          {installPrompt && !isInstalled && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  1-Click Direct Install Ready
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Your browser supports direct web app installation.
                </span>
              </div>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Step-by-Step Installation Guide:
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#0e121d] rounded-xl border border-slate-200 dark:border-[#1f273b] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivePlatform('ios')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatform === 'ios'
                    ? 'bg-white dark:bg-[#1d2538] text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatform === 'android'
                    ? 'bg-white dark:bg-[#1d2538] text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePlatform('desktop')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePlatform === 'desktop'
                    ? 'bg-white dark:bg-[#1d2538] text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
            </div>
          </div>

          {/* Guide Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-3">
            {activePlatform === 'ios' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Open this site in <strong>Safari</strong> on your iPhone or iPad.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span>Tap the</span>
                    <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-[#1e2538] rounded text-slate-900 dark:text-white font-mono text-xs">
                      <Share className="w-3 h-3 text-sky-500" /> Share
                    </strong>
                    <span>button at the bottom bar.</span>
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                    <span>Scroll down and select</span>
                    <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 dark:bg-[#1e2538] rounded text-slate-900 dark:text-white font-mono text-xs">
                      <PlusSquare className="w-3 h-3 text-amber-500" /> Add to Home Screen
                    </strong>
                    <span>then tap <strong>Add</strong>.</span>
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'android' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Open in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>
            )}

            {activePlatform === 'desktop' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    <Laptop className="w-4 h-4 text-amber-500" />
                    <span>Native Standalone Desktop App (Recommended)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Runs the high-speed BitTorrent engine natively on your PC. Streams ANY magnet link (TCP, UDP, DHT) directly with zero browser restrictions.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      ✓ No terminal or Node.js needed for end users
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Or Install as Chrome / Edge Web App (PWA):
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        Open in Chrome, Edge, Brave, or Opera.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        Click the <strong>Install icon (⊕ or 💻)</strong> on the right side of the URL address bar.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        Click <strong>Install</strong> to launch Torrent Player in its own standalone window.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advantages List */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Why Install the Web App?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b]">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Full-screen borderless video</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Zero disk storage used</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b]">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">1-tap Home Screen launch</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b]">
                <Smartphone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Mobile rotation &amp; zoom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0b0e17]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-[#1a2130] hover:bg-slate-300 dark:hover:bg-[#232b3e] text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
