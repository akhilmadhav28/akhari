import * as THREE from 'three'

/**
 * Builds the cable curve between two modules.
 *
 * Control points extend along whichever axis dominates the run, so the wide
 * desktop layout gets the horizontal n8n-style bow and the stacked mobile
 * layout gets a vertical drop — from the same code, with no breakpoint check.
 */
export function buildEdgeCurve(
  from: THREE.Vector3,
  to: THREE.Vector3,
  sag: number,
): THREE.CubicBezierCurve3 {
  const delta = to.clone().sub(from)
  const horizontal = Math.abs(delta.x) >= Math.abs(delta.y)

  // Pull the endpoints in so the cable emerges from the module's edge rather
  // than its centre, where it would be buried inside the body anyway.
  const inset = delta.clone().normalize().multiplyScalar(0.78)
  const a = from.clone().add(inset)
  const b = to.clone().sub(inset)

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
