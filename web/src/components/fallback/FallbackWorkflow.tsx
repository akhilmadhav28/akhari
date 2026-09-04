import { useEffect, useMemo, useRef } from 'react'
import {
  DESKTOP_FRAMING,
  EDGES,
  MAX_EDGE_DEPTH,
  MOBILE_FRAMING,
  NODES,
  type NodeType,
} from '@/constants/workflow'
import { appearAtFor } from '@/lib/scene/anchors'
import { scroll } from '@/lib/scroll/scrollStore'
import {
  damp,
  easeInOutQuart,
  easeOutBack,
  easeOutQuart,
  lerp,
  remap,
} from '@/lib/animation/math'
import { prefersReducedMotion } from '@/lib/perf/device'

/**
 * The workflow, without WebGL.
 *
 * Not a placeholder image — the same graph, the same seven modules, the same
 * per-section build order and the same travelling pulses, drawn in SVG. A
 * visitor whose browser refuses a WebGL context still watches the automation
 * assemble as they scroll; they just get a flat rendering of it instead of a lit
 * three-dimensional one.
 *
 * This matters more than it looks. Locked-down corporate laptops, stale display
 * drivers and machines with graphics acceleration switched off are a real slice
 * of traffic, and for a site whose entire argument is "I build systems that
 * work", shipping them a page with its centrepiece missing is the worst possible
 * first impression.
 *
 * Everything is driven from one rAF reading the same `scroll` store and the same
 * measured `appearAtFor` anchors the 3D scene uses, so the two versions stay in
 * lockstep by construction rather than by being kept in sync by hand.
 *
 * Units: world units × 100, y flipped, so the 3D layout is reused directly.
 */

const U = 100
const NODE_W = 178
const NODE_H = 111

/** Icons mirroring the 3D node faces, on a 24×24 grid. */
const ICONS: Record<NodeType, string> = {
  TRIGGER: 'M13.5 2 5 13.5h6l-.5 8.5L19 10.5h-6z',
  API: 'M3 8.5h15M14.5 5 18 8.5 14.5 12M21 15.5H6M9.5 12 6 15.5 9.5 19',
  AI: 'M10 3l1.9 5.6L17.5 10.5 11.9 12.4 10 18l-1.9-5.6L2.5 10.5 8.1 8.6z M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  DATABASE:
    'M12 2.4c4.4 0 8 1.4 8 3.1s-3.6 3.1-8 3.1-8-1.4-8-3.1S7.6 2.4 12 2.4zM4 5.5v13c0 1.7 3.6 3.1 8 3.1s8-1.4 8-3.1v-13M4 12c0 1.7 3.6 3.1 8 3.1s8-1.4 8-3.1',
  LOGIC: 'M3.5 12H9M9 12c5 0 5 0 5-6h6.5M9 12c5 0 5 0 5 6h6.5',
  NOTIFICATION: 'M5.5 17v-6a6.5 6.5 0 0 1 13 0v6h2.5H3zM9.6 19.6a3 3 0 0 0 4.8 0',
  OUTPUT: 'M12 3.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2zM7.8 12.2l3.1 3.1 5.5-6.5',
}

const HOP_TIME = 0.62
const PAUSE = 0.85
const CYCLE = (MAX_EDGE_DEPTH + 1) * HOP_TIME + PAUSE
const BUILD_SPAN = 0.028

interface Handles {
  group: SVGGElement | null
  nodes: Map<string, SVGGElement>
  paths: Map<string, SVGPathElement>
  pulses: Map<string, SVGCircleElement>
}

