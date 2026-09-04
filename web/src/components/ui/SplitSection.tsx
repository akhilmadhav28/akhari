import type { ReactNode } from 'react'
import type { AnchorId } from '@/constants/workflow'

/**
 * A section that occupies one half of the viewport and leaves the other half to
 * the 3D graph.
 *
 * This is what makes the workflow visible while it is being built. Rather than
 * dimming the whole scene behind full-width content, each section claims a
 * column and carries a *directional* scrim: opaque under the copy, fading to
 * nothing across the middle, fully clear over the half where the module is
 * connecting. The camera frames to the opposite side (see `ANCHOR_SIDES`), so
 * the two never fight for the same space.
 *
 * On a portrait viewport there is no spare half, so the scrim becomes a soft
 * vertical one and the graph sits in the band beneath the copy instead.
 *
 * Pointer events are disabled on the shell and re-enabled on the column, which
 * leaves the graph hoverable in the open half while text selection still works.
 */

interface SplitSectionProps {
  id: AnchorId
  side: 'left' | 'right'
  children: ReactNode
  className?: string
}

const SCRIM_DESKTOP: Record<'left' | 'right', string> = {
  left: 'linear-gradient(100deg, rgba(15,12,10,0.94) 0%, rgba(15,12,10,0.87) 30%, rgba(15,12,10,0.38) 56%, rgba(15,12,10,0) 76%)',
  right:
    'linear-gradient(260deg, rgba(15,12,10,0.94) 0%, rgba(15,12,10,0.87) 30%, rgba(15,12,10,0.38) 56%, rgba(15,12,10,0) 76%)',
}

const SCRIM_COMPACT =
  'linear-gradient(180deg, rgba(15,12,10,0.30) 0%, rgba(15,12,10,0.88) 14%, rgba(15,12,10,0.88) 74%, rgba(15,12,10,0.26) 100%)'

/**
 * Feathers the scrim's top and bottom edges.
 *
 * Adjacent sections lean their gradients in opposite directions, so without
 * this their scrims meet in a visible horizontal seam straight across the
 * viewport — the join between two sections should never be a drawn line.
 */
const SCRIM_FEATHER =
  'linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)'

export function SplitSection({ id, side, children, className = '' }: SplitSectionProps) {
  return (
    <section
      id={id}
      className={`pointer-events-none relative py-[clamp(5.5rem,11vw,9.5rem)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 lg:hidden"
        style={{
          background: SCRIM_COMPACT,
          maskImage: SCRIM_FEATHER,
          WebkitMaskImage: SCRIM_FEATHER,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
        style={{
          background: SCRIM_DESKTOP[side],
          maskImage: SCRIM_FEATHER,
          WebkitMaskImage: SCRIM_FEATHER,
        }}
      />

      <div className="wrap">
        <div
          className={`pointer-events-auto w-full lg:max-w-[38rem] ${
            side === 'right' ? 'lg:ml-auto' : ''
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

/**
 * The section marker.
 *
 * The number is set enormous and nearly invisible behind the heading rather
 * than as a small copper digit in front of it. Two reasons: the page had almost
 * no type-scale contrast — everything lived between 0.6rem and 3.75rem, and the
 * only real jump was heading-to-body — and four identically-sized numbered
 * eyebrows in a row was much of what made the sections read as a series of
 * identical slides.
 *
 * It is `aria-hidden` and duplicated nowhere: the number is decoration, and a
 * screen reader announcing "zero three" before every section heading is noise.
 */
export function SectionEyebrow({ index, label }: { index: string; label: string }) {
  return (
    <div className="relative mb-6">
      <span
        className="pointer-events-none absolute -top-[0.62em] -left-[0.06em] -z-10 font-display text-[clamp(5rem,11vw,9rem)] leading-none text-ink/[0.05] select-none"
        aria-hidden="true"
      >
        {index}
      </span>
      <p className="eyebrow">
        <span className="h-px w-6 bg-line-strong" />
        {label}
      </p>
    </div>
  )
}
