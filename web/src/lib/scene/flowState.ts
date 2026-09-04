import { EDGES, NODES } from '@/constants/workflow'

/**
 * Per-frame scene state, shared mutably between the Workflow controller and the
 * meshes that render it.
 *
 * `Workflow` does all the timing maths once per frame and writes here; nodes,
 * cables and pulses read their own slice and apply it to their transforms. The
 * alternative — passing computed values down as props — would re-render the
 * React tree every frame for no benefit, since none of this affects the DOM.
 *
 * Nothing in here is ever reallocated after init.
 */

/** Maximum simultaneous pulses on a single cable. */
export const MAX_PULSES = 4

export interface EdgeRuntime {
  /** How much of the cable is drawn, 0-1. */
  reveal: number
  /** Idle brightness once live, 0-1. */
  energy: number
  /** Pulse head positions along the cable, 0-1. -1 means the slot is empty. */
  pulses: Float32Array
}

export interface NodeRuntime {
  /** Materialisation: 0 absent, 1 fully arrived and settled. */
  build: number
  /** Socket outline opacity, 0-1. Fades out as `build` completes. */
  socket: number
  /** Illumination from a pulse arriving, 0-1. Decays on its own. */
  glow: number
  /**
   * Illumination driven from outside the 3D scene — the pipeline demo sets
   * this to 1 as each step runs, and `Workflow` folds it into `glow` and decays
   * it. It exists as its own channel because `glow` is overwritten every frame
   * by the execution loop: anything written there from the DOM would survive
   * for exactly one frame and never be seen.
   */
  demo: number
  /** Eased hover response, 0-1. Follows `hoverTarget`. */
  hover: number
  /** Set to 1/0 by pointer events; `hover` chases it so exits still ease. */
  hoverTarget: number
}

export const edgeRuntime: Record<string, EdgeRuntime> = {}
export const nodeRuntime: Record<string, NodeRuntime> = {}

for (const e of EDGES) {
  edgeRuntime[e.id] = {
    reveal: 0,
    energy: 0,
    pulses: new Float32Array(MAX_PULSES).fill(-1),
  }
}

for (const n of NODES) {
  nodeRuntime[n.id] = { build: 0, socket: 0, glow: 0, demo: 0, hover: 0, hoverTarget: 0 }
}

/**
 * Lights a module from outside the scene. Safe to call whether or not the 3D
 * layer ever mounted — on a machine with no WebGL this writes to an object
 * nothing is reading, which is exactly the desired no-op.
 */
export function pingNode(id: string): void {
  const rt = nodeRuntime[id]
  if (rt) rt.demo = 1
}

/** Resets everything to its pre-scroll state. Used on remount. */
export function resetFlowState(): void {
  for (const e of EDGES) {
    const r = edgeRuntime[e.id]
    r.reveal = 0
    r.energy = 0
    r.pulses.fill(-1)
  }
  for (const n of NODES) {
    const r = nodeRuntime[n.id]
    r.build = 0
    r.socket = 0
    r.glow = 0
    r.demo = 0
    r.hover = 0
    r.hoverTarget = 0
  }
}
