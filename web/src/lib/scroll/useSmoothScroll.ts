import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { clamp, remap } from '@/lib/animation/math'
import { scroll } from './scrollStore'
import { anchors, computeAnchors } from '@/lib/scene/anchors'
import { prefersReducedMotion } from '@/lib/perf/device'

gsap.registerPlugin(ScrollTrigger)

/** Module-level handle so anchor links can route through Lenis when it exists. */
let instance: Lenis | null = null

/**
 * Installs Lenis smooth scrolling and wires it to GSAP's ticker so ScrollTrigger
 * reads Lenis' interpolated position rather than the browser's raw scrollTop.
 * Without this handshake the two run on different clocks and scroll-linked
 * animation visibly judders.
 *
 * One master ScrollTrigger spans the whole narrative — the top of the hero to
 * the bottom of the closing section — and drives scene progress 0→1. The page's
 * own sections provide the scroll distance; there is no synthetic spacer.
 * Module arrival points are measured from the DOM inside `computeAnchors`, and
 * recomputed whenever ScrollTrigger refreshes.
 *
 * Under `prefers-reduced-motion` Lenis is skipped: native scrolling stays,
 * ScrollTrigger still reports progress, and the workflow still assembles — it
 * just no longer eases or drifts on its own.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    const reduced = prefersReducedMotion()
    let cleanupTicker = () => {}

    if (!reduced) {
      const lenis = new Lenis({
        duration: 1.05,
        // Gentle exponential ease-out. Long tails feel laggy on a trackpad.
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        // Native touch scrolling on phones: smoother, and it keeps the
        // browser's own URL-bar collapse behaviour working.
        syncTouch: false,
      })
      instance = lenis

      lenis.on('scroll', ScrollTrigger.update)

      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)

      cleanupTicker = () => {
        gsap.ticker.remove(tick)
        lenis.destroy()
        instance = null
      }
    }

    // Measure before the first frame so the hero opens correctly, and again on
    // every refresh — fonts and images landing late change section heights.
    computeAnchors()

    const master = ScrollTrigger.create({
      trigger: '#top',
      start: 'top top',
      endTrigger: '#contact',
      end: 'bottom bottom',
      onRefresh: computeAnchors,
      onUpdate: (self) => {
        scroll.progress = self.progress
        scroll.velocity = clamp(self.getVelocity() / 3000, -1, 1)

        // The closing reveal: begins once the last cable has landed.
        scroll.reveal = clamp(remap(self.progress, anchors.revealAt, 1))
        scroll.complete = self.progress >= anchors.revealAt
      },
    })

    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh).catch(() => {})
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      master.kill()
      cleanupTicker()
    }
  }, [])
}

/** Scrolls to a hash target, routing through Lenis when it's driving. */
export function scrollToHash(hash: string): void {
  const el = document.querySelector<HTMLElement>(hash)
  if (!el) return

  if (instance) {
    instance.scrollTo(el, { offset: 0, duration: 1.2 })
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }
}
