import * as THREE from 'three'
import { NODE_W } from '@/components/3d/WorkflowNode'

/**
 * Builds the cable curve between two modules.
 *
 * Control points extend along whichever axis dominates the run, so the wide
 * desktop layout gets the horizontal n8n-style bow and the stacked mobile
 * layout gets a vertical drop — from the same code, with no breakpoint check.
 */

/** Matches the port nub position in WorkflowNode — the one place a cable can
 *  actually leave a module's body. */
const PORT_X = NODE_W / 2 + 0.045

export function buildEdgeCurve(
  from: THREE.Vector3,
  to: THREE.Vector3,
  sag: number,
): THREE.CubicBezierCurve3 {
  const delta = to.clone().sub(from)
  const horizontal = Math.abs(delta.x) >= Math.abs(delta.y)

  // Anchor to the port nub, not an inset along the raw 3D direction to the
  // other node. That used to spend part of a flat 0.78 pull-in on whatever
  // y/z separation the edge happened to have, which for anything but a
  // perfectly side-by-side pair left the tube ending short of the nub on x
  // and off the node's depth on z — floating in front of the face plate
  // instead of plugging into the port. A module only has ports on its left
  // and right, so every cable leaves from whichever side faces the other end.
  const fromSide = delta.x >= 0 ? 1 : -1
  const toSide = -fromSide
  const a = from.clone().add(new THREE.Vector3(fromSide * PORT_X, 0, 0))
  const b = to.clone().add(new THREE.Vector3(toSide * PORT_X, 0, 0))

  const reach = horizontal
    ? new THREE.Vector3(delta.x * 0.4, 0, 0)
    : new THREE.Vector3(0, delta.y * 0.4, 0)

  const bow = (
    horizontal
      ? new THREE.Vector3(0, sag, sag * 0.45)
      : new THREE.Vector3(sag, 0, sag * 0.45)
  ).multiplyScalar(0.8)

  return new THREE.CubicBezierCurve3(
    a,
    a.clone().add(reach).add(bow),
    b.clone().sub(reach).add(bow),
    b,
  )
}
