/**
 * Small, allocation-free maths helpers. Everything here is called inside
 * useFrame at 60fps, so nothing in this file may allocate.
 */

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Maps v from [inMin,inMax] onto [outMin,outMax], clamped at both ends. */
export const remap = (v: number, inMin: number, inMax: number, outMin = 0, outMax = 1) => {
  if (inMax === inMin) return outMin
  return lerp(outMin, outMax, clamp((v - inMin) / (inMax - inMin)))
}

/**
 * Framerate-independent exponential smoothing — the correct way to "lerp
 * towards a target" in a render loop. `lambda` is roughly "how fast", dt in
 * seconds. Ordinary `lerp(a, b, 0.1)` is framerate-dependent and drifts on
 * high-refresh displays.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/* --- Easing. Named to match the GSAP curves used elsewhere. --------------- */

export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
export const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOutExpo = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2

/**
 * Overshoot-and-settle. Used for the magnetic snap when a node arrives at its
 * socket — it passes its target slightly, then eases back.
 */
export const easeOutBack = (t: number, overshoot = 1.25) => {
  const c3 = overshoot + 1
  const p = t - 1
  return 1 + c3 * p * p * p + overshoot * p * p
}

/** Smooth 0→1→0 ramp, for pulses that rise and fall. */
export const bell = (t: number) => {
  const c = clamp(t)
  return Math.sin(c * Math.PI)
}
