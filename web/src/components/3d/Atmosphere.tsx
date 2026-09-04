import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { DeviceProfile } from '@/lib/perf/device'
import { prefersReducedMotion } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'

/**
 * Airborne dust.
 *
 * The rig was lit correctly and the modules read as objects, but the space
 * *between* the lens and the subject was optically empty — and empty air is one
 * of the few things a real camera never photographs. Every frame of the scene
 * had depth cues on the objects and none in the volume around them.
 *
 * This fills that volume and nothing else. It is not a "particle effect": there
 * is no swirl, no rising embers, no starfield. It is a slow, barely-moving
 * suspension that exists to be caught by the key light.
 *
 * ── Why this is not the additive-quad glow that got removed ──────────────────
 * The halos that came out earlier were flat sprites of colour pasted behind
 * every module at a constant intensity — light with no source, identical
 * everywhere. This is the opposite in the way that matters: each mote's
 * brightness is computed from where it sits relative to the actual key light,
 * so the dust is bright when you are looking into the beam and nearly invisible
 * when you are looking across it. The brightness has a cause.
 *
 * ── The light shaft, drawn by not drawing it ────────────────────────────────
 * A volumetric shaft would mean either a raymarch (far too expensive here) or a
 * cone of additive geometry (exactly the fake-light mistake above). Instead the
 * motes forward-scatter: `pow(dot(viewDir, lightDir), k)` peaks when the camera
 * looks back up the beam, so the shaft appears as a brightening of real
 * particles rather than as a painted cone. Turn away from the key and it goes,
 * because the only thing that was ever there is dust.
 *
 * ── Density that survives a moving camera ───────────────────────────────────
 * The camera travels the length of the graph, so a fixed cloud would be dense
 * at one end of the page and absent at the other. The motes wrap in a box
 * centred on the camera: density stays constant wherever it goes, while each
 * mote keeps a real world-space position between wraps, so it still parallaxes
 * properly against the modules. Wrapping happens in the vertex shader — the CPU
 * never touches a position.
 */

interface AtmosphereProps {
  profile: DeviceProfile
}

/**
 * Half-extent of the wrapping box, in world units.
 *
 * Deliberately small. The first pass used 15, which put the tier's whole mote
 * budget into a 30-unit cube — about one mote per 120 cubic units, most of it
 * outside the frustum, and the result was invisible. Density is what makes dust
 * read, not count, so the same budget is packed into a slab only a little
 * deeper than the camera's working distance (5–11 units to its subject). Also
 * comfortably inside the fog's near plane at 20, which a custom ShaderMaterial
 * would not receive anyway.
 */
const BOX = 8

/** Direction from the graph towards the key light — see SceneEnvironment. */
const LIGHT_DIR = new THREE.Vector3(-8, 11, 7).normalize()

