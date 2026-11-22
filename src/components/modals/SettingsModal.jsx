import React, { useState, useEffect } from 'react'
import * as storage from '../../utils/storage'
import { formatBytes } from '../../utils/format'
import { Settings, X, HardDrive, Trash2, Check } from 'lucide-react'

export function SettingsModal({ isOpen, onClose }) {
  const [trackersText, setTrackersText] = useState('')
  const [maxConns, setMaxConns] = useState(55)
  const [storageEstimate, setStorageEstimate] = useState({ usage: 0, quota: 0 })
  const [statusMsg, setStatusMsg] = useState('')
  const [isClearingAll, setIsClearingAll] = useState(false)

  const loadSettings = async () => {
    const s = storage.loadSettings()
    setTrackersText(s.trackers.join('\n'))
    setMaxConns(s.maxConns || 55)

    const est = await storage.getStorageEstimate()
    setStorageEstimate(est)
  }

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    const current = storage.loadSettings()
    const rawTrackers = trackersText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.startsWith('wss://') || t.startsWith('ws://'))

    storage.saveSettings({
      ...current,
      trackers:
        rawTrackers.length > 0 ? rawTrackers : storage.DEFAULT_TRACKERS,
      maxConns: parseInt(maxConns, 10) || 55,
    })

    onClose()
  }

  const handleReset = () => {
    if (window.confirm('Reset settings to default?')) {
      storage.resetSettings()
      loadSettings()
    }
  }

  const handleClearLocalStorage = () => {
    if (
      window.confirm(
        'Clear localStorage (watch history and saved tracker settings)?'
      )
    ) {
      storage.clearLocalStorage()
      loadSettings()
      setStatusMsg('LocalStorage cleared successfully!')
      setTimeout(() => setStatusMsg(''), 3000)
    }
  }

  const handleClearAllStorage = async () => {
    if (
      window.confirm(
        'Wipe all stored data including OPFS torrent chunks, watch history, and cached data?'
      )
    ) {
      setIsClearingAll(true)
      await storage.clearAllStorage()
      loadSettings()
      setIsClearingAll(false)
      setStatusMsg('All local storage, OPFS chunks, and cache cleared!')
      setTimeout(() => setStatusMsg(''), 4000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Settings &amp; Storage
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* WebSocket Trackers */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              WebSocket trackers (wss://, one per line):
            </label>
            <textarea
              rows={4}
              value={trackersText}
              onChange={(e) => setTrackersText(e.target.value)}
              spellCheck="false"
              className="w-full bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1e2538] rounded-xl p-3 font-mono text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Browser WebRTC clients connect directly to WebSocket trackers to discover peers.
            </p>
          </div>

          {/* Max Connections */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Maximum peer connections:
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={maxConns}
              onChange={(e) => setMaxConns(e.target.value)}
              className="w-32 bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1e2538] rounded-xl p-2.5 font-mono text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <hr className="border-slate-200 dark:border-[#232b3e]" />

          {/* Storage Management */}
          <div className="bg-slate-50 dark:bg-[#0b0e17] p-4 rounded-xl border border-slate-200 dark:border-[#1e2538] space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <HardDrive className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h4>Local device storage</h4>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              Magnet Player saves watch history, resume positions, custom settings, and browser stream cache locally on this device.
            </p>

            <div className="flex items-center justify-between text-xs py-2 border-y border-slate-200 dark:border-[#1e2538]">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Storage in use:</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                {storageEstimate.usage > 0
                  ? `${formatBytes(storageEstimate.usage)} (of ${formatBytes(
                      storageEstimate.quota
                    )} quota)`
                  : '< 1 MB'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearLocalStorage}
                className="px-3 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2a364f] rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95"
              >
                Clear history &amp; settings
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleClearAllStorage}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isClearingAll ? 'Clearing...' : 'Wipe all cache'}</span>
              </button>
            </div>

            {statusMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{statusMsg}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-white dark:bg-[#1a2030] hover:bg-slate-100 dark:hover:bg-[#222b40] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2a364f] rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95"
          >
            Reset defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md active:scale-95"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
