import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  Zap,
  Gauge,
  Tv,
  PictureInPicture,
  Loader2,
  Sliders,
  Scan,
  MoreVertical,
  X,
  Lock,
  Unlock,
  Download,
  Sun,
} from 'lucide-react'
import { useWebTorrent } from '../context/WebTorrentContext'
import * as audio from '../utils/audio'
import * as subtitles from '../utils/subtitles'
import * as storage from '../utils/storage'
import * as downloader from '../utils/downloader'
import { formatDuration } from '../utils/format'

function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return '00:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (h > 0) {
    return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

export function CustomPlayer({ onOpenExternalPlayer }) {
  const {
    torrent,
    streamingFile,
    videoRef,
    isTheaterMode,
    setIsTheaterMode,
    resumePrompt,
    setResumePrompt,
    stats,
  } = useWebTorrent()

  const playerContainerRef = useRef(null)
  const outputContainerRef = useRef(null)
  const hideControlsTimeoutRef = useRef(null)
  const customSubInputRef = useRef(null)

  // Direct DOM refs for high-performance zero-re-render scrubbing
  const playedBarRef = useRef(null)
  const bufferedBarRef = useRef(null)
  const rangeInputRef = useRef(null)
  const timeTextRef = useRef(null)
  const isScrubbingRef = useRef(false)

  // Player state (only state that requires UI toggle re-renders)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [audioBoost, setAudioBoostVal] = useState(1.0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isForceLandscape, setIsForceLandscape] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [useNativeControls, setUseNativeControls] = useState(false)

  // 2x Hold-to-speed state & refs
  const [isHolding2x, setIsHolding2x] = useState(false)
  const isHolding2xRef = useRef(false)
  const holdTimeoutRef = useRef(null)
  const prevPlaybackRateRef = useRef(1.0)
  const preventClickToggleRef = useRef(false)

  // Subtitles & menus state
  const [availableSubtitles, setAvailableSubtitles] = useState([])
  const [activeSubtitle, setActiveSubtitle] = useState('off')
  const [showSubMenu, setShowSubMenu] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showBoostMenu, setShowBoostMenu] = useState(false)
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false)

  // Fit Screen / Zoom options
  const [fitMode, setFitMode] = useState('contain')
  const [fitNotification, setFitNotification] = useState(null)

  // MX / VLC Player Style Brightness & Volume Gestures
  const [brightness, setBrightness] = useState(1.0)
  const [gestureHUD, setGestureHUD] = useState(null)
  const gestureHUDTimeoutRef = useRef(null)
  const pointerStartRef = useRef(null)

  // Screen Lock (Play Lock) & Touch gestures state
  const [isScreenLocked, setIsScreenLocked] = useState(false)
  const [showUnlockPill, setShowUnlockPill] = useState(false)
  const [lockToast, setLockToast] = useState(null)
  const [doubleTapFeedback, setDoubleTapFeedback] = useState(null)
  const unlockPillTimeoutRef = useRef(null)
  const lastTapRef = useRef({ time: 0, x: 0 })
  const singleTapTimeoutRef = useRef(null)

  const toggleScreenLock = useCallback((e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setIsScreenLocked((prev) => {
      const next = !prev
      if (next) {
        setControlsVisible(false)
        setShowMobileMoreMenu(false)
        setShowSubMenu(false)
        setShowSpeedMenu(false)
        setShowBoostMenu(false)
        setShowUnlockPill(false)
        setLockToast('Screen Locked')
        setTimeout(() => setLockToast(null), 2000)
      } else {
        setControlsVisible(true)
        setShowUnlockPill(false)
        setLockToast('Screen Unlocked')
        setTimeout(() => setLockToast(null), 2000)
      }
      return next
    })
  }, [])

  const cycleFitMode = () => {
    const modes = [
      { id: 'contain', label: 'Fit to Screen' },
      { id: 'cover', label: 'Zoom / Fill (No Black Bars)' },
      { id: 'fill', label: 'Stretch Full' },
    ]
    const curIdx = modes.findIndex((m) => m.id === fitMode)
    const next = modes[(curIdx + 1) % modes.length]
    setFitMode(next.id)
    if (videoRef.current) {
      videoRef.current.style.objectFit = next.id
    }
    setFitNotification(next.label)
    setTimeout(() => setFitNotification(null), 1600)
  }

  // Subtitle synchronization when torrent / file changes
  useEffect(() => {
    if (!torrent || !streamingFile) {
      setAvailableSubtitles([])
      setActiveSubtitle('off')
      return
    }

    const subFiles = subtitles.findTorrentSubtitles(torrent, streamingFile)
    setAvailableSubtitles(subFiles)

    const autoSub =
      subFiles.find((sf) => {
        const sn = sf.name.toLowerCase()
        const vn = streamingFile.name.toLowerCase().replace(/\.[^/.]+$/, '')
        return sn.includes(vn) || sn.includes('eng') || sn.includes('english')
      }) || subFiles[0]

    if (autoSub) {
      setActiveSubtitle(autoSub.path)
    } else {
      setActiveSubtitle('off')
    }
  }, [torrent, streamingFile])

  // Fresh Video Mounting & Streaming
  useEffect(() => {
    const container = outputContainerRef.current
    if (!container || !streamingFile || !torrent) return

    setIsBuffering(false)
    setIsPlaying(false)

    // Remove any previous video elements to guarantee clean decoder pipeline
    container.replaceChildren()

    // Create a fresh HTML5 video element
    const video = document.createElement('video')
    video.id = 'player-video'
    video.controls = useNativeControls
    video.autoplay = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('controlsList', 'nodownload noplaybackrate')
    video.className =
      'w-full h-full cursor-pointer select-none touch-manipulation'
    video.style.objectFit = fitMode
    video.style.webkitTouchCallout = 'none'
    video.style.webkitUserSelect = 'none'
    video.style.userSelect = 'none'
    video.style.touchAction = 'manipulation'
    if (brightness !== 1.0) {
      video.style.filter = `brightness(${brightness})`
    }
    video.oncontextmenu = (e) => {
      e.preventDefault()
      return false
    }

    container.appendChild(video)
    videoRef.current = video

    // Stream the torrent file through Node.js Backend, ServiceWorker, or WebTorrent renderTo
    try {
      if (streamingFile.streamURL) {
        video.src = streamingFile.streamURL
      } else if (typeof streamingFile.renderTo === 'function') {
        streamingFile.renderTo(video)
      } else if (typeof streamingFile.streamTo === 'function') {
        streamingFile.streamTo(video)
      } else if (typeof streamingFile.getBlobURL === 'function') {
        streamingFile.getBlobURL((err, url) => {
          if (!err && url) video.src = url
        })
      }
    } catch (err) {
      if (streamingFile.streamURL) {
        video.src = streamingFile.streamURL
      } else {
        console.error('[CustomPlayer] Stream setup error:', err)
      }
    }

    // Try starting playback
    video.play().catch((err) => {
      console.log('[CustomPlayer] Autoplay deferred:', err.name)
      setIsPlaying(false)
    })

    // High-performance DOM-based Timeline & Time Display updater (0 React re-renders)
    const updateTimelineDOM = () => {
      if (isScrubbingRef.current || !video.duration) return
      const cur = video.currentTime
      const dur = video.duration
      const pct = (cur / dur) * 100

      if (playedBarRef.current) {
        playedBarRef.current.style.width = `${pct}%`
      }
      if (rangeInputRef.current) {
        rangeInputRef.current.value = cur
        rangeInputRef.current.max = dur
      }
      if (timeTextRef.current) {
        timeTextRef.current.textContent = `${formatTime(cur)} / ${formatTime(dur)}`
      }

      let bufPct = 0
      if (video.buffered && video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        bufPct = Math.min(100, (bufferedEnd / dur) * 100)
      }
      if (
        streamingFile &&
        streamingFile._startPiece !== undefined &&
        streamingFile._endPiece !== undefined &&
        torrent.pieces
      ) {
        const totalFilePieces =
          streamingFile._endPiece - streamingFile._startPiece + 1
        let downloadedPieces = 0
        for (let i = streamingFile._startPiece; i <= streamingFile._endPiece; i++) {
          if (torrent.pieces[i] && torrent.pieces[i].missing === 0) {
            downloadedPieces++
          }
        }
        const torrentBufPct =
          totalFilePieces > 0 ? (downloadedPieces / totalFilePieces) * 100 : 0
        bufPct = Math.max(bufPct, torrentBufPct)
      } else if (stats?.progress) {
        bufPct = Math.max(bufPct, stats.progress)
      }
      if (bufferedBarRef.current) {
        bufferedBarRef.current.style.width = `${Math.min(100, bufPct)}%`
      }
    }

    // Continuous lookahead and buffer manager:
    // Ensures download continues buffering forward even when the player is paused!
    if (!torrent._userPaused && typeof streamingFile.select === 'function') {
      try {
        streamingFile.select()
      } catch {}
    }

    const performLookaheadBuffer = () => {
      if (!torrent || torrent.destroyed) return
      if (!torrent._userPaused && typeof streamingFile.select === 'function') {
        try {
          streamingFile.select()
        } catch {}
      }
      updateTimelineDOM()
    }

    // Run buffer manager immediately and every 1s (active whether playing OR paused)
    performLookaheadBuffer()
    const bufferInterval = setInterval(performLookaheadBuffer, 1000)

    // Video events
    const handlePlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
      performLookaheadBuffer()
    }
    const handlePause = () => {
      setIsPlaying(false)
      setIsBuffering(false)
      performLookaheadBuffer()
      storage.updateHistoryProgress(
        torrent.infoHash,
        video.currentTime,
        video.duration,
        torrent.progress
      )
    }
    const handleWaiting = () => {
      if (!video.paused && video.currentTime > 0) {
        setIsBuffering(true)
      }
    }
    const handlePlaying = () => {
      setIsBuffering(false)
      setIsPlaying(true)
    }
    const handleCanPlay = () => {
      setIsBuffering(false)
    }
    const handleLoadedData = () => {
      setIsBuffering(false)
    }
    const handleCanPlayThrough = () => {
      setIsBuffering(false)
    }
    const handleError = () => {
      setIsBuffering(false)
      console.warn('[CustomPlayer] Video error:', video.error)
    }
    const handleLoadedMetadata = () => {
      if (rangeInputRef.current) {
        rangeInputRef.current.max = video.duration || 100
      }
      updateTimelineDOM()
      setIsBuffering(false)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('error', handleError)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    // Throttled History Save (at most once every 5 seconds)
    let lastSave = 0
    const onTimeSave = () => {
      const now = Date.now()
      if (now - lastSave > 5000) {
        lastSave = now
        storage.updateHistoryProgress(
          torrent.infoHash,
          video.currentTime,
          video.duration,
          torrent.progress
        )
      }
    }
    video.addEventListener('timeupdate', onTimeSave)
    video.addEventListener('timeupdate', updateTimelineDOM)
    video.addEventListener('progress', updateTimelineDOM)

    return () => {
      clearInterval(bufferInterval)
      video.removeEventListener('timeupdate', onTimeSave)
      video.removeEventListener('timeupdate', updateTimelineDOM)
      video.removeEventListener('progress', updateTimelineDOM)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [streamingFile, torrent, useNativeControls, setResumePrompt])

  // Update native controls attribute when toggled
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.controls = useNativeControls
    }
  }, [useNativeControls, videoRef])

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFs)
      if (!isFs) {
        setIsForceLandscape(false)
        if (typeof window !== 'undefined' && window.Android && typeof window.Android.exitImmersiveFullscreen === 'function') {
          window.Android.exitImmersiveFullscreen()
        }
        try {
          if (screen.orientation?.unlock) screen.orientation.unlock()
        } catch {}
      }
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  // Auto-hide controls and all bottom menus when playing
  const showControlsTemporarily = useCallback(() => {
    if (isScreenLocked) return
    setControlsVisible(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    // Only auto-hide if playing and NO submenus or options menus are open!
    if (isPlaying && !showMobileMoreMenu && !showSubMenu && !showSpeedMenu && !showBoostMenu) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 4000)
    }
  }, [isPlaying, isScreenLocked, showMobileMoreMenu, showSubMenu, showSpeedMenu, showBoostMenu])

  // Clear hide timer when any menu is opened, keeping controls comfortably visible on mobile
  useEffect(() => {
    if (showMobileMoreMenu || showSubMenu || showSpeedMenu || showBoostMenu) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = null
      }
      setControlsVisible(true)
    }
  }, [showMobileMoreMenu, showSubMenu, showSpeedMenu, showBoostMenu])

  // When playback begins, auto-hide controls after 4s only if no menus are open
  useEffect(() => {
    if (isScreenLocked) return
    if (isPlaying && !showMobileMoreMenu && !showSubMenu && !showSpeedMenu && !showBoostMenu) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 4000)
    } else {
      setControlsVisible(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [isPlaying, isScreenLocked, showMobileMoreMenu, showSubMenu, showSpeedMenu, showBoostMenu])

  const handleMouseMove = useCallback(() => {
    if (isScreenLocked) return
    showControlsTemporarily()
  }, [showControlsTemporarily, isScreenLocked])

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setControlsVisible(false)
      setShowSubMenu(false)
      setShowSpeedMenu(false)
      setShowBoostMenu(false)
      setShowMobileMoreMenu(false)
    }
  }, [isPlaying])

  // Toggle Play / Pause
  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch((e) => console.log('Play blocked:', e))
    } else {
      video.pause()
    }
  }

  // Global contextmenu suppressor during long-press to block browser "Download video" popup
  const suppressMenuRef = useRef((e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  })

  // Hold-to-2x speed functionality (touch and mouse)
  const handlePointerDown = (e) => {
    // Only primary button
    if (e.button !== undefined && e.button !== 0) return
    // Ignore clicks on controls bar, buttons, sliders, menu dropdowns
    if (
      e.target.closest(
        'button, input, select, textarea, [role="menu"], .player-controls-container'
      )
    ) {
      return
    }

    // If screen is locked, tapping anywhere triggers unlock pill
    if (isScreenLocked) {
      setShowUnlockPill(true)
      if (unlockPillTimeoutRef.current) {
        clearTimeout(unlockPillTimeoutRef.current)
      }
      unlockPillTimeoutRef.current = setTimeout(() => {
        setShowUnlockPill(false)
      }, 3000)
      return
    }

    const video = videoRef.current
    if (!video) return

    preventClickToggleRef.current = false
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
    }

    // Initialize pointer start for MX / VLC Player vertical swipe gestures (Left: Brightness, Right: Volume)
    const rect = playerContainerRef.current?.getBoundingClientRect()
    const relX = rect ? (e.clientX - rect.left) / rect.width : 0.5
    pointerStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      side: relX < 0.5 ? 'brightness' : 'volume',
      startBrightness: brightness,
      startVolume: video ? (video.muted ? 0 : video.volume) : volume,
      isSwiping: false,
    }

    // Suppress contextmenu during press
    window.addEventListener('contextmenu', suppressMenuRef.current, { capture: true })

    // If video is playing, prepare hold-to-2x
    if (!video.paused) {
      holdTimeoutRef.current = setTimeout(() => {
        if (!videoRef.current || videoRef.current.paused) return
        isHolding2xRef.current = true
        setIsHolding2x(true)
        prevPlaybackRateRef.current = videoRef.current.playbackRate || 1.0
        videoRef.current.playbackRate = 2.0
        preventClickToggleRef.current = true
        try {
          if (navigator.vibrate) navigator.vibrate(35)
        } catch {}
      }, 300)
    }
  }

  // MX Player / VLC Player vertical swipe for Brightness & Volume
  const handlePointerMove = (e) => {
    if (isScreenLocked || !pointerStartRef.current) return
    const p = pointerStartRef.current
    const deltaX = e.clientX - p.startX
    const deltaY = e.clientY - p.startY

    if (!p.isSwiping) {
      // If vertical movement is dominant and > 18px, activate vertical swipe gesture
      if (Math.abs(deltaY) > 18 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25) {
        p.isSwiping = true
        preventClickToggleRef.current = true
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current)
          holdTimeoutRef.current = null
        }
        if (isHolding2xRef.current) {
          isHolding2xRef.current = false
          setIsHolding2x(false)
          if (videoRef.current) {
            videoRef.current.playbackRate = prevPlaybackRateRef.current || 1.0
          }
        }
      } else {
        return
      }
    }

    // Swipe UP (negative deltaY) increases value; swipe DOWN (positive deltaY) decreases value
    const rect = playerContainerRef.current?.getBoundingClientRect()
    const height = rect?.height || 320
    const fractionChange = -deltaY / (height * 0.7)

    if (p.side === 'brightness') {
      const newBrightness = Math.max(0.2, Math.min(1.8, Math.round((p.startBrightness + fractionChange * 1.0) * 100) / 100))
      setBrightness(newBrightness)
      if (videoRef.current) {
        videoRef.current.style.filter = `brightness(${newBrightness})`
      }
      const percent = Math.round((newBrightness / 1.0) * 100)
      setGestureHUD({ type: 'brightness', value: percent, label: `${percent}%` })
    } else {
      const newVolume = Math.max(0, Math.min(1.0, Math.round((p.startVolume + fractionChange * 1.0) * 100) / 100))
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
      if (videoRef.current) {
        videoRef.current.volume = newVolume
        videoRef.current.muted = newVolume === 0
      }
      const percent = Math.round(newVolume * 100)
      setGestureHUD({ type: 'volume', value: percent, label: `${percent}%` })
    }

    if (gestureHUDTimeoutRef.current) {
      clearTimeout(gestureHUDTimeoutRef.current)
    }
    gestureHUDTimeoutRef.current = setTimeout(() => {
      setGestureHUD(null)
    }, 1000)
  }

  const handlePointerUp = (e) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }

    // Remove contextmenu suppressor after short delay to catch trailing events
    setTimeout(() => {
      window.removeEventListener('contextmenu', suppressMenuRef.current, { capture: true })
    }, 300)

    const hadSwipe = pointerStartRef.current?.isSwiping
    pointerStartRef.current = null
    if (hadSwipe) {
      preventClickToggleRef.current = true
      setTimeout(() => {
        preventClickToggleRef.current = false
      }, 250)
      return
    }

    if (isScreenLocked) {
      return
    }

    const video = videoRef.current
    if (isHolding2xRef.current) {
      isHolding2xRef.current = false
      setIsHolding2x(false)
      if (video) {
        video.playbackRate = prevPlaybackRateRef.current || 1.0
      }
      // Suppress trailing click toggle so video doesn't pause upon release
      preventClickToggleRef.current = true
      setTimeout(() => {
        preventClickToggleRef.current = false
      }, 200)
      return
    }

    if (preventClickToggleRef.current) return

    if (
      e.target.closest(
        'button, input, select, textarea, [role="menu"], .player-controls-container'
      )
    ) {
      return
    }

    // Double-tap seek detection (Left 38% = -10s, Right 38% = +10s)
    const now = Date.now()
    const lastTap = lastTapRef.current
    const rect = playerContainerRef.current?.getBoundingClientRect()
    const isTouch = e.pointerType === 'touch' || (typeof window !== 'undefined' && 'ontouchstart' in window)

    if (rect && now - lastTap.time < 320 && Math.abs(e.clientX - lastTap.x) < 60) {
      // Double tap confirmed! Cancel pending single tap toggle
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current)
        singleTapTimeoutRef.current = null
      }
      lastTapRef.current = { time: 0, x: 0 }

      const relX = (e.clientX - rect.left) / rect.width
      if (relX < 0.38) {
        handleSkip(-10)
        setDoubleTapFeedback({ direction: 'left', id: Date.now() })
        setTimeout(() => setDoubleTapFeedback(null), 650)
        showControlsTemporarily()
        return
      } else if (relX > 0.62) {
        handleSkip(10)
        setDoubleTapFeedback({ direction: 'right', id: Date.now() })
        setTimeout(() => setDoubleTapFeedback(null), 650)
        showControlsTemporarily()
        return
      }
    }

    lastTapRef.current = { time: now, x: e.clientX }

    // Single tap scheduling (slight 200ms debounce to allow double-tap)
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current)
    }

    singleTapTimeoutRef.current = setTimeout(() => {
      if (isTouch) {
        // On mobile / touch screen, tapping video canvas toggles controls visibility
        if (controlsVisible) {
          setControlsVisible(false)
          setShowSubMenu(false)
          setShowSpeedMenu(false)
          setShowBoostMenu(false)
          setShowMobileMoreMenu(false)
        } else {
          showControlsTemporarily()
        }
      } else {
        // Desktop click:
        if (isPlaying && !controlsVisible) {
          showControlsTemporarily()
        } else {
          togglePlay()
          showControlsTemporarily()
        }
      }
    }, 200)
  }

  const handlePointerCancel = () => {
    pointerStartRef.current = null
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    setTimeout(() => {
      window.removeEventListener('contextmenu', suppressMenuRef.current, { capture: true })
    }, 300)

    if (isHolding2xRef.current) {
      isHolding2xRef.current = false
      setIsHolding2x(false)
      if (videoRef.current) {
        videoRef.current.playbackRate = prevPlaybackRateRef.current || 1.0
      }
      setTimeout(() => {
        preventClickToggleRef.current = false
      }, 200)
    }
  }

  // Seek ±10s
  const handleSkip = (seconds) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds)
    )
  }

  // Scrubbing / Timeline Dragging
  const handleScrubChange = (e) => {
    const val = parseFloat(e.target.value)
    const video = videoRef.current
    if (playedBarRef.current && video?.duration) {
      playedBarRef.current.style.width = `${(val / video.duration) * 100}%`
    }
    if (timeTextRef.current && video?.duration) {
      timeTextRef.current.textContent = `${formatTime(val)} / ${formatTime(video.duration)}`
    }
  }

  const handleScrubStart = () => {
    isScrubbingRef.current = true
  }

  const handleScrubEnd = (e) => {
    isScrubbingRef.current = false
    const video = videoRef.current
    if (video) {
      video.currentTime = parseFloat(e.target.value)
    }
  }

  // Volume
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    setIsMuted(val === 0)
    if (videoRef.current) {
      videoRef.current.volume = val
      videoRef.current.muted = val === 0
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    video.muted = nextMuted
  }

  // Speed
  const handleSpeedSelect = (spd) => {
    setPlaybackSpeed(spd)
    setShowSpeedMenu(false)
    if (videoRef.current) {
      videoRef.current.playbackRate = spd
    }
  }

  // Audio Boost
  const handleBoostSelect = (bst) => {
    setAudioBoostVal(bst)
    setShowBoostMenu(false)
    if (videoRef.current) {
      audio.initAudioBooster(videoRef.current)
      audio.setAudioBoost(bst)
    }
    const s = storage.loadSettings()
    storage.saveSettings({ ...s, audioBoost: bst })
  }

  // Subtitles Select
  const handleSubtitleSelect = async (path) => {
    setActiveSubtitle(path)
    setShowSubMenu(false)
    const video = videoRef.current
    if (!video) return

    subtitles.cleanSubtitleTracks(video)
    if (path === 'off') return

    const selectedFile = torrent?.files.find((f) => f.path === path)
    if (selectedFile) {
      const content = await subtitles.loadSubtitleFromTorrentFile(selectedFile)
      if (content && videoRef.current) {
        subtitles.attachSubtitleTrack(
          videoRef.current,
          content,
          selectedFile.name,
          'en',
          true
        )
      }
    }
  }

  // Custom Subtitle File
  const handleCustomSubFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const video = videoRef.current
    if (!video) return

    try {
      const text = await file.text()
      subtitles.cleanSubtitleTracks(video)
      subtitles.attachSubtitleTrack(video, text, file.name, 'en', true)

      setAvailableSubtitles((prev) => [
        ...prev,
        { path: 'custom', name: `Local: ${file.name}` },
      ])
      setActiveSubtitle('custom')
      setShowSubMenu(false)
    } catch (err) {
      alert(`Failed to load subtitle file: ${err.message}`)
    }
  }

  // Fullscreen with Android Native App Immersive Mode & Safari fallback
  const toggleFullscreen = async () => {
    const container = playerContainerRef.current
    const video = videoRef.current
    if (!container) return

    // If already in fullscreen or landscape mode, exit cleanly
    if (document.fullscreenElement || document.webkitFullscreenElement || isFullscreen || isForceLandscape) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        }
      } catch (e) {
        console.warn('Exit fullscreen error:', e)
      }
      if (typeof window !== 'undefined' && window.Android && typeof window.Android.exitImmersiveFullscreen === 'function') {
        window.Android.exitImmersiveFullscreen()
      }
      try {
        if (screen.orientation?.unlock) screen.orientation.unlock()
      } catch {}
      setIsFullscreen(false)
      setIsForceLandscape(false)
      return
    }

    // 1. Enter HTML5 Fullscreen on container (Hides all surrounding website UI!)
    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen({ navigationUI: 'hide' })
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen()
      } else if (video && video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen()
      }
    } catch (e) {
      if (video && video.webkitEnterFullscreen) {
        try { video.webkitEnterFullscreen() } catch {}
      }
      console.warn('Request fullscreen error:', e)
    }

    // 2. Trigger native Android immersive mode
    if (typeof window !== 'undefined' && window.Android && typeof window.Android.enterImmersiveFullscreen === 'function') {
      window.Android.enterImmersiveFullscreen(false)
    }

    setIsFullscreen(true)
  }

  // Mobile Screen Rotate & Big Screen Landscape Mode
  const toggleRotateScreen = async () => {
    const container = playerContainerRef.current
    const video = videoRef.current
    if (!container) return

    // If already in rotate mode or fullscreen, exit
    if (document.fullscreenElement || document.webkitFullscreenElement || isFullscreen || isForceLandscape) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        }
      } catch (e) {
        console.warn('Exit fullscreen error:', e)
      }
      if (typeof window !== 'undefined' && window.Android && typeof window.Android.exitImmersiveFullscreen === 'function') {
        window.Android.exitImmersiveFullscreen()
      }
      try {
        if (screen.orientation?.unlock) screen.orientation.unlock()
      } catch {}
      setIsFullscreen(false)
      setIsForceLandscape(false)
      return
    }

    // 1. Enter Fullscreen on player container FIRST (Ensures ONLY the player expands, NOT the site!)
    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen({ navigationUI: 'hide' })
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen()
      } else if (video && video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen()
      }
    } catch (e) {
      if (video && video.webkitEnterFullscreen) {
        try { video.webkitEnterFullscreen() } catch {}
      }
      console.warn('Request fullscreen error in rotate:', e)
    }

    // 2. Rotate to landscape in native app and browser
    if (typeof window !== 'undefined' && window.Android && typeof window.Android.enterImmersiveFullscreen === 'function') {
      window.Android.enterImmersiveFullscreen(true)
    } else if (typeof screen !== 'undefined' && screen.orientation?.lock) {
      try {
        await screen.orientation.lock('landscape')
      } catch {}
    }

    setIsFullscreen(true)
    setIsForceLandscape(true)
  }

  // PiP
  const handlePip = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (e) {
      console.warn('PiP error:', e)
    }
  }

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => {
        e.preventDefault()
        return false
      }}
      className={`relative bg-black select-none group overflow-hidden ${
        isForceLandscape
          ? 'fixed inset-0 z-50 w-screen h-screen rotate-mode'
          : isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full aspect-video sm:aspect-auto sm:min-h-[320px] sm:max-h-[74vh]'
      } flex items-center justify-center`}
    >
      {/* Container where the pristine fresh video element is mounted */}
      <div
        id="output"
        ref={outputContainerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
      />

      {/* Screen Lock Toggle Button (Top Left) */}
      {!useNativeControls && (
        <button
          type="button"
          onClick={toggleScreenLock}
          className={`absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 z-40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xl cursor-pointer active:scale-95 touch-manipulation pointer-events-auto transition-all ${
            isScreenLocked
              ? 'bg-amber-500 text-slate-950 border border-amber-400'
              : controlsVisible || !isPlaying
              ? 'bg-black/65 hover:bg-black/85 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-amber-400'
              : 'opacity-0 pointer-events-none'
          }`}
          title={isScreenLocked ? 'Screen is Locked. Tap to Unlock' : 'Lock screen controls'}
          aria-label={isScreenLocked ? 'Unlock screen' : 'Lock screen'}
        >
          {isScreenLocked ? (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-950" />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Screen Lock</span>
            </>
          )}
        </button>
      )}

      {/* Mobile Quick Rotate Pill */}
      {!isScreenLocked && (
        <button
          type="button"
          onClick={toggleRotateScreen}
          className={`sm:hidden absolute top-2.5 right-2.5 z-30 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/75 backdrop-blur-md border border-amber-500/40 rounded-full text-white text-[11px] font-semibold shadow-lg active:scale-95 touch-manipulation cursor-pointer transition-opacity duration-300 ${
            controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Rotate Screen to Big Screen Landscape"
          aria-label="Rotate Screen"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Rotate</span>
        </button>
      )}

      {/* Lock / Unlock Toast Notification */}
      {lockToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 bg-black/90 backdrop-blur-md border border-amber-500/70 rounded-full text-white text-xs font-bold tracking-wide shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2">
          {isScreenLocked ? (
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{lockToast}</span>
        </div>
      )}

      {/* Floating Center Unlock Pill when Screen is Locked */}
      {isScreenLocked && showUnlockPill && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={toggleScreenLock}
            className="pointer-events-auto px-5 py-2.5 bg-black/90 hover:bg-black text-white font-bold rounded-full border border-amber-500/80 shadow-[0_4px_24px_rgba(245,158,11,0.5)] backdrop-blur-md flex items-center gap-2.5 text-sm cursor-pointer transition-transform active:scale-95 touch-manipulation"
          >
            <Unlock className="w-4 h-4 text-amber-400" />
            <span>Tap to Unlock</span>
          </button>
        </div>
      )}

      {/* Double-Tap Seek Visual Feedback Indicator */}
      {doubleTapFeedback && (
        <div
          className={`absolute top-0 bottom-0 ${
            doubleTapFeedback.direction === 'left'
              ? 'left-0 pr-8 sm:pr-12 rounded-r-full'
              : 'right-0 pl-8 sm:pl-12 rounded-l-full'
          } w-2/5 flex items-center justify-center bg-white/10 backdrop-blur-xs z-30 pointer-events-none animate-in fade-in zoom-in-75 duration-150`}
        >
          <div className="flex flex-col items-center justify-center text-white bg-black/80 px-4 py-3 rounded-2xl border border-white/20 shadow-2xl">
            {doubleTapFeedback.direction === 'left' ? (
              <RotateCcw className="w-6 h-6 text-amber-400 mb-1" />
            ) : (
              <RotateCw className="w-6 h-6 text-amber-400 mb-1" />
            )}
            <span className="font-mono text-xs font-bold tracking-wider">
              {doubleTapFeedback.direction === 'left' ? '-10 SECONDS' : '+10 SECONDS'}
            </span>
          </div>
        </div>
      )}

      {/* MX / VLC Player Style Brightness & Volume Gesture HUD */}
      {!isScreenLocked && gestureHUD && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-40 px-3.5 py-4 bg-black/85 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center gap-2.5 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100 ${
            gestureHUD.type === 'brightness' ? 'left-6 sm:left-12' : 'right-6 sm:right-12'
          }`}
        >
          {gestureHUD.type === 'brightness' ? (
            <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
          ) : gestureHUD.value === 0 ? (
            <VolumeX className="w-6 h-6 text-red-400" />
          ) : (
            <Volume2 className="w-6 h-6 text-sky-400" />
          )}
          <div className="w-2.5 h-24 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-white/10">
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                gestureHUD.type === 'brightness'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                  : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
              }`}
              style={{
                height: `${Math.min(
                  100,
                  Math.max(0, gestureHUD.type === 'brightness' ? (gestureHUD.value / 180) * 100 : gestureHUD.value)
                )}%`,
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-wider">
            {gestureHUD.label}
          </span>
        </div>
      )}

      {/* Hold for 2x Speed Active Floating Badge */}
      {!isScreenLocked && isHolding2x && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-black/85 backdrop-blur-md border border-amber-500/60 rounded-full text-white text-xs font-bold tracking-wider flex items-center gap-2 shadow-[0_4px_24px_rgba(245,158,11,0.35)] animate-pulse pointer-events-none select-none">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
          <span className="font-mono text-amber-400 font-extrabold tracking-wide">2X SPEED</span>
          <span className="text-[10px] text-slate-300 font-sans font-normal opacity-80 uppercase tracking-widest hidden sm:inline">Release to resume</span>
        </div>
      )}

      {/* Fit / Zoom Mode Floating Toast */}
      {fitNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-black/85 backdrop-blur-md border border-amber-500/50 rounded-full text-white text-xs font-bold tracking-wide shadow-xl animate-fade-in pointer-events-none select-none flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5 text-amber-400" />
          <span>{fitNotification}</span>
        </div>
      )}

      {/* Buffering Spinner Overlay (Only when actively playing and waiting for chunks) */}
      {!useNativeControls && isPlaying && isBuffering && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 animate-fade-in">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-2" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
            Buffering Stream…
          </span>
        </div>
      )}

      {/* Center Mobile Touch Controls Cluster (Rewind 10s | Pause | Forward 10s) */}
      {!useNativeControls && !isScreenLocked && controlsVisible && isPlaying && (
        <div className="sm:hidden absolute inset-0 flex items-center justify-center gap-6 z-30 pointer-events-none animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => handleSkip(-10)}
            className="w-12 h-12 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-transform pointer-events-auto touch-manipulation cursor-pointer"
            title="Rewind 10s"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5 text-slate-200" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_4px_24px_rgba(245,158,11,0.5)] active:scale-90 transition-transform pointer-events-auto touch-manipulation cursor-pointer"
            title="Pause"
            aria-label="Pause"
          >
            <Pause className="w-7 h-7 fill-slate-950" />
          </button>

          <button
            type="button"
            onClick={() => handleSkip(10)}
            className="w-12 h-12 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-transform pointer-events-auto touch-manipulation cursor-pointer"
            title="Forward 10s"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5 text-slate-200" />
          </button>
        </div>
      )}

      {/* Center Big Play Button (Whenever Paused & Not Locked) */}
      {!useNativeControls && !isPlaying && !isScreenLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px] z-10 pointer-events-none">
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto touch-manipulation"
            title="Play Stream"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-slate-950 ml-1" />
          </button>
          <span className="text-xs font-semibold text-white mt-2.5 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 pointer-events-auto">
            Click to Play
          </span>
        </div>
      )}

      {/* Resume Notification Toast Banner */}
      {resumePrompt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/60 text-white px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 z-30 animate-bounce">
          <span className="text-xs sm:text-sm font-medium">
            Resume playback from{' '}
            <strong className="text-amber-400 font-mono font-bold">
              {formatDuration(resumePrompt.savedTime)}
            </strong>
            ?
          </span>
          <button
            type="button"
            onClick={resumePrompt.onResume}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={resumePrompt.onDismiss}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Custom Bottom Controls Bar Overlay */}
      {!useNativeControls && !isScreenLocked && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 inset-x-0 player-controls-container bg-gradient-to-t from-black/95 via-black/80 to-transparent px-2.5 sm:px-4 pt-6 sm:pt-8 pb-3 sm:pb-3 transition-opacity duration-300 z-40 ${
            controlsVisible || !isPlaying
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Timeline / Progress Scrubber with Direct DOM Refs */}
          <div className="relative group/timeline w-full mb-2.5 flex items-center">
            {/* Background Bar */}
            <div className="absolute inset-x-0 h-1.5 group-hover/timeline:h-2.5 bg-slate-700/60 rounded-full transition-all overflow-hidden pointer-events-none">
              {/* Buffered Bar */}
              <div
                ref={bufferedBarRef}
                className="absolute left-0 top-0 bottom-0 bg-slate-500/50 rounded-full transition-all duration-200"
                style={{ width: '0%' }}
              />
              {/* Played Progress Bar */}
              <div
                ref={playedBarRef}
                className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                style={{ width: '0%' }}
              />
            </div>

            {/* Interactive Range Input */}
            <input
              ref={rangeInputRef}
              type="range"
              min={0}
              max={100}
              step="0.1"
              defaultValue={0}
              onChange={handleScrubChange}
              onMouseDown={handleScrubStart}
              onMouseUp={handleScrubEnd}
              onTouchStart={handleScrubStart}
              onTouchEnd={handleScrubEnd}
              className="relative z-10 w-full h-5 sm:h-4 opacity-0 group-hover/timeline:opacity-100 cursor-pointer touch-manipulation"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            {/* Left Controls: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                className="min-w-[42px] min-h-[42px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation active:scale-95"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                )}
              </button>

              {/* Skip -10s */}
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center p-1.5 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation active:scale-95"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>

              {/* Skip +10s */}
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center p-1.5 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation active:scale-95"
                title="Forward 10s"
              >
                <RotateCw className="w-4.5 h-4.5" />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-1 sm:gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="min-w-[42px] min-h-[42px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation active:scale-95"
                  title={isMuted ? 'Unmute' : 'Mute'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden sm:block w-16 sm:w-20 h-1.5 bg-slate-700 accent-amber-500 rounded-lg cursor-pointer"
                />
              </div>

              {/* Time Display (Direct DOM Text) */}
              <div
                ref={timeTextRef}
                className="font-mono text-xs sm:text-sm font-semibold text-slate-200 ml-0.5 sm:ml-1 whitespace-nowrap shrink-0"
              >
                00:00 / 00:00
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 relative">
              {/* Desktop-only secondary controls */}
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
                {/* Subtitles Button & Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubMenu(!showSubMenu)
                      setShowSpeedMenu(false)
                      setShowBoostMenu(false)
                    }}
                    className={`p-1.5 rounded hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 ${
                      activeSubtitle !== 'off'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                    title="Subtitles / Closed Captions"
                  >
                    <Subtitles className="w-4 h-4" />
                    <span className="text-[10px] hidden md:inline uppercase font-bold">
                      {activeSubtitle !== 'off' ? 'CC' : ''}
                    </span>
                  </button>

                  {showSubMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 sm:w-52 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                        Select Subtitles
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubtitleSelect('off')}
                        className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                          activeSubtitle === 'off'
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        Off
                      </button>
                      {availableSubtitles.map((sub, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSubtitleSelect(sub.path)}
                          className={`w-full text-left px-2.5 py-1.5 rounded truncate transition-colors ${
                            activeSubtitle === sub.path
                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                          title={sub.name}
                        >
                          {sub.name}
                        </button>
                      ))}
                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => customSubInputRef.current?.click()}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-sky-400 font-semibold rounded transition-colors"
                        >
                          + Upload Subtitle (.srt/.vtt)
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={customSubInputRef}
                    accept=".srt,.vtt"
                    onChange={handleCustomSubFile}
                    className="hidden"
                  />
                </div>

                {/* Audio Boost Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBoostMenu(!showBoostMenu)
                      setShowSubMenu(false)
                      setShowSpeedMenu(false)
                    }}
                    className={`p-1.5 rounded hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 ${
                      audioBoost > 1.0 ? 'text-amber-400 font-bold' : 'text-slate-300'
                    }`}
                    title="Audio Booster (up to 300%)"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] hidden md:inline font-mono">
                      {Math.round(audioBoost * 100)}%
                    </span>
                  </button>

                  {showBoostMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                        Audio Boost
                      </div>
                      {[1.0, 1.5, 2.0, 3.0].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleBoostSelect(b)}
                          className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                            audioBoost === b
                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          {Math.round(b * 100)}% {b === 1.0 ? '(Normal)' : '(Boost)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu)
                      setShowSubMenu(false)
                      setShowBoostMenu(false)
                    }}
                    className="p-1.5 rounded hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-slate-300"
                    title="Playback Speed"
                  >
                    <Gauge className="w-4 h-4" />
                    <span className="text-[10px] font-mono hidden md:inline">
                      {playbackSpeed}x
                    </span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-40 text-xs animate-in fade-in slide-in-from-bottom-2">
                      <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                        Speed
                      </div>
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSpeedSelect(spd)}
                          className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                            playbackSpeed === spd
                              ? 'bg-amber-500/20 text-amber-300 font-bold'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle to native browser controls */}
                <button
                  type="button"
                  onClick={() => setUseNativeControls(true)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:block"
                  title="Switch to Native Player Controls"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {/* External Player */}
                <button
                  type="button"
                  onClick={() => onOpenExternalPlayer(streamingFile)}
                  className="p-1.5 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer hidden sm:block"
                  title="Play in External Player (VLC / IINA / MPV)"
                >
                  <Tv className="w-4 h-4" />
                </button>

                {/* PiP */}
                <button
                  type="button"
                  onClick={handlePip}
                  className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer hidden sm:block"
                  title="Picture in Picture"
                >
                  <PictureInPicture className="w-4 h-4" />
                </button>

                {/* Theater Mode */}
                <button
                  type="button"
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer hidden sm:block"
                  title="Toggle Theater Mode"
                >
                  <span className="text-xs font-mono font-bold">
                    {isTheaterMode ? '⇱' : '⇲'}
                  </span>
                </button>
              </div>

              {/* Fit Screen / Zoom Options (Contain / Cover / Stretch) - Visible on Mobile & Desktop */}
              <button
                type="button"
                onClick={cycleFitMode}
                className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer active:scale-95 touch-manipulation gap-1.5"
                title={`Screen Fit: ${fitMode === 'contain' ? 'Fit Screen' : fitMode === 'cover' ? 'Fill / Zoom (No Black Bars)' : 'Stretch'}`}
                aria-label="Screen Fit / Zoom"
              >
                <Scan className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                <span className="text-xs font-bold hidden sm:inline uppercase">
                  {fitMode === 'contain' ? 'Fit' : fitMode === 'cover' ? 'Zoom' : 'Stretch'}
                </span>
              </button>

              {/* Screen Rotate / Landscape Mode for Mobile */}
              <button
                type="button"
                onClick={toggleRotateScreen}
                className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 rounded-lg text-slate-300 hover:text-amber-400 transition-all cursor-pointer flex items-center justify-center active:scale-95 touch-manipulation p-2 sm:p-1.5"
                title="Rotate Screen / Big Screen Landscape"
                aria-label="Rotate screen"
              >
                <RotateCw className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Screen Lock */}
              <button
                type="button"
                onClick={toggleScreenLock}
                className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title="Lock screen controls"
                aria-label="Lock screen"
              >
                <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                aria-label="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                )}
              </button>

              {/* Mobile 3-Dots More Menu Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMoreMenu(!showMobileMoreMenu)
                  setShowSubMenu(false)
                  setShowSpeedMenu(false)
                  setShowBoostMenu(false)
                }}
                className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-2 sm:p-1.5 rounded-lg transition-colors cursor-pointer sm:hidden active:scale-95 touch-manipulation ${
                  showMobileMoreMenu ? 'text-amber-400 bg-slate-800' : 'text-slate-300 hover:text-white'
                }`}
                title="More playback options"
                aria-label="More options"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Mobile Bottom Sheet Menu */}
          {showMobileMoreMenu && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="sm:hidden mt-2 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 text-xs text-white space-y-3 animate-in fade-in slide-in-from-bottom-2 max-h-[75vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  Playback Controls &amp; Options
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer touch-manipulation active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Save Video Directly to Mobile Device */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreMenu(false)
                    if (streamingFile) {
                      downloader.saveTorrentFile(streamingFile)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-colors active:scale-95 touch-manipulation"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Save Video File to Device</span>
                </button>
              </div>

              {/* Subtitles */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subtitles ({activeSubtitle !== 'off' ? 'Active' : 'Off'})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleSubtitleSelect('off')
                      setShowMobileMoreMenu(false)
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer touch-manipulation active:scale-95 ${
                      activeSubtitle === 'off'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Off
                  </button>
                  {availableSubtitles.map((sub, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        handleSubtitleSelect(sub.path)
                        setShowMobileMoreMenu(false)
                      }}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs truncate max-w-[140px] font-medium cursor-pointer touch-manipulation active:scale-95 ${
                        activeSubtitle === sub.path
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      customSubInputRef.current?.click()
                      setShowMobileMoreMenu(false)
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-sky-400 font-medium cursor-pointer touch-manipulation active:scale-95"
                  >
                    + Upload .srt
                  </button>
                </div>
              </div>

              {/* Playback Speed */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Playback Speed ({playbackSpeed}x)</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        handleSpeedSelect(spd)
                        setShowMobileMoreMenu(false)
                      }}
                      className={`min-h-[36px] flex items-center justify-center rounded-lg text-xs text-center font-mono font-medium cursor-pointer touch-manipulation active:scale-95 ${
                        playbackSpeed === spd
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Boost */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audio Booster ({Math.round(audioBoost * 100)}%)</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1.0, 1.5, 2.0, 3.0].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        handleBoostSelect(b)
                        setShowMobileMoreMenu(false)
                      }}
                      className={`min-h-[36px] flex items-center justify-center rounded-lg text-xs text-center font-mono font-medium cursor-pointer touch-manipulation active:scale-95 ${
                        audioBoost === b
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {Math.round(b * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Lock Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreMenu(false)
                    toggleScreenLock()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold cursor-pointer transition-colors active:scale-95 touch-manipulation"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Lock Screen Controls</span>
                </button>
              </div>

              {/* Extra Mobile Actions: External Player & Native Player */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreMenu(false)
                    onOpenExternalPlayer(streamingFile)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold cursor-pointer touch-manipulation active:scale-95"
                >
                  <Tv className="w-4 h-4" />
                  <span>VLC / External</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMoreMenu(false)
                    setUseNativeControls(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer touch-manipulation active:scale-95"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Native Controls</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Switch back from native controls button */}
      {useNativeControls && (
        <button
          type="button"
          onClick={() => setUseNativeControls(false)}
          className="absolute top-3 right-3 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded text-xs font-semibold shadow-lg transition-colors cursor-pointer z-30"
        >
          Switch to Custom Controls
        </button>
      )}
    </div>
  )
}