export function Atmosphere({ profile }: AtmosphereProps) {
  const count = profile.particles
  const points = useRef<THREE.Points>(null)
  const clock = useRef(0)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Uniform through the box. Anything clustered reads as a deliberate
      // shape, and a shape is the one thing suspended dust must never have.
      positions[i * 3] = (Math.random() * 2 - 1) * BOX
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * BOX
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOX
      seeds[i] = Math.random()
    }

    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
  }, [count])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      // Additive so motes read as catching light rather than as grey specks
      // sitting in front of the scene.
      blending: THREE.AdditiveBlending,
      // Depth tested (a mote behind a module is hidden, which is most of why
      // the dust reads as being *in* the space) but never written, so motes
      // cannot occlude each other into hard edges.
      depthWrite: false,
      depthTest: true,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uLightDir: { value: LIGHT_DIR.clone() },
        uColor: { value: new THREE.Color('#FFD9A8') },
        uPixelRatio: { value: 1 },
        // Rises slightly into the closing reveal, with the rest of the lights.
        uGain: { value: 1 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uCam;
        uniform vec3 uLightDir;
        uniform float uPixelRatio;
        attribute float aSeed;
        varying float vAlpha;

        void main() {
          vec3 p = position;

          // Drift. Slow, mostly upward, with a lateral wander on a different
          // period per mote so the field never pulses as one body.
          p.y += uTime * (0.045 + aSeed * 0.05);
          p.x += sin(uTime * 0.11 + aSeed * 24.0) * 0.55;
          p.z += cos(uTime * 0.08 + aSeed * 17.0) * 0.45;

          // Wrap into a box centred on the camera. Keeps density constant as
          // the camera travels while preserving true world-space parallax.
          vec3 halfBox = vec3(${BOX}.0);
          vec3 rel = mod(p - uCam + halfBox, halfBox * 2.0) - halfBox;
          vec3 world = uCam + rel;

          float dist = length(rel);
          vec3 viewDir = rel / max(dist, 0.0001);

          // ── Where the beam actually falls ──────────────────────────────
          // The key sits on the camera's own side of the graph, so this is a
          // frontlit scene: there is no backlit beam to look into, and a
          // forward-scatter term would evaluate to zero across the entire
          // page. What reads instead is the wash — motes nearer the key are
          // simply more lit than motes away from it, which puts a soft
          // diagonal gradient of brightness through the volume running in the
          // key's direction. That gradient is the shaft.
          float alongBeam = dot(normalize(world), uLightDir);
          float wash = smoothstep(-0.65, 0.85, alongBeam);

          // ── Retroreflection ───────────────────────────────────────────
          // Frontlit dust does have one view-dependent peak: light bouncing
          // straight back at its source, which the camera shares a side with.
          // Headlights in fog. Small, but it is what makes the field sparkle
          // as the camera drifts rather than sitting inert.
          float retro = pow(max(0.0, dot(viewDir, -uLightDir)), 2.0);

          // Fade in from the lens so nothing sits enormous in the near field,
          // and out towards the box edge so wrapping is never visible as a pop.
          float near = smoothstep(0.8, 2.5, dist);
          float far = 1.0 - smoothstep(${BOX}.0 * 0.6, ${BOX}.0, dist);

          vAlpha = near * far * (0.14 + wash * 0.7 + retro * 0.5);

          vec4 mv = modelViewMatrix * vec4(world, 1.0);
          gl_Position = projectionMatrix * mv;

          // Perspective size attenuation, with a floor so distant motes stay a
          // sub-pixel glimmer rather than vanishing into aliasing noise.
          //
          // Small on purpose. Larger sprites at a lower count read as discrete
          // dots on the glass — nearer to a dead pixel than to air. Dust wants
          // to be numerous and barely resolvable.
          float size = 1.7 + aSeed * 2.4;
          gl_PointSize = max(1.0, size * uPixelRatio * (9.0 / max(-mv.z, 0.001)));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uGain;
        varying float vAlpha;

        void main() {
          // Soft round falloff. A hard-edged point sprite reads as a dead
          // pixel, which is the single fastest way to make dust look like
          // rendering noise.
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);

          // Held well under the bloom threshold (0.95 — see ScenePost). Dust
          // that blooms stops being dust and becomes a smear.
          gl_FragColor = vec4(uColor, a * vAlpha * uGain * 0.5);
        }
      `,
    })
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  const reduced = useRef(prefersReducedMotion())

  useFrame((state, delta) => {
    // Frozen under reduced motion: the dust is still there and still catches
    // the key, it simply stops drifting.
    if (!reduced.current) clock.current += Math.min(delta, 0.05)

    const u = material.uniforms
    u.uTime.value = clock.current
    u.uCam.value.copy(state.camera.position)
    u.uPixelRatio.value = state.gl.getPixelRatio()
    // Comes up with the rig on load, and lifts a little as the system wakes.
    u.uGain.value = scroll.boot * (1 + scroll.reveal * 0.5)
  })

  if (count === 0) return null

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1}
    />
  )
}