export function FallbackWorkflow() {
  const svg = useRef<SVGSVGElement>(null)
  const handles = useRef<Handles>({
    group: null,
    nodes: new Map(),
    paths: new Map(),
    pulses: new Map(),
  })

  const compact = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches

  const nodes = useMemo(() => NODES.filter((n) => !compact || n.onMobile), [compact])

  const edges = useMemo(() => {
    const present = new Set(nodes.map((n) => n.id))
    return EDGES.filter((e) => present.has(e.from) && present.has(e.to))
  }, [nodes])

  const pos = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    for (const n of nodes) {
      const p = compact ? n.mobilePosition : n.position
      map[n.id] = { x: p[0] * U, y: -p[1] * U }
    }
    return map
  }, [nodes, compact])

  /** Cable geometry, matching the 3D bezier's shape in two dimensions. */
  const paths = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of edges) {
      const a = pos[e.from]
      const b = pos[e.to]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const horizontal = Math.abs(dx) >= Math.abs(dy)

      const reach = horizontal ? dx * 0.4 : 0
      const drop = horizontal ? 0 : dy * 0.4
      const bow = -e.sag * U * 0.8

      const c1x = a.x + reach + (horizontal ? 0 : bow)
      const c1y = a.y + drop + (horizontal ? bow : 0)
      const c2x = b.x - reach + (horizontal ? 0 : bow)
      const c2y = b.y - drop + (horizontal ? bow : 0)

      map[e.id] = `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`
    }
    return map
  }, [edges, pos])

  const framing = compact ? MOBILE_FRAMING : DESKTOP_FRAMING

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const h = handles.current
    let raf = 0
    let last = performance.now()
    let clock = 0

    // Smoothed viewBox, so the pan settles rather than snapping.
    let vx = pos[nodes[0].id].x
    let vy = pos[nodes[0].id].y
    let vw = 900

    // Cache path lengths once — getTotalLength forces layout if called per frame.
    const lengths = new Map<string, number>()
    for (const e of edges) {
      const p = h.paths.get(e.id)
      if (p) lengths.set(e.id, p.getTotalLength())
    }

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const p = scroll.progress

      /* --- Modules ------------------------------------------------------- */
      for (const n of nodes) {
        const el = h.nodes.get(n.id)
        if (!el) continue

        const at = appearAtFor(n.id)
        const build = easeOutQuart(remap(p, at, at + BUILD_SPAN))
        const snap = easeOutBack(build, 1.15)

        el.style.opacity = String(build)
        el.style.transform = `translate(${pos[n.id].x}px, ${pos[n.id].y}px) scale(${(
          0.82 +
          snap * 0.18
        ).toFixed(4)})`
      }

      /* --- Cables -------------------------------------------------------- */
      for (const e of edges) {
        const path = h.paths.get(e.id)
        const len = lengths.get(e.id) ?? 0
        if (!path) continue

        const gate = Math.min(
          easeOutQuart(remap(p, appearAtFor(e.from), appearAtFor(e.from) + BUILD_SPAN)),
          easeOutQuart(remap(p, appearAtFor(e.to), appearAtFor(e.to) + BUILD_SPAN)),
        )
        const reveal = remap(gate, 0.55, 1)

        // Draw-on: dash the whole length and retract the offset.
        path.style.strokeDasharray = `${len}`
        path.style.strokeDashoffset = `${len * (1 - reveal)}`
        path.style.opacity = String(0.35 + reveal * 0.65)
      }

      /* --- Pulses -------------------------------------------------------- */
      if (reduced) {
        clock = p * CYCLE * 6
      } else {
        clock += dt
      }

      const waves = scroll.complete ? 2 : 1
      const active = new Set<string>()

      for (let w = 0; w < waves; w++) {
        const waveTime = (clock + (w * CYCLE) / waves) % CYCLE
        for (const e of edges) {
          const local = waveTime - e.depth * HOP_TIME
          if (local < 0 || local > HOP_TIME) continue

          const dot = h.pulses.get(e.id)
          const path = h.paths.get(e.id)
          const len = lengths.get(e.id) ?? 0
          if (!dot || !path) continue

          const gate = Math.min(
            easeOutQuart(remap(p, appearAtFor(e.from), appearAtFor(e.from) + BUILD_SPAN)),
            easeOutQuart(remap(p, appearAtFor(e.to), appearAtFor(e.to) + BUILD_SPAN)),
          )
          if (remap(gate, 0.55, 1) < 0.95) continue

          const t = local / HOP_TIME
          const pt = path.getPointAtLength(len * t)
          dot.setAttribute('cx', String(pt.x))
          dot.setAttribute('cy', String(pt.y))
          dot.style.opacity = String(Math.sin(t * Math.PI) * 0.95)
          active.add(e.id)
        }
      }

      for (const e of edges) {
        if (active.has(e.id)) continue
        const dot = h.pulses.get(e.id)
        if (dot) dot.style.opacity = '0'
      }

      /* --- Camera -------------------------------------------------------- */
      // Same "dwell then travel" logic the 3D controller uses, expressed as a
      // viewBox pan instead of a camera move.
      let i = 0
      while (i < nodes.length - 2 && p >= appearAtFor(nodes[i + 1].id)) i++

      const a = nodes[i]
      const b = nodes[i + 1] ?? nodes[i]
      const pa = appearAtFor(a.id)
      const pb = appearAtFor(b.id)
      const t = easeInOutQuart(remap(p, pa + (pb - pa) * 0.55, pb))

      const fa = framing[a.anchor]
      const fb = framing[b.anchor]

      let targetX = lerp(pos[a.id].x, pos[b.id].x, t) + lerp(fa.aimX, fb.aimX, t) * U
      let targetY = lerp(pos[a.id].y, pos[b.id].y, t) - lerp(fa.aimY, fb.aimY, t) * U
      let targetW = compact ? 760 : 900

      // Closing reveal: widen out to the whole network.
      const rv = easeInOutQuart(scroll.reveal)
      if (rv > 0) {
        const xs = nodes.map((n) => pos[n.id].x)
        const ys = nodes.map((n) => pos[n.id].y)
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2
        const span = Math.max(...xs) - Math.min(...xs) + NODE_W * 2.4

        targetX = lerp(targetX, cx + (compact ? 0 : -1.8 * U), rv)
        targetY = lerp(targetY, cy, rv)
        targetW = lerp(targetW, Math.max(span, compact ? 900 : 2100), rv)
      }

      // Reduced motion snaps straight to the target: the graph still tracks the
      // section you are reading, it just doesn't glide there on its own.
      const lambda = reduced ? 1e6 : 6
      vx = damp(vx, targetX, lambda, dt)
      vy = damp(vy, targetY, lambda, dt)
      vw = damp(vw, targetW, lambda, dt)

      const el = svg.current
      if (el) {
        const ratio = el.clientHeight / Math.max(1, el.clientWidth)
        const vh = vw * ratio
        el.setAttribute('viewBox', `${vx - vw / 2} ${vy - vh / 2} ${vw} ${vh}`)
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [nodes, edges, pos, framing, compact])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-void" aria-hidden="true">
      <svg
        ref={svg}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-900 -300 1800 900"
      >
        <defs>
          <radialGradient id="fw-wash" cx="38%" cy="72%" r="78%">
            <stop offset="0%" stopColor="#1A120C" />
            <stop offset="100%" stopColor="#0A0806" />
          </radialGradient>

          {/* A restrained bloom. Wide enough to separate the modules from the
              ground, nowhere near the halo the earlier version used. */}
          <filter id="fw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#fw-wash)" />

        <g ref={(el) => void (handles.current.group = el)}>
          {/* Cables first, so modules sit on top of their own connections. */}
          {edges.map((e) => {
            const accent = nodes.find((n) => n.id === e.to)?.accent ?? '#E0803F'
            return (
              <g key={e.id}>
                <path
                  ref={(el) => void (el && handles.current.paths.set(e.id, el))}
                  d={paths[e.id]}
                  fill="none"
                  stroke={accent}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={0}
                  filter="url(#fw-glow)"
                />
                <circle
                  ref={(el) => void (el && handles.current.pulses.set(e.id, el))}
                  r={11}
                  fill="#FFD9A8"
                  opacity={0}
                  filter="url(#fw-glow)"
                />
              </g>
            )
          })}

          {nodes.map((n) => (
            <g
              key={n.id}
              ref={(el) => void (el && handles.current.nodes.set(n.id, el))}
              style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <rect
                x={-NODE_W / 2}
                y={-NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={14}
                fill="#2A2521"
                stroke={n.accent}
                strokeWidth={2.5}
                filter="url(#fw-glow)"
              />
              <rect
                x={-NODE_W / 2 + 7}
                y={-NODE_H / 2 + 7}
                width={NODE_W - 14}
                height={NODE_H - 14}
                rx={9}
                fill="#17130F"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
              />

              <g
                transform={`translate(${-NODE_W / 2 + 18} ${-NODE_H / 2 + 15}) scale(1.05)`}
                fill="none"
                stroke={n.accent}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICONS[n.type]} />
              </g>

              <text
                x={NODE_W / 2 - 15}
                y={-NODE_H / 2 + 26}
                textAnchor="end"
                fill={n.accent}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={11}
                opacity={0.85}
              >
                {n.type}
              </text>

              <line
                x1={-NODE_W / 2 + 16}
                y1={-6}
                x2={NODE_W / 2 - 16}
                y2={-6}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1.5}
              />

              <text
                x={-NODE_W / 2 + 17}
                y={20}
                fill="#F2EDE4"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize={21}
                fontWeight={600}
              >
                {n.label}
              </text>
              <text
                x={-NODE_W / 2 + 17}
                y={38}
                fill="#9C9184"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={12}
              >
                {n.meta}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

export default FallbackWorkflow
