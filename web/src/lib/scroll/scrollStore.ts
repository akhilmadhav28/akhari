import { NODES } from '@/constants/workflow'

/**
 * A mutable singleton rather than React state, on purpose.
 *
 * Scroll updates at up to 120Hz. Routing that through useState would re-render
 * the tree on every frame and make the 3D scene stutter. Instead the scroll
 * driver writes here, and `useFrame` consumers read `scroll.smoothed` directly
 * — no reconciliation, no allocation, no re-render.
 *
 * The one component that genuinely needs to re-render — the HUD showing which
 * module just connected — subscribes to `onConnect`, which fires once per
 * module: seven times over the whole page, not seven thousand.
 */
export interface ScrollState {
  /** Raw progress across the narrative, hero to closing section, 0-1. */
  progress: number
  /** Damped progress. The scene reads this so it glides instead of snapping. */
  smoothed: number
  /** Signed scroll velocity, normalised roughly to -1..1. */
  velocity: number
  /** How far into the closing reveal we are, 0-1. Wakes the system. */
  reveal: number
  /** True once every module is connected. */
  complete: boolean
  /**
   * Real-time (not scroll-driven) ramp from 0-1 over the first ~1.4s after the
   * scene mounts. The rig opens dark and comes up to its resting light level —
   * the same "system waking up" idea as `reveal`, played once on arrival
   * instead of at the close.
   */
  boot: number
}

export const scroll: ScrollState = {
  progress: 0,
  smoothed: 0,
  velocity: 0,
  reveal: 0,
  complete: false,
  boot: 0,
}

type ConnectListener = (connected: number, nodeId: string | null, total: number) => void

const listeners = new Set<ConnectListener>()
let lastCount = -1

/** Subscribe to module connections. Returns an unsubscribe function. */
export function onConnect(fn: ConnectListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Called by the scene once per frame with how many modules are currently
 * connected. Notifies only when that count actually changes — `total` comes
 * from the scene rather than the full node list because compact viewports
 * render a reduced graph.
 */
export function reportConnected(count: number, nodeId: string | null, total: number): void {
  if (count === lastCount) return
  lastCount = count
  for (const fn of listeners) fn(count, nodeId, total)
}

export const ALL_NODES = NODES
