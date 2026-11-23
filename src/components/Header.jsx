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
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useWebTorrent } from '../context/WebTorrentContext'

export function Header({
  onOpenHistory,
  onOpenSettings,
  onOpenAbout,
  onOpenInstallApp,
}) {
  const { isDark, toggleTheme } = useTheme()
  const { torrent, cancelTorrent } = useWebTorrent()

  const handleGoHome = (e) => {
    e.preventDefault()
    if (torrent) {
      cancelTorrent()
    }
    window.location.hash = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="pt-3 sm:pt-6 pb-3 sm:pb-5 px-3 sm:px-6 max-w-5xl mx-auto">
      {/* Top Bar: Brand on Left, Quick Actions (Install + Theme) on Right */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2.5 sm:mb-4">
        {/* Brand / Logo + Title */}
        <a
          href="./"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 sm:gap-3 group cursor-pointer transition-transform active:scale-95 select-none min-w-0"
          title="Return to Home"
          aria-label="Torrent Player Home"
        >
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-30 blur-xs group-hover:opacity-60 transition duration-300" />
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-[#232b3e] flex items-center justify-center shadow-xs sm:shadow-md group-hover:border-amber-500/50 transition-colors">
              <img
                src="./assets/logo.svg"
                alt="Torrent Player"
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
              Torrent Player
            </h1>
          </div>
        </a>

        {/* Top-Right Quick Action Group (Install App + Theme Toggle) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenInstallApp}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="Download / Install Web App for Mobile & Desktop"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden text-xs">Install</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/90 dark:bg-[#131722]/90 hover:bg-slate-100 dark:hover:bg-[#1d2436] border border-slate-200 dark:border-[#232b3e] text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer active:scale-95"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 dark:text-slate-200" />
            )}
            <span className="text-xs sm:text-sm font-semibold hidden md:inline">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Subtitle & Value Proposition */}
        <p className="text-xs sm:text-base text-slate-700 dark:text-slate-300 font-medium max-w-lg mx-auto">
          Instant In-Browser BitTorrent &amp; Magnet Streamer
        </p>

        {/* Advertising Feature Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
            <HardDrive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Zero Storage Needed</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>No Subscription</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30 shadow-2xs">
            <Infinity className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
            <span>Unlimited Streaming</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30 shadow-2xs">
            <Zap className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
            <span>100% Free &amp; Private</span>
          </span>
        </div>

        {/* Tactile Segmented Navigation Group */}
        <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5 p-1 mt-3.5 sm:mt-4.5 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-xl sm:rounded-2xl shadow-xs dark:shadow-md transition-colors max-w-full">
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="View recent stream history"
          >
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Recent streams</span>
            <span className="sm:hidden">History</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="Storage preferences and tracker config"
          >
            <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Storage &amp; trackers</span>
            <span className="sm:hidden">Settings</span>
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="About Torrent Player technology"
          >
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>About</span>
          </button>
        </div>
      </div>
    </header>
  )
}
