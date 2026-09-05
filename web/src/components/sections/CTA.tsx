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
 *
 * ── Why the scrims are scoped to an inner element ───────────────────────────
 * The section runs on past its last line to give the reveal room to land, and
 * the scrims must not cover that dwell area or they dim the one shot the page
 * has been building towards. That was first done by fading the scrims out from
 * 44% of the section height, which was a guess dressed as a measurement: the
 * copy occupies a different fraction of the section at every viewport, so on a
 * phone the release began *inside* the copy and left the email line at 1.49:1
 * over the lit figure — caught by the contrast harness, invisible by eye.
 *
 * Scoping the scrims to a wrapper around the copy removes the guess. They
 * cover the copy and nothing else at every width, with no magic number to
 * re-tune when the copy or the spacer changes.
 */
export function CTA() {
  return (
    <section
      id="contact"
      className="pointer-events-none relative overflow-hidden py-[clamp(7rem,16vw,14rem)]"
    >
      {/* The copy stage. Scrims are scoped here, leaving the dwell room below
          completely clear for the payoff. */}
      <div className="relative">
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
          shot. Bled past the copy on both edges so it feathers out rather than
          ending on a line.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 -inset-y-12 -z-10 lg:hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,12,10,0) 0%, rgba(15,12,10,0.86) 4%, rgba(15,12,10,0.86) 96%, rgba(15,12,10,0) 100%)',
          }}
        />

        {/* Scrim under the copy only, so the network and the figure stay lit. */}
        <div
          className="pointer-events-none absolute inset-x-0 -inset-y-12 -z-10 hidden lg:block"
          style={{
            background:
              // Releases earlier across the width than the other sections'
              // scrims. This is the payoff shot — the complete network — and
              // holding the scrim across the middle of the viewport washed out
              // half of it.
              'linear-gradient(100deg, rgba(15,12,10,0.96) 0%, rgba(15,12,10,0.90) 24%, rgba(15,12,10,0.34) 46%, rgba(15,12,10,0) 64%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%)',
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
      </div>

      {/*
        Scroll room for the payoff.

        Measured before this existed: the last module landed 557px before the
        page's scroll ended, so the whole reveal — the graph completing, the
        system waking, the camera pulling back to the full network — played out
        in 615px, about 0.6 of a screen. Projects got 1714px and Services
        1629px. The two acts that argue for the thing had three times the room
        of the thing itself, which is the peak-end rule backwards: the moment a
        visitor actually remembers was the most rushed on the page.

        This is authored silence, not dead scroll. Nothing new arrives in it;
        the completed network is on screen, lit, holding, and it is the only
        stretch of the page where the visitor is not being told something. The
        anchors are measured from the DOM on every refresh, so extending the
        section re-times the reveal automatically — nothing here is hardcoded.
      */}
      <div aria-hidden="true" className="h-[36vh] lg:h-[62vh]" />
    </section>
  )
}
