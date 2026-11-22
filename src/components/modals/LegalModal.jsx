import React, { useState, useEffect } from 'react'
import { Scale, ShieldCheck, FileText, AlertCircle, X } from 'lucide-react'

export function LegalModal({ isOpen, onClose, initialTab = 'dmca' }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Legal, DMCA &amp; Terms
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Client-Side Open Source P2P Protocol Compliance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors cursor-pointer text-sm font-semibold"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sleek Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0b0e17]/50 px-4 pt-1.5 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('dmca')}
            className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'dmca'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>DMCA &amp; Copyright Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed flex-1">
          {activeTab === 'dmca' ? (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-[#1f273b] space-y-2.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Architecture &amp; Safe Harbor Overview</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 text-xs leading-normal">
                  Magnet Player is a <strong>purely client-side web utility</strong> (HTML5/JavaScript) running directly in the user's browser. It acts as an interactive client for the WebTorrent/BitTorrent P2P protocol.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e]">
                    <strong className="text-slate-950 dark:text-white block font-semibold">🚫 No File Storage</strong>
                    <span className="text-slate-600 dark:text-slate-300">No audio, video, or files are uploaded or hosted on any server.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e]">
                    <strong className="text-slate-950 dark:text-white block font-semibold">🚫 No Search Index</strong>
                    <span className="text-slate-600 dark:text-slate-300">We do not index, catalog, or crawl magnet links or torrent sites.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#131722] border border-slate-200 dark:border-[#232b3e]">
                    <strong className="text-slate-950 dark:text-white block font-semibold">⚡ Direct P2P Swarm</strong>
                    <span className="text-slate-600 dark:text-slate-300">Streams transfer directly peer-to-peer via browser WebRTC.</span>
                  </div>
                </div>
              </div>

              {/* DMCA Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">
                  1. DMCA Notice &amp; Takedown Procedure
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  Because Magnet Player does not maintain content servers, hosting infrastructure, or a torrent search database, <strong>we have no technical capability to remove, modify, or take down files</strong> that reside on the decentralized BitTorrent network.
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs">
                  However, we respect the intellectual property rights of copyright holders and comply with the applicable provisions of the Digital Millennium Copyright Act (17 U.S.C. § 512).
                </p>
              </div>

              {/* How to submit notification */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">
                  2. Submitting a Copyright Complaint
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  If you are a copyright owner or authorized agent and believe your copyrighted work is being unlawfully shared through a torrent swarm, you must direct your takedown request to:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700 dark:text-slate-200 text-xs">
                  <li>The <strong>website or torrent indexing service</strong> that generated or published the magnet link or .torrent file.</li>
                  <li>The <strong>Internet Service Providers (ISPs)</strong> of the IP addresses actively seeding the swarm.</li>
                  <li>The public <strong>WebSocket tracker operators</strong> that facilitate peer discovery for that torrent.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white mb-1 text-sm">
                  1. Acceptance of Terms
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  By accessing or using Magnet Player, you acknowledge that you have read, understood, and agreed to these Terms of Service. If you do not agree to these terms, please discontinue using this software immediately.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white mb-1 text-sm">
                  2. Lawful &amp; Permitted Use Only
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  Magnet Player is created for personal, non-commercial, and lawful purposes, including streaming public domain material, Creative Commons content, open-source video releases, or media you own and possess the right to distribute.
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  ⚠️ You must not use this software to download, stream, or distribute copyrighted media without the explicit permission of the copyright owner. You are solely responsible for ensuring compliance with your local laws.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white mb-1 text-sm">
                  3. P2P Sharing &amp; Bandwidth
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  When streaming via the BitTorrent protocol, your browser acts as a node that may upload data chunks to other swarm participants. You acknowledge that peer-to-peer data transfers utilize network bandwidth and that you are solely responsible for any data limits or carrier charges incurred.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white mb-1 text-sm">
                  4. Disclaimer of Warranties ("AS IS")
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  This software is provided "AS IS" and without warranties of any kind, express or implied. The maintainers and contributors do not guarantee uninterrupted, error-free operation or the availability, legality, or security of any third-party torrent swarms.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-950 dark:text-white mb-1 text-sm">
                  5. Limitation of Liability
                </h4>
                <p className="text-slate-700 dark:text-slate-200">
                  To the maximum extent permitted by law, the authors and contributors of Magnet Player shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this software.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#232b3e] flex items-center justify-between bg-slate-50 dark:bg-[#0b0e17]/80">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Updated: November 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
