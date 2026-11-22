import React, { useState } from 'react'
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Zap,
  Volume2,
  Subtitles,
  ExternalLink,
  Cpu,
  Tv
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'Can I stream magnet links directly in my web browser without downloading the full file?',
    a: 'Yes! Torrent Player leverages WebTorrent and WebRTC data channels to begin sequential video playback immediately. As soon as the first few video pieces buffer in your browser memory, playback begins instantly—no need to wait for the entire torrent to finish downloading.'
  },
  {
    q: 'Do I need to install uTorrent, qBittorrent, or any browser extension?',
    a: 'No installation is required. Everything runs 100% inside your standard web browser (Chrome, Edge, Firefox, Brave, Safari, Opera). There are zero plugins, zero desktop software dependencies, and zero sign-ups needed.'
  },
  {
    q: 'What video formats and audio codecs are supported for browser playback?',
    a: 'Torrent Player supports modern browser-native video containers including MP4, WebM, and playable Matroska (MKV) with H.264, VP8, VP9, or AV1 video codecs and AAC/Opus/Vorbis audio. For files requiring legacy codecs (such as AC3 audio or HEVC in certain browsers), you can use the built-in "Launch External Player" feature to stream instantly into VLC, IINA, MPV, or PotPlayer.'
  },
  {
    q: 'Why do some torrents show 0 peers or take time to find peers in the browser?',
    a: 'Browser-based torrenting communicates using WebRTC protocol rather than traditional TCP/UDP sockets used by desktop clients. To stream in a browser, the swarm needs peers that support WebRTC (such as WebTorrent Desktop, Brave Browser, or clients connected to WebRTC trackers). We include high-availability public WebSocket trackers by default to maximize peer discovery.'
  },
  {
    q: 'Is my streaming activity private? Does Torrent Player store my data?',
    a: 'Torrent Player is 100% decentralized and client-side. No media files, stream data, or personal information pass through any central server. Your watch history, resume positions, and custom tracker preferences are saved strictly in your own browser localStorage and can be deleted at any time with one click.'
  },
  {
    q: 'How does the 300% Audio Booster and Subtitles feature work?',
    a: 'Quiet video files can be amplified up to 300% using our built-in Web Audio API gain node without audio distortion. You can also drag-and-drop any external .srt or .vtt subtitle file directly into the video window, and our on-the-fly subtitle parser syncs them automatically.'
  }
]

export function SeoContentSection() {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index))
  }

  return (
    <section
      aria-labelledby="seo-guide-title"
      className="max-w-3xl mx-auto px-4 mt-8 mb-6 text-slate-800 dark:text-slate-200"
    >
      {/* Informational SEO Overview Card */}
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl p-5 sm:p-6 shadow-sm dark:shadow-lg space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Zap className="w-3 h-3" />
            <span>Decentralized Streaming</span>
          </div>
          <h2
            id="seo-guide-title"
            className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            In-Browser Torrent &amp; Magnet Link Video Player
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Stream movies, open-source media, and video content directly in your web browser. 
            Enjoy seamless peer-to-peer playback with WebRTC technology, intelligent sliding lookahead buffering, 
            built-in volume booster, and zero local disk clutter.
          </p>
        </div>

        {/* Feature Grid for Keyword Density & User Benefit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Instant WebRTC Playback
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              Sequential piece fetching begins playback in seconds without waiting for 100% download.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Zero Server Storage
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              100% client-side privacy. No files or personal IP logs are saved to any remote server.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Tv className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              External Player Hand-off
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
              One-click stream transfer to desktop players like VLC, IINA, MPV, or PotPlayer.
            </p>
          </div>
        </div>

        {/* 3-Step Quick Guide */}
        <div className="border-t border-slate-200 dark:border-[#232b3e] pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            How to Stream Magnet Links in 3 Steps
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121d]/60 border border-slate-200/80 dark:border-[#1f273b]/80">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Copy link or file:</strong> Get your magnet URI, 40-char info hash, or .torrent file.
              </p>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121d]/60 border border-slate-200/80 dark:border-[#1f273b]/80">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Paste or drop:</strong> Enter it into the search bar or drag &amp; drop onto the page.
              </p>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121d]/60 border border-slate-200/80 dark:border-[#1f273b]/80">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Instant playback:</strong> Watch immediately with audio boost and subtitle controls.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Accordion (Boosts Google Rich Snippets) */}
        <div className="border-t border-slate-200 dark:border-[#232b3e] pt-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-[#1f273b] bg-slate-50/50 dark:bg-[#0e121d]/50 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-amber-500' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-[#1f273b]/50 mt-1">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
