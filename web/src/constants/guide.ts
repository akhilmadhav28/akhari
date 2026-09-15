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
 * Text is placeholder-empty on purpose — copy is a separate pass, same
 * discipline as `constants/founders.ts` and `constants/isAutomationForYou.ts`
 * (structure first, words after review).
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

export const GUIDE_SCRIPT: GuideLine[] = [
  { id: 'hero', trigger: { kind: 'hero' }, text: '' },
  ...NODES.map((n) => ({
    id: `module-${n.id}`,
    trigger: { kind: 'module', nodeId: n.id } as const,
    text: '',
  })),
  { id: 'climax', trigger: { kind: 'climax' }, text: '' },
]
