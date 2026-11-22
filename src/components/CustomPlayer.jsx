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
} from 'lucide-react'
import { useWebTorrent } from '../context/WebTorrentContext'
import * as audio from '../utils/audio'
import * as subtitles from '../utils/subtitles'
import * as storage from '../utils/storage'
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
    video.className =
      'w-full h-full max-h-[74vh] object-contain cursor-pointer'

    container.appendChild(video)
    videoRef.current = video

    // Stream the torrent file through the ServiceWorker
    try {
      streamingFile.streamTo(video)
    } catch (err) {
      try {
        if (streamingFile.streamURL) {
          video.src = streamingFile.streamURL
        }
      } catch (e2) {
        console.error('[CustomPlayer] Stream setup error:', e2)
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
      if (!video.paused) {
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

    // Click on video toggles Play
    video.onclick = () => {
      if (!useNativeControls) {
        if (video.paused) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    }

    // Double-click on video toggles Fullscreen
    video.ondblclick = () => {
      if (!useNativeControls) {
        toggleFullscreen()
      }
    }

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
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Auto-hide controls when playing (throttled)
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false)
        setShowSubMenu(false)
        setShowSpeedMenu(false)
        setShowBoostMenu(false)
      }, 2500)
    }
  }, [isPlaying])

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setControlsVisible(false)
      setShowSubMenu(false)
      setShowSpeedMenu(false)
      setShowBoostMenu(false)
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

    const video = videoRef.current
    if (!video) return

    preventClickToggleRef.current = false
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
    }

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
      }, 220)
    }
  }

  const handlePointerUp = (e) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
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
      }, 150)
      return
    }

    // If not holding and not prevented, single click toggles play/pause
    if (!preventClickToggleRef.current) {
      if (
        e.target.closest(
          'button, input, select, textarea, [role="menu"], .player-controls-container'
        )
      ) {
        return
      }
      togglePlay()
    }
  }

  const handlePointerCancel = () => {
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
      setTimeout(() => {
        preventClickToggleRef.current = false
      }, 150)
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

  // Fullscreen
  const toggleFullscreen = async () => {
    const container = playerContainerRef.current
    if (!container) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch (e) {
      console.warn('Fullscreen error:', e)
    }
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
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={(e) => {
        if (
          !e.target.closest(
            'button, input, select, textarea, [role="menu"], .player-controls-container'
          )
        ) {
          toggleFullscreen()
        }
      }}
      className={`relative bg-black select-none group overflow-hidden ${
        isFullscreen ? 'w-screen h-screen' : 'w-full min-h-[320px] max-h-[74vh]'
      } flex items-center justify-center`}
    >
      {/* Container where the pristine fresh video element is mounted */}
      <div
        id="output"
        ref={outputContainerRef}
        className="w-full h-full flex items-center justify-center"
      />

      {/* Hold for 2x Speed Active Floating Badge */}
      {isHolding2x && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-black/85 backdrop-blur-md border border-amber-500/60 rounded-full text-white text-xs font-bold tracking-wider flex items-center gap-2 shadow-[0_4px_24px_rgba(245,158,11,0.35)] animate-pulse pointer-events-none select-none">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
          <span className="font-mono text-amber-400 font-extrabold tracking-wide">2X SPEED</span>
          <span className="text-[10px] text-slate-300 font-sans font-normal opacity-80 uppercase tracking-widest hidden sm:inline">Release to resume</span>
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

      {/* Center Big Play Button (Whenever Paused) */}
      {!useNativeControls && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px] z-10 pointer-events-none">
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
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
      {!useNativeControls && (
        <div
          className={`absolute bottom-0 inset-x-0 player-controls-container bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 sm:px-4 pt-8 pb-3 transition-opacity duration-300 z-20 ${
            controlsVisible || !isPlaying
              ? 'opacity-100'
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
              className="relative z-10 w-full h-4 opacity-0 group-hover/timeline:opacity-100 cursor-pointer"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            {/* Left Controls: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 hover:text-amber-400 transition-colors cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              {/* Skip -10s */}
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Skip +10s */}
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="p-1 hover:text-amber-400 transition-colors cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-1 sm:gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 sm:p-1 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
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
                className="font-mono text-[10px] sm:text-xs text-slate-300 ml-0.5 sm:ml-1 whitespace-nowrap"
              >
                00:00 / 00:00
              </div>
            </div>

            {/* Right Controls: Subtitles, Boost, Speed, Native Toggle, External, PiP, Theater, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-2 relative">
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
                  <span className="text-[10px] hidden sm:inline uppercase font-bold">
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
                  <span className="text-[10px] hidden sm:inline font-mono">
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
                  <span className="text-[10px] font-mono hidden sm:inline">
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

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
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
