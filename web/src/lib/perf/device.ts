import { useEffect, useState } from 'react'

/**
 * Device capability tiering.
 *
 * Every expensive decision in the 3D scene keys off this: pixel ratio, shadow
 * maps, post-processing, node count, curve subdivision and particle counts. The
 * goal is that a mid-range Android phone renders a simpler but still coherent
 * version of the same scene rather than a stuttering copy of the desktop one.
 */

export type Tier = 'low' | 'mid' | 'high'

export interface DeviceProfile {
  tier: Tier
  /** Portrait / small viewport — changes layout, not just quality. */
  isCompact: boolean
  isTouch: boolean
  /** Capped device pixel ratio for the WebGL canvas. */
  dpr: [number, number]
  /** Soft shadows are the single most expensive thing in this scene. */
  shadows: boolean
  /** Screen-space bloom pass. */
  bloom: boolean
  /** Points along each connection curve. */
  curveSegments: number
  /** Ambient dust particles behind the graph. */
  particles: number
  /** Environment reflections cost a cubemap render; skipped on low. */
  reflections: boolean
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Reads the unmasked GPU string. Integrated/software renderers get demoted a
 * tier regardless of what the CPU heuristics say — core count is a poor proxy
 * for fill rate, which is what actually limits us here.
 */
function gpuIsWeak(): boolean {
  // Reuses the cached probe rather than creating another context.
  const { supported, renderer } = probeWebGL()
  if (!supported) return true
  return /swiftshader|llvmpipe|software|mali-4|adreno \(tm\) [1-4]|powervr sgx/.test(
    renderer.toLowerCase(),
  )
}

export interface WebGLProbe {
  supported: boolean
  /**
   * Which power preference actually yielded a context. Asking for
   * 'high-performance' can be refused outright on hybrid-graphics laptops and
   * on machines with graphics acceleration partly disabled — in which case the
   * canvas silently never renders. Falling back to 'default' costs nothing and
   * is the difference between a working scene and a blank one.
   */
  powerPreference: 'high-performance' | 'default'
  renderer: string
}

let probed: WebGLProbe | null = null

export function probeWebGL(): WebGLProbe {
  if (probed) return probed

  if (typeof document === 'undefined') {
    probed = { supported: false, powerPreference: 'default', renderer: 'ssr' }
    return probed
  }

  const attempt = (powerPreference: 'high-performance' | 'default') => {
    try {
      const canvas = document.createElement('canvas')
      const attrs = { powerPreference, failIfMajorPerformanceCaveat: false }
      const gl =
        (canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ??
        (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null)
      if (!gl) return null

      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown'

      // Release immediately — probe contexts count against the browser's hard
      // limit and leaking one can starve the real canvas.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      return renderer
    } catch {
      return null
    }
  }

  const high = attempt('high-performance')
  if (high !== null) {
    probed = { supported: true, powerPreference: 'high-performance', renderer: high }
    return probed
  }

  const standard = attempt('default')
  if (standard !== null) {
    probed = { supported: true, powerPreference: 'default', renderer: standard }
    return probed
  }

  probed = { supported: false, powerPreference: 'default', renderer: 'none' }
  return probed
}

export function detectProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      tier: 'mid',
      isCompact: false,
      isTouch: false,
      dpr: [1, 1.5],
      shadows: false,
      bloom: false,
      curveSegments: 32,
      particles: 0,
      reflections: false,
    }
  }

  const isCompact = window.matchMedia('(max-width: 900px)').matches
  const isTouch = window.matchMedia('(pointer: coarse)').matches

  const cores = navigator.hardwareConcurrency ?? 4
  // deviceMemory is Chromium-only; absence is not evidence of a weak device.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  let tier: Tier = 'high'
  if (isTouch || isCompact) tier = 'mid'
  if (cores <= 4 || memory <= 4) tier = 'mid'
  if (cores <= 2 || memory <= 2) tier = 'low'
  if (gpuIsWeak()) tier = tier === 'high' ? 'mid' : 'low'
  if (prefersReducedMotion()) tier = tier === 'high' ? 'mid' : tier

  const byTier: Record<Tier, Omit<DeviceProfile, 'tier' | 'isCompact' | 'isTouch'>> = {
    /**
     * The low end of each `dpr` range is a floor, not a target.
     *
     * PerformanceMonitor drops to it when frames get expensive, and dropping
     * below the display's own device pixel ratio means the scene is rendered
     * smaller than the screen and upscaled — which looks like the whole thing
     * went out of focus. Most laptops here are 1.5; 1.0 was visibly soft the
     * moment anything made the frame cost more. Giving up a little resolution
     * under load is fine, giving up sharpness entirely is not.
     */
    high: {
      dpr: [1.5, 2],
      shadows: true,
      bloom: true,
      curveSegments: 48,
      particles: 220,
      reflections: true,
    },
    mid: {
      dpr: [1.25, 1.75],
      shadows: false,
      bloom: true,
      curveSegments: 28,
      particles: 90,
      reflections: false,
    },
    low: {
      dpr: [1, 1],
      shadows: false,
      bloom: false,
      curveSegments: 18,
      particles: 0,
      reflections: false,
    },
  }

  return { tier, isCompact, isTouch, ...byTier[tier] }
}

/**
 * Detects once on mount, then only re-evaluates the layout-affecting flags on
 * resize. Re-running the full GPU probe on every resize would burn contexts,
 * and hardware doesn't change mid-session.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(() => detectProfile())

  useEffect(() => {
    const compactQuery = window.matchMedia('(max-width: 900px)')

    const onChange = () => {
      setProfile((prev) => {
        const isCompact = compactQuery.matches
        if (isCompact === prev.isCompact) return prev
        return { ...prev, isCompact }
      })
    }

    compactQuery.addEventListener('change', onChange)
    return () => compactQuery.removeEventListener('change', onChange)
  }, [])

  return profile
}
