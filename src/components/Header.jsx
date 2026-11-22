import React from 'react'
import { Clock, HardDrive, Info, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useWebTorrent } from '../context/WebTorrentContext'

export function Header({ onOpenHistory, onOpenSettings, onOpenAbout }) {
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
    <header className="relative pt-6 sm:pt-8 pb-3 sm:pb-4">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Brand Header - Clickable Home */}
        <div className="flex items-center justify-center">
          <a
            href="./"
            onClick={handleGoHome}
            className="inline-flex items-center gap-3 group cursor-pointer transition-transform active:scale-95 select-none"
            title="Return to Home"
            aria-label="Torrent Player Home"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-25 blur-sm group-hover:opacity-50 transition duration-300" />
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-[#131722] border border-slate-200/80 dark:border-[#232b3e] flex items-center justify-center shadow-md group-hover:border-amber-500/50 transition-colors">
                <img
                  src="./assets/logo.svg"
                  alt="Torrent Player"
                  className="w-7 h-7 sm:w-8 sm:h-8"
                />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-2">
                Torrent Player
              </h1>
            </div>
          </a>
        </div>

        {/* Tactile Segmented Navigation Group */}
        <div className="inline-flex items-center justify-center gap-1 p-1.5 mt-4 bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-xl shadow-xs dark:shadow-lg transition-colors">
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="View recent stream history"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Recent streams</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="Storage preferences and tracker config"
          >
            <HardDrive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Storage &amp; trackers</span>
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title="About Torrent Player technology"
          >
            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>About</span>
          </button>

          {/* Theme Toggle Button */}
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-[#232b3e] mx-0.5" />

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1d2436] transition-all cursor-pointer active:scale-95"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
