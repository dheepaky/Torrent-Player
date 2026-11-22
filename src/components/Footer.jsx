import React, { memo } from 'react'

export const Footer = memo(function Footer({ onOpenLegal, onOpenAbout }) {
  return (
    <footer className="mt-14 border-t border-slate-200 dark:border-[#232b3e] bg-slate-100/70 dark:bg-[#0b0e17] py-6 text-center text-xs transition-colors">
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {/* Sleek, Professional Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={onOpenAbout}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
          >
            About
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
          >
            Terms of Service
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={() => onOpenLegal('dmca')}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer px-3 py-1 rounded-lg hover:bg-amber-500/10 font-bold"
          >
            DMCA &amp; Copyright
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          © 2026 Torrent Player. No files, torrents, or personal data are stored on any server.
        </p>
      </div>
    </footer>
  )
})
