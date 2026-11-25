import React, { memo } from 'react'

export const Footer = memo(function Footer({ onOpenLegal, onOpenAbout, onOpenTab }) {
  return (
    <footer className="mt-14 border-t border-slate-200 dark:border-[#232b3e] bg-slate-100/70 dark:bg-[#0b0e17] pt-8 pb-28 sm:pb-8 text-center transition-colors">
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Sleek, Professional Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
          {onOpenTab && (
            <>
              <button
                type="button"
                onClick={() => onOpenTab('guide')}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
              >
                Guide
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>

              <button
                type="button"
                onClick={() => onOpenTab('shortcuts')}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
              >
                Shortcuts
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>

              <button
                type="button"
                onClick={() => onOpenTab('storage')}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
              >
                Storage
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>

              <button
                type="button"
                onClick={() => onOpenTab('faq')}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
              >
                FAQ
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
            </>
          )}

          <button
            type="button"
            onClick={onOpenAbout}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
          >
            About
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
          >
            Privacy Policy
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-[#131722]"
          >
            Terms of Service
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <button
            type="button"
            onClick={() => onOpenLegal('dmca')}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-amber-500/10 font-bold"
          >
            DMCA &amp; Copyright
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>

          <a
            href="mailto:dheefx.dev@outlook.com"
            className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer px-3.5 py-1.5 rounded-lg hover:bg-sky-500/10"
            title="Contact Support"
          >
            Support
          </a>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
          © 2026 Torrent Player. Released under GNU GPL v3.0.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Support &amp; Inquiries: <a href="mailto:dheefx.dev@outlook.com" className="underline hover:text-sky-400">dheefx.dev@outlook.com</a>
        </p>
      </div>
    </footer>
  )
})
