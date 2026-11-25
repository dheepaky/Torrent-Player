import React, { useEffect, useRef } from 'react'
import {
  HelpCircle,
  Command,
  HardDrive,
  Info,
  X,
  ChevronUp,
} from 'lucide-react'
import { InstructionsSection } from './InstructionsSection'
import { ShortcutsGuide } from './ShortcutsGuide'
import { StorageNotice } from './StorageNotice'
import { SeoContentSection } from './SeoContentSection'

export function ResourceMenu({
  activeTab,
  onTabChange,
  onOpenSettings,
  isStreaming = false,
}) {
  const containerRef = useRef(null)

  const tabs = [
    {
      id: 'guide',
      label: 'How to Stream',
      icon: HelpCircle,
      desc: 'Step-by-step instructions & mobile streaming tips',
      hideWhenStreaming: true,
    },
    {
      id: 'shortcuts',
      label: 'Shortcuts',
      icon: Command,
      desc: 'Keyboard controls, hotkeys & touch gestures',
      hideWhenStreaming: false,
    },
    {
      id: 'storage',
      label: 'Storage & RAM',
      icon: HardDrive,
      desc: 'How in-memory browser RAM streaming works',
      hideWhenStreaming: false,
    },
    {
      id: 'faq',
      label: 'FAQ & Guide',
      icon: Info,
      desc: 'Frequently asked questions & feature comparison',
      hideWhenStreaming: false,
    },
  ]

  const visibleTabs = isStreaming
    ? tabs.filter((t) => !t.hideWhenStreaming)
    : tabs

  const currentTabObj = tabs.find((t) => t.id === activeTab)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeTab) {
        onTabChange(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, onTabChange])

  const handleToggle = (id) => {
    if (activeTab === id) {
      onTabChange(null)
    } else {
      onTabChange(id)
      // Smooth scroll into view if needed
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 50)
    }
  }

  return (
    <div
      ref={containerRef}
      id="resource-menu-hub"
      className="max-w-4xl mx-auto px-4 mt-6 sm:mt-8 select-none"
    >
      {/* Sleek Segmented Pill Menu Bar */}
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-2xl bg-white/90 dark:bg-[#131722]/90 border border-slate-200/90 dark:border-[#232b3e] shadow-xs backdrop-blur-md gap-1 sm:gap-1.5 flex-wrap">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleToggle(tab.id)}
                aria-expanded={isActive}
                aria-controls={`panel-${tab.id}`}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2130]'
                }`}
                title={tab.desc}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-slate-950'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tab Header Bar */}
      {activeTab && (
        <div className="mt-4 pt-2">
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Viewing:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {currentTabObj?.label}
                </strong>
              </span>
              <span className="hidden sm:inline text-slate-600 dark:text-slate-400">
                — {currentTabObj?.desc}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onTabChange(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
              title="Close this section (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Panels (kept in DOM for 100% Googlebot SEO indexing while remaining clean for users) */}
      <div className="mt-2">
        {/* 1. How to Stream Guide */}
        <div
          id="panel-guide"
          className={activeTab === 'guide' ? 'block animate-in fade-in duration-200' : 'hidden'}
          aria-hidden={activeTab !== 'guide'}
        >
          <InstructionsSection />
        </div>

        {/* 2. Shortcuts & Gestures */}
        <div
          id="panel-shortcuts"
          className={activeTab === 'shortcuts' ? 'block animate-in fade-in duration-200' : 'hidden'}
          aria-hidden={activeTab !== 'shortcuts'}
        >
          <ShortcutsGuide />
        </div>

        {/* 3. Storage & Streaming Cache */}
        <div
          id="panel-storage"
          className={activeTab === 'storage' ? 'block animate-in fade-in duration-200' : 'hidden'}
          aria-hidden={activeTab !== 'storage'}
        >
          <StorageNotice
            onOpenSettings={onOpenSettings}
            defaultExpanded={true}
          />
        </div>

        {/* 4. Complete SEO & FAQ Guide */}
        <div
          id="panel-faq"
          className={activeTab === 'faq' ? 'block animate-in fade-in duration-200' : 'hidden'}
          aria-hidden={activeTab !== 'faq'}
        >
          <SeoContentSection />
        </div>
      </div>

      {/* Bottom Collapse Button if activeTab is open */}
      {activeTab && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => {
              onTabChange(null)
              containerRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131722] dark:hover:bg-[#1a2130] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#232b3e] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ChevronUp className="w-4 h-4 text-amber-500" />
            <span>Collapse section</span>
          </button>
        </div>
      )}
    </div>
  )
}
