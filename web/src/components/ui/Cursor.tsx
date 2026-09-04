import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/perf/device'

/**
 * A two-part cursor: a small solid dot that tracks the pointer exactly, and a
 * ring that lags slightly behind it.
 *
 * The lag is the whole effect — a ring that tracks perfectly reads as a broken
 * cursor, while one that trails reads as weight. The ring expands over anything
 * marked `data-cursor-target` and over a hovered 3D node.
 *
 * Only mounts for fine pointers with motion enabled. When it does mount it sets
 * `data-cursor="custom"` on <html>, which is what hides the native cursor — so
 * if this component is ever absent, the real cursor is never lost.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const d = dot.current
    const r = ring.current
    if (!d || !r) return

    const root = document.documentElement
    root.dataset.cursor = 'custom'

    const dotX = gsap.quickTo(d, 'x', { duration: 0.09, ease: 'power2.out' })
    const dotY = gsap.quickTo(d, 'y', { duration: 0.09, ease: 'power2.out' })
    const ringX = gsap.quickTo(r, 'x', { duration: 0.42, ease: 'power3.out' })
    const ringY = gsap.quickTo(r, 'y', { duration: 0.42, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)

      const overTarget = (e.target as Element | null)?.closest?.(
        'a, button, [data-cursor-target], input, select, textarea',
      )
      const overNode = root.dataset.nodeHover === 'true'

      gsap.to(r, {
        scale: overTarget || overNode ? 1.9 : 1,
        borderColor: overTarget || overNode ? 'rgba(224,128,63,0.9)' : 'rgba(242,237,228,0.32)',
        duration: 0.3,
        ease: 'power3.out',
      })
    }

    const onLeave = () => gsap.to([d, r], { opacity: 0, duration: 0.2 })
    const onEnter = () => gsap.to([d, r], { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      delete root.dataset.cursor
      gsap.killTweensOf([d, r])
    }
  }, [])

  return (
    <>
      <div
        ref={dot}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent md:block"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ring}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border md:block"
        style={{ borderColor: 'rgba(242,237,228,0.32)', willChange: 'transform' }}
      />
    </>
  )
}
