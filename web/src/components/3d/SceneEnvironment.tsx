import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import type { DeviceProfile } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'
import { C } from '@/constants/brand'
import { easeOutCubic } from '@/lib/animation/math'
import { Atmosphere } from './Atmosphere'

/**
 * Lighting, atmosphere and ground — a photographed rig on a dark table.
 *
 * Dark again, but warm. The lighting is tungsten rather than fluorescent: a
 * single warm key raking across blackened steel, brass fittings picking it up,
 * and screens lit amber from within. Nothing here is cyan, and nothing blooms
 * — the previous version's neon halos were the single most AI-looking thing on
 * the page.
 *
 * Shadow still does most of the work of making these read as objects, so it
 * stays on wherever the hardware can take it.
 */

interface SceneEnvironmentProps {
  profile: DeviceProfile
}

export function SceneEnvironment({ profile }: SceneEnvironmentProps) {
  const shadows = profile.tier !== 'low'

  return (
    <>
      <Backdrop />

      {/*
        Aerial perspective: distant objects wash towards the paper colour
        rather than darkening, which is what gives the closing pull-back depth
        on a light ground.

        The far plane is also load-bearing. The ground's far edge would
        otherwise draw a hard horizon straight across the viewport — invisible
        on the old near-black palette, glaring on paper. Ending the fog well
        before that edge dissolves the horizon completely, so the modules read
        as sitting in open space rather than on a visible table.
      */}
      <fog attach="fog" args={[C.void, 20, 62]} />

      <Relight shadows={shadows} />

      {/* Copper bounce from below — the brand colour touching the rig. */}
      <pointLight position={[2, -3, 4]} intensity={16} distance={24} color={C.accent} />

      {/* Brass kicker from behind, separating the modules from the ground. */}
      <pointLight position={[-4, 2, -6]} intensity={12} distance={26} color={C.brass} />

      {profile.reflections && (
        <Environment resolution={128} frames={1}>
          {/* Warm softboxes. Bright rectangles are what make machined metal
              read as metal rather than as grey plastic. */}
          <Lightformer
            form="rect"
            intensity={4}
            color="#FFE2BC"
            position={[-7, 6, 6]}
            scale={[14, 9, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            color="#FFF1DF"
            position={[8, 1, 5]}
            scale={[10, 7, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.4}
            color={C.brass}
            position={[0, -7, 2]}
            scale={[16, 5, 1]}
          />
          {/* One cool card so the metal isn't uniformly orange. */}
          <Lightformer
            form="rect"
            intensity={0.9}
            color="#B9CBDA"
            position={[4, 4, -6]}
            scale={[8, 6, 1]}
          />
        </Environment>
      )}

      <Ground shadows={shadows} />

      {/* Suspended dust, which is also where the light shaft comes from. */}
      <Atmosphere profile={profile} />
    </>
  )
}

/**
 * The key, the fill and the ambient base — animated across the scroll.
 *
 * This is the page's only change of *value*. Everything else about the design
 * holds one tone from the top of the document to the bottom: one ground colour,
 * one accent, one lighting state, five sections. Individually each screen is
 * lit correctly and collectively there is nothing to mark progress against, so
 * a long scroll reads as flat however good any single frame is.
 *
 * Rather than inverting a section — which would mean an opaque background and
 * losing the continuous scene that the whole page is built on — the change
 * happens inside the rig:
 *
 *   opening    the established warm tungsten
 *   middle     cooler and about a third down, so the work section feels like a
 *              different time of day
 *   closing    ramps well past the opening on `scroll.reveal`, so the system
 *              coming online is also the lights coming up
 *
 * `scroll.smoothed` is read directly in the frame loop rather than through
 * state; nothing here re-renders.
 */
function Relight({ shadows }: { shadows: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)

  const scratch = useMemo(
    () => ({ warm: new THREE.Color('#FFD9A8'), cool: new THREE.Color('#C6D2E4'), out: new THREE.Color() }),
    [],
  )

  useFrame(() => {
    const p = scroll.smoothed
    const reveal = Math.min(1, Math.max(0, scroll.reveal))

    // Dips through the middle of the page and recovers into the close. Cosine
    // rather than a piecewise ramp so there is no moment where the lighting
    // visibly "changes" — the room just gets colder and then warms back up.
    const dip = 0.5 - 0.5 * Math.cos(Math.min(1, p / 0.78) * Math.PI * 2)

    // Boot: the rig opens dim and comes up to its resting level over the
    // first ~1.4s. A floor rather than zero — arriving from total black reads
    // as a loading flicker, not a lighting choice.
    const boot = 0.22 + 0.78 * easeOutCubic(scroll.boot)

    if (key.current) {
      key.current.intensity = (2.4 - dip * 0.95 + reveal * 1.5) * boot
      scratch.out.copy(scratch.warm).lerp(scratch.cool, dip * 0.55 * (1 - reveal))
      key.current.color.copy(scratch.out)
    }
    if (fill.current) fill.current.intensity = (0.45 + dip * 0.5 - reveal * 0.2) * boot
    if (ambient.current) ambient.current.intensity = (0.42 - dip * 0.16 + reveal * 0.22) * boot
  })

  return (
    <>
      {/* Low warm base — enough that shadow sides are readable, not so much
          that the rig stops looking lit. */}
      <ambientLight ref={ambient} intensity={0.42} color="#8A7256" />
      <hemisphereLight args={['#6E5A44', C.voidTop, 0.55]} />

      {/* Key: warm tungsten, high and to the left, raking across the bodies. */}
      <directionalLight
        ref={key}
        position={[-8, 11, 7]}
        intensity={2.4}
        color="#FFD9A8"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-16, 16, 12, -12, 1, 44]} />
      </directionalLight>

      {/* Cool fill. Restrained at the ends of the page and briefly the dominant
          character through the middle. */}
      <directionalLight ref={fill} position={[9, 3, 8]} intensity={0.45} color="#9FB4C8" />
    </>
  )
}

/**
 * A large inverted sphere carrying a very slight vertical wash.
 *
 * Nearly imperceptible by design — a completely flat white background reads as
 * an empty buffer, while anything stronger stops looking like paper. It exists
 * to keep the top of frame a shade cooler than the bottom.
 */
function Backdrop() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(C.voidTop) },
      // Must equal the fog colour. The ground fogs out to `C.void` at
      // distance, so anything else here leaves a visible tonal step exactly
      // along the horizon — the seam is only invisible when the two agree.
      uBottom: { value: new THREE.Color(C.void) },
    }),
    [],
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(80, 24, 16), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={-10}>
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        vertexShader={/* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec3 vPos;

          void main() {
            vec3 dir = normalize(vPos);
            float h = smoothstep(-0.6, 0.5, dir.y);
            vec3 col = mix(uBottom, uTop, h);

            // A very faint warm pool low and left, roughly where the key sits.
            float halo = pow(max(0.0, dot(dir, normalize(vec3(-0.5, -0.3, 0.8)))), 4.0);
            col += vec3(0.10, 0.055, 0.02) * halo;

            gl_FragColor = vec4(col, 1.0);

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  )
}

/**
 * The surface the modules cast onto.
 *
 * A plain matte plane, barely darker than the backdrop. Its entire job is to
 * receive shadow — that soft grey pool under each module is what makes the
 * whole scene read as photographed objects rather than drawn ones.
 */
function Ground({ shadows }: { shadows: boolean }) {
  return (
    // Oversized on purpose: its edge has to fall beyond the fog's far plane,
    // or that edge becomes a drawn horizon line.
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.2, 0]} receiveShadow={shadows}>
      <planeGeometry args={[260, 260]} />
      <meshStandardMaterial color={C.voidWarm} metalness={0.25} roughness={0.72} />
    </mesh>
  )
}
