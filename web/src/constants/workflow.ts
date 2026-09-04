import { C } from './brand'

/**
 * The automation graph.
 *
 * Single source of truth for the 3D scene: node identity and placement, how the
 * graph is wired, and — importantly — which page section each module belongs to.
 *
 * Modules are no longer scheduled against a synthetic scroll stage. Each one is
 * anchored to a real section of the document, and its actual appearance point is
 * measured from the DOM at runtime (see `lib/scene/anchors.ts`). Reaching About
 * connects a module; reaching What I Build connects the next; by the time the
 * visitor is at the bottom the workflow is complete and the system wakes up.
 *
 * The consequence: section heights can change freely — copy edits, new cards,
 * a different viewport — and the choreography stays in sync, because nothing
 * here hardcodes a scroll offset.
 */

export type NodeType =
  | 'TRIGGER'
  | 'API'
  | 'AI'
  | 'DATABASE'
  | 'LOGIC'
  | 'NOTIFICATION'
  | 'OUTPUT'

/** Sections that modules can be anchored to, in document order. */
export type AnchorId = 'top' | 'about' | 'services' | 'projects' | 'contact'

/** Which side of the viewport the section's copy occupies. */
export type ContentSide = 'left' | 'right' | 'center'

export const ANCHOR_SIDES: Record<AnchorId, ContentSide> = {
  top: 'left',
  about: 'left',
  services: 'right',
  projects: 'left',
  contact: 'center',
}

export interface WorkflowNodeDef {
  id: string
  type: NodeType
  label: string
  /** Small monospace line under the label on the node face. */
  meta: string
  accent: string
  position: [number, number, number]
  mobilePosition: [number, number, number]
  onMobile: boolean

  /** Section this module belongs to. */
  anchor: AnchorId
  /** Where within that section it lands, 0 = section top, 1 = section bottom. */
  anchorAt: number
  /**
   * How far ahead of arrival the empty socket shows, in progress units. The AI
   * module gets a long lead so its slot sits visibly waiting across the
   * preceding section — the workflow is incomplete until intelligence arrives.
   */
  socketLead: number
}

export interface EdgeDef {
  id: string
  from: string
  to: string
  /**
   * Hops from the trigger. Edges sharing a depth fire at the same moment, which
   * is what makes the branches execute in parallel once the system is live.
   */
  depth: number
  /** Lateral bow of the cable. Keeps parallel runs from overlapping. */
  sag: number
}

/* ==========================================================================
   Nodes
   ========================================================================== */

export const NODES: WorkflowNodeDef[] = [
  {
    id: 'trigger',
    type: 'TRIGGER',
    label: 'Trigger',
    meta: 'webhook',
    accent: C.accent,
    position: [-8.6, 0.2, 0.6],
    mobilePosition: [-1.5, 4.6, 0.3],
    onMobile: true,
    anchor: 'top',
    // Already assembled on first paint — the hero must open on a real object.
    anchorAt: -0.4,
    socketLead: 0.01,
  },
  {
    id: 'api',
    type: 'API',
    label: 'API',
    meta: 'GET /orders',
    accent: C.sage,
    position: [-4.9, 0.75, -0.9],
    mobilePosition: [1.4, 2.5, -0.4],
    onMobile: true,
    anchor: 'about',
    anchorAt: 0.3,
    socketLead: 0.04,
  },
  {
    id: 'ai',
    type: 'AI',
    label: 'AI',
    meta: 'classify + decide',
    accent: C.accent,
    position: [-0.6, 0.05, 0.9],
    mobilePosition: [-1.2, 0.2, 0.4],
    onMobile: true,
    anchor: 'services',
    anchorAt: 0.16,
    // Long lead: the empty slot is visible right through About.
    socketLead: 0.16,
  },
  {
    id: 'database',
    type: 'DATABASE',
    label: 'Database',
    meta: 'upsert row',
    accent: C.brass,
    position: [3.0, -1.05, -1.5],
    mobilePosition: [1.6, -2.0, -0.6],
    onMobile: false,
    anchor: 'services',
    anchorAt: 0.66,
    socketLead: 0.05,
  },
  {
    id: 'logic',
    type: 'LOGIC',
    label: 'Logic',
    meta: 'if / else',
    // Neutral steel, which suits the one module that decides rather than acts —
    // and breaks up what used to be three sage nodes out of seven, close enough
    // together that API, Database and Logic read as near-duplicates.
    accent: C.steelLight,
    position: [3.3, 1.3, 0.7],
    mobilePosition: [1.5, -2.1, 0.3],
    onMobile: true,
    anchor: 'projects',
    anchorAt: 0.14,
    socketLead: 0.05,
  },
  {
    id: 'notification',
    type: 'NOTIFICATION',
    label: 'Notify',
    meta: 'WhatsApp',
    accent: C.rust,
    position: [7.2, 2.05, -0.4],
    mobilePosition: [-1.6, -4.4, -0.3],
    onMobile: false,
    anchor: 'projects',
    anchorAt: 0.6,
    socketLead: 0.05,
  },
  {
    id: 'output',
    type: 'OUTPUT',
    label: 'Output',
    meta: 'done',
    accent: C.brass,
    position: [7.6, -0.35, 1.1],
    mobilePosition: [-1.4, -4.6, 0.3],
    onMobile: true,
    // The last cable lands as the closing section arrives. That completion is
    // what wakes the system up.
    anchor: 'contact',
    anchorAt: 0.06,
    socketLead: 0.05,
  },
]

