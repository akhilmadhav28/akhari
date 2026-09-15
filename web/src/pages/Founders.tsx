import { useEffect } from 'react'
import { BRAND } from '@/constants/brand'
import { FOUNDERS, ORIGIN, PHILOSOPHY, PHILOSOPHY_INTRO, PROCESS } from '@/constants/founders'

/**
 * Meet the founders. A plain page, same reasoning as `pages/Privacy.tsx` —
 * no Lenis, no WorkflowScene. This is a page about the people, not the
 * product, and it needs to be readable and linkable on its own rather than
 * living as another beat in the scroll story.
 */
export function Founders() {
  useEffect(() => {
    document.title = 'Founders — Akhari'
  }, [])

  return (
    <div className="min-h-screen bg-void">
      <header className="border-b border-line">
        <div className="wrap-narrow flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label={`${BRAND.name} — home`}>
            <img
              src="/brand/logo-mark-sm.png"
              alt=""
              width={26}
              height={25}
              className="h-6 w-auto"
            />
            <span className="font-mono text-[0.78rem] tracking-[0.34em] text-ink">
              {BRAND.wordmark}
            </span>
          </a>
          <a
            href="/"
            className="font-mono text-[0.7rem] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
          >
            ← Back to site
          </a>
        </div>
      </header>

      <main className="wrap-narrow py-16 sm:py-20">
        <p className="eyebrow">
          <b>Founders</b>
          <span className="h-px w-6 bg-line-strong" />
          {BRAND.location}
        </p>

        <h1 className="mt-5 text-[2.25rem] sm:text-[2.75rem]">Two friends, one system.</h1>

        <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-dim">{ORIGIN}</p>

        <figure className="relative mt-12 aspect-[3/2] w-full overflow-hidden rounded-lg border border-line bg-surface">
          <img
            src="/founders/hari-akhil.jpg"
            alt="Hari Prasad and Akhil Madhav"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
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
          <figcaption className="mono-tag absolute bottom-2.5 left-4 text-[0.6rem] tracking-[0.16em] text-faint uppercase">
            Hari Prasad &amp; Akhil Madhav
          </figcaption>
        </figure>

        <div className="mt-14 grid gap-x-10 gap-y-10 border-t border-line pt-10 sm:grid-cols-2">
          {FOUNDERS.map((f) => (
            <div key={f.id}>
              <h2 className="text-[1.15rem] font-sans font-semibold">{f.name}</h2>
              <p className="mono-tag mt-1 text-accent">{f.role}</p>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-dim">{f.bio}</p>
            </div>
          ))}
        </div>

        {/* Addresses "what if one of you is unreachable" without overclaiming
            technical redundancy neither of us actually has — Akhil is still
            the one who builds. What's true regardless is the structural
            point: this is two founders and a real business, not a single
            freelancer's calendar with a website attached to it. */}
        <p className="mt-8 max-w-[38rem] text-[0.95rem] leading-relaxed text-ink-dim">
          Neither of us disappears if the other is unreachable for a day — Akhari is two founders
          running a real business together, not one freelancer's calendar with a website attached.
        </p>

        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Philosophy</b>
            <span className="h-px w-6 bg-line-strong" />
            What both of us actually believe
          </p>

          <h2 className="mt-5 text-[1.4rem] font-sans font-semibold text-ink">
            {PHILOSOPHY_INTRO.heading}
          </h2>
          <p className="mt-4 max-w-[38rem] text-[0.95rem] leading-relaxed text-ink-dim">
            {PHILOSOPHY_INTRO.body}
          </p>

          {/* One flowing sequence, not a card grid — these build on each
              other rather than standing as parallel, unrelated beliefs. */}
          <div className="mt-9 flex max-w-[42rem] flex-col gap-7">
            {PHILOSOPHY.map((p) => (
              <div key={p.title} className="border-t border-line pt-6">
                <h3 className="text-[1rem] font-sans font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-dim">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Process</b>
            <span className="h-px w-6 bg-line-strong" />
            What working with us is actually like
          </p>
          <div className="mt-7 grid gap-8 sm:grid-cols-2">
            {PROCESS.map((p) => (
              <div key={p.title}>
                <h3 className="text-[1rem] font-sans font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-dim">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <p className="mono-tag text-faint">
            &copy; {new Date().getFullYear()} {BRAND.wordmark}
          </p>
        </div>
      </main>
    </div>
  )
}
