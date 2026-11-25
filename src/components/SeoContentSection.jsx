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
  Tv,
  HardDrive,
  Infinity,
  Check,
  X,
  Smartphone,
  Laptop,
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'Can I stream magnet links directly in my web browser with zero storage needed?',
    a: 'Yes! Torrent Player is a high-performance BitTorrent & Magnet Streamer that buffers video chunks directly into RAM memory. As soon as the first few video pieces buffer, playback starts immediately—zero storage is consumed on your hard drive or phone, and no full file download is required.'
  },
  {
    q: 'How does Torrent Player compare to Seedr, Webtor, or desktop BitTorrent clients?',
    a: 'Unlike Seedr which caps free accounts at 2GB and charges monthly fees, Torrent Player provides 100% Free Unlimited Streaming with No Subscription. Unlike desktop clients (uTorrent, qBittorrent), it uses Zero Storage Needed by streaming in-memory WebRTC pieces without downloading gigabytes of files to your hard drive or phone.'
  },
  {
    q: 'Can I stream torrents and magnet links on iPhone, iPad, or Android without installing an app?',
    a: 'Yes! Because Torrent Player runs 100% inside web browsers (Safari on iOS, Chrome on Android) via WebRTC, mobile users can stream video directly without needing jailbreaks or App Store torrent apps. Features include one-click landscape rotation, fit/zoom screen options, and 300% volume boost.'
  },
  {
    q: 'Is there any subscription fee, account, or credit card required?',
    a: 'No Subscription is ever needed. Torrent Player provides Unlimited Streaming and is 100% Free & Private. There are zero monthly fees, zero subscriptions, zero registrations, and zero user telemetry.'
  },
  {
    q: 'Is streaming unlimited? Are there any bandwidth or video length limits?',
    a: 'Unlimited Streaming is supported for all playable magnet links, infohashes, and .torrent files. You can stream full-length movies, documentaries, web shows, and music videos without any artificial bandwidth limits or throttling.'
  },
  {
    q: 'Do I need to install uTorrent, qBittorrent, or any browser extension?',
    a: 'No installation is required. Everything runs 100% inside your standard web browser (Chrome, Edge, Firefox, Brave, Safari, Opera, Android Chrome, iOS Safari). There are zero plugins and zero desktop dependencies needed.'
  },
  {
    q: 'What video formats and audio codecs are supported for browser playback?',
    a: 'Torrent Player supports modern browser-native video containers including MP4, WebM, and playable Matroska (MKV) with H.264, VP8, VP9, or AV1 video codecs and AAC/Opus/Vorbis audio. For files requiring legacy codecs, you can use the built-in "Launch External Player" button to stream instantly into VLC, IINA, MPV, or PotPlayer.'
  },
  {
    q: 'Is my streaming activity private? Does Torrent Player log my IP or data?',
    a: '100% Free & Private. Torrent Player is completely decentralized and client-side. No media files, stream data, or personal information pass through any remote server. Your watch history and resume timestamps are saved strictly on your own device.'
  },
  {
    q: 'How does the 300% Audio Booster, Subtitles, and Zoom Fit Screen feature work?',
    a: 'Quiet video files can be amplified up to 300% using our built-in Web Audio API gain node. You can also drag-and-drop any external .srt or .vtt subtitle file directly into the video window, rotate to landscape, or cycle between Fit to Screen, Zoom (no black bars), and Stretch.'
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold tracking-wide uppercase mb-2.5">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Instant, Serverless Peer-to-Peer Video Streaming</span>
          </div>
          <h2
            id="seo-guide-title"
            className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Instant, Serverless Video Streaming
          </h2>
          <p className="mt-2.5 text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Experience next-generation serverless peer-to-peer video streaming directly in your web browser. 
            Enjoy seamless playback with WebRTC technology, intelligent sliding lookahead piece buffering, 
            built-in 300% volume booster, on-the-fly subtitles, and cross-platform support across Web, Android, Linux, Windows, and macOS.
          </p>
        </div>

        {/* Feature Grid for Keyword Density & User Benefit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <HardDrive className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Zero Storage Needed
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-normal">
              100% in-memory RAM streaming. No bulky video files saved to your disk or phone storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              No Subscription
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-normal">
              Zero monthly plans, zero paywalls, zero sign-ups, and zero credit card requirements.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Infinity className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Unlimited Streaming
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-normal">
              Stream as many movies, videos, and media files as you want with no bandwidth caps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              100% Free &amp; Private
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-normal">
              Decentralized peer-to-peer WebRTC streaming with zero server logging and zero tracking.
            </p>
          </div>
        </div>

        {/* Competitor Comparison Table for SEO Ranking */}
        <div className="border-t border-slate-200 dark:border-[#232b3e] pt-5">
          <div className="mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
              Feature Comparison
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Torrent Player vs. Competitors (Seedr, Webtor, uTorrent)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#232b3e] text-[11px] text-slate-400 uppercase">
                  <th className="py-2 pr-3 font-semibold">Features</th>
                  <th className="py-2 px-3 font-bold text-amber-500 dark:text-amber-400">Torrent Player</th>
                  <th className="py-2 px-3 font-semibold">Seedr.cc</th>
                  <th className="py-2 px-3 font-semibold">uTorrent / qBittorrent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f273b] text-slate-700 dark:text-slate-300 text-[11px]">
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Cost &amp; Subscription</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    100% Free (No Subscription)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">Paid ($6.95–$19.99/mo)</td>
                  <td className="py-2.5 px-3 text-slate-500">Free with Ads / Pro Upsell</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Device Storage Used</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    Zero Storage Needed (RAM Stream)
                  </td>
                  <td className="py-2.5 px-3 text-rose-500">2GB Free Cap Only</td>
                  <td className="py-2.5 px-3 text-rose-500">Heavy Disk Space (10–50GB)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Mobile Phone (iPhone &amp; Android)</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    Full Browser Support (Safari &amp; Chrome)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">Web only</td>
                  <td className="py-2.5 px-3 text-rose-500">Blocked on iOS App Store</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Software Installation</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    Zero Downloads / Pure Web
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">Web Dashboard</td>
                  <td className="py-2.5 px-3 text-rose-500">Desktop Software Required</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Privacy &amp; Registration</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    No Sign-Up / 100% Private
                  </td>
                  <td className="py-2.5 px-3 text-rose-500">Account &amp; Email Required</td>
                  <td className="py-2.5 px-3 text-slate-500">Direct IP Exposure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Highlights */}
        <div className="border-t border-slate-200 dark:border-[#232b3e] pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>iPhone &amp; Android Magnet Streamer</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Stream video torrents on your mobile phone without jailbreaking or downloading third-party apps from the App Store. Features touch-friendly 2X hold speed, landscape rotation, and fit/zoom screen.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121d] border border-slate-200 dark:border-[#1f273b] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <Laptop className="w-3.5 h-3.5 text-sky-500" />
              <span>Free Seedr Alternative for Chromebook &amp; PC</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Stream unlimited magnet links on Chromebooks, macOS, Windows, and Linux without 2GB file caps or monthly subscriptions. Clean in-memory streaming keeps your device free of gigabytes of disk clutter.
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
          <div className="flex items-center gap-2.5 mb-3.5">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions (FAQ)
            </h3>
          </div>

          <div className="space-y-2.5">
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
                    className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
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
                    <div className="px-4 pb-4 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-[#1f273b]/50 mt-1">
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