/* ==========================================================================
   Edges
   ========================================================================== */

export const EDGES: EdgeDef[] = [
  { id: 'e-trigger-api', from: 'trigger', to: 'api', depth: 0, sag: 0.55 },
  { id: 'e-api-ai', from: 'api', to: 'ai', depth: 1, sag: -0.5 },
  { id: 'e-ai-database', from: 'ai', to: 'database', depth: 2, sag: -0.85 },
  { id: 'e-ai-logic', from: 'ai', to: 'logic', depth: 2, sag: 0.9 },
  { id: 'e-logic-notification', from: 'logic', to: 'notification', depth: 3, sag: 0.6 },
  { id: 'e-logic-output', from: 'logic', to: 'output', depth: 3, sag: -0.45 },
  // The join. Without it the graph reads as a tree; with it, as a system.
  { id: 'e-database-output', from: 'database', to: 'output', depth: 3, sag: -0.7 },
]

export const MAX_EDGE_DEPTH = EDGES.reduce((m, e) => Math.max(m, e.depth), 0)

/** Graph centroid, used for the closing wide shot. */
export function centroid(compact: boolean): [number, number, number] {
  const list = NODES.filter((n) => !compact || n.onMobile)
  const sum = list.reduce(
    (acc, n) => {
      const p = compact ? n.mobilePosition : n.position
      return [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]] as [number, number, number]
    },
    [0, 0, 0] as [number, number, number],
  )
  return [sum[0] / list.length, sum[1] / list.length, sum[2] / list.length]
}

/* ==========================================================================
   Camera framing
   ========================================================================== */

export interface Framing {
  /** Distance from the focus point. */
  distance: number
  /** Camera height above the focus point. */
  height: number
  /**
   * Where the camera *aims*, relative to the module it is following.
   *
   * Offsetting the aim rather than the camera is what actually moves the
   * subject around the frame — shift the camera sideways while still looking
   * straight at the module and it stays dead centre, just viewed from an angle.
   * Aiming left of the module pushes it to the right of the frame.
   */
  aimX: number
  /** Positive aims above the module, pushing it below the frame's centre. */
  aimY: number
  fov: number
  /** Amplitude of the slow orbital drift, in world units. */
  orbit: number
  /** Camera roll in radians. Tiny values only — this is a tilted head, not a
   *  Dutch angle. Applied after lookAt, which otherwise forces level. */
  roll: number
}

