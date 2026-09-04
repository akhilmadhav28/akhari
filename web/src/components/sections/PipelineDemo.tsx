import { useCallback, useEffect, useRef, useState } from 'react'
import { extract, SAMPLES, type Extraction } from '@/lib/demo/extract'
import { pingNode } from '@/lib/scene/flowState'
import { prefersReducedMotion } from '@/lib/perf/device'

/**
 * The live one.
 *
 * Everything else on this page describes the work. This runs it: a visitor
 * types the kind of message that actually arrives — half-punctuated, missing
 * half the details — and watches it come out the other end as fields, a route,
 * a log entry and a drafted reply.
 *
 * Two things make it worth the space it takes:
 *
 *   · **It genuinely reads the input.** Nothing here is on rails. Change
 *     "friday" to "tomorrow" and the resolved date changes; delete the phone
 *     number and the contact field disappears; write it as a complaint and it
 *     routes somewhere else with a different SLA. A scripted animation would
 *     have been a tenth of the work and would fall apart the moment anyone
 *     typed something of their own — which is the first thing anyone does.
 *
 *   · **It drives the actual 3D graph.** Each step pings its real module in the
 *     scene behind the page, so the thing being explained and the thing on
 *     screen are the same thing. See `pingNode`.
 *
 * The "runs in your browser" label is not a disclaimer, it is the point: no
 * key, no server, nothing to rate-limit, so it still works the week this link
 * gets pasted into a group chat. `extract` is the one function a real
 * deployment swaps for a model call — everything around it stays.
 */

interface Step {
  /** Module in the 3D graph this step corresponds to. */
  node: string
  label: string
  /** Milliseconds this step is held before the next begins. */
  ms: number
  detail: (x: Extraction) => string
}

const STEPS: Step[] = [
  { node: 'trigger', label: 'Trigger', ms: 200, detail: (x) => `${x.channel} · inbound` },
  { node: 'api', label: 'Normalise', ms: 170, detail: () => 'trimmed, deduped, timestamped' },
  {
    node: 'ai',
    label: 'Classify + extract',
    // The long one on purpose. This is the step that costs money and time in a
    // real deployment, and flattening every step to the same duration is what
    // makes a progress animation feel fake.
    ms: 520,
    detail: (x) =>
      `${x.intent.toLowerCase()} · ${x.urgency} priority · ${x.fields.length} field${
        x.fields.length === 1 ? '' : 's'
      }`,
  },
  { node: 'logic', label: 'Route', ms: 190, detail: (x) => `${x.route} · respond in ${x.sla}` },
  { node: 'database', label: 'Log', ms: 230, detail: (x) => `row ${x.ref}` },
  { node: 'notification', label: 'Draft reply', ms: 300, detail: (x) => `ready on ${x.channel}` },
  { node: 'output', label: 'Done', ms: 150, detail: () => 'handed back' },
]

type Status = 'idle' | 'running' | 'done'

