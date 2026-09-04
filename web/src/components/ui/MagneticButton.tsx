import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/perf/device'
import { scrollToHash } from '@/lib/scroll/useSmoothScroll'

/**
 * A button that leans towards the pointer.
 *
 * The label moves further than the button body, which is what makes the effect
 * read as magnetism rather than the whole element sliding around. Movement uses
 * `gsap.quickTo` — a pre-compiled setter that writes the transform directly,
 * so pointermove doesn't allocate a tween per event.
 *
 * Disabled entirely for coarse pointers (nothing to track) and reduced motion.
 */

interface MagneticButtonProps {
  children: ReactNode
  href?: string
  variant?: 'primary' | 'ghost'
  className?: string
  strength?: number
  onClick?: () => void
  ariaLabel?: string
}

export function MagneticButton({
  children,
  href,
  variant = 'primary',
  className = '',
  strength = 0.32,
  onClick,
  ariaLabel,
}: MagneticButtonProps) {
  const root = useRef<HTMLElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    const inner = label.current
    if (!el || !inner) return
    if (prefersReducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const ctx = gsap.context(() => {
      const moveX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
      const moveY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
      const labelX = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' })
      const labelY = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' })

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        moveX(dx * strength)
        moveY(dy * strength)
        labelX(dx * strength * 0.45)
        labelY(dy * strength * 0.45)
      }

      const onLeave = () => {
        moveX(0)
        moveY(0)
        labelX(0)
        labelY(0)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)

      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    }, el)

    return () => ctx.revert()
  }, [strength])

  const classes = `btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`
  const inner = <span ref={label} className="pointer-events-none inline-flex items-center gap-2">{children}</span>

  if (href) {
    const internal = href.startsWith('#')
    return (
      <a
        ref={root as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={classes}
        aria-label={ariaLabel}
        data-cursor-target
        onClick={
          internal
            ? (e) => {
                e.preventDefault()
                scrollToHash(href)
              }
            : undefined
        }
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      ref={root as React.RefObject<HTMLButtonElement>}
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      data-cursor-target
    >
      {inner}
    </button>
  )
}