/**
 * One shot per section, not one shot per side.
 *
 * This used to be keyed by which half the copy occupied, which meant all three
 * left-copy sections shared a single identical setup — same distance, same
 * height, same field of view. Every module therefore appeared at the same size
 * from the same angle, five times running, and the scroll read as one move
 * repeated rather than a sequence of shots.
 *
 * Keyed by section, each beat can be composed:
 *
 *   top       a held medium shot, module well right so the headline has room
 *   about     closer and lower, looking slightly up at the module
 *   services  the close-up — the face fills enough of the frame to be read,
 *             which is the point when the copy beside it is about what the
 *             model actually does
 *   projects  pulled right back; several modules and the cables between them
 *   contact   opening out, on its way to the closing wide shot
 *
 * `aimX` sign follows the copy: negative aims left of the module and pushes it
 * into the right half, positive does the reverse. Note that the usable offset
 * shrinks with distance — the frame is narrower in world units up close, so the
 * services close-up needs a much smaller aimX than the wide projects shot to
 * put the module in the same place on screen.
 */
export const DESKTOP_FRAMING: Record<AnchorId, Framing> = {
  top: { distance: 6.9, height: 1.0, aimX: -2.5, aimY: 0.15, fov: 40, orbit: 0.16, roll: 0 },
  // Closer and lower than the hero, but not as close as it first was: at 5.2 the
  // module was wider than the free half and its right edge ran off frame.
  about: { distance: 6.0, height: 0.3, aimX: -1.55, aimY: 0.34, fov: 38, orbit: 0.12, roll: 0.012 },
  // The close-up. Pulled back from an earlier, tighter 4.2: at that distance the
  // module overflowed the free half and sat half off-frame. The usable aimX
  // scales with distance — the frame is only ~5.4 world units wide here, so
  // this offset does the same job the projects shot needs 3.2 for.
  services: { distance: 5.2, height: 0.55, aimX: 1.35, aimY: 0.08, fov: 36, orbit: 0.07, roll: -0.02 },
  projects: { distance: 11, height: 2.6, aimX: -3.2, aimY: 0.4, fov: 46, orbit: 0.28, roll: 0.008 },
  contact: { distance: 8.0, height: 1.4, aimX: -2.2, aimY: 0.1, fov: 42, orbit: 0.2, roll: 0 },
}

/**
 * On a portrait viewport the copy is full width, so there is no free half. The
 * aim goes up instead of sideways, dropping the graph into the band under the
 * text. The shots still vary in distance — that is what survives the loss of
 * the sideways offset.
 */
export const MOBILE_FRAMING: Record<AnchorId, Framing> = {
  top: { distance: 6.8, height: 1.5, aimX: 0, aimY: 1.5, fov: 48, orbit: 0.08, roll: 0 },
  about: { distance: 5.6, height: 1.0, aimX: 0, aimY: 1.32, fov: 46, orbit: 0.07, roll: 0.01 },
  services: { distance: 4.4, height: 0.8, aimX: 0, aimY: 1.05, fov: 44, orbit: 0.05, roll: -0.016 },
  projects: { distance: 8.6, height: 2.0, aimX: 0, aimY: 1.7, fov: 52, orbit: 0.12, roll: 0.006 },
  contact: { distance: 7.2, height: 1.2, aimX: 0, aimY: 1.3, fov: 50, orbit: 0.06, roll: 0 },
}

/** The closing wide shot, once the workflow is complete. */
export const REVEAL_FRAMING: Framing = {
  distance: 21,
  height: 5.6,
  // Aimed slightly left so the whole network settles opposite the copy and
  // leaves the right of frame to the figure waking up.
  aimX: -1.8,
  // Negative aims below the network, lifting it into the upper part of the
  // frame. Without this the payoff shot sits low enough that the footer edge
  // cuts through it and the completed graph is never seen whole.
  aimY: -1.5,
  fov: 36,
  orbit: 0.07,
  roll: 0,
}

export const MOBILE_REVEAL_FRAMING: Framing = {
  distance: 16.5,
  height: 0,
  aimX: 0,
  aimY: -0.9,
  fov: 52,
  orbit: 0.04,
  roll: 0,
}
