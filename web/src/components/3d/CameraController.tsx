import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  centroid,
  DESKTOP_FRAMING,
  MOBILE_FRAMING,
  MOBILE_REVEAL_FRAMING,
  NODES,
  REVEAL_FRAMING,
  type Framing,
} from '@/constants/workflow'
import type { DeviceProfile } from '@/lib/perf/device'
import { prefersReducedMotion } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'
import { appearAtFor } from '@/lib/scene/anchors'
import { easeInOutQuart, lerp, remap } from '@/lib/animation/math'

/**
 * Drives the camera from scroll progress.
 *
 * Rather than following a fixed path, the camera *follows the build*. It looks
 * at whichever module is currently arriving, travelling from the last one to the
 * next as progress moves between their measured arrival points. Because those
 * points come from the DOM, the camera lands on a module exactly when its
 * section does — the movement is caused by the same thing that causes the
 * connection, so the two can never drift apart.
 *
 * Framing depends on which side that section's copy occupies: with text on the
 * left the camera shifts so the module sits right of centre, and vice versa. On
 * a portrait viewport the offset becomes vertical instead, putting the graph in
 * the band beneath the text.
 *
 * Once the graph is complete the whole thing blends to a wide shot of the
 * network — the closing reveal.
 */

interface CameraControllerProps {
  profile: DeviceProfile
}

/** The viewport aspect every `aimX` in `DESKTOP_FRAMING` was tuned against. */
const REF_ASPECT = 1.6

