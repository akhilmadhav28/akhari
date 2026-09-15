import { NODES } from './workflow'

/**
 * The guide's script — what `GuideCaption` says, keyed to what's actually
 * happening in the scroll story rather than to raw progress numbers, on the
 * same "never hardcode a scroll offset" principle as `lib/scene/anchors.ts`.
 *
 * Three trigger shapes:
 *   - `hero`    shown before any module has connected.
 *   - `module`  shown the moment that module connects (mirrors `onConnect`).
 *   - `climax`  shown once the last cable delivers power to the figure.
 *
 * Copy follows one running example — an order coming in — matching each
 * node's own `meta` line (webhook, GET /orders, classify + decide, upsert
 * row, if/else, WhatsApp, done) so the caption narrates the same system the
 * graph is visibly assembling, not a generic gloss over it.
 */
export type GuideTrigger =
  | { kind: 'hero' }
  | { kind: 'module'; nodeId: string }
  | { kind: 'climax' }

export interface GuideLine {
  id: string
  trigger: GuideTrigger
  text: string
}

const MODULE_LINES: Record<string, string> = {
  trigger: 'It starts here — a trigger, the moment worth acting on.',
  api: 'It pulls in the real data. Not a demo — an actual API.',
  ai: 'AI reads it and decides what happens next.',
  database: 'Every decision gets saved, so nothing is lost or repeated.',
  logic: "Not every case is the same — logic sends it down the right path.",
  notification: "The right person hears about it immediately, on WhatsApp.",
  output: 'Done. No one had to be there for any of it.',
}

export const GUIDE_SCRIPT: GuideLine[] = [
  {
    id: 'hero',
    trigger: { kind: 'hero' },
    text: 'Watch this build itself — the same shape as what we ship.',
  },
  ...NODES.map((n) => ({
    id: `module-${n.id}`,
    trigger: { kind: 'module', nodeId: n.id } as const,
    text: MODULE_LINES[n.id] ?? '',
  })),
  {
    id: 'climax',
    trigger: { kind: 'climax' },
    text: 'This is what runs behind Akhari — quietly, every day.',
  },
]
