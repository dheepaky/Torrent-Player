import React, { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { WebTorrentProvider, useWebTorrent } from './context/WebTorrentContext'
import { Header } from './components/Header'
import { MobileNoticeBanner } from './components/MobileNoticeBanner'
import { MagnetInput } from './components/MagnetInput'
import { HeroPlayer } from './components/HeroPlayer'
import { FilePicker } from './components/FilePicker'
import { ShortcutsGuide } from './components/ShortcutsGuide'
import { InstructionsSection } from './components/InstructionsSection'
import { StorageNotice } from './components/StorageNotice'
import { SeoContentSection } from './components/SeoContentSection'
import { AdSlot } from './components/AdSlot'
import { Footer } from './components/Footer'
import { HistoryModal } from './components/modals/HistoryModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { ExternalPlayerModal } from './components/modals/ExternalPlayerModal'
import { AboutModal } from './components/modals/AboutModal'
import { LegalModal } from './components/modals/LegalModal'
import { InstallAppModal } from './components/modals/InstallAppModal'
import * as subtitles from './utils/subtitles'

function MainContent() {
  const {
    torrent,
    videoRef,
    downloadTorrent,
    togglePause,
    isTheaterMode,
    setIsTheaterMode,
  } = useWebTorrent()

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isLegalOpen, setIsLegalOpen] = useState(false)
  const [isInstallOpen, setIsInstallOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [legalTab, setLegalTab] = useState('dmca')
  const [extPlayerFile, setExtPlayerFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Listen for native PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleOpenLegal = (tab = 'dmca') => {
    setLegalTab(tab)
    setIsLegalOpen(true)
  }

  // Drag and Drop global listener
  useEffect(() => {
    let dragCounter = 0

    const handleDragEnter = (e) => {
      e.preventDefault()
      dragCounter++
      setIsDragging(true)
    }

    const handleDragLeave = (e) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        setIsDragging(false)
        dragCounter = 0
      }
    } 

    const handleDragOver = (e) => {
      e.preventDefault()
    }

    const handleDrop = async (e) => {
      e.preventDefault()
      setIsDragging(false)
      dragCounter = 0

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

      // Subtitle dropped
      if (['.srt', '.vtt'].includes(ext)) {
        const video = videoRef.current
        if (video) {
          try {
            const text = await file.text()
            subtitles.cleanSubtitleTracks(video)
            subtitles.attachSubtitleTrack(video, text, file.name, 'en', true)
          } catch (err) {
            console.error('Failed to attach dropped subtitle:', err)
          }
        }
        return
      }

      // Torrent file dropped
      if (ext === '.torrent') {
        downloadTorrent(file)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [videoRef, downloadTorrent])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable)
      ) {
        return
      }

      const video = videoRef.current

      switch (e.key) {
        case ' ':
        case 'k':
          if (video) {
            e.preventDefault()
            video.paused ? video.play() : video.pause()
          }
          break
        case 'ArrowLeft':
        case 'j':
          if (video) {
            e.preventDefault()
            video.currentTime = Math.max(0, video.currentTime - 5)
          }
          break
        case 'ArrowRight':
        case 'l':
          if (video) {
            e.preventDefault()
            video.currentTime = Math.min(
              video.duration || 0,
              video.currentTime + 5
            )
          }
          break
        case 'ArrowUp':
          if (video) {
            e.preventDefault()
            video.volume = Math.min(1.0, video.volume + 0.1)
          }
          break
        case 'ArrowDown':
          if (video) {
            e.preventDefault()
            video.volume = Math.max(0.0, video.volume - 0.1)
          }
          break
        case 'f':
        case 'F':
          if (video) {
            e.preventDefault()
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else if (video.requestFullscreen) {
              video.requestFullscreen()
            }
          }
          break
        case 'm':
        case 'M':
          if (video) {
            e.preventDefault()
            video.muted = !video.muted
          }
          break
        case 't':
        case 'T':
          setIsTheaterMode((prev) => !prev)
          break
        case 'p':
        case 'P':
          e.preventDefault()
          togglePause()
          break
        case '[':
          if (video) {
            e.preventDefault()
            video.playbackRate = Math.max(0.25, video.playbackRate - 0.25)
          }
          break
        case ']':
          if (video) {
            e.preventDefault()
            video.playbackRate = Math.min(3.0, video.playbackRate + 0.25)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [videoRef, togglePause, setIsTheaterMode])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e17] text-slate-800 dark:text-slate-100 flex flex-col justify-between relative transition-colors duration-200">
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-amber-500/20 backdrop-blur-sm border-4 border-dashed border-amber-400 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950/90 border border-amber-400 px-8 py-6 rounded-2xl text-center shadow-2xl animate-pulse">
            <span className="text-5xl block mb-2">⚡</span>
            <h3 className="text-2xl font-bold text-white mb-1">
              Drop .torrent or Subtitle File
            </h3>
            <p className="text-slate-300 text-sm">
              Release to start streaming immediately
            </p>
          </div>
        </div>
      )}

      <div>
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenInstallApp={() => setIsInstallOpen(true)}
        />

        <main className="pb-12">
          {!torrent && (
            <MobileNoticeBanner
              onOpenInstallApp={() => setIsInstallOpen(true)}
            />
          )}

          {/* Top Leaderboard Ad Slot (728x90 desktop / 320x50 mobile) */}
          <AdSlot id="ad-top-leaderboard" format="leaderboard" className="max-w-4xl" />

          <MagnetInput />

          <HeroPlayer
            onOpenExternalPlayer={(file) => setExtPlayerFile(file)}
          />

          <FilePicker
            onOpenExternalPlayer={(file) => setExtPlayerFile(file)}
          />

          <StorageNotice
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Golden Zone Ad Unit: Post-Player / Post-Tool (Dual 300x250 Medium Rectangles - Industry Highest RPM) */}
          <AdSlot id="ad-post-player" format="dual-rectangle" className="max-w-4xl" />

          <ShortcutsGuide />

          {/* Mid-Content Ad Slot (In-Feed Responsive Display) */}
          <AdSlot id="ad-mid-content" format="horizontal" className="max-w-4xl" />

          <InstructionsSection />

          <SeoContentSection />

          {/* Bottom Pre-Footer Ad Slot (728x90 Leaderboard / Display Unit) */}
          <AdSlot id="ad-bottom-footer" format="leaderboard" className="max-w-4xl" />
        </main>
      </div>

      <Footer
        onOpenLegal={handleOpenLegal}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ExternalPlayerModal
        file={extPlayerFile}
        isOpen={!!extPlayerFile}
        onClose={() => setExtPlayerFile(null)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <LegalModal
        isOpen={isLegalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalOpen(false)}
      />

      <InstallAppModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        installPrompt={installPrompt}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <WebTorrentProvider>
        <MainContent />
      </WebTorrentProvider>
    </ThemeProvider>
  )
}
