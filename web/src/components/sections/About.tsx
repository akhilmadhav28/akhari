import { BRAND } from '@/constants/brand'
import { PROJECTS } from '@/constants/content'
import { Reveal } from '@/components/ui/Reveal'
import { SectionEyebrow, SplitSection } from '@/components/ui/SplitSection'

/**
 * About.
 *
 * No portrait here and no headline claiming a single builder — both retired
 * once there were two founders to represent, and a placeholder photo for one
 * of them would have been worse than none. The actual faces live on
 * `/founders`, which this section links to instead of standing in for.
 */
export function About() {
  return (
    <SplitSection id="about" side="left">
      <Reveal>
        <SectionEyebrow index="01" label="About" />
      </Reveal>

      <Reveal stagger className="mt-8 max-w-[34rem] space-y-5 text-ink-dim">
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
