import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { DeviceProfile } from '@/lib/perf/device'
import { prefersReducedMotion } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'
import { anchors } from '@/lib/scene/anchors'
import { clamp, damp, remap } from '@/lib/animation/math'
import { NODES } from '@/constants/workflow'
import { C } from '@/constants/brand'
import { MAX_PULSES } from '@/lib/scene/flowState'
import { buildEdgeCurve } from '@/lib/three/curves'
import { CABLE_FRAG, CABLE_VERT } from './Connection'

/** The module the figure hangs off. */
const OUTPUT_NODE = NODES.find((n) => n.id === 'output')!

/**
 * The guide, waking up.
 *
 * This used to be a pure payoff — invisible until the closing section, then
 * powered on by the last cable landing. It is now also the guide the homepage
 * narrates through (see `GuideCaption`, the DOM half of the same idea) — but
 * it stays a payoff too, not just a companion, because its position is
 * outside the camera's frustum for most of the page (see `armThreshold`
 * below). It fades dimly into frame partway through, well before the climax,
 * then the last cable landing still switches it fully on exactly as before.
 * `scroll.reveal` is still the only input driving the climax half of that;
 * `scroll.progress`, measured against `anchors.revealAt`, drives the new
 * early-arrival half.
 *
 * ── Why this is in the scene and not in the DOM ─────────────────────────────
 * It was a DOM element for a long time — a `<video>` with `mix-blend-mode:
 * screen` so its black background would drop out over the canvas. That cannot
 * work, and the reason is worth writing down because it looked like it was
 * working for weeks.
 *
 * A blended element blends with the backdrop *inside its own stacking
 * context*, not with whatever happens to be painted underneath it on screen.
 * Two things independently broke that here. The wrapper's opacity was animated
 * for the fade-in, and any opacity below 1 forms an isolation group — so the
 * blend resolved against nothing, and the resulting rectangle was then
 * composited over the canvas *normally*, black background and all. Even with
 * that fixed, `<main>` carries `z-index: 10` to sit above the canvas, which
 * makes it a stacking context too: the canvas is outside it and can never be
 * part of the backdrop of anything inside it.
 *
 * The visible symptom was a hard-edged box around the figure. It was patched
 * once with a painted radial gradient, which made it worse in a way that was
 * hard to see — that gradient reaches full opacity at the corners, so it was
 * covering the 3D network behind the container with flat page colour.
 *
 * In the scene there is no compositing question. Additive blending against the
 * frame buffer means black adds nothing, so the background is gone by
 * construction rather than by being hidden. Three things follow for free:
 * the bloom pass treats the figure as a light source like everything else, the
 * cables genuinely pass in front of it because it has a real depth, and the
 * page has no blend modes or stacked compositing layers over the WebGL canvas
 * at all — which is the exact configuration that took this machine's GPU
 * process down once already.
 *
 * The clip is encoded with a falloff that takes its edges to true black, which
 * additive blending turns directly into a soft edge.
 *
 * This is also the seam for the planned three.js figure: replace the mesh,
 * keep `scroll.reveal` (now joined by `scroll.progress`, see above) as the
 * only input.
 */

const CLIP = '/media/robot.mp4'

/** Placed right of the graph's centre, behind it, so cables cross in front. */
const POSITION: [number, number, number] = [5.6, 0.1, -5.4]
const SIZE: [number, number] = [15.5, 8.7]

const MOBILE_POSITION: [number, number, number] = [0, -0.4, -6.5]
const MOBILE_SIZE: [number, number] = [11, 6.2]

/**
 * Where the feed lands, in the clip's own UV space.
 *
 * The head sits slightly left of centre and a little above the middle of the
 * frame. Expressed as a fraction rather than a world position so it stays on
 * the figure if the plane is ever moved or resized.
 */
const SOCKET_UV: [number, number] = [0.6, 0.62]

/** How far in front of the plane the cable end floats, in world units. */
const SOCKET_LIFT = 0.55

/**
 * Current arriving at the figure.
 *
 * A mutable singleton for the same reason the scroll store is one: `RobotLink`
 * writes it inside its frame callback and `RobotFigure` reads it inside its
 * own, and routing a per-frame number through React state to travel between two
 * components in the same subtree would re-render both sixty times a second to
 * move one float.
 */
const link = { arrive: 0 }

interface RobotFigureProps {
  profile: DeviceProfile
}

/** World position of the point on the figure the Output module feeds. */
function socketPosition(compact: boolean): THREE.Vector3 {
  const [x, y, z] = compact ? MOBILE_POSITION : POSITION
  const [w, h] = compact ? MOBILE_SIZE : SIZE
  return new THREE.Vector3(
    x + (SOCKET_UV[0] - 0.5) * w,
    y + (SOCKET_UV[1] - 0.5) * h,
    z + SOCKET_LIFT,
  )
}

/** How far before `anchors.revealAt`, in progress units, the figure starts
 *  fading dimly into frame. Not a magic number in the sense `anchors.ts`
 *  warns against — it's a lead measured relative to a DOM-derived value, not
 *  a hardcoded absolute scroll position, so it still moves with the page. */
