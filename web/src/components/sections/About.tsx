import { BRAND } from '@/constants/brand'
import { PROJECTS } from '@/constants/content'
import { Reveal } from '@/components/ui/Reveal'
import { SplitHeading } from '@/components/ui/SplitHeading'
import { SectionEyebrow, SplitSection } from '@/components/ui/SplitSection'

/**
 * About.
 *
 * The portrait is treated as a plate in a technical document rather than a
 * profile picture — hard frame, corner registration marks, monospace caption in
 * the same typeface as the module faces. It sits inline beside the opening
 * paragraph now rather than as a full column, because the right half of the
 * viewport belongs to the graph.
 *
 * PORTRAIT SLOT — set `BRAND.portrait` once a real photograph is in
 * `public/brand/`. Until then the frame shows the mark, so the layout is never
 * broken by a missing file and no placeholder face is invented.
 */
export function About() {
  return (
    <SplitSection id="about" side="left">
      <Reveal>
        <SectionEyebrow index="01" label="About" />
      </Reveal>

      <SplitHeading
        text={'The person who scopes it\nis the person who builds it.'}
        className="text-[length:var(--text-h2)]"
      />

      <div className="mt-9 flex flex-col gap-7 sm:flex-row sm:items-start">
        <Reveal className="shrink-0">
          <figure className="relative aspect-[4/5] w-[10.5rem] overflow-hidden rounded-lg border border-line bg-surface">
            {BRAND.portrait ? (
              <img
                src={BRAND.portrait}
                alt="Akhil Madhav"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              // Copper. This wash was still the original cyan long after the
              // palette moved — it survived two rewrites because it only ever
              // renders in the no-portrait fallback state.
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_60%_at_50%_40%,rgba(224,128,63,0.16),transparent)]">
                <img
                  src="/brand/logo-mark.png"
                  alt=""
                  className="w-[46%] opacity-30"
                  loading="lazy"
                />
              </div>
            )}

            {[
              'top-2 left-2 border-t border-l',
              'top-2 right-2 border-t border-r',
              'bottom-2 left-2 border-b border-l',
              'bottom-2 right-2 border-b border-r',
            ].map((pos) => (
              <span
                key={pos}
                className={`pointer-events-none absolute h-3 w-3 border-accent/55 ${pos}`}
                aria-hidden="true"
              />
            ))}
          </figure>

          <figcaption className="mono-tag mt-2.5 text-faint">Akhil Madhav &amp; Hari Prasad</figcaption>
        </Reveal>

        <Reveal stagger className="space-y-5 text-ink-dim">
          <p>
            Akhari is Hari and me — no account manager, no offshore team, and nobody learning on
            your project. That is a deliberate limit on how much work we take, not a stage we are
            trying to grow out of.
          </p>
          <p>
            We build around how a business here actually runs. Your accounts are in Tally, your
            orders arrive on WhatsApp, half your customers pay cash on delivery. We work with that
            rather than asking you to abandon it.
          </p>
          <p>
            The systems we have built are still running months later, because the last step is the
            one most agencies skip: we keep them alive when APIs change and the business changes.
          </p>
          <p>
            <a
              href="/founders"
              className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] tracking-[0.1em] text-accent uppercase transition-colors hover:text-ink"
              data-cursor-target
            >
              Meet the founders →
            </a>
          </p>
        </Reveal>
      </div>

      <Reveal className="mt-9 flex flex-wrap gap-x-10 gap-y-5 border-t border-line pt-7">
        {[
          ['Based', BRAND.location],
          ['Working since', '2023'],
          ['Systems live', String(PROJECTS.length)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="mono-tag text-faint">{label}</p>
            <p className="mt-1 text-ink">{value}</p>
          </div>
        ))}
      </Reveal>
    </SplitSection>
  )
}
