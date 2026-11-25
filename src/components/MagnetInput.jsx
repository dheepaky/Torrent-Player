import React, { useState, useEffect, useRef } from 'react'
import { useWebTorrent } from '../context/WebTorrentContext'
import {
  Play,
  Loader2,
  Magnet,
  X,
  FileUp,
  HardDrive,
  ShieldCheck,
  Infinity,
  Zap,
} from 'lucide-react'

export function MagnetInput() {
  const { downloadTorrent, loadingStatus, cancelTorrent, torrent, isReady } =
    useWebTorrent()
  const [inputVal, setInputVal] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (window.location.hash && !inputVal) {
      setInputVal(decodeURIComponent(window.location.hash.substring(1)).trim())
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputVal.trim()
    if (!trimmed) return
    downloadTorrent(trimmed)
  }

  const handleCancel = () => {
    cancelTorrent()
    setInputVal('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    downloadTorrent(file)
    e.target.value = ''
  }

  const sampleUrl = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel'

  // If a torrent is active, we hide the main input bar
  if (torrent) return null

  return (
    <div className="max-w-4xl mx-auto px-4 mt-2 sm:mt-4">
      {/* Feature Badges Strip */}
      <div className="pt-4 sm:pt-8 pb-4 sm:pb-6 text-center select-none">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
            <HardDrive className="w-3.5 h-3.5 text-amber-500" />
            <span>Zero Storage Needed</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>No Subscription</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
            <Infinity className="w-3.5 h-3.5 text-sky-500" />
            <span>Unlimited Streaming</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-purple-500" />
            <span>100% Free &amp; Private</span>
          </span>
        </div>
      </div>

      {/* Hidden file input for importing .torrent files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".torrent,application/x-bittorrent"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Input Deck Container */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 shadow-md dark:shadow-2xl transition-all focus-within:border-amber-500/80 focus-within:ring-4 focus-within:ring-amber-500/10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Magnet className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />
            </div>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                isReady
                  ? 'Paste magnet URI, info hash, or torrent link…'
                  : 'Starting WebTorrent engine…'
              }
              disabled={!isReady}
              autoComplete="off"
              className="w-full pl-12 sm:pl-14 pr-20 sm:pr-24 py-3.5 sm:py-4.5 bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1e2538] rounded-xl sm:rounded-2xl text-slate-950 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-amber-500 text-base sm:text-lg font-medium shadow-inner transition-colors disabled:opacity-50 min-h-[52px] sm:min-h-[58px]"
            />

            <div className="absolute right-2.5 flex items-center gap-1.5 shrink-0 z-10">
              {!inputVal && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard?.readText) {
                        const text = await navigator.clipboard.readText()
                        if (text) setInputVal(text.trim())
                      }
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer touch-manipulation active:scale-95"
                  title="Paste magnet link from clipboard"
                >
                  Paste
                </button>
              )}

              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal('')}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1d2436] transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons: 2 columns on mobile, inline on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Import .torrent Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isReady}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2130] dark:hover:bg-[#222b40] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-xl sm:rounded-2xl font-bold transition-all text-xs sm:text-sm cursor-pointer shrink-0 active:scale-95 disabled:opacity-40 min-h-[52px] sm:min-h-[58px]"
              title="Upload a .torrent file from your computer or phone"
            >
              <FileUp className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
              <span>Import file</span>
            </button>

            {/* Submit / Play Stream Button */}
            <button
              type="submit"
              disabled={!isReady || !inputVal.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl sm:rounded-2xl transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_14px_rgba(245,158,11,0.28)] min-h-[52px] sm:min-h-[58px] shrink-0 active:scale-95"
            >
              <Play className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
              <span>Play stream</span>
            </button>
          </div>
        </form>

        {/* Quick-Help Chips Underneath */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3 pb-1 text-xs text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => downloadTorrent(sampleUrl)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1a2130] hover:bg-amber-50 dark:hover:bg-amber-500/15 text-slate-800 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 border border-slate-200 dark:border-[#273248] transition-colors cursor-pointer font-semibold text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Try sample (sintel)</span>
          </button>

          <span className="hidden sm:inline text-xs font-medium">
            Drag &amp; drop .torrent anywhere
          </span>
        </div>
      </div>

      {/* Peer Searching & Resolution Status */}
      {loadingStatus && (
        <div className="mt-4 space-y-2">
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm dark:shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
              loadingStatus.isError
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-white dark:bg-[#131722] border-slate-200 dark:border-amber-500/30 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {loadingStatus.isSearching && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Loader2 className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {loadingStatus.isSearching ? 'Finding swarm peers' : 'Stream status'}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-snug">
                  {loadingStatus.message}
                  {loadingStatus.isSearching && loadingStatus.count !== undefined && (
                    <span className="text-amber-500 dark:text-amber-400 font-mono ml-1.5 font-bold">
                      ({loadingStatus.count}s)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="self-end sm:self-auto px-3.5 py-1.5 bg-slate-100 dark:bg-[#1c2333] hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-500/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#29354d] rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 active:scale-95"
            >
              Cancel search
            </button>
          </div>

          {/* Helpful tip if browser mode takes a while */}
          {loadingStatus.isSearching && loadingStatus.count > 12 && !loadingStatus.isBackend && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 animate-in fade-in">
              <span className="text-amber-500 font-bold shrink-0">💡 Tip:</span>
              <p>
                Regular torrents use standard TCP/UDP peers. Use the <strong>Torrent Player Desktop App</strong> or connect to the local Wi-Fi streaming engine to stream any movie instantly!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
