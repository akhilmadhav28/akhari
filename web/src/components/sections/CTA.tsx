import { BRAND } from '@/constants/brand'
import { Reveal } from '@/components/ui/Reveal'
import { SplitHeading } from '@/components/ui/SplitHeading'
import { MagneticButton } from '@/components/ui/MagneticButton'

/**
 * Closing call to action.
 *
 * The last module connects here, which completes the graph and wakes the
 * system. Copy holds the left on wide viewports so the figure has the right —
 * the visual answer to the question the headline asks.
 *
 * The figure itself lives in the 3D scene (see `3d/RobotFigure`), not here. It
 * was a DOM `<video>` in this section for a long time and could not be made to
 * composite correctly over the canvas from inside `<main>` — that component's
 * header has the full account.
 */
export function CTA() {
  return (
    <section
      id="contact"
      className="pointer-events-none relative overflow-hidden py-[clamp(7rem,16vw,14rem)]"
    >
      {/*
        Portrait scrim.

        This section rolls its own scrim rather than using SplitSection (the
        copy is centred here, and `side` only takes left or right), and for a
        long time it only had the desktop one below — a horizontal gradient
        that is fully transparent past 64% of the width. That is correct when
        the copy is capped at 40rem in the left half, and wrong the moment it
        is not: on a portrait viewport the column is full width, so the last
        ~40% of every line was sitting directly on the figure with no scrim
        behind it at all. The closing paragraph was the least readable text on
        the page on a phone, in the one section that is asking for the work.

        Vertical here, matching SCRIM_COMPACT in SplitSection so the sections
        agree. Slightly lighter than that one because this is still the payoff
        shot, and self-feathering at both ends so it does not seam against the
        Projects scrim above it.
      */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 lg:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,12,10,0.26) 0%, rgba(15,12,10,0.86) 16%, rgba(15,12,10,0.86) 74%, rgba(15,12,10,0.28) 100%)',
        }}
      />

      {/* Scrim under the copy only, so the network and the figure stay lit. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            // Releases earlier than the other sections' scrims. This is the
            // payoff shot — the complete network — and holding the scrim across
            // the middle of the viewport washed out half of it.
            'linear-gradient(100deg, rgba(15,12,10,0.96) 0%, rgba(15,12,10,0.90) 24%, rgba(15,12,10,0.34) 46%, rgba(15,12,10,0) 64%)',
        }}
      />

      <div className="wrap">
        <div className="pointer-events-auto w-full lg:max-w-[40rem]">
          <Reveal>
            <p className="eyebrow mb-8">
              <b>04</b>
              <span className="h-px w-6 bg-line-strong" />
              Start here
            </p>
          </Reveal>

          <SplitHeading
            as="h2"
            text={'What should we\nautomate next?'}
            className="text-[length:var(--text-h1)]"
          />

          <Reveal>
            <p className="mt-8 max-w-[34rem] text-[length:var(--text-lede)] text-ink-dim">
              One conversation, no deck, no obligation. If I cannot save you meaningful hours I
              will say so on the call instead of selling you a project.
            </p>
          </Reveal>

          <Reveal className="mt-11 flex flex-wrap gap-4">
            <MagneticButton href={`mailto:${BRAND.email}`} variant="primary">
              Start a project
            </MagneticButton>
            <MagneticButton href={`tel:${BRAND.phoneHref}`} variant="ghost">
              {BRAND.phone}
            </MagneticButton>
          </Reveal>

          <Reveal>
            <p className="mt-9 font-mono text-[0.72rem] tracking-[0.14em] text-faint">
              {BRAND.email}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
