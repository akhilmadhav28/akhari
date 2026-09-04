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
      {/* Scrim under the copy only, so the network and the figure stay lit. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
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
