import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
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

  // Backend Engine connection info
  const [backendInfo, setBackendInfo] = useState({
    isConnected: false,
    checked: false,
    baseUrl: '',
    localIps: [],
    port: 4000,
  })

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
  const backendInfoRef = useRef(backendInfo)

  backendInfoRef.current = backendInfo

  // Auto-detect Local Node.js Backend or fallback to Browser WebTorrent
  const detectBackend = useCallback(async () => {
    // 1. Try relative /api/health (proxied by Vite or direct origin)
    try {
      const res = await fetch('/api/health', {
        signal: AbortSignal.timeout(1500),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'ok') {
          const info = {
            isConnected: true,
            checked: true,
            baseUrl: '',
            localIps: data.localIps || [],
            port: data.port || 4000,
          }
          setBackendInfo(info)
          setIsReady(true)
          return true
        }
      }
    } catch {}

    // 2. Try direct http://localhost:4000/api/health (CORS enabled)
    try {
      const res = await fetch('http://localhost:4000/api/health', {
        signal: AbortSignal.timeout(1500),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'ok') {
          const info = {
            isConnected: true,
            checked: true,
            baseUrl: 'http://localhost:4000',
            localIps: data.localIps || [],
            port: data.port || 4000,
          }
          setBackendInfo(info)
          setIsReady(true)
          return true
        }
      }
    } catch {}

    // 3. Fallback to Browser WebTorrent (WebRTC mode)
    setBackendInfo({
      isConnected: false,
      checked: true,
      baseUrl: '',
      localIps: [],
      port: 4000,
    })
    const swReady = await initServiceWorkerServer()
    setIsReady(swReady)
    return false
  }, [])

  useEffect(() => {
    detectBackend()
  }, [detectBackend])

  // Comprehensive cleanup & cancel helper
  const cancelTorrent = useCallback(
    (preserveHash = false) => {
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

      // 6. If Backend Engine was streaming, inform server to cancel & release cache
      const curr = torrentRef.current
      const backend = backendInfoRef.current
      if (curr?.isBackend && backend?.isConnected) {
        try {
          fetch(`${backend.baseUrl}/api/torrent/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ infoHash: curr.infoHash }),
          }).catch(() => {})
        } catch {}
      }

      // 7. Safely remove client torrents if browser mode
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
    },
    []
  )

  // Play a specific file in the torrent
  const playFile = useCallback((file, resumeTime = 0) => {
    const currTorrent = torrentRef.current
    if (!currTorrent || !file) return

    streamingFileRef.current = file
    setStreamingFile(file)

    if (typeof file.select === 'function') {
      file.select()
    }

    // Critical lookahead for browser WebTorrent
    if (file._startPiece !== undefined && file._endPiece !== undefined && currTorrent.critical) {
      try {
        const initialLookahead = Math.min(file._endPiece, file._startPiece + 5)
        currTorrent.critical(file._startPiece, initialLookahead)

        const endStart = Math.max(file._startPiece, file._endPiece - 2)
        currTorrent.critical(endStart, file._endPiece)
      } catch (e) {
        console.warn('[WebTorrent Engine] Could not mark critical pieces:', e)
      }
    }
  }, [])

  // Start downloading a torrent (supports both Backend TCP/UDP and Browser WebRTC)
  const downloadTorrent = useCallback(
    async (rawTorrentId, options = {}) => {
      cancelTorrent(true)

      const backend = backendInfoRef.current
      let torrentStr = ''
      if (typeof rawTorrentId === 'string') {
        torrentStr = rawTorrentId.trim()
      } else if (rawTorrentId?.name) {
        torrentStr = rawTorrentId
      }

      // -------------------------------------------------------------
      // PATH A: NODE.JS BACKEND (Full TCP/UDP/DHT BitTorrent Swarms)
      // -------------------------------------------------------------
      if (backend?.isConnected) {
        let elapsed = 0
        setLoadingStatus({
          message: 'Connecting to BitTorrent peers & buffering stream…',
          count: 0,
          isSearching: true,
          isError: false,
          isBackend: true,
        })

        searchTimerRef.current = setInterval(() => {
          elapsed++
          setLoadingStatus((prev) =>
            prev && prev.isSearching
              ? {
                  ...prev,
                  count: elapsed,
                  message:
                    elapsed >= 35
                      ? `Still discovering peers (${elapsed}s). Connecting to swarm trackers…`
                      : 'Connecting to BitTorrent peers & buffering stream…',
                }
              : prev
          )
        }, 1000)

        try {
          const res = await fetch(`${backend.baseUrl}/api/torrent/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ torrentId: torrentStr }),
          })

          if (searchTimerRef.current) {
            clearInterval(searchTimerRef.current)
            searchTimerRef.current = null
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.error || `Server responded with ${res.status}`)
          }

          const data = await res.json()
          if (!data.success || !data.torrent) {
            throw new Error('Failed to resolve torrent metadata')
          }

          setLoadingStatus(null)

          const rawT = data.torrent
          const files = (rawT.files || []).map((f) => ({
            ...f,
            streamURL: `${backend.baseUrl}${f.streamURL}`,
            select: () => {},
            deselect: () => {},
          }))

          // Synthetic torrent object conforming to player needs
          const syntheticTorrent = {
            infoHash: rawT.infoHash,
            name: rawT.name,
            length: rawT.length,
            numPeers: rawT.numPeers || 0,
            isBackend: true,
            files,
            pieces: [],
            bitfield: {
              get: () => false,
            },
          }

          torrentRef.current = syntheticTorrent
          setTorrent(syntheticTorrent)

          window.location.hash = syntheticTorrent.infoHash

          storage.saveHistoryItem({
            infoHash: syntheticTorrent.infoHash,
            name: syntheticTorrent.name,
            size: syntheticTorrent.length,
          })

          // Find playable files
          const mediaFiles = files.filter((f) => isPlayableMedia(f.name))
          let targetFile = null
          if (options.targetFileName) {
            targetFile = files.find((f) => f.name === options.targetFileName)
          }
          if (!targetFile && mediaFiles.length > 0) {
            targetFile = mediaFiles.reduce((a, b) =>
              b.length > a.length ? b : a
            )
          }
          if (!targetFile && files.length > 0) {
            targetFile = files.reduce((a, b) => (b.length > a.length ? b : a))
          }

          if (targetFile) {
            playFile(targetFile, options.resumeTime)
          }

          // Polling stats from Node.js backend
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
          statsIntervalRef.current = setInterval(async () => {
            try {
              const statsRes = await fetch(
                `${backend.baseUrl}/api/torrent/stats?infoHash=${syntheticTorrent.infoHash}`
              )
              if (!statsRes.ok) return
              const s = await statsRes.json()

              syntheticTorrent.numPeers = s.numPeers
              syntheticTorrent.progress = s.progress
              syntheticTorrent.length = s.total

              // Update pieces for PieceMapCanvas if provided
              if (s.pieces && s.pieces.length > 0) {
                syntheticTorrent.pieces = s.pieces.map((val) => ({
                  length: 1,
                  missing: val === 2 ? 0 : val === 1 ? 0.5 : 1,
                }))
                syntheticTorrent.bitfield = {
                  get: (i) => s.pieces[i] === 2,
                }
              }

              setStats({
                numPeers: s.numPeers,
                progress: Math.round(s.progress * 10000) / 100,
                downloaded: s.downloaded,
                total: s.total,
                timeRemaining: Math.round((s.timeRemaining || 0) / 1000),
                downloadSpeed: s.isPaused ? 0 : s.downloadSpeed,
                uploadSpeed: s.isPaused ? 0 : s.uploadSpeed,
                isDone: s.isDone,
              })
              setIsPaused(s.isPaused)
            } catch {}
          }, 1000)

          return
        } catch (err) {
          if (searchTimerRef.current) {
            clearInterval(searchTimerRef.current)
            searchTimerRef.current = null
          }
          console.error('[Backend Engine] Add error:', err)
          setLoadingStatus({
            message: `Backend stream error: ${err.message}`,
            isError: true,
          })
          return
        }
      }

      // -------------------------------------------------------------
      // PATH B: BROWSER WEBTORRENT (Fallback WebRTC Mode)
      // -------------------------------------------------------------
      const client = getClient()
      if (!client) {
        setLoadingStatus({
          message: 'WebTorrent engine is initializing. Please wait a moment.',
          isError: true,
        })
        return
      }

      const torrentId = storage.enrichTorrentIdentifier(torrentStr)

      let elapsed = 0
      setLoadingStatus({
        message: 'Searching for WebRTC peers (Browser Mode)…',
        count: 0,
        isSearching: true,
        isError: false,
        isBackend: false,
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

          window.location.hash = t.infoHash

          storage.saveHistoryItem({
            infoHash: t.infoHash,
            name: t.name,
            size: t.length,
          })

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
            targetFile = t.files.reduce((a, b) => (b.length > a.length ? b : a))
          }

          if (targetFile) {
            playFile(targetFile, options.resumeTime)
          }

          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
          statsIntervalRef.current = setInterval(() => {
            if (!t || t.destroyed) return

            setStats({
              numPeers: t.numPeers,
              progress: Math.round(t.progress * 10000) / 100,
              downloaded: t.downloaded,
              total: t.length,
              timeRemaining: Math.round(t.timeRemaining / 1000),
              downloadSpeed: t.paused ? 0 : t.downloadSpeed,
              uploadSpeed: t.paused ? 0 : t.uploadSpeed,
              isDone: t.done,
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
                      ? `No WebRTC peers found after ${elapsed}s. Regular torrents require running the local streaming server on port 4000 ('npm run server'). See tips below!`
                      : 'Searching for WebRTC peers (Browser Mode)…',
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
  const togglePause = useCallback(async () => {
    const currTorrent = torrentRef.current
    if (!currTorrent) return

    const backend = backendInfoRef.current
    if (currTorrent.isBackend && backend?.isConnected) {
      const nextPaused = !isPaused
      setIsPaused(nextPaused)
      try {
        await fetch(
          `${backend.baseUrl}/api/torrent/${nextPaused ? 'pause' : 'resume'}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ infoHash: currTorrent.infoHash }),
          }
        )
      } catch {}
      return
    }

    // Browser WebTorrent pause logic
    if (currTorrent._userPaused) {
      currTorrent._userPaused = false
      setIsPaused(false)
      if (streamingFileRef.current?.select) {
        streamingFileRef.current.select()
      }
      if (canvasRef.current) {
        piecemap.startPieceMapAnimation(canvasRef.current, currTorrent)
      }
      if (videoRef.current && videoRef.current._wasPlayingBeforePause) {
        videoRef.current._wasPlayingBeforePause = false
        videoRef.current.play().catch(() => {})
      }
    } else {
      currTorrent._userPaused = true
      setIsPaused(true)
      if (currTorrent.deselect) {
        currTorrent.deselect(0, currTorrent.pieces.length - 1, false)
      }
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current._wasPlayingBeforePause = true
        videoRef.current.pause()
      }
      piecemap.stopPieceMapAnimation()
    }
  }, [isPaused])

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
        backendInfo,
        detectBackend,
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
