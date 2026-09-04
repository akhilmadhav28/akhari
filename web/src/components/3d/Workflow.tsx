import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { EDGES, MAX_EDGE_DEPTH, NODES } from '@/constants/workflow'
import type { DeviceProfile } from '@/lib/perf/device'
import { prefersReducedMotion } from '@/lib/perf/device'
import { scroll, reportConnected } from '@/lib/scroll/scrollStore'
import { appearAtFor } from '@/lib/scene/anchors'
import { edgeRuntime, MAX_PULSES, nodeRuntime } from '@/lib/scene/flowState'
import { buildEdgeCurve } from '@/lib/three/curves'
import { damp, easeOutQuart, remap } from '@/lib/animation/math'
import { WorkflowNode } from './WorkflowNode'
import { Connection } from './Connection'
import { DataPulse } from './DataPulse'
import { RobotFigure } from './RobotFigure'

/**
 * The automation graph, and the single place that decides what it is doing.
 *
 * Everything scroll- and time-dependent is computed here once per frame and
 * written into `flowState`. Nodes, cables and pulses then read their own slice
 * and apply it. Keeping the maths in one loop means the whole scene costs one
 * pass over seven edges and seven nodes, and no child ever re-renders.
 *
 * Arrival points come from `appearAtFor`, which is measured from the live DOM —
 * so each module connects when its section is reached, whatever height that
 * section happens to be.
 */

/** Scroll distance a module takes to materialise and settle. */
const BUILD_SPAN = 0.028

/** Seconds for one pulse to traverse one cable. */
const HOP_TIME = 0.62

/** Quiet beat between waves, so execution reads as discrete runs. */
const PAUSE = 0.85

const CYCLE = (MAX_EDGE_DEPTH + 1) * HOP_TIME + PAUSE

interface WorkflowProps {
  profile: DeviceProfile
  onNodeHover: (id: string, hovering: boolean) => void
}

