import { useEffect, useMemo, useState } from 'react'
import { BRAND } from '@/constants/brand'
import {
  AWARENESS_POINTS,
  CONSISTENCY_CAVEAT,
  CONSISTENCY_FLAGS,
  GLOSSARY,
  MYTHS,
  READINESS_SIGNALS,
  SCORE_BANDS,
  TIERS,
} from '@/constants/isAutomationForYou'

/**
 * "Is automation for you?" — a plain page, same reasoning as Privacy/Founders:
 * no Lenis, no WorkflowScene, no cursor beyond `data-cursor-target` on the
 * checklist rows (harmless — the cursor component itself just doesn't mount
 * off a coarse pointer or reduced motion, same as everywhere else).
 *
 * Unlike every other page on the Site, this one is not trying to win a
 * client. It exists because a lot of business owners who would
 * genuinely benefit from automation never get as far as considering it,
 * because nothing they've read has told them plainly whether it applies to a
 * business that runs the way theirs does. Order: awareness (does this apply
 * to me) -> myths (what's actually true) -> tiers (how scary is this really)
 * -> glossary (what do these words mean) -> self-assessment (is it me,
 * specifically) -> one soft link out, not a CTA block. Each section is meant
 * to remove one objection before the next assumes it's gone.
 */
export function IsAutomationForYou() {
  useEffect(() => {
    document.title = 'Is automation for you? · Akhari'
  }, [])

  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const signalCount = useMemo(
    () => READINESS_SIGNALS.filter((s) => checked.has(s.id)).length,
    [checked],
  )
  const hasFlag = useMemo(() => CONSISTENCY_FLAGS.some((f) => checked.has(f.id)), [checked])
  const band = useMemo(
    () => SCORE_BANDS.find((b) => signalCount >= b.min && signalCount <= b.max),
    [signalCount],
  )
  const showResult = checked.size > 0

  return (
    <div className="min-h-dvh bg-void">
      <header className="border-b border-line">
        <div className="wrap-narrow flex h-20 items-center justify-between">
          <a href="/" className="tap flex items-center gap-3" aria-label={`${BRAND.name} · home`}>
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
            className="tap font-mono text-[0.7rem] max-sm:text-[0.75rem] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
          >
            ← Back to site
          </a>
        </div>
      </header>

      <main className="wrap-narrow py-16 sm:py-20">
        <p className="eyebrow">
          <b>For business owners</b>
          <span className="h-px w-6 bg-line-strong" />
          No pitch on this page
        </p>

        <h1 className="mt-5 text-[2.25rem] sm:text-[2.75rem]">Is automation for you?</h1>

        <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-dim">
          Not a sales page, a plain answer to a question a lot of business owners have
          and nobody has told them straight: whether any of this is actually meant for a
          business that runs the way yours does.
        </p>

        {/* Section 1 — awareness */}
        <div className="mt-14 grid gap-x-10 gap-y-10 border-t border-line pt-10 sm:grid-cols-3">
          {AWARENESS_POINTS.map((p) => (
            <div key={p.title}>
              <h2 className="text-[1.05rem] font-sans font-semibold text-ink">{p.title}</h2>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-dim">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Section 2 — myths */}
        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Myths</b>
            <span className="h-px w-6 bg-line-strong" />
            What owners usually assume
          </p>
          <div className="mt-7 space-y-8">
            {MYTHS.map((m) => (
              <div key={m.claim}>
                <p className="text-[1.05rem] text-ink-dim italic">{m.claim}</p>
                <p className="mt-3 max-w-[38rem] text-[0.95rem] leading-relaxed text-ink">
                  <span className="mono-tag mr-2 text-accent">Actually</span>
                  {m.reality}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — tiers */}
        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Levels</b>
            <span className="h-px w-6 bg-line-strong" />
            Not everything is the same kind of leap
          </p>
          <div className="mt-7 grid gap-8 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.level}>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[0.8rem] text-faint">{t.level}</span>
                  <h3 className="text-[1rem] font-sans font-semibold text-ink">{t.name}</h3>
                </div>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-dim">{t.description}</p>
                <p className="mt-2.5 font-mono text-[0.76rem] leading-relaxed text-muted">
                  {t.example}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — glossary */}
        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Glossary</b>
            <span className="h-px w-6 bg-line-strong" />
            The words, translated
          </p>
          <dl className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term}>
                <dt className="mono-tag text-accent">{g.term}</dt>
                <dd className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-dim">
                  {g.definition}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Section 5 — the self-assessment. The one interactive element on
            this page, and the one most likely to get screenshotted into a
            WhatsApp group, which is how this audience actually shares things.
            Ungated, instant, client-side only — nothing here is stored,
            logged or sent anywhere; see Privacy.tsx Section 2 for the same
            commitment already made about the homepage's live demo. */}
        <div className="mt-16 border-t border-line pt-10">
          <p className="eyebrow">
            <b>Check for yourself</b>
            <span className="h-px w-6 bg-line-strong" />
            Nothing here is recorded or sent anywhere
          </p>

          <div className="panel panel-sheen paper mt-7 p-6 sm:p-8">
            <p className="text-[0.95rem] leading-relaxed">
              Tick whatever is true of your business today.
            </p>

            <div className="mt-5 flex flex-col divide-y divide-line">
              {READINESS_SIGNALS.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 py-3"
                  data-cursor-target
                >
                  <input
                    type="checkbox"
                    checked={checked.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span className="text-[0.95rem] leading-relaxed">{item.label}</span>
                </label>
              ))}
            </div>

            <p className="mt-6 text-[0.8rem] text-faint">Also worth being honest about:</p>
            <div className="mt-2 flex flex-col divide-y divide-line">
              {CONSISTENCY_FLAGS.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 py-3"
                  data-cursor-target
                >
                  <input
                    type="checkbox"
                    checked={checked.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span className="text-[0.95rem] leading-relaxed">{item.label}</span>
                </label>
              ))}
            </div>

            {showResult && band && (
              <div className="mt-6 border-t border-line pt-6">
                <p className="mono-tag text-accent">{band.verdict}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed">{band.body}</p>

                {hasFlag && (
                  <div className="mt-5 border-t border-line pt-5">
                    <p className="mono-tag text-accent">{CONSISTENCY_CAVEAT.title}</p>
                    <p className="mt-2 text-[0.95rem] leading-relaxed">{CONSISTENCY_CAVEAT.body}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Closing — one line, one link, no button, no CTA block. Founders.tsx
            already sets the precedent that this Site can describe an offer
            without selling it; this page has even less reason to end any
            other way. */}
        <p className="mt-14 max-w-[38rem] text-[0.95rem] leading-relaxed text-ink-dim">
          If any of this looked like your business, the next step is small: one free call that
          maps what is actually happening before anyone talks about building anything.{' '}
          <a
            href={`mailto:${BRAND.email}`}
            className="text-accent underline underline-offset-2 hover:text-ink"
          >
            Start there
          </a>
          , or keep reading the rest of the site first. There is no rush either way.
        </p>

        <div className="mt-14 border-t border-line pt-8">
          <p className="mono-tag text-faint">
            &copy; {new Date().getFullYear()} {BRAND.wordmark}
          </p>
        </div>
      </main>
    </div>
  )
}
