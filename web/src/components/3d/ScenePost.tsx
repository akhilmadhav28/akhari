import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { DeviceProfile } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'
import { bell, damp } from '@/lib/animation/math'

/**
 * The camera the scene is photographed through.
 *
 * ── Why bloom, having removed the glow once ─────────────────────────────────
 * The halos that came out earlier were additive quads: a flat sprite of colour
 * pasted behind every module at a constant intensity, present whether or not
 * the module was lit. That is what reads as generated — light with no source,
 * identical on every object, sitting *behind* geometry instead of spilling out
 * of it.
 *
 * This is the opposite. It is a threshold pass: pixels already brighter than
 * the rest of the frame bleed into their neighbours, and nothing else does.
 * Only the screens, the LEDs and the travelling pulses ever cross it. The
 * blackened-steel bodies never do, so the modules stay solid objects that
 * happen to have lit displays, rather than objects wrapped in fog.
 *
 * Two decisions do most of the work of keeping it photographic:
 *
 *   · **The bloom is copper, not white.** UnrealBloomPass tints each mip of
 *     its blur chain independently, so the tight first mip stays close to the
 *     source colour and the wide outer mips fall towards deep amber. That is
 *     roughly what a real lens does with a warm source, and it is the single
 *     biggest difference between "tungsten" and "neon".
 *
 *   · **The radius is small.** A wide radius is the dreamy, uniform haze of
 *     every AI render. Kept tight, the same effect reads as a lens flaring
 *     slightly on a bright screen.
 *
 * ── Why three's own passes ──────────────────────────────────────────────────
 * @react-three/postprocessing requires three >= 0.182 and this project is on
 * 0.180. Upgrading three to add a glow is the wrong trade. three ships
 * UnrealBloomPass in examples/jsm, it tree-shakes to a few KB inside the
 * already-lazy 3D chunk, and going direct is what makes the per-mip tinting
 * above reachable at all.
 *
 * ── Why this is not the thing that crashed the GPU ──────────────────────────
 * The earlier crash was a *compositor* failure: stacked CSS masks and blend
 * modes on DOM layers being re-composited every frame above a full-screen
 * canvas. This is a render pass inside the existing WebGL context — a
 * different subsystem entirely. It is still real fill-rate cost, so it is off
 * on the low tier and runs at half resolution on mid.
 */

interface ScenePostProps {
  profile: DeviceProfile
}

/**
 * Tuned against the espresso ground — see the note on radius above.
 *
 * The threshold sits above the module screens' own brightness on purpose. Set
 * lower, the white label text on every node face crossed it and bloomed, which
 * put a soft halo around type that is supposed to be the crispest thing in the
 * scene — the modules read as out of focus. Only the pulses, the LEDs and the
 * lit figure should ever get here.
 */
const THRESHOLD = 0.95
const BASE_STRENGTH = 0.62
const RADIUS = 0.4

