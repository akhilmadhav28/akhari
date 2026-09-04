import { PROJECTS, type Project } from '@/constants/content'
import { Reveal } from '@/components/ui/Reveal'
import { SplitHeading } from '@/components/ui/SplitHeading'
import { SectionEyebrow } from '@/components/ui/SplitSection'

/**
 * Selected work.
 *
 * The one section that deliberately does not follow the page's own template.
 *
 * Every other section is a `SplitSection`: eyebrow, two-line serif heading,
 * lede, content, held in the same column at the same left edge. Four of those
 * in a row is what makes a page read as a series of identical slides no matter
 * how well each is set — the repetition registers as monotony while scrolling
 * even when no single screen looks wrong. So this one breaks: the featured case
 * runs off the right edge of the viewport, and the rest collapse into a
 * full-width list instead of four equal cards.
 *
 * That also fixes the hierarchy problem. Four identical blocks said nothing
 * about which job matters; a lead item and a list says which one to read.
 *
 * The scene stays visible throughout — the bleed is horizontal only, and the
 * camera is pulled well back for this beat (see `DESKTOP_FRAMING.projects`), so
 * the network reads around the content rather than being covered by it.
 */

/** Left edge aligned with `.wrap`'s content box; right edge runs off frame. */
const BLEED_RIGHT = {
  paddingLeft: 'calc(max(0px, (100vw - 84rem) / 2) + clamp(1.25rem, 5vw, 4.5rem))',
}

const FEATHER = 'linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)'

