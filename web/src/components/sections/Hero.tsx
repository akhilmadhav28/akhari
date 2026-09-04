import { BRAND } from '@/constants/brand'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { SplitHeading } from '@/components/ui/SplitHeading'

/**
 * The hero.
 *
 * Content is held to the left half on wide viewports so the graph reads in the
 * open space on the right rather than behind the type. The scrim is a
 * left-to-right gradient rather than a flat overlay — it gives the headline the
 * contrast it needs without dimming the part of the scene you are meant to be
 * looking at.
 */
export function Hero() {
  return (
    // pointer-events are disabled on the layout wrappers and re-enabled on the
    // content column only, so the 3D graph stays hoverable in the open space
    // beside the type while text selection inside the column still works.
    // Top-aligned on portrait viewports so the copy owns the upper two thirds
    // and the module has somewhere to sit that isn't on top of the buttons;
    // centred once there is width to put it beside the type instead.
    <section
      id="top"
      className="pointer-events-none relative flex min-h-svh items-start pt-32 pb-24 lg:pt-40 lg:pb-32"
    >
      {/* Directional scrim: opaque under the type, clear over the graph. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(100deg, rgba(15,12,10,0.94) 0%, rgba(15,12,10,0.86) 26%, rgba(15,12,10,0.42) 52%, rgba(15,12,10,0) 74%)',
        }}
      />

      {/*
        Light pool.

        The scrim above is flat black at 94%, and flat black behind type is the
        most obviously synthetic thing a dark layout can do — real darkness is
        never even. This puts a soft warm falloff low and left of the headline,
        placed to agree with the tungsten key in the 3D scene, so the copy reads
        as sitting in the same room as the rig rather than on a panel in front
        of it.

        Painted as a plain gradient at normal blend. No filter, no blend mode:
        this element sits directly over the WebGL canvas, and that is not a
        place to add compositing layers.
      */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(58% 62% at 22% 78%, rgba(224,128,63,0.13) 0%, rgba(184,95,34,0.05) 38%, rgba(15,12,10,0) 72%)',
        }}
      />

      <div className="wrap pointer-events-none">
        <div className="pointer-events-auto max-w-[46rem]">
          {/*
            The tagline and the location are each held together with
            `whitespace-nowrap`, and the row is allowed to wrap between them.

            Left as bare text nodes they became anonymous flex items that broke
            mid-phrase on a narrow viewport — "AI AUTOMATION / STUDIO" above
            "HYDERABAD, / INDIA", with the separating slash stranded on its own
            in the gap between the two. Wrapping by phrase instead puts the
            break where a person would put it.
          */}
          <p className="eyebrow mb-7 flex-wrap">
            <span className="glow-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="whitespace-nowrap">{BRAND.tagline}</span>
            <span className="text-line-strong">/</span>
            <span className="whitespace-nowrap">{BRAND.location}</span>
          </p>

          <SplitHeading
            as="h1"
            immediate
            delay={0.15}
            text={'Build systems.\nNot repetitive tasks.'}
            className="text-[length:var(--text-h1)]"
          />

          {/*
            Rewritten off the brief.

            The original read "AI-powered automations that turn complex
            workflows into intelligent systems". Every part of that is a tell:
            "AI-powered", the turn-X-into-Y construction, "intelligent systems"
            as a destination, and an em-dash coda. It was the most
            machine-written sentence left on a page that had just had every
            other one stripped, and it sat directly under the headline.

            This says the same thing as a claim someone could disagree with.
          */}
          <p className="mt-8 max-w-[34rem] text-[length:var(--text-lede)] text-ink-dim">
            I build the parts of a business that should run without anyone driving them, and I
            keep them running after they ship.
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            <MagneticButton href="#projects" variant="primary">
              View my work
            </MagneticButton>
            <MagneticButton href="#contact" variant="ghost">
              Let&rsquo;s automate
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </MagneticButton>
          </div>

        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-8 mx-auto flex w-fit flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="font-mono text-[0.62rem] tracking-[0.3em] text-faint uppercase">
          Scroll to build
        </span>
        <span className="relative block h-9 w-px overflow-hidden bg-line-strong">
          <span className="absolute inset-x-0 top-0 h-3 animate-[trace_2.2s_ease-in-out_infinite] bg-accent" />
        </span>
      </div>

      <style>{`
        @keyframes trace {
          0%   { transform: translateY(-100%); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(360%); opacity: 0; }
        }
      `}</style>
    </section>
  )
}
