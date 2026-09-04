import { NODES } from '@/constants/workflow'
import { clamp } from '@/lib/animation/math'

/**
 * Maps each module to the scroll position where it connects, by measuring the
 * page.
 *
 * The alternative — hardcoding a progress value per module — breaks the moment
 * anyone edits copy, adds a card, or opens the site on a shorter viewport: the
 * modules drift away from the sections they are supposed to belong to. Here the
 * numbers are derived from where the sections actually are, and recomputed on
 * every ScrollTrigger refresh (resize, font load, image load).
 */

export const anchors = {
  /** nodeId → progress at which the module arrives, 0-1. */
  appearAt: {} as Record<string, number>,
  /** Progress at which the graph is complete and the system wakes. */
  revealAt: 1,
  ready: false,
}

/** Absolute document Y of an element, independent of offset parents. */
const docY = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY

/**
 * A module lands when its anchor point is this far up the viewport. Slightly
 * above the middle, so the connection happens as the section's content is being
 * read rather than as it first peeks into view.
 */
const TRIGGER_LINE = 0.62

export function computeAnchors(): void {
  const first = document.getElementById('top')
  const last = document.getElementById('contact')
  if (!first || !last) return

  const vh = window.innerHeight

  // These must mirror the master ScrollTrigger's start and end exactly, or
  // every computed value is offset by a constant.
  const startY = docY(first)
  const endY = docY(last) + last.offsetHeight - vh
  const span = Math.max(1, endY - startY)

  let latest = 0

  for (const node of NODES) {
    const section = document.getElementById(node.anchor)
    if (!section) continue

    const anchorY = docY(section) + section.offsetHeight * node.anchorAt
    const scrollAt = anchorY - vh * TRIGGER_LINE

    // Deliberately NOT clamped at the low end. A negative arrival point means
    // "already assembled before the page has been scrolled at all", which is
    // how the hero opens on a real object instead of an empty scene. Clamping
    // to 0 collapses that into "arrives exactly at progress 0", where the build
    // curve evaluates to zero and the module is invisible until you scroll.
    const p = Math.min(1, (scrollAt - startY) / span)
    anchors.appearAt[node.id] = p
    if (p > latest) latest = p
  }

  // The last cable landing is what completes the system. Give it a moment to
  // settle before the reveal takes over.
  anchors.revealAt = clamp(latest + 0.035)
  anchors.ready = true
}

/**
 * Progress at which a module arrives. Before the page has been measured only
 * the trigger exists, so the hero still opens on a real object rather than a
 * void that fills in once measurement lands.
 */
export function appearAtFor(nodeId: string): number {
  if (anchors.ready) return anchors.appearAt[nodeId] ?? 1
  return nodeId === 'trigger' ? 0 : 1
}
