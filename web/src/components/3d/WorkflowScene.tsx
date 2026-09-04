import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { C } from '@/constants/brand'
import { probeWebGL, useDeviceProfile } from '@/lib/perf/device'
import { scroll } from '@/lib/scroll/scrollStore'
import { clamp, damp } from '@/lib/animation/math'
import { disposeNodeFaceTextures } from '@/lib/three/nodeFaceTexture'

import { resetFlowState } from '@/lib/scene/flowState'
import { Workflow } from './Workflow'
import { CameraController } from './CameraController'
import { SceneEnvironment } from './SceneEnvironment'
import { ScenePost } from './ScenePost'

/**
 * The fixed WebGL layer that sits behind the whole page.
 *
 * The canvas is `position: fixed` and never unmounts, which is what makes the
 * scene continuous — one camera moving through one graph for the entire page,
 * rather than a series of separate animations that happen to be adjacent.
 *
 * There is no global dimming layer. Each section carries its own directional
 * scrim instead (see `SplitSection`), so the graph stays fully saturated in the
 * half of the viewport it occupies while the copy keeps its contrast in the
 * other. Dimming the whole scene would have made the build invisible exactly
 * when it is most worth watching.
 *
 * Performance is managed in four places:
 *   · device tier picks the starting quality (see lib/perf/device)
 *   · PerformanceMonitor drops pixel ratio if frames start costing too much
 *   · rendering stops entirely when the tab is hidden
 *   · textures and geometry are disposed on unmount
 */
export function WorkflowScene() {
  const profile = useDeviceProfile()
  const [dpr, setDpr] = useState(profile.dpr[1])

  useEffect(() => {
    resetFlowState()
    return () => {
      disposeNodeFaceTextures()

    }
  }, [])

  // Node hover swaps the cursor — the only DOM effect the 3D scene has, and it
  // fires a handful of times per session rather than per frame.
  const onNodeHover = useCallback((_id: string, hovering: boolean) => {
    document.documentElement.dataset.nodeHover = hovering ? 'true' : 'false'
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" data-scene-root>
      <Canvas
        className="pointer-events-auto"
        dpr={dpr}
        shadows={profile.shadows}
        gl={{
          antialias: profile.tier !== 'low',
          // Whichever preference actually produced a context during the probe.
          // Hard-coding 'high-performance' means no context at all on machines
          // that refuse it, and a canvas that renders nothing looks identical
          // to a scene that was never there.
          powerPreference: probeWebGL().powerPreference,
          failIfMajorPerformanceCaveat: false,
          // The backdrop sphere is opaque, so an alpha buffer would be a
          // per-pixel cost for nothing.
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [-11, 2, 6], fov: 40, near: 0.1, far: 160 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          // Slightly above neutral: ACES rolls warm highlights off hard, and
          // the amber screens need headroom to read as lit.
          gl.toneMappingExposure = 1.15
          scene.background = new THREE.Color(C.void)
        }}
      >
        <PerformanceMonitor
          // Sustained low frames drop the pixel ratio a step rather than
          // degrading the scene's content — resolution is the cheapest thing
          // to give up and the least noticeable on a soft-lit scene.
          onDecline={() => setDpr(profile.dpr[0])}
          onIncline={() => setDpr(profile.dpr[1])}
        />

        <SceneClock />
        <VisibilityGate />

        <CameraController profile={profile} />
        <SceneEnvironment profile={profile} />
        <Workflow profile={profile} onNodeHover={onNodeHover} />

        {/* Takes over the render loop when present — see ScenePost. On the low
            tier it is absent and R3F renders the scene directly, which is the
            same picture without the bleed, the vignette or the grain. */}
        {profile.bloom && <ScenePost profile={profile} />}
      </Canvas>
    </div>
  )
}

/**
 * Smooths raw scroll progress into the value the scene actually reads, once per
 * frame and before anything consumes it — hence the negative priority.
 *
 * Damping here rather than in each consumer means every part of the scene is
 * guaranteed to be looking at the same progress value on a given frame.
 */
function SceneClock() {
  const bootStart = useRef<number | null>(null)

  useFrame((state, delta) => {
    if (bootStart.current === null) bootStart.current = state.clock.elapsedTime
    scroll.boot = clamp((state.clock.elapsedTime - bootStart.current) / 1.4)

    scroll.smoothed = damp(scroll.smoothed, scroll.progress, 7, Math.min(delta, 0.05))
  }, -10)
  return null
}

/** Stops rendering when the tab is in the background. */
function VisibilityGate() {
  const setFrameloop = useThree((s) => s.setFrameloop)

  useEffect(() => {
    const onChange = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [setFrameloop])

  return null
}