const ARM_LEAD = 0.12

/** Opacity ceiling while "not yet arrived" — the climax still has to read as
 *  brighter than anything shown before it. */
const BASE_MAX = 0.42

export function RobotFigure({ profile }: RobotFigureProps) {
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const shown = useRef(0)
  const playing = useRef(false)
  // Scratch object, created once, mutated every frame — see the useFrame
  // comment below for why this can't be a fresh THREE.Color per call.
  const gainScratch = useMemo(() => new THREE.Color(), [])

  // Only created once the figure is about to enter frame at all. Until then
  // this component renders nothing and the clip is never fetched, so it
  // costs visitors who do not reach that point in the page precisely
  // nothing. Measured against `anchors.revealAt` rather than a flat scroll
  // number, so it tracks wherever the closing section actually lands —
  // `anchors.revealAt` defaults to 1 before layout is measured, so this
  // stays safely unarmed until real numbers exist.
  const [armed, setArmed] = useState(false)

  const video = useMemo(() => {
    if (!armed || typeof document === 'undefined') return null
    const el = document.createElement('video')
    el.src = CLIP
    el.muted = true
    el.loop = false
    el.playsInline = true
    el.preload = 'auto'
    el.crossOrigin = 'anonymous'
    return el
  }, [armed])

  const texture = useMemo(() => {
    if (!video) return null
    const t = new THREE.VideoTexture(video)
    // The clip is a graded sRGB image, not data. Without this it is uploaded
    // as linear and the figure comes out washed and pale.
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    return t
  }, [video])

  useEffect(() => {
    return () => {
      texture?.dispose()
      if (video) {
        video.pause()
        // Dropping the src releases the decoder; leaving it attached keeps a
        // hardware decode session alive for a video nothing is displaying.
        video.removeAttribute('src')
        video.load()
      }
    }
  }, [texture, video])

  useFrame((_, delta) => {
    // Arming from the frame loop rather than an IntersectionObserver: the
    // scroll store is already the authority on where the visitor is, and the
    // 3D layer has no DOM node of its own to observe. Threshold is measured
    // from the DOM (anchors.revealAt), not a flat number — see ARM_LEAD.
    const armThreshold = clamp(anchors.revealAt - ARM_LEAD)
    if (!armed && scroll.progress > armThreshold) setArmed(true)

    const m = material.current
    if (!m) return

    const dt = Math.min(delta, 0.05)

    // One continuous target, so there is no seam between "fading in dim" and
    // the existing climax mechanic: at progress = revealAt this evaluates to
    // exactly BASE_MAX (guideT = 1, reveal = 0), and rises from there to 1 as
    // reveal itself rises 0→1.
    const guideT = clamp(remap(scroll.progress, armThreshold, anchors.revealAt))
    const target = BASE_MAX * guideT + (1 - BASE_MAX) * scroll.reveal
    shown.current = damp(shown.current, target, 2.6, dt)

    // Each packet that lands down the feed lifts the figure briefly. This is
    // the whole point of the cable existing: without it the figure fades up on
    // its own timer beside a graph that happens to have finished, and with it
    // the graph is visibly the thing switching it on.
    link.arrive = damp(link.arrive, 0, 3.2, dt)
    m.opacity = Math.min(1, shown.current * (1 + link.arrive * 0.5))

    // Opacity saturates at 1 well before the climax finishes building, so the
    // lever for "beyond anything shown earlier" is gain, not opacity: lerp
    // from a dim, desaturated baseline up to the existing full ROBOT_GAIN as
    // the figure arrives, then let each cable pulse punch briefly past even
    // that resting level. link.arrive is only ever nonzero once reveal ≥ 0.34
    // (RobotLink's own gate below), so the pulse overshoot is automatically
    // exclusive to the climax — nothing in the dim early phase can be
    // mistaken for the payoff. Mutated in place: THREE.Color's copy/lerp/
    // multiplyScalar don't allocate, matching the no-allocation-in-useFrame
    // rule the rest of this file already follows.
    gainScratch.copy(GAIN_BASE).lerp(ROBOT_GAIN, shown.current)
    gainScratch.multiplyScalar(1 + link.arrive * 0.28)
    m.color.copy(gainScratch)

    if (video && !playing.current && shown.current > 0.03) {
      playing.current = true
      if (prefersReducedMotion()) {
        // No autonomous motion: hold the powered-on frame instead of playing.
        video.currentTime = video.duration || 0
      } else {
        video.play().catch(() => {})
      }
    }
  })

  if (!texture) return null

  const [x, y, z] = profile.isCompact ? MOBILE_POSITION : POSITION
  const [w, h] = profile.isCompact ? MOBILE_SIZE : SIZE

  return (
    <>
      <mesh position={[x, y, z]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          ref={material}
          map={texture}
          transparent
          opacity={0}
          // Above 1 on purpose. `color` multiplies the map, and the clip is a
          // dim, desaturated, additively-blended image sitting in front of a
          // near-black backdrop — at 1.0 the figure was barely there. This is
          // gain, applied where it can be tuned, rather than another re-encode.
          // It also lifts the brightest parts of the face over the bloom
          // threshold, so the figure catches the same lens as the modules.
          color={ROBOT_GAIN}
          // The whole technique. Additive means every black pixel contributes
          // nothing, so the clip's background is absent rather than hidden, and
          // its baked edge falloff becomes a genuine soft edge.
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped
          // Fog would tint the figure towards the ground colour at this depth,
          // which on an additive surface only ever brightens it.
          fog={false}
        />
      </mesh>

      <RobotLink profile={profile} />
    </>
  )
}

/** Map gain. See the note on `color` above. */
const ROBOT_GAIN = new THREE.Color(2.1, 2.05, 1.95)

/** Dim, slightly warm baseline the figure lerps up from while "not yet
 *  arrived" — desaturated and low enough that it reads as distant/incomplete
 *  next to the full ROBOT_GAIN it resolves into at the climax. */
const GAIN_BASE = new THREE.Color(1.05, 1.0, 0.92)

/**
 * The feed from the Output module into the figure.
 *
 * This is the cable that makes the completion mean something. The graph
 * finishing is otherwise an abstract event — the last edge lands between two
 * modules off to one side and the figure independently fades up nearby. With
 * this run in place the sequence reads as cause and effect: output connects to
 * the figure, current flows down the line, and the figure comes on.
 *
 * It deliberately does not live in `EDGES`. Everything in there is part of the
 * scroll choreography — measured anchors, camera stops, parallel depth groups,
 * the HUD's module count — and a run whose far end is not a module would have
 * to be special-cased in every one of those. Here it owns its own timing and
 * reads only `scroll.reveal`, the same single input as the figure it feeds.
 */
function RobotLink({ profile }: RobotFigureProps) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const port = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef(0)

  const socket = useMemo(() => socketPosition(profile.isCompact), [profile.isCompact])

  const curve = useMemo(() => {
    const from = new THREE.Vector3(
      ...(profile.isCompact ? OUTPUT_NODE.mobilePosition : OUTPUT_NODE.position),
    )
    return buildEdgeCurve(from, socket, profile.isCompact ? 0.5 : -1.6)
  }, [profile.isCompact, socket])

  // Noticeably heavier than the cables between modules. It is the only run in
  // the scene carrying power rather than data, and at the same gauge as the
  // rest it read as one more wire crossing the frame instead of the connection
  // the whole ending turns on.
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, profile.curveSegments, 0.058, 8, false),
    [curve, profile.curveSegments],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uCable: { value: new THREE.Color('#3A322B') },
      uAccent: { value: new THREE.Color(C.accent) },
      uReveal: { value: 0 },
      uEnergy: { value: 0 },
      uPulses: { value: new Array(MAX_PULSES).fill(-1) as number[] },
    }),
    [],
  )

  useFrame((_, delta) => {
    const mat = material.current
    if (!mat) return

    const dt = Math.min(delta, 0.05)
    const reveal = Math.min(1, Math.max(0, scroll.reveal))

    // Draws on over the first third of the reveal, so the line reaches the
    // figure before the figure has finished coming up rather than after.
    mat.uniforms.uReveal.value = Math.min(1, reveal * 3)
    mat.uniforms.uEnergy.value = reveal

    const pulses = mat.uniforms.uPulses.value as number[]
    pulses.fill(-1)

    // Current only once the line has actually landed.
    if (reveal < 0.34) {
      if (port.current) port.current.opacity = 0
      return
    }

    const before = clock.current
    clock.current += dt

    const period = 1.15
    for (let i = 0; i < 2; i++) {
      const offset = (i * period) / 2
      pulses[i] = (((clock.current + offset) % period) + period) % period / period

      // A packet lands whenever its phase wraps. Detected from the wrap rather
      // than by testing the position against a threshold, which silently misses
      // arrivals on any frame long enough to step over the window.
      const wrapped =
        Math.floor((before + offset) / period) !== Math.floor((clock.current + offset) / period)
      if (wrapped) link.arrive = 1
    }

    if (port.current) {
      // Sits just under the cable's own brightness at rest and flares as each
      // packet reaches it, so the port reads as being fed rather than as a
      // lamp that happens to be there.
      port.current.opacity = reveal * (0.42 + link.arrive * 0.58)
    }
  })

  return (
    <>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          vertexShader={CABLE_VERT}
          fragmentShader={CABLE_FRAG}
          uniforms={uniforms}
          transparent={false}
        />
      </mesh>

      {/*
        The port on the figure.

        Without it the cable simply stops somewhere over the image and the eye
        has no reason to believe it arrived anywhere — a line ending in mid-air
        reads as a line passing behind. A lit terminus is what turns it into a
        connection. It is bright enough to clear the bloom threshold, so it
        flares through the same lens as everything else in the scene.
      */}
      <mesh position={socket}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshBasicMaterial
          ref={port}
          color={PORT_COLOR}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped
          fog={false}
        />
      </mesh>
    </>
  )
}

/** Above 1 so the port clears the bloom threshold and actually flares. */
const PORT_COLOR = new THREE.Color(2.6, 1.7, 0.9)
