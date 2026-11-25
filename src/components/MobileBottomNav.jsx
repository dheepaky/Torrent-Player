import React, { useState, useEffect, useRef } from 'react'
import {
  PlayCircle,
  Magnet,
  ListVideo,
  Clock,
  Settings,
} from 'lucide-react'
import { useWebTorrent } from '../context/WebTorrentContext'

export function MobileBottomNav({
  onOpenHistory,
  onOpenSettings,
}) {
  const { torrent, isTheaterMode } = useWebTorrent()
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    // 1. Hide on scroll down, show on scroll up
    const handleScroll = () => {
      const currentY = window.scrollY
      const lastY = lastScrollYRef.current

      if (currentY <= 60) {
        setIsVisible(true)
      } else if (currentY > lastY + 15) {
        // Scrolling down -> hide
        setIsVisible(false)
      } else if (currentY < lastY - 10) {
        // Scrolling up -> show
        setIsVisible(true)
      }
      lastScrollYRef.current = currentY
    }

    // 2. Hide when input or textarea is focused (prevents overlapping mobile keyboard & paste button)
    const handleFocusIn = (e) => {
      const tag = e.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        setIsVisible(false)
      }
    }

    const handleFocusOut = () => {
      setIsVisible(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // If theater mode or fullscreen is active, hide bottom nav
  if (isTheaterMode) return null

  const scrollToPlayer = () => {
    const el = document.getElementById('player-card') || document.querySelector('video')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToInput = () => {
    const el = document.querySelector('input[type="text"]')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToFileList = () => {
    const el = document.getElementById('file-picker-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      scrollToInput()
    }
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-2xl transition-all duration-300 ease-in-out select-none ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto text-center">
        {/* Stream / Player Tab */}
        <button
          type="button"
          onClick={scrollToPlayer}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          <PlayCircle className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] font-semibold mt-0.5">Stream</span>
        </button>

        {/* Magnet Input Tab */}
        <button
          type="button"
          onClick={scrollToInput}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          <Magnet className="w-5 h-5 text-sky-500" />
          <span className="text-[10px] font-semibold mt-0.5">Magnet</span>
        </button>

        {/* Files Tab */}
        <button
          type="button"
          onClick={scrollToFileList}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer relative"
        >
          <ListVideo className="w-5 h-5 text-purple-500" />
          <span className="text-[10px] font-semibold mt-0.5">Files</span>
          {torrent?.files && torrent.files.length > 0 && (
            <span className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        {/* History Tab */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          <Clock className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] font-semibold mt-0.5">History</span>
        </button>

        {/* Settings Tab */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-semibold mt-0.5">Settings</span>
        </button>
      </div>
    </nav>
  )
}
