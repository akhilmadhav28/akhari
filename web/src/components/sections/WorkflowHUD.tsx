import { useEffect, useRef, useState } from 'react'
import { ALL_NODES, onConnect, scroll } from '@/lib/scroll/scrollStore'
import { clamp, remap } from '@/lib/animation/math'

/**
 * A small readout of how much of the workflow is wired up.
 *
 * This replaced the old narrated beat captions. Once each module is tied to a
 * section, the sections *are* the narrative — a second stream of prose
 * alongside them was just competing with the copy. What is genuinely useful is
 * a status line: which module connected, and how many are left.
 *
 * It re-renders once per connection — seven times over the whole page — because
 * it subscribes to `onConnect` rather than to scroll position. Visibility is
 * driven separately on a rAF, so fading in and out costs no renders at all.
 */
export function WorkflowHUD() {
  const [state, setState] = useState({ connected: 0, id: null as string | null, total: 7 })
  const hud = useRef<HTMLDivElement>(null)

  useEffect(
    () => onConnect((connected, id, total) => setState({ connected, id, total })),
    [],
  )

  useEffect(() => {
    let raf = 0
    let shown = 0

    const step = () => {
      // In after the hero, out again as the closing reveal takes over — by
      // then the graph is complete and there is nothing left to report.
      const target =
        clamp(remap(scroll.progress, 0.03, 0.09)) * (1 - clamp(remap(scroll.reveal, 0.1, 0.55)))

      shown += (target - shown) * 0.12
      if (hud.current) hud.current.style.opacity = shown.toFixed(3)
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const label = ALL_NODES.find((n) => n.id === state.id)?.label ?? '—'
  const done = state.connected >= state.total

  return (
    <div
      ref={hud}
      // Hidden on narrow viewports: with full-width copy there is no free
      // corner, and a status readout sitting on top of the text it is meant to
      // accompany is worse than no readout at all.
      className="pointer-events-none fixed right-[clamp(1.25rem,5vw,4.5rem)] bottom-8 z-20 hidden flex-col items-end gap-3 lg:flex"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`font-mono text-[0.66rem] tracking-[0.16em] transition-colors duration-500 ${
            done ? 'text-sage' : 'text-ink-dim'
          }`}
        >
          {label}
        </span>
        <span className="font-mono text-[0.66rem] tracking-[0.16em] text-faint">
          {String(state.connected).padStart(2, '0')}/{String(state.total).padStart(2, '0')}
        </span>
      </div>

      {/* One tick per module. Lit ticks are the ones already wired in. */}
      <ol className="flex items-center gap-1.5">
        {Array.from({ length: state.total }, (_, i) => (
          <li
            key={i}
            className={`h-px transition-all duration-[600ms] ${
              i < state.connected
                ? done
                  ? 'w-7 bg-sage'
                  : 'w-7 bg-accent'
                : 'w-3.5 bg-line-strong'
            }`}
          />
        ))}
      </ol>
    </div>
  )
}
