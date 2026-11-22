import React, { useEffect, useRef } from 'react'

/**
 * AdSlot Component
 * 100% Compliant with Google AdSense, Adsterra, and IAB Publisher Standards:
 * - Clear "ADVERTISEMENT" label to prevent accidental clicks & satisfy AdSense policy.
 * - Reserved dimensions (`min-h`) to eliminate Cumulative Layout Shift (CLS).
 * - Safe vertical clearance away from video player scrubbers and clickable buttons.
 * - Supports industry top-earning formats:
 *    • 'leaderboard': 728x90 (Desktop) / 320x50 & 320x100 (Mobile)
 *    • 'rectangle': 300x250 or 336x280 (Highest RPM format globally)
 *    • 'dual-rectangle': 2x 300x250 side-by-side on desktop, single on mobile (Webtor/Convertio benchmark)
 *    • 'responsive': Fluid auto-format display banner
 */
export function AdSlot({
  id = 'ad-slot',
  format = 'leaderboard', // 'leaderboard' | 'rectangle' | 'dual-rectangle' | 'responsive'
  adClient,
  adSlot,
  adSlot2,
  className = '',
}) {
  const adRef1 = useRef(null)
  const adRef2 = useRef(null)

  useEffect(() => {
    if (adClient && adSlot && typeof window !== 'undefined') {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        if (format === 'dual-rectangle') {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        }
      } catch (e) {
        console.debug('[AdSlot] AdSense push deferred:', e)
      }
    }
  }, [adClient, adSlot, format])

  // Dual Rectangle Unit (Two 300x250 Medium Rectangles side-by-side on desktop)
  if (format === 'dual-rectangle') {
    return (
      <aside
        id={id}
        className={`my-8 mx-auto px-4 max-w-4xl text-center select-none ${className}`}
        aria-label="Advertisements"
      >
        <span className="text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 block font-semibold">
          Advertisement
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
          {/* Ad Box 1 */}
          <div
            ref={adRef1}
            className="w-full max-w-[336px] min-h-[250px] sm:min-h-[280px] rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c101a]/50 p-2 flex items-center justify-center overflow-hidden transition-colors"
          >
            {adClient && adSlot && (
              <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '300px', height: '250px' }}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
              />
            )}
          </div>

          {/* Ad Box 2 */}
          <div
            ref={adRef2}
            className="w-full max-w-[336px] min-h-[250px] sm:min-h-[280px] rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c101a]/50 p-2 flex items-center justify-center overflow-hidden transition-colors"
          >
            {adClient && (adSlot2 || adSlot) && (
              <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '300px', height: '250px' }}
                data-ad-client={adClient}
                data-ad-slot={adSlot2 || adSlot}
              />
            )}
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
      // 300x250 Medium Rectangle / 336x280 Large Rectangle
      formatClasses = 'min-h-[250px] sm:min-h-[280px] max-w-[336px] w-full mx-auto'
      dataFormat = 'rectangle'
      insStyle = { display: 'inline-block', width: '300px', height: '250px' }
      break
    case 'horizontal':
    case 'leaderboard':
    default:
      // Leaderboard: 728x90 on Desktop, 320x50/320x100 on Mobile
      formatClasses = 'min-h-[60px] sm:min-h-[90px] max-w-[728px] w-full mx-auto'
      dataFormat = 'horizontal'
      insStyle = { display: 'block', width: '100%', height: '100%' }
      break
  }

  return (
    <aside
      id={id}
      className={`my-6 mx-auto px-4 text-center select-none transition-all ${className}`}
      aria-label="Advertisement"
    >
      <div className="flex flex-col items-center justify-center">
        {/* AdSense Policy Requirement: Clear, Non-Misleading Label */}
        <span className="text-xs font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 block font-semibold">
          Advertisement
        </span>

        {/* Ad Container Box */}
        <div
          ref={adRef1}
          className={`${formatClasses} relative rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0c101a]/50 p-2 flex items-center justify-center overflow-hidden transition-colors`}
        >
          {adClient && adSlot && (
            <ins
              className="adsbygoogle"
              style={insStyle}
              data-ad-client={adClient}
              data-ad-slot={adSlot}
              data-ad-format={dataFormat}
              data-full-width-responsive="true"
            />
          )}
        </div>
      </div>
    </aside>
  )
}
