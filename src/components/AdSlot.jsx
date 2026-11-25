import React, { useState, useEffect, useRef } from 'react'

/**
 * AdSlot Component
 * 100% Compliant with Google AdSense, Adsterra, and IAB Publisher Standards:
 * - Hidden by default: does NOT take space or show placeholder boxes when no ads are filled.
 * - Only shows the "ADVERTISEMENT" label and container when an ad genuinely loads.
 * - Automatically collapses and hides when unfilled or when ad blockers are active.
 */
export function AdSlot({
  id = 'ad-slot',
  format = 'leaderboard', // 'leaderboard' | 'rectangle' | 'dual-rectangle' | 'horizontal'
  adClient = import.meta.env.VITE_ADSENSE_CLIENT || null,
  adSlot = import.meta.env.VITE_ADSENSE_SLOT || null,
  adSlot2 = null,
  className = '',
}) {
  const [isAdLoaded, setIsAdLoaded] = useState(false)
  const containerRef = useRef(null)

  // If no publisher client ID and slot configured, do not render anything
  const hasConfig = Boolean(adClient && adSlot)

  useEffect(() => {
    if (!hasConfig || typeof window === 'undefined') return

    // Trigger AdSense push
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      if (format === 'dual-rectangle') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (e) {
      console.debug('[AdSlot] AdSense push:', e)
    }

    const container = containerRef.current
    if (!container) return

    // Check if an ad has actually rendered into the container
    const checkFilled = () => {
      const insElements = container.querySelectorAll('ins.adsbygoogle')
      let anyFilled = false

      insElements.forEach((ins) => {
        const status = ins.getAttribute('data-ad-status')
        const hasIframe = ins.querySelector('iframe') !== null
        const hasVisibleContent = ins.children.length > 0 && ins.offsetHeight > 20

        if (status === 'filled' || hasIframe || hasVisibleContent) {
          anyFilled = true
        }
      })

      if (anyFilled) {
        setIsAdLoaded(true)
      }
    }

    checkFilled()

    // Observe changes to data-ad-status or child nodes
    const observer = new MutationObserver(() => {
      checkFilled()
    })

    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['data-ad-status'],
    })

    // Timeout fallback check (after AdSense finishes loading)
    const timer = setTimeout(checkFilled, 2500)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [hasConfig, format])

  // Completely hide when no ads are configured
  if (!hasConfig) {
    return null
  }

  // Dual Rectangle Unit (Two 300x250 Medium Rectangles side-by-side on desktop)
  if (format === 'dual-rectangle') {
    return (
      <aside
        id={id}
        ref={containerRef}
        className={`mx-auto px-4 max-w-4xl text-center select-none transition-all ${
          isAdLoaded ? 'my-8 block' : 'hidden'
        } ${className}`}
        aria-label="Advertisements"
        style={!isAdLoaded ? { display: 'none' } : undefined}
      >
        {isAdLoaded && (
          <span className="text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 block font-semibold">
            Advertisement
          </span>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
          <div className="w-full max-w-[336px] flex items-center justify-center overflow-hidden">
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '300px', height: '250px' }}
              data-ad-client={adClient}
              data-ad-slot={adSlot}
            />
          </div>

          <div className="w-full max-w-[336px] flex items-center justify-center overflow-hidden">
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '300px', height: '250px' }}
              data-ad-client={adClient}
              data-ad-slot={adSlot2 || adSlot}
            />
          </div>
        </div>
      </aside>
    )
  }

  // Single Standard IAB Format Sizes
  let formatClasses = ''
  let insStyle = { display: 'block' }
  let dataFormat = 'auto'

  switch (format) {
    case 'rectangle':
      formatClasses = 'max-w-[336px] w-full mx-auto'
      dataFormat = 'rectangle'
      insStyle = { display: 'inline-block', width: '300px', height: '250px' }
      break
    case 'horizontal':
    case 'leaderboard':
    default:
      formatClasses = 'max-w-[728px] w-full mx-auto'
      dataFormat = 'horizontal'
      insStyle = { display: 'block', width: '100%', height: '100%' }
      break
  }

  return (
    <aside
      id={id}
      ref={containerRef}
      className={`mx-auto px-4 text-center select-none transition-all ${
        isAdLoaded ? 'my-6 block' : 'hidden'
      } ${className}`}
      aria-label="Advertisement"
      style={!isAdLoaded ? { display: 'none' } : undefined}
    >
      <div className="flex flex-col items-center justify-center">
        {isAdLoaded && (
          <span className="text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 block font-semibold">
            Advertisement
          </span>
        )}

        <div className={`${formatClasses} relative flex items-center justify-center overflow-hidden`}>
          <ins
            className="adsbygoogle"
            style={insStyle}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format={dataFormat}
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </aside>
  )
}