export function Workflow({ profile, onNodeHover }: WorkflowProps) {
  const execClock = useRef(0)
  const reduced = useRef(prefersReducedMotion())

  /* --- Layout ------------------------------------------------------------ */

  const nodes = useMemo(
    () => NODES.filter((n) => !profile.isCompact || n.onMobile),
    [profile.isCompact],
  )

  const edges = useMemo(() => {
    const present = new Set(nodes.map((n) => n.id))
    return EDGES.filter((e) => present.has(e.from) && present.has(e.to))
  }, [nodes])

  const positions = useMemo(() => {
    const map: Record<string, THREE.Vector3> = {}
    for (const n of nodes) {
      map[n.id] = new THREE.Vector3(...(profile.isCompact ? n.mobilePosition : n.position))
    }
    return map
  }, [nodes, profile.isCompact])

  const curves = useMemo(() => {
    const map: Record<string, THREE.CubicBezierCurve3> = {}
    for (const e of edges) {
      map[e.id] = buildEdgeCurve(positions[e.from], positions[e.to], e.sag)
    }
    return map
  }, [edges, positions])

  /** A cable takes the colour of the module it feeds. */
  const accents = useMemo(() => {
    const byId = new Map(NODES.map((n) => [n.id, n.accent]))
    const map: Record<string, string> = {}
    for (const e of edges) map[e.id] = byId.get(e.to) ?? '#3DE8FF'
    return map
  }, [edges])

  /* --- Per-frame simulation ---------------------------------------------- */

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = scroll.smoothed

    // 1 — Modules materialise and settle as their section is reached, and their
    //     glow decays from whatever the previous frame's pulses left behind.
    let connected = 0
    let latestId: string | null = null

    for (const n of nodes) {
      const rt = nodeRuntime[n.id]
      const at = appearAtFor(n.id)

      rt.build = easeOutQuart(remap(p, at, at + BUILD_SPAN))

      const socketIn = remap(p, at - n.socketLead, at - n.socketLead + 0.015)
      rt.socket = socketIn * (1 - rt.build)

      rt.glow = damp(rt.glow, 0, 3.4, dt)

      // The pipeline demo lights modules from the DOM. Folded in here, after
      // the decay and before the execution loop's Math.max, so a demo step and
      // a passing pulse reinforce rather than cancel each other. Decays more
      // slowly than a pulse hit — a step in the demo is something the visitor
      // is reading, not something flying past.
      if (rt.demo > 0.001) {
        rt.demo = damp(rt.demo, 0, 2.1, dt)
        rt.glow = Math.max(rt.glow, rt.demo)
      }

      if (rt.build > 0.6) {
        connected++
        latestId = n.id
      }
    }

    reportConnected(connected, latestId, nodes.length)

    // 2 — Cables draw on once both ends have very nearly landed, so a wire
    //     never hangs off a module that is still flying in.
    for (const e of edges) {
      const rt = edgeRuntime[e.id]
      const gate = Math.min(nodeRuntime[e.from].build, nodeRuntime[e.to].build)
      rt.reveal = damp(rt.reveal, remap(gate, 0.55, 1), 7, dt)
      rt.pulses.fill(-1)
    }

    // 3 — Execution. A cable carries traffic as soon as it is live, so the
    //     workflow is visibly working while it is still being built. Once the
    //     graph is complete the whole network runs several waves at once.
    const waves = scroll.complete ? (profile.tier === 'low' ? 2 : 3) : 1

    if (reduced.current) {
      // No autonomous motion: scroll position drives the pulses directly, so
      // the story still plays but nothing moves unless the visitor does.
      execClock.current = p * CYCLE * 6
    } else {
      execClock.current += dt
    }

    for (let w = 0; w < waves; w++) {
      const waveTime = (execClock.current + (w * CYCLE) / waves) % CYCLE

      for (const e of edges) {
        const rt = edgeRuntime[e.id]
        if (rt.reveal < 0.95) continue

        // Edges sharing a depth fire together — this is what makes the two
        // branches execute in parallel rather than in sequence.
        const local = waveTime - e.depth * HOP_TIME
        if (local < 0 || local > HOP_TIME) continue

        const t = local / HOP_TIME

        for (let s = 0; s < MAX_PULSES; s++) {
          if (rt.pulses[s] < 0) {
            rt.pulses[s] = t
            break
          }
        }

        // Illuminate the module the pulse is leaving, then the one it lands
        // on. Max() rather than assignment so converging branches add up.
        if (t < 0.12) {
          const from = nodeRuntime[e.from]
          from.glow = Math.max(from.glow, 1 - remap(t, 0, 0.12))
        }
        if (t > 0.88) {
          const to = nodeRuntime[e.to]
          to.glow = Math.max(to.glow, remap(t, 0.88, 1))
        }
      }
    }

    // 4 — Cable brightness lifts as the system comes fully online.
    const energyTarget = 0.55 + scroll.reveal * 0.45
    for (const e of edges) {
      const rt = edgeRuntime[e.id]
      rt.energy = damp(rt.energy, energyTarget * rt.reveal, 4, dt)
    }
  })

  return (
    <group>
      {/* Behind the cables in world space, so the network crosses in front of
          the figure rather than being pasted beside it. */}
      <RobotFigure profile={profile} />

      {edges.map((edge) => (
        <Connection
          key={edge.id}
          edge={edge}
          curve={curves[edge.id]}
          accent={accents[edge.id]}
          segments={profile.curveSegments}
        />
      ))}

      <DataPulse curves={curves} accents={accents} />

      {nodes.map((def, i) => (
        <WorkflowNode
          key={def.id}
          def={def}
          position={positions[def.id]}
          // Deterministic pseudo-random per node: varied entries, stable
          // across reloads so the choreography never changes shape.
          seed={(((i * 0.6180339887) % 1) + 1) % 1}
          onHover={onNodeHover}
        />
      ))}
    </group>
  )
}
