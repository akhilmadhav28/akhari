import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { EdgeDef } from '@/constants/workflow'
import { edgeRuntime, MAX_PULSES } from '@/lib/scene/flowState'

/**
 * A cable between two nodes.
 *
 * The curve is a cubic bezier whose control points extend along the dominant
 * axis of the run, which gives the n8n-style bow on the wide desktop layout and
 * a vertical drop on the stacked mobile one without any special-casing.
 *
 * Everything animated lives in the shader: the draw-on reveal, the travelling
 * pulse heads with their comet tails, and a fresnel rim that keeps the cable
 * legible against the dark ground. That means a cable costs one draw call and
 * four uniform writes per frame regardless of how much is happening on it.
 */

interface ConnectionProps {
  edge: EdgeDef
  /** Built by Workflow so the cable and its pulses share one curve. */
  curve: THREE.CubicBezierCurve3
  accent: string
  segments: number
}

/**
 * Exported so the Output→figure link can be the same cable rather than a
 * lookalike. It is the one run in the scene that does not connect two modules,
 * and a second shader written to match this one would drift from it the first
 * time either is touched.
 */
export const CABLE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const CABLE_FRAG = /* glsl */ `
  uniform vec3  uCable;
  uniform vec3  uAccent;
  uniform float uReveal;
  uniform float uEnergy;
  uniform float uPulses[${MAX_PULSES}];

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    float u = vUv.x;

    // Draw-on: nothing past the reveal front exists yet.
    if (u > uReveal) discard;

    // Soften the leading edge so the cable grows rather than snapping.
    float tip = smoothstep(uReveal, uReveal - 0.05, u);

    // Back on a dark ground, so the rim is what makes a thin cable visible.
    // Kept well below the old value: the previous version's bright fresnel
    // halo was a large part of what made the scene read as generated.
    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.2);

    vec3 col = uCable;
    col += uAccent * fres * (0.18 + 0.16 * uEnergy);
    col = mix(col, mix(col, uAccent, 0.22), uEnergy);

    // Travelling pulses: a tight bright head with an exponential tail behind.
    float glow = 0.0;
    for (int i = 0; i < ${MAX_PULSES}; i++) {
      float p = uPulses[i];
      if (p < 0.0) continue;
      float d = u - p;
      glow += exp(-d * d * 1100.0);
      glow += exp(-max(0.0, -d) * 22.0) * 0.30;
    }
    glow = clamp(glow, 0.0, 1.0);

    // The pulse REPLACES the cable colour rather than adding to it. Additive
    // light does nothing useful here — the ground is already near-white, so a
    // travelling highlight has to be a change in hue and value, not a bloom.
    col = mix(col, uAccent, glow);
    col += uAccent * glow * 0.55;
    col += vec3(1.0, 0.86, 0.68) * glow * glow * 0.35;

    gl_FragColor = vec4(col * tip, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function Connection({ edge, curve, accent, segments }: ConnectionProps) {
  const material = useRef<THREE.ShaderMaterial>(null)

  // Rebuilt whenever the curve identity changes, which is how the cable stays
  // attached when the layout swaps between the desktop and mobile graphs.
  // 6 radial segments is plenty for a 3.5cm tube — the silhouette reads as
  // round well before the polygon count would.
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, segments, 0.036, 6, false),
    [curve, segments],
  )

  const uniforms = useMemo(
    () => ({
      uCable: { value: new THREE.Color('#3A322B') },
      uAccent: { value: new THREE.Color(accent) },
      uReveal: { value: 0 },
      uEnergy: { value: 0 },
      uPulses: { value: new Array(MAX_PULSES).fill(-1) as number[] },
    }),
    [accent],
  )

  // Dispose the tube when the layout changes or the scene unmounts —
  // useMemo replacing a geometry does not free the old GPU buffers.
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(() => {
    const mat = material.current
    if (!mat) return

    const rt = edgeRuntime[edge.id]
    mat.uniforms.uReveal.value = rt.reveal
    mat.uniforms.uEnergy.value = rt.energy

    const dst = mat.uniforms.uPulses.value as number[]
    for (let i = 0; i < MAX_PULSES; i++) dst[i] = rt.pulses[i]
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={CABLE_VERT}
        fragmentShader={CABLE_FRAG}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  )
}
