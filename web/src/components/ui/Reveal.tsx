import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/perf/device'

gsap.registerPlugin(ScrollTrigger)

/**
 * Fades and lifts its children in once, when they first reach the viewport.
 *
 * Deliberately restrained: 24px of travel and no scale or blur. On a page that
 * already has a camera moving through a 3D scene, section-level entrance
 * animation should be almost subliminal — its job is to stop content appearing
 * abruptly, not to be noticed.
 *
 * With reduced motion the content is simply present from the start; there is no
 * hidden state to get stuck in if a trigger never fires.
 */

/** Kept to a small set of block tags so the ref type stays concrete. */
type RevealTag = 'div' | 'section' | 'ul' | 'ol' | 'p'

interface RevealProps {
  children: ReactNode
  className?: string
  as?: RevealTag
  /** Seconds to wait after the trigger fires. */
  delay?: number
  /** Stagger direct children instead of moving the whole block. */
  stagger?: boolean
  id?: string
}

export function Reveal({
  children,
  className = '',
  as = 'div',
  delay = 0,
  stagger = false,
  id,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Every tag in RevealTag is a plain block element with identical props; the
  // cast keeps the ref concrete instead of collapsing to `never`.
  const Tag = as as 'div'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : [el]

      gsap.from(targets, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [delay, stagger])

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  )
}
