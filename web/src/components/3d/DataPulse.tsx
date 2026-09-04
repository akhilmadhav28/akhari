import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { EDGES } from '@/constants/workflow'
import { edgeRuntime, MAX_PULSES } from '@/lib/scene/flowState'
import { bell } from '@/lib/animation/math'

/**
 * Every data pulse in the scene, in one instanced mesh.
 *
 * There can be up to `EDGES.length * MAX_PULSES` beads live at once during the
 * final multi-wave state. As separate meshes that would be 28 draw calls that
 * mostly render nothing; instanced, it is one, and empty slots are collapsed to
 * zero scale rather than removed.
 *
 * Positions come from the same curves the cables are built from, so a bead is
 * always exactly on its wire.
 */

interface DataPulseProps {
  curves: Record<string, THREE.CubicBezierCurve3>
  accents: Record<string, string>
}

const COUNT = EDGES.length * MAX_PULSES

export function DataPulse({ curves, accents }: DataPulseProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)

  // Scratch objects, allocated once. useFrame runs 60+ times a second and
  // allocating a Vector3 in there would hand the GC steady work forever.
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const point = useMemo(() => new THREE.Vector3(), [])

  // Per-instance colour is static — write it once rather than every frame.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return

    const color = new THREE.Color()
    EDGES.forEach((edge, e) => {
      // Mildly overdriven so the bead has a hot core against the dark ground,
      // but nothing like the old value — an over-bright pulse blows out to a
      // white dot and loses the copper entirely.
      color.set(accents[edge.id] ?? '#E0803F').multiplyScalar(1.35)
      for (let i = 0; i < MAX_PULSES; i++) {
        m.setColorAt(e * MAX_PULSES + i, color)
      }
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [accents])

  useEffect(() => {
    const m = mesh.current
    return () => {
      m?.dispose()
    }
  }, [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return

    for (let e = 0; e < EDGES.length; e++) {
      const edge = EDGES[e]
      const rt = edgeRuntime[edge.id]
      const curve = curves[edge.id]

      for (let i = 0; i < MAX_PULSES; i++) {
        const index = e * MAX_PULSES + i
        const t = rt.pulses[i]

        if (t < 0 || !curve) {
          // Collapse rather than remove: instance counts stay stable.
          dummy.scale.setScalar(0)
          dummy.position.set(0, -999, 0)
        } else {
          curve.getPointAt(Math.min(t, 1), point)
          dummy.position.copy(point)
          // Swell on entry, shrink on arrival, so the bead reads as energy
          // rather than a ball bearing sliding along a wire.
          dummy.scale.setScalar(0.55 + bell(t) * 0.65)
        }

        dummy.updateMatrix()
        m.setMatrixAt(index, dummy.matrix)
      }
    }

    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
      renderOrder={2}
    >
      {/* An 8-face icosahedron. At this size it is two pixels of bloom — a
          higher-poly sphere would be invisible detail at real cost. */}
      <icosahedronGeometry args={[0.095, 1]} />
      <meshBasicMaterial
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </instancedMesh>
  )
}
