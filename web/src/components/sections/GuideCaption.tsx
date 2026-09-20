import { useEffect, useRef, useState } from 'react'
import { onConnect, scroll } from '@/lib/scroll/scrollStore'
import { clamp, remap } from '@/lib/animation/math'
import { GUIDE_SCRIPT } from '@/constants/guide'

/**
 * The guide's caption — replaces `WorkflowHUD`.
 *
 * `WorkflowHUD` was a dry status readout ("which module connected, N/07") that
 * faded out as the closing reveal took over, because it had nothing left to
 * report once the graph was complete. This is the opposite case: the figure
 * (`3d/RobotFigure.tsx`) is now a guide with something to say *through* the
 * climax, not just up to it, so the two visibility windows can't be the same
 * shape. One voice replaces the readout, following the same split it proved —
 * content changes via `onConnect` (event-driven, ~8 fires total: hero + 7
 * modules + one climax flip, not a re-render per frame), visibility purely on
 * a rAF loop reading `scroll` directly. The two stay fully independent, same
 * as in `WorkflowHUD` — the opacity loop never restarts when content changes,
 * so a module transition never resets the fade.
 *
 * Placement: bottom-right corner on `lg+`, the same slot `WorkflowHUD` used
 * and the same side the figure/cable occupy (`CTA.tsx`'s own comment holds
 * copy left "so the figure has the right"). Below `lg`, a slim strip under
 * `Nav` instead of hidden entirely — this is now primary onboarding
 * narration, not a secondary readout, and portrait is most of this site's
 * traffic.
 */

/** How far into `scroll.reveal` the climax line fires — comfortably before
 *  `RobotLink`'s own 0.34 pulse-start gate, so the caption and the cable's
 *  visible current arrive together rather than the caption lagging it. */
const CLIMAX_AT = 0.3

export function GuideCaption() {
  const [activeId, setActiveId] = useState('hero')
  const climaxFired = useRef(false)
  const desktopEl = useRef<HTMLDivElement>(null)
  const mobileEl = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      onConnect((connected, id) => {
        if (climaxFired.current) return
        setActiveId(connected === 0 ? 'hero' : `module-${id}`)
      }),
    [],
  )

  useEffect(() => {
    let raf = 0
    let shown = 0

    const step = () => {
      if (!climaxFired.current && scroll.reveal > CLIMAX_AT) {
        climaxFired.current = true
        setActiveId('climax')
      }

      // In near the very top (this narrates the whole page now, not just the
      // middle stretch) and out again only once the payoff has fully landed —
      // past that, CTA's own copy is the thing asking for attention.
      const fadeIn = clamp(remap(scroll.progress, 0.03, 0.06))
      const fadeOut = 1 - clamp(remap(scroll.reveal, 0.85, 1))
      const target = fadeIn * fadeOut

      shown += (target - shown) * 0.12
      const opacity = shown.toFixed(3)
      if (desktopEl.current) desktopEl.current.style.opacity = opacity
      if (mobileEl.current) mobileEl.current.style.opacity = opacity
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const line = GUIDE_SCRIPT.find((l) => l.id === activeId)

  const content = (
    <div className="flex items-center gap-2.5">
      <span className="glow-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span className="text-[0.8rem] leading-snug text-ink-dim">{line?.text}</span>
    </div>
  )

  return (
    <>
      <div
        ref={desktopEl}
        data-guide-line={activeId}
        className="pointer-events-none fixed right-[clamp(1.25rem,5vw,4.5rem)] bottom-8 z-20 hidden max-w-[18rem] lg:block"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        {content}
      </div>

      <div
        ref={mobileEl}
        data-guide-line={activeId}
        className="pointer-events-none fixed inset-x-0 top-[4.5rem] z-20 flex justify-center border-b border-line/60 bg-void/85 px-5 py-2.5 backdrop-blur-md lg:hidden"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        {content}
      </div>
    </>
  )
}
