import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as storage from '../utils/storage.js'
import * as subtitles from '../utils/subtitles.js'
import * as audio from '../utils/audio.js'
import * as piecemap from '../utils/piecemap.js'
import { isPlayableMedia } from '../utils/format.js'
import { getClient, initServiceWorkerServer } from '../utils/webtorrentClient.js'

const WebTorrentContext = createContext(null)

export function WebTorrentProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [torrent, setTorrent] = useState(null)
  const [streamingFile, setStreamingFile] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [resumePrompt, setResumePrompt] = useState(null)

  const [stats, setStats] = useState({
    numPeers: 0,
    progress: 0,
    downloaded: 0,
    total: 0,
    timeRemaining: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    isDone: false,
  })

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const torrentRef = useRef(null)
  const streamingFileRef = useRef(null)
  const searchTimerRef = useRef(null)
  const statsIntervalRef = useRef(null)

  // Initialize WebTorrent Client & ServiceWorker once on mount
  useEffect(() => {
    initServiceWorkerServer().then((ready) => {
      setIsReady(ready)
    })
  }, [])

  // Comprehensive cleanup & cancel helper
  const cancelTorrent = useCallback((preserveHash = false) => {
    // 1. Clear timers
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current)
      searchTimerRef.current = null
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }

    // 2. Clear loading and search status immediately
    setLoadingStatus(null)

    // 3. Reset URL hash cleanly if not preserving
    if (!preserveHash && window.location.hash) {
      try {
        history.replaceState(null, '', window.location.pathname)
      } catch {}
    }

    // 4. Stop canvas animations & audio booster
    piecemap.stopPieceMapAnimation()
    audio.disconnectAudioBooster()

    // 5. Clean video element
    if (videoRef.current) {
      try {
        subtitles.cleanSubtitleTracks(videoRef.current)
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      } catch (e) {
        console.warn('Video reset warning:', e)
      }
    }

    // 6. Safely remove all torrents from client
    const client = getClient()
    if (client) {
      try {
        const activeTorrents = [...client.torrents]
        for (const t of activeTorrents) {
          try {
            client.remove(t, { destroyStore: true })
          } catch (e) {
            try {
              t.destroy({ destroyStore: true })
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Error removing client torrents:', e)
      }
    }

    torrentRef.current = null
    setTorrent(null)
    streamingFileRef.current = null
    setStreamingFile(null)
    setIsPaused(false)
    setResumePrompt(null)
    setStats({
      numPeers: 0,
      progress: 0,
      downloaded: 0,
      total: 0,
      timeRemaining: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      isDone: false,
    })
  }, [])

  // Play a specific file in the torrent
  const playFile = useCallback((file, resumeTime = 0) => {
    const currTorrent = torrentRef.current
    if (!currTorrent || !file) return

    streamingFileRef.current = file
    setStreamingFile(file)

    // Select file in swarm
    file.select()

    // Mark critical lookahead on start and end pieces
    if (file._startPiece !== undefined && file._endPiece !== undefined) {
      try {
        const initialLookahead = Math.min(file._endPiece, file._startPiece + 5)
        currTorrent.critical(file._startPiece, initialLookahead)

        // Prioritize end pieces for container metadata (MP4 moov atom)
        const endStart = Math.max(file._startPiece, file._endPiece - 2)
        currTorrent.critical(endStart, file._endPiece)
      } catch (e) {
        console.warn('[WebTorrent Engine] Could not mark critical pieces:', e)
      }
    }
  }, [])

  // Start downloading a torrent
  const downloadTorrent = useCallback(
    (rawTorrentId, options = {}) => {
      cancelTorrent(true)

      const client = getClient()
      if (!client) {
        setLoadingStatus({
          message: 'WebTorrent client is not ready. Please refresh the page.',
          isError: true,
        })
        return
      }

      // Enrich magnet URI / hex infohash with WebSocket trackers
      const torrentId = storage.enrichTorrentIdentifier(rawTorrentId)

      let elapsed = 0
      setLoadingStatus({
        message: 'Searching for WebRTC peers…',
        count: 0,
        isSearching: true,
        isError: false,
      })

      let newTorrent = null
      try {
        newTorrent = client.add(torrentId, (t) => {
          if (searchTimerRef.current) {
            clearInterval(searchTimerRef.current)
            searchTimerRef.current = null
          }
          setLoadingStatus(null)

          torrentRef.current = t
          setTorrent(t)

          // Update URL hash
          window.location.hash = t.infoHash

          // Save to history
          storage.saveHistoryItem({
            infoHash: t.infoHash,
            name: t.name,
            size: t.length,
          })

          // Find playable files (default to largest playable or largest overall)
          const mediaFiles = t.files.filter((f) => isPlayableMedia(f.name))
          let targetFile = null
          if (options.targetFileName) {
            targetFile = t.files.find((f) => f.name === options.targetFileName)
          }
          if (!targetFile && mediaFiles.length > 0) {
            targetFile = mediaFiles.reduce((a, b) =>
              b.length > a.length ? b : a
            )
          }
          if (!targetFile && t.files.length > 0) {
            targetFile = t.files.reduce((a, b) =>
              b.length > a.length ? b : a
            )
          }

          if (targetFile) {
            playFile(targetFile, options.resumeTime)
          }

          // Throttled stats refresh loop with value diffing to prevent unnecessary React re-renders
          let prevStats = {}
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
          statsIntervalRef.current = setInterval(() => {
            if (!t || t.destroyed) return

            const curPeers = t.numPeers
            const curProg = Math.round(t.progress * 10000) / 100
            const curDown = t.downloaded
            const curDSpeed = t.paused ? 0 : Math.round(t.downloadSpeed / 1024)
            const curUSpeed = t.paused ? 0 : Math.round(t.uploadSpeed / 1024)
            const curDone = t.done

            // Skip re-render if high-frequency stats haven't changed meaningfully
            if (
              prevStats.peers === curPeers &&
              prevStats.prog === curProg &&
              prevStats.dspeed === curDSpeed &&
              prevStats.uspeed === curUSpeed &&
              prevStats.done === curDone
            ) {
              return
            }

            prevStats = {
              peers: curPeers,
              prog: curProg,
              dspeed: curDSpeed,
              uspeed: curUSpeed,
              done: curDone,
            }

            setStats({
              numPeers: curPeers,
              progress: curProg,
              downloaded: curDown,
              total: t.length,
              timeRemaining: Math.round(t.timeRemaining / 1000),
              downloadSpeed: t.paused ? 0 : t.downloadSpeed,
              uploadSpeed: t.paused ? 0 : t.uploadSpeed,
              isDone: curDone,
            })
          }, 1000)

          t.on('done', () => {
            setStats((prev) => ({ ...prev, isDone: true }))
          })
        })

        newTorrent.on('error', (err) => {
          console.error('[WebTorrent Engine] Torrent error:', err)
          setLoadingStatus({
            message: `Torrent error: ${err.message}`,
            isError: true,
          })
        })

        searchTimerRef.current = setInterval(() => {
          elapsed++
          setLoadingStatus((prev) =>
            prev && prev.isSearching
              ? {
                  ...prev,
                  count: elapsed,
                  message:
                    elapsed >= 30
                      ? `No WebRTC peers found after ${elapsed}s. Ensure the torrent has active seeders supporting WebRTC.`
                      : 'Searching for WebRTC peers…',
                }
              : prev
          )

          if (newTorrent && (newTorrent.numPeers > 0 || newTorrent.done)) {
            if (searchTimerRef.current) {
              clearInterval(searchTimerRef.current)
              searchTimerRef.current = null
            }
          }
        }, 1000)
      } catch (err) {
        console.error('[WebTorrent Engine] client.add error:', err)
        setLoadingStatus({
          message: `Failed to load torrent: ${err.message}`,
          isError: true,
        })
      }
    },
    [cancelTorrent, playFile]
  )

  // Pause / Resume torrent download
  const togglePause = useCallback(() => {
    const currTorrent = torrentRef.current
    if (!currTorrent) return

    if (currTorrent._userPaused) {
      // Resume
      currTorrent._userPaused = false
      setIsPaused(false)

      if (streamingFileRef.current) {
        try {
          streamingFileRef.current.select()
          const video = videoRef.current
          if (video && video.duration && currTorrent.pieceLength) {
            const currentByte =
              streamingFileRef.current.offset +
              (video.currentTime / video.duration) *
                streamingFileRef.current.length
            const currentPiece = Math.floor(
              currentByte / currTorrent.pieceLength
            )
            const startPiece = Math.max(
              streamingFileRef.current._startPiece || 0,
              currentPiece
            )
            const endPiece = Math.min(
              streamingFileRef.current._endPiece ||
                currTorrent.pieces.length - 1,
              currentPiece + 15
            )
            currTorrent.select(startPiece, endPiece, 1)
          }
        } catch (e) {
          console.warn('[WebTorrent Engine] Error re-selecting on resume:', e)
        }
      } else if (currTorrent.pieces && currTorrent.pieces.length > 0) {
        try {
          currTorrent.select(0, currTorrent.pieces.length - 1, 0)
        } catch {}
      }

      if (canvasRef.current) {
        piecemap.startPieceMapAnimation(canvasRef.current, currTorrent)
      }

      if (videoRef.current && videoRef.current._wasPlayingBeforePause) {
        videoRef.current._wasPlayingBeforePause = false
        videoRef.current.play().catch(() => {})
      }
    } else {
      // Pause
      currTorrent._userPaused = true
      setIsPaused(true)

      if (currTorrent.pieces && currTorrent.pieces.length > 0) {
        try {
          currTorrent.deselect(0, currTorrent.pieces.length - 1, false)
          if (currTorrent.files) {
            currTorrent.files.forEach((f) => {
              try {
                f.deselect()
              } catch {}
            })
          }
        } catch (e) {
          console.warn('[WebTorrent Engine] Error deselecting on pause:', e)
        }
      }

      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current._wasPlayingBeforePause = true
        videoRef.current.pause()
      }

      piecemap.stopPieceMapAnimation()
    }
  }, [])

  // Listen to hash changes on load and navigation
  useEffect(() => {
    if (!isReady) return

    const handleHash = () => {
      const hash = decodeURIComponent(
        window.location.hash.substring(1)
      ).trim()
      if (hash && hash !== '') {
        if (
          torrentRef.current &&
          torrentRef.current.infoHash?.toLowerCase() === hash.toLowerCase()
        ) {
          return
        }
        downloadTorrent(hash)
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [isReady, downloadTorrent])

  return (
    <WebTorrentContext.Provider
      value={{
        isReady,
        torrent,
        streamingFile,
        loadingStatus,
        isPaused,
        isTheaterMode,
        setIsTheaterMode,
        resumePrompt,
        setResumePrompt,
        stats,
        videoRef,
        canvasRef,
        downloadTorrent,
        cancelTorrent,
        playFile,
        togglePause,
      }}
    >
      {children}
    </WebTorrentContext.Provider>
  )
}

export function useWebTorrent() {
  const ctx = useContext(WebTorrentContext)
  if (!ctx) throw new Error('useWebTorrent must be used within WebTorrentProvider')
  return ctx
}