export function PipelineDemo() {
  const [value, setValue] = useState(SAMPLES[0].text)
  const [status, setStatus] = useState<Status>('idle')
  const [done, setDone] = useState(0)
  const [result, setResult] = useState<Extraction | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const timers = useRef<number[]>([])

  const clear = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }, [])

  useEffect(() => clear, [clear])

  const run = useCallback(() => {
    const text = value.trim()
    if (!text) return

    clear()

    // Extraction is synchronous and takes well under a millisecond. The staged
    // reveal that follows is presentation: seven results appearing in the same
    // frame is unreadable, and a pipeline you cannot watch step through is not
    // demonstrating anything.
    const started = performance.now()
    const x = extract(text)

    setResult(x)
    setDone(0)
    setStatus('running')

    if (prefersReducedMotion()) {
      for (const s of STEPS) pingNode(s.node)
      setDone(STEPS.length)
      setElapsed(performance.now() - started)
      setStatus('done')
      return
    }

    let at = 0
    STEPS.forEach((step, i) => {
      at += step.ms
      timers.current.push(
        window.setTimeout(() => {
          // Light the corresponding module in the 3D scene behind the page.
          pingNode(step.node)
          setDone(i + 1)
          if (i === STEPS.length - 1) {
            setElapsed(performance.now() - started)
            setStatus('done')
          }
        }, at),
      )
    })
  }, [value, clear])

  const reset = (text: string) => {
    clear()
    setValue(text)
    setStatus('idle')
    setDone(0)
    setResult(null)
  }

  const running = status === 'running'

  return (
    // `paper` inverts the theme variables for everything inside — see index.css.
    <div className="panel panel-sheen paper mt-12 p-6" data-cursor-target>
      <div className="flex items-baseline gap-3">
        <h3 className="text-[0.95rem] font-semibold">Try it on a real message</h3>
        {/* Said plainly and up front. A demo that overstates what it is doing
            is worse than no demo on a page selling honest systems. */}
        <span className="ml-auto font-mono text-[0.6rem] tracking-[0.14em] text-faint uppercase">
          Runs in your browser
        </span>
      </div>

      <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
        Edit it, or write your own the way a customer actually would. It reads what you type —
        change the day, drop the phone number, make it a complaint, and watch the routing change.
      </p>

      <label className="sr-only" htmlFor="demo-input">
        Incoming message
      </label>
      <textarea
        id="demo-input"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (status !== 'idle') {
            clear()
            setStatus('idle')
            setDone(0)
            setResult(null)
          }
        }}
        rows={3}
        spellCheck={false}
        className="mt-4 w-full resize-none rounded-lg border border-line bg-abyss/70 p-3.5 font-mono text-[0.78rem] leading-relaxed text-ink-dim outline-none transition-colors focus:border-accent/60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => reset(s.text)}
            className="rounded-full border border-line px-3 py-1 font-mono text-[0.62rem] tracking-[0.1em] text-faint uppercase transition-colors hover:border-line-strong hover:text-ink-dim"
          >
            {s.label}
          </button>
        ))}

        <button
          type="button"
          onClick={run}
          disabled={running || !value.trim()}
          className="btn btn-primary ml-auto !min-h-9 !px-4 !text-[0.8rem] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {running ? 'Running…' : status === 'done' ? 'Run again' : 'Run'}
        </button>
      </div>

      {/* --- Pipeline readout ------------------------------------------------
          Rendered at a fixed height from the moment a run starts, so completing
          steps never push the reply block down the page under the reader. */}
      {result && (
        <div className="mt-6 border-t border-line pt-5">
          <ol className="relative flex flex-col gap-2 pl-5" aria-live="polite">
            {/* The spine. Draws downward as steps land — the same gesture as a
                cable drawing on in the scene, which is what it is standing in
                for at this size. */}
            <span className="absolute top-1 bottom-1 left-[3px] w-px bg-line" aria-hidden="true" />
            <span
              className="absolute top-1 left-[3px] w-px origin-top bg-accent transition-transform duration-300 ease-out"
              style={{
                bottom: '0.25rem',
                transform: `scaleY(${done / STEPS.length})`,
              }}
              aria-hidden="true"
            />

            {STEPS.map((step, i) => {
              const landed = i < done
              return (
                <li
                  key={step.node}
                  className={`relative flex items-baseline gap-3 transition-opacity duration-300 ${
                    landed ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  <span
                    className={`absolute top-[0.42rem] -left-5 h-[7px] w-[7px] rounded-full transition-colors duration-300 ${
                      landed ? 'glow-dot bg-accent' : 'bg-line-strong'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="w-[8.5rem] shrink-0 text-[0.8rem] text-ink">{step.label}</span>
                  <span className="font-mono text-[0.7rem] text-muted">
                    {landed ? step.detail(result) : '—'}
                  </span>
                </li>
              )
            })}
          </ol>

          {status === 'done' && (
            <>
              {result.fields.length > 0 && (
                <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
                  {result.fields.map((f) => (
                    <div key={f.label}>
                      <dt className="font-mono text-[0.58rem] tracking-[0.14em] text-faint uppercase">
                        {f.label}
                      </dt>
                      <dd className="mt-0.5 text-[0.82rem] text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-5 rounded-lg border border-line bg-abyss/60 p-4">
                <p className="font-mono text-[0.58rem] tracking-[0.14em] text-faint uppercase">
                  Drafted reply · {result.channel}
                </p>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-dim">{result.reply}</p>
              </div>

              <p className="mt-3 font-mono text-[0.6rem] tracking-[0.12em] text-faint">
                {/* Real measurement of the real run, staged delays included —
                    not a number chosen to look impressive. */}
                {STEPS.length} steps · {Math.round(elapsed)}ms
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
