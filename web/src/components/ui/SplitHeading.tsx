import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/perf/device'

gsap.registerPlugin(ScrollTrigger)

/**
 * A heading whose words rise into place from behind a mask.
 *
 * Each line is its own `overflow: hidden` block, so words travel up out of
 * nothing rather than fading in on the spot — the difference between type that
 * arrives and type that just appears.
 *
 * Accessibility: the split spans are `aria-hidden` and the full string is
 * exposed once via a visually-hidden node, so a screen reader reads "Build
 * systems." and not "B u i l d  s y s t e m s ."
 */

interface SplitHeadingProps {
  /** Use \n to force a line break; each line masks independently. */
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
  /** Play as soon as it mounts (hero) rather than on scroll. */
  immediate?: boolean
}

export function SplitHeading({
  text,
  className = '',
  as = 'h2',
  delay = 0,
  immediate = false,
}: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  // All allowed tags share the same props; the cast keeps the ref concrete.
  const Tag = as as 'h2'

  const lines = useMemo(() => text.split('\n').map((line) => line.split(' ')), [text])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const words = el.querySelectorAll('[data-word]')

      gsap.from(words, {
        yPercent: 118,
        duration: 1.05,
        delay,
        ease: 'expo.out',
        stagger: 0.045,
        ...(immediate
          ? {}
          : { scrollTrigger: { trigger: el, start: 'top 86%', once: true } }),
      })
    }, el)

    return () => ctx.revert()
  }, [delay, immediate, text])

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text.replace(/\n/g, ' ')}</span>

      <span aria-hidden="true">
        {lines.map((words, li) => (
          // Descender room inside the mask. The serif display face drops its
          // y, p and g noticeably further below the baseline than the sans it
          // replaced, and this block clips — too little padding and "Build
          // systems." loses the tail of its y.
          <span key={li} className="block overflow-hidden pb-[0.2em]">
            {words.map((word, wi) => (
              <span key={wi} className="inline-block overflow-hidden align-bottom">
                <span data-word className="inline-block will-change-transform">
                  {word}
                  {wi < words.length - 1 ? ' ' : ''}
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  )
}
