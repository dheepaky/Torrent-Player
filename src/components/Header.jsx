import React from 'react'
import {
  Clock,
  HardDrive,
  Info,
  Sun,
  Moon,
  ShieldCheck,
  Infinity,
  Zap,
  Download,
  HelpCircle,
} from 'lucide-react'
import logoSvg from '../assets/logo.svg'
import { useTheme } from '../context/ThemeContext'
import { useWebTorrent } from '../context/WebTorrentContext'

export function Header({
  onOpenHistory,
  onOpenSettings,
  onOpenAbout,
  onOpenInstallApp,
  onOpenGuide,
}) {
  const { isDark, toggleTheme } = useTheme()
  const { torrent, cancelTorrent } = useWebTorrent()

  const isNativeApp =
    typeof window !== 'undefined' &&
    (!!window.Android || /TorrentPlayerApp/i.test(navigator.userAgent))

  const handleGoHome = (e) => {
    e.preventDefault()
    if (torrent) {
      cancelTorrent()
    }
    window.location.hash = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="w-full">
      {/* 1. Sleek Sticky Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-[#0b0e17]/90 border-b border-slate-200/80 dark:border-[#1e2538] transition-colors shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <a
            href="./"
            onClick={handleGoHome}
            className="inline-flex items-center gap-2 sm:gap-3 group cursor-pointer transition-transform active:scale-95 select-none shrink-0"
            title="Return to Home"
            aria-label="Torrent Player Home"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 opacity-25 blur-xs group-hover:opacity-60 transition duration-300" />
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] flex items-center justify-center shadow-xs group-hover:border-amber-500/50 transition-colors p-1.5">
                <img
                  src={logoSvg}
                  alt="Torrent Player"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = './favicon.png'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                Torrent Player
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                v2.2
              </span>
            </div>
          </a>

          {/* Right Action Controls: Unified Navigation & Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Recent History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181f2f] transition-all cursor-pointer text-xs sm:text-sm font-semibold active:scale-95"
              title="Recent streams history"
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Storage & Settings Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181f2f] transition-all cursor-pointer text-xs sm:text-sm font-semibold active:scale-95"
              title="Settings & Trackers"
            >
              <HardDrive className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Guide & Tips Button */}
            {onOpenGuide && (
              <button
                type="button"
                onClick={() => onOpenGuide('guide')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181f2f] transition-all cursor-pointer text-xs sm:text-sm font-semibold active:scale-95"
                title="How to Stream & Tips"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                <span>Guide</span>
              </button>
            )}

            {/* About Modal */}
            <button
              type="button"
              onClick={onOpenAbout}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181f2f] transition-all cursor-pointer text-xs sm:text-sm font-semibold active:scale-95"
              title="About technology"
            >
              <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>About</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1" />

            {/* Install App Button (hidden in native Android app) */}
            {!isNativeApp && (
              <button
                type="button"
                onClick={onOpenInstallApp}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                title="Install App (Desktop & Mobile)"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-xs">App</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-[#181f2f] hover:bg-slate-200 dark:hover:bg-[#222b40] border border-slate-200/80 dark:border-[#2a364f] text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Screen reader SEO heading */}
      <h1 className="sr-only">
        Instant, Serverless Peer-to-Peer Video Streaming — Torrent Player
      </h1>
    </header>
  )
}