export function CameraController({ profile }: CameraControllerProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const reduced = useRef(prefersReducedMotion())

  const compact = profile.isCompact

  /** Modules in build order, with their world position and section framing. */
  const stops = useMemo(() => {
    const framingSet = compact ? MOBILE_FRAMING : DESKTOP_FRAMING
    return NODES.filter((n) => !compact || n.onMobile).map((n) => ({
      id: n.id,
      pos: new THREE.Vector3(...(compact ? n.mobilePosition : n.position)),
      // Keyed by the module's own section, so each beat is composed rather than
      // every left-copy section sharing one shot.
      framing: framingSet[n.anchor],
    }))
  }, [compact])

  const wide = useMemo(() => {
    const c = new THREE.Vector3(...centroid(compact))
    return { pos: c, framing: compact ? MOBILE_REVEAL_FRAMING : REVEAL_FRAMING }
  }, [compact])

  const scratch = useMemo(
    () => ({
      focus: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      smoothPos: new THREE.Vector3(stops[0].pos.x, 2, 8),
      smoothTarget: new THREE.Vector3().copy(stops[0].pos),
      framing: { ...stops[0].framing } as Framing,
    }),
    [stops],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = scroll.smoothed
    const time = state.clock.elapsedTime

    // --- Which module are we travelling between? ---------------------------
    let i = 0
    while (i < stops.length - 2 && p >= appearAtFor(stops[i + 1].id)) i++

    const a = stops[i]
    const b = stops[i + 1] ?? stops[i]

    const pa = appearAtFor(a.id)
    const pb = appearAtFor(b.id)

    // Dwell on the module that just connected, then travel to the next one over
    // the back half of the gap, arriving exactly as it lands.
    //
    // Spreading the move evenly across the whole gap looked correct on paper
    // and was wrong in practice: the camera spent most of each section aimed at
    // the empty space between two modules, so the middle of every section
    // showed nothing at all. Dwelling keeps a subject in frame throughout, and
    // the late travel doubles as a reveal of the cable being drawn.
    const DWELL = 0.55
    const travelStart = pa + (pb - pa) * DWELL
    const t = easeInOutQuart(remap(p, travelStart, pb))

    scratch.focus.lerpVectors(a.pos, b.pos, t)

    const f = scratch.framing
    f.distance = lerp(a.framing.distance, b.framing.distance, t)
    f.height = lerp(a.framing.height, b.framing.height, t)
    f.aimX = lerp(a.framing.aimX, b.framing.aimX, t)
    f.aimY = lerp(a.framing.aimY, b.framing.aimY, t)
    f.fov = lerp(a.framing.fov, b.framing.fov, t)
    f.orbit = lerp(a.framing.orbit, b.framing.orbit, t)
    f.roll = lerp(a.framing.roll, b.framing.roll, t)

    // --- Closing reveal ----------------------------------------------------
    // Blend focus and framing towards the wide shot of the whole network.
    const rv = easeInOutQuart(scroll.reveal)
    if (rv > 0) {
      scratch.focus.lerp(wide.pos, rv)
      f.distance = lerp(f.distance, wide.framing.distance, rv)
      f.height = lerp(f.height, wide.framing.height, rv)
      f.aimX = lerp(f.aimX, wide.framing.aimX, rv)
      f.aimY = lerp(f.aimY, wide.framing.aimY, rv)
      f.fov = lerp(f.fov, wide.framing.fov, rv)
      f.orbit = lerp(f.orbit, wide.framing.orbit, rv)
      f.roll = lerp(f.roll, wide.framing.roll, rv)
    }

    // --- Compose -----------------------------------------------------------
    // The camera sits square in front of the module; the aim offset is what
    // moves the module around the frame. On compact viewports aimX is zero and
    // aimY does the work instead, dropping the graph below the copy.
    // `aimX` is in world units, but what matters is where the module lands as a
    // *fraction* of the frame — and the frame gets wider in world units as the
    // viewport aspect grows. Left unscaled, a fixed offset pushes the module a
    // smaller proportion of the way across an ultrawide screen, so it drifts
    // back towards the centre exactly as the centred copy column is moving
    // right to meet it. That is what put the hero's final full stop on the
    // trigger module at 2560. Scaling by aspect holds the composition constant.
    const aspectGain = Math.min(1.9, Math.max(0.85, camera.aspect / REF_ASPECT))

    scratch.pos.set(scratch.focus.x, scratch.focus.y + f.height, scratch.focus.z + f.distance)
    scratch.target.set(
      scratch.focus.x + f.aimX * aspectGain,
      scratch.focus.y + f.aimY,
      scratch.focus.z,
    )

    if (!reduced.current) {
      // Orbital drift. Three different periods so the path never visibly
      // repeats, amplitude keyed to the current beat.
      scratch.pos.x += Math.sin(time * 0.18) * f.orbit
      scratch.pos.y += Math.cos(time * 0.14) * f.orbit * 0.55
      scratch.pos.z += Math.cos(time * 0.11) * f.orbit * 0.8

      // Pointer parallax — skipped on touch, where there is no hover position
      // and the value would sit wherever the last tap landed.
      if (!profile.isTouch) {
        scratch.pos.x += state.pointer.x * 0.5
        scratch.pos.y += state.pointer.y * 0.34
        scratch.target.x += state.pointer.x * 0.12
        scratch.target.y += state.pointer.y * 0.08
      }

      // Momentum: lean into the direction of travel on a fast scroll.
      scratch.pos.z += scroll.velocity * 0.35
    }

    // Damped rather than assigned — absorbs trackpad jitter and keeps the
    // camera moving smoothly through a scroll that stops abruptly.
    const k = 1 - Math.exp(-6 * dt)
    scratch.smoothPos.lerp(scratch.pos, k)
    scratch.smoothTarget.lerp(scratch.target, k)

    camera.position.copy(scratch.smoothPos)
    camera.lookAt(scratch.smoothTarget)

    // Roll has to come after lookAt, which derives rotation from the world up
    // vector and so always produces a level camera. Kept to a couple of
    // hundredths of a radian — enough that the close beats do not feel like the
    // same tripod, not enough to notice as a tilt.
    if (f.roll !== 0) camera.rotateZ(f.roll)

    if (Math.abs(camera.fov - f.fov) > 0.01) {
      camera.fov = f.fov
      camera.updateProjectionMatrix()
    }
  }, -5)

  return null
}