export function ScenePost({ profile }: ScenePostProps) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const bloomRef = useRef<UnrealBloomPass | null>(null)
  const gradeRef = useRef<ShaderPass | null>(null)
  const strength = useRef(BASE_STRENGTH)
  // EffectComposer stores its pixel ratio privately and offers no getter, so
  // the last value set has to be tracked here to avoid resizing every frame.
  const ratio = useRef(-1)

  const composer = useMemo(() => {
    // HalfFloat gives the bloom threshold real headroom above 1.0 to work
    // with. On a byte target every bright pixel clips to white first and the
    // copper tint is lost before the pass ever sees it.
    const c = new EffectComposer(
      gl,
      new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType,
        samples: profile.tier === 'high' ? 4 : 0,
      }),
    )

    c.addPass(new RenderPass(scene, camera))

    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), BASE_STRENGTH, RADIUS, THRESHOLD)

    // The blur chain, tinted per mip. Mip 0 is the tightest and stays close to
    // the source; each one after it is wider and has more of its green and blue
    // taken away, so the spill warms as it spreads instead of washing to white.
    //
    // These are multipliers, not colours — red is pinned at 1.0 throughout so
    // the tint shifts hue without draining the bloom's energy. Passing brand
    // hexes through THREE.Color instead would look right and behave wrong:
    // colour management converts them to linear on the way in, and #E0803F
    // arrives as roughly (0.76, 0.21, 0.05), which dims the outer mips to
    // nothing at the same time as it tints them.
    bloom.bloomTintColors = [
      new THREE.Vector3(1.0, 0.96, 0.9),
      new THREE.Vector3(1.0, 0.86, 0.68),
      new THREE.Vector3(1.0, 0.72, 0.45),
      new THREE.Vector3(1.0, 0.6, 0.3),
      new THREE.Vector3(1.0, 0.48, 0.2),
    ]

    c.addPass(bloom)
    bloomRef.current = bloom

    // Tone mapping and colour-space conversion happen here rather than on the
    // materials: three skips both when rendering into a render target, which
    // is exactly what we want — bloom has to be computed in linear light or a
    // tone-mapped highlight has already been rolled off before it can bleed.
    c.addPass(new OutputPass())

    const grade = new ShaderPass(GradeShader)
    c.addPass(grade)
    gradeRef.current = grade

    return c
  }, [gl, scene, camera, profile.tier])

  useEffect(() => () => composer.dispose(), [composer])

  /**
   * Resolution is split in two, and the split is the whole point.
   *
   * The scene always renders at the canvas's full pixel ratio. Only the bloom's
   * own mip chain is reduced. An earlier version scaled the composer's pixel
   * ratio instead, which is a different and much worse thing: it downsampled
   * every pass, so the modules, their screen text and the cables all rendered
   * at a fraction of the resolution and were upscaled to the display. The scene
   * looked soft and pixelated, and the bloom was not the reason — a blur is the
   * one effect where the resolution you gave up is genuinely invisible.
   */
  const bloomScale = profile.tier === 'high' ? 0.5 : 0.34

  useEffect(() => {
    composer.setSize(size.width, size.height)
    ratio.current = gl.getPixelRatio()
    composer.setPixelRatio(ratio.current)

    // setSize on the composer propagates full resolution to every pass, so the
    // bloom has to be shrunk back down afterwards or this does nothing.
    bloomRef.current?.setSize(
      Math.max(1, Math.round(size.width * bloomScale)),
      Math.max(1, Math.round(size.height * bloomScale)),
    )

    const grade = gradeRef.current
    if (grade) grade.uniforms.uAspect.value = size.width / Math.max(1, size.height)
  }, [composer, gl, size, bloomScale])

  // Priority > 0 takes the render loop away from R3F, which is required — the
  // frame has to go through the composer or none of this is on screen.
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const bloom = bloomRef.current
    const grade = gradeRef.current

    // PerformanceMonitor can drop the canvas pixel ratio underneath us; the
    // composer's targets have to follow or the frame is resampled twice.
    const want = gl.getPixelRatio()
    if (Math.abs(ratio.current - want) > 0.01) {
      ratio.current = want
      composer.setPixelRatio(want)
    }

    if (bloom) {
      // The wake-up surge. `scroll.reveal` ramps 0→1 as the last cable lands,
      // and sin() over that turns it into a swell that peaks mid-reveal and
      // settles — the lights coming up on the rig, not a permanent brightness
      // change. A step would just look like a different scene.
      const surge = Math.sin(Math.min(1, Math.max(0, scroll.reveal)) * Math.PI)

      // The same idiom played once on arrival instead of at the close: the
      // rig visibly powers on rather than opening already mid-scene. `bell`
      // rises and falls across `scroll.boot`'s 0→1 ramp, so the flare peaks
      // partway through the 1.4s boot window and is gone by the time it ends.
      const bootFlare = bell(scroll.boot)

      const target = BASE_STRENGTH + surge * 0.5 + scroll.reveal * 0.16 + bootFlare * 0.55
      strength.current = damp(strength.current, target, 3.5, dt)
      bloom.strength = strength.current
    }

    if (grade) {
      // Quantised to roughly 24fps. Grain resampled every frame at 120Hz
      // shimmers like digital noise; held for two or three frames it reads as
      // film, which is the whole point of having it.
      grade.uniforms.uTime.value = Math.floor(performance.now() / 42)
      grade.uniforms.uReveal.value = scroll.reveal
    }

    composer.render(dt)
  }, 1)

  return null
}

/**
 * Final grade: vignette, halation and grain.
 *
 * This pass is doing anti-CG work more than it is doing colour work. A clean
 * WebGL frame is *too* clean — uniform sharpness corner to corner, no falloff,
 * no sensor noise. Every one of those is a tell. Darkening the corners gives
 * the frame a lens, and a little grain gives it a sensor; together they are
 * most of why the scene reads as photographed rather than rendered.
 *
 * All three are deliberately near the threshold of noticing. If you can point
 * at the vignette, it is too strong.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uReveal: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAspect;
    uniform float uReveal;
    varying vec2 vUv;

    void main() {
      vec4 col = texture2D(tDiffuse, vUv);

      // --- Vignette ---------------------------------------------------------
      // Aspect-corrected, or it turns into an oval on a wide viewport and
      // stops reading as a lens.
      vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
      float r = length(d) / length(vec2(uAspect, 1.0) * 0.5);
      float vig = smoothstep(1.05, 0.36, r);
      col.rgb *= mix(0.72, 1.0, vig);

      // --- Halation ---------------------------------------------------------
      // Warm film stocks bleed red around bright areas. Lifting the red channel
      // slightly in proportion to luminance is a cheap stand-in, and it keeps
      // the copper from ever going white at the centre of a hot screen.
      float lum = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col.r += smoothstep(0.55, 1.0, lum) * 0.05;

      // --- Grain ------------------------------------------------------------
      // Deliberately faint. At the amplitude this started on it stopped reading
      // as film stock and started reading as a low-resolution image, which is
      // the opposite of the intended effect. Scaled hard by (1 - lum) so it
      // lives in the shadows and never touches the lit screens or the type.
      float n = fract(sin(dot(vUv * 1024.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
      col.rgb += (n - 0.5) * 0.014 * (1.0 - smoothstep(0.05, 0.42, lum));

      gl_FragColor = col;
    }
  `,
}
