import { SERVICES } from '@/constants/content'
import { Reveal } from '@/components/ui/Reveal'
import { SplitHeading } from '@/components/ui/SplitHeading'
import { SectionEyebrow, SplitSection } from '@/components/ui/SplitSection'
import { PipelineDemo } from './PipelineDemo'

/**
 * What I build.
 *
 * A single compact column rather than a card grid — the section now occupies
 * half the viewport, and five equal boxes squeezed into that space would read as
 * a menu. As a list it reads as an inventory, and each row is short enough that
 * the whole offer is legible in one pass while the AI module connects alongside.
 */
export function Services() {
  return (
    <SplitSection id="services" side="right">
      <Reveal>
        <SectionEyebrow index="02" label="What I build" />
      </Reveal>

      <SplitHeading
        text={'Five things,\ndone properly.'}
        className="text-[length:var(--text-h2)]"
      />

      <Reveal>
        <p className="mt-6 max-w-[34rem] text-[length:var(--text-lede)] text-ink-dim">
          Plain names for what other studios call agentic orchestration. Same work — I would just
          rather tell you what it does.
        </p>
      </Reveal>

      <Reveal stagger as="ul" className="mt-10 flex flex-col gap-px overflow-hidden rounded-xl bg-line">
        {SERVICES.map((service, i) => (
          <li
            key={service.id}
            className="group relative flex gap-5 bg-surface/85 p-6 backdrop-blur-md transition-colors duration-300 hover:bg-surface-2/85"
            data-cursor-target
          >
            {/* Bare, not boxed. A grid of rounded-square icon chips is the
                single most templated component on the internet. */}
            <span className="mt-1 shrink-0 text-accent/85 transition-colors duration-300 group-hover:text-accent">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={service.icon} />
              </svg>
            </span>

            <div className="min-w-0">
              <div className="flex items-baseline gap-3">
                <h3 className="text-[1.0625rem] font-semibold">{service.title}</h3>
                <span
                  className="ml-auto font-mono text-[0.6rem] tracking-[0.2em] text-faint transition-colors duration-300 group-hover:text-accent"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">{service.body}</p>
            </div>
          </li>
        ))}
      </Reveal>

      {/* The list above says what gets built. This runs one. */}
      <Reveal>
        <PipelineDemo />
      </Reveal>
    </SplitSection>
  )
}