export function Projects() {
  const [featured, ...rest] = PROJECTS

  return (
    <section id="projects" className="pointer-events-none relative py-[clamp(5.5rem,11vw,9.5rem)]">
      {/* Weaker and reaching further right than the other sections' scrims:
          this one has to cover a much wider block of content while still
          leaving the wide shot of the network legible behind it. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(100deg, rgba(15,12,10,0.95) 0%, rgba(15,12,10,0.89) 38%, rgba(15,12,10,0.56) 68%, rgba(15,12,10,0.16) 90%)',
          maskImage: FEATHER,
          WebkitMaskImage: FEATHER,
        }}
      />

      <div className="wrap">
        <div className="pointer-events-auto max-w-[38rem]">
          <Reveal>
            <SectionEyebrow index="03" label="Selected work" />
          </Reveal>

          <SplitHeading
            text={'Systems that\nare still running.'}
            className="text-[length:var(--text-h2)]"
          />

          <Reveal>
            <p className="mt-6 text-ink-dim">
              Real companies with real people who will tell you what actually happened. No stock
              logos, no &ldquo;500+ systems deployed&rdquo;.
            </p>
          </Reveal>
        </div>
      </div>

      <Featured project={featured} />

      <div className="wrap">
        <ul className="pointer-events-auto mt-16 border-t border-line">
          {rest.map((project, i) => (
            <ListedProject key={project.id} project={project} index={i + 2} />
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ==========================================================================
   The lead case
   ========================================================================== */

function Featured({ project }: { project: Project }) {
  return (
    <Reveal>
      <article className="pointer-events-auto mt-14" style={BLEED_RIGHT}>
        <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="order-2 max-w-[34rem] pr-[clamp(1.25rem,5vw,4.5rem)] lg:order-1 lg:pr-0">
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-accent uppercase">
              {project.client}
            </p>

            <h3 className="mt-4 text-[length:var(--text-h3)] font-semibold">{project.title}</h3>

            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-dim">{project.body}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
              <p className="text-[0.9rem] text-ink">{project.result}</p>
              <ul className="ml-auto flex flex-wrap gap-1.5">
                {project.tech.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.62rem] text-faint"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

            {project.quote && (
              <blockquote className="mt-7">
                {/* Instrument Serif ships an italic and it is already loaded for
                    the headings. Setting the client's own words in it costs
                    nothing and gives the page a second voice. It is the only
                    place the display face appears below headline size, which is
                    exactly what a pull quote is for. */}
                <p className="font-display text-[1.4rem] leading-[1.32] text-ink italic">
                  &ldquo;{project.quote}&rdquo;
                </p>
                <cite className="mono-tag mt-3 block text-faint not-italic">{project.person}</cite>
              </blockquote>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <Plate project={project} />
          </div>
        </div>
      </article>
    </Reveal>
  )
}

/**
 * The media plate.
 *
 * Shows a real screenshot when `project.image` is set. Until then it draws the
 * project's own pipeline — the same shape as the 3D graph beside it, flattened
 * into a diagram. That is deliberately not a placeholder: it is the
 * architecture the case study is describing, so the slot is finished work
 * rather than an empty frame waiting on an asset.
 */
function Plate({ project }: { project: Project }) {
  const steps = project.architecture
  const gap = 208 / Math.max(1, steps.length - 1)

  return (
    <figure className="relative aspect-[4/3] w-full overflow-hidden border border-line bg-surface/70">
      {project.image ? (
        <img
          src={project.image}
          alt={`${project.client} — ${project.title}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 400 300"
          className="h-full w-full"
          role="img"
          aria-label={`Pipeline: ${steps.join(', then ')}`}
        >
          <defs>
            <linearGradient id={`wash-${project.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#241a12" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0f0c0a" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={`url(#wash-${project.id})`} />

          {steps.map((step, i) => {
            const y = 46 + i * gap
            const x = i % 2 === 0 ? 128 : 268
            const py = 46 + (i - 1) * gap
            const px = (i - 1) % 2 === 0 ? 128 : 268

            return (
              <g key={step}>
                {i > 0 && (
                  <path
                    d={`M ${px} ${py + 13} C ${px} ${py + 34}, ${x} ${y - 34}, ${x} ${y - 13}`}
                    fill="none"
                    stroke="#443a31"
                    strokeWidth="1.4"
                  />
                )}
                <rect
                  x={x - 78}
                  y={y - 13}
                  width="156"
                  height="26"
                  rx="4"
                  fill="#17130f"
                  stroke={i === 0 ? '#e0803f' : '#2b241e'}
                />
                <circle cx={x - 66} cy={y} r="2.6" fill={i === 0 ? '#e0803f' : '#7e9c86'} />
                <text
                  x={x - 56}
                  y={y + 3.4}
                  fill="#cdc3b5"
                  fontSize="9"
                  fontFamily="'JetBrains Mono', ui-monospace, monospace"
                >
                  {step.length > 26 ? `${step.slice(0, 25)}…` : step}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {/* Registration marks, matching the portrait plate in About. */}
      {[
        'top-2 left-2 border-t border-l',
        'top-2 right-2 border-t border-r',
        'bottom-2 left-2 border-b border-l',
        'bottom-2 right-2 border-b border-r',
      ].map((pos) => (
        <span
          key={pos}
          className={`pointer-events-none absolute h-3 w-3 border-accent/45 ${pos}`}
          aria-hidden="true"
        />
      ))}

      {/* Left, not right: the plate runs off the right edge of the viewport by
          design, so anything anchored to that side gets cut. */}
      <figcaption className="mono-tag absolute bottom-2.5 left-4 text-[0.58rem] tracking-[0.16em] text-faint uppercase">
        {project.image ? project.client : 'architecture'}
      </figcaption>
    </figure>
  )
}

/* ==========================================================================
   The rest, as a list
   ========================================================================== */

function ListedProject({ project, index }: { project: Project; index: number }) {
  return (
    <li className="group border-b border-line" data-cursor-target>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-5 gap-y-3 py-7 md:grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1fr)]">
        <span className="font-mono text-[0.68rem] text-faint transition-colors duration-300 group-hover:text-accent">
          {String(index).padStart(2, '0')}
        </span>

        <div className="min-w-0">
          <p className="font-mono text-[0.62rem] tracking-[0.18em] text-accent/85 uppercase">
            {project.client}
          </p>
          <h3 className="mt-2 text-[1.0625rem] font-semibold">{project.title}</h3>
          <p className="mt-2 font-mono text-[0.66rem] leading-relaxed text-faint transition-colors duration-300 group-hover:text-muted">
            {project.architecture.map((step, si) => (
              <span key={step}>
                {si > 0 && <span className="text-accent/50"> → </span>}
                {step}
              </span>
            ))}
          </p>
        </div>

        <div className="col-start-2 md:col-start-3">
          <p className="text-[0.9rem] text-ink-dim">{project.result}</p>
          {project.quote && (
            <p className="mt-2 text-[0.82rem] text-muted">
              &ldquo;{project.quote}&rdquo;
              <span className="ml-1.5 text-faint">— {project.person}</span>
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
