import * as THREE from 'three'
import type { NodeType } from '@/constants/workflow'

/**
 * Node faces are drawn to a 2D canvas and used as a single map on an inset
 * plane, rather than assembled from meshes and SDF text.
 *
 * Three reasons: one texture and one draw call per node instead of a dozen;
 * no webfont dependency inside WebGL (troika would fetch its own font at
 * runtime); and pixel-level control over the small internal details — tick
 * marks, LEDs, the inner bevel highlight — that make the modules read as
 * physical instruments instead of flat cards.
 */

/**
 * Drawn at 2× and sampled down, which is the difference between a screen you
 * can read and one that looks like a photograph of a screen.
 *
 * A module face fills roughly a fifth of the viewport height when the camera is
 * parked on it. At 512×320 that is close to one texel per device pixel on a
 * 1.5-DPR laptop and under-samples on anything denser, so the label text picked
 * up exactly the soft, slightly blocky quality you get from an upscaled image.
 */
const SCALE = 2

/** Physical canvas size. */
const W = 512 * SCALE
const H = 320 * SCALE

/** Logical drawing space. Every coordinate below is in these units — `paint`
 *  applies the scale once as a transform, so the artwork is written at a
 *  readable size and rendered at whatever SCALE says. */
const LW = 512
const LH = 320
const PAD = 26
const RADIUS = 26

const cache = new Map<string, THREE.CanvasTexture>()

type Ctx = CanvasRenderingContext2D

/* --- Icons. Stroked paths on a 24x24 grid, scaled by the caller. --------- */

const ICONS: Record<NodeType, (c: Ctx) => void> = {
  // Lightning bolt — matches the notch in the Akhari mark.
  TRIGGER: (c) => {
    c.beginPath()
    c.moveTo(13.5, 2)
    c.lineTo(5, 13.5)
    c.lineTo(11, 13.5)
    c.lineTo(10.5, 22)
    c.lineTo(19, 10.5)
    c.lineTo(13, 10.5)
    c.closePath()
    c.stroke()
  },
  // Two-way exchange.
  API: (c) => {
    c.beginPath()
    c.moveTo(3, 8.5)
    c.lineTo(18, 8.5)
    c.moveTo(14.5, 5)
    c.lineTo(18, 8.5)
    c.lineTo(14.5, 12)
    c.moveTo(21, 15.5)
    c.lineTo(6, 15.5)
    c.moveTo(9.5, 12)
    c.lineTo(6, 15.5)
    c.lineTo(9.5, 19)
    c.stroke()
  },
  // Four-point spark.
  AI: (c) => {
    const star = (cx: number, cy: number, r: number) => {
      c.beginPath()
      c.moveTo(cx, cy - r)
      c.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy)
      c.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r)
      c.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy)
      c.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r)
      c.closePath()
      c.stroke()
    }
    star(10, 10.5, 7.5)
    star(19, 19, 3.6)
  },
  // Stacked cylinder.
  DATABASE: (c) => {
    c.beginPath()
    c.ellipse(12, 5.5, 8, 3.1, 0, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.moveTo(4, 5.5)
    c.lineTo(4, 18.5)
    c.moveTo(20, 5.5)
    c.lineTo(20, 18.5)
    c.stroke()
    c.beginPath()
    c.ellipse(12, 12, 8, 3.1, 0, 0, Math.PI)
    c.stroke()
    c.beginPath()
    c.ellipse(12, 18.5, 8, 3.1, 0, 0, Math.PI)
    c.stroke()
  },
  // A path splitting in two.
  LOGIC: (c) => {
    c.beginPath()
    c.moveTo(3.5, 12)
    c.lineTo(9, 12)
    c.stroke()
    c.beginPath()
    c.moveTo(9, 12)
    c.quadraticCurveTo(14, 12, 14, 6)
    c.lineTo(20.5, 6)
    c.stroke()
    c.beginPath()
    c.moveTo(9, 12)
    c.quadraticCurveTo(14, 12, 14, 18)
    c.lineTo(20.5, 18)
    c.stroke()
    c.beginPath()
    c.arc(9, 12, 1.9, 0, Math.PI * 2)
    c.stroke()
  },
  // Bell.
  NOTIFICATION: (c) => {
    c.beginPath()
    c.moveTo(5.5, 17)
    c.lineTo(5.5, 11)
    c.quadraticCurveTo(5.5, 4.5, 12, 4.5)
    c.quadraticCurveTo(18.5, 4.5, 18.5, 11)
    c.lineTo(18.5, 17)
    c.lineTo(21, 17)
    c.lineTo(3, 17)
    c.stroke()
    c.beginPath()
    c.moveTo(9.6, 19.6)
    c.quadraticCurveTo(12, 22.2, 14.4, 19.6)
    c.stroke()
  },
  // Check in a ring.
  OUTPUT: (c) => {
    c.beginPath()
    c.arc(12, 12, 8.6, 0, Math.PI * 2)
    c.stroke()
    c.beginPath()
    c.moveTo(7.8, 12.2)
    c.lineTo(10.9, 15.3)
    c.lineTo(16.4, 8.8)
    c.stroke()
  },
}

/* --- Drawing ------------------------------------------------------------- */

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function paint(
  canvas: HTMLCanvasElement,
  type: NodeType,
  label: string,
  meta: string,
  accent: string,
) {
  const c = canvas.getContext('2d')
  if (!c) return

  c.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  c.clearRect(0, 0, LW, LH)

  // The screen. Near-black and *warm* — this plate was a blue-grey left over
  // from the original cool palette, and seven cold rectangles were the last
  // thing in the scene fighting the tungsten lighting around them.
  const plate = c.createLinearGradient(0, PAD, 0, LH - PAD)
  plate.addColorStop(0, '#2A2219')
  plate.addColorStop(0.5, '#1A1510')
  plate.addColorStop(1, '#100C09')
  roundRect(c, PAD, PAD, LW - PAD * 2, LH - PAD * 2, RADIUS)
  c.fillStyle = plate
  c.fill()

  c.save()
  roundRect(c, PAD, PAD, LW - PAD * 2, LH - PAD * 2, RADIUS)
  c.clip()

  // A soft diagonal sheen across the glass. Small detail, but it is the thing
  // that stops the face reading as a flat dark rectangle.
  const sheen = c.createLinearGradient(PAD, PAD, LW * 0.72, LH)
  sheen.addColorStop(0, 'rgba(255,236,214,0.13)')
  sheen.addColorStop(0.38, 'rgba(255,236,214,0.03)')
  sheen.addColorStop(1, 'rgba(255,236,214,0)')
  c.fillStyle = sheen
  c.fillRect(0, 0, LW, LH)

  // Accent wash behind the icon — a lit UI element, not a bloom. Stronger than
  // it was: with the bloom threshold now above the screen's own brightness,
  // colour on the face has to come from the artwork rather than from spill.
  const wash = c.createRadialGradient(108, 104, 4, 108, 104, 150)
  wash.addColorStop(0, hexToRgba(accent, 0.46))
  wash.addColorStop(0.55, hexToRgba(accent, 0.1))
  wash.addColorStop(1, hexToRgba(accent, 0))
  c.fillStyle = wash
  c.fillRect(0, 0, LW, LH)
  c.restore()

  // Recessed edge: dark line outside, faint highlight inside.
  roundRect(c, PAD, PAD, LW - PAD * 2, LH - PAD * 2, RADIUS)
  c.strokeStyle = 'rgba(0,0,0,0.55)'
  c.lineWidth = 3
  c.stroke()

  roundRect(c, PAD + 2, PAD + 2, LW - PAD * 2 - 4, LH - PAD * 2 - 4, RADIUS - 2)
  c.strokeStyle = 'rgba(255,238,218,0.12)'
  c.lineWidth = 1.5
  c.stroke()

  // Icon.
  c.save()
  c.translate(72, 68)
  c.scale(3.4, 3.4)
  c.strokeStyle = accent
  c.lineWidth = 1.85
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.shadowColor = accent
  c.shadowBlur = 16
  ICONS[type](c)
  // Struck twice: the second pass lands on top of its own glow and gives the
  // stroke a clean edge, so the icon reads as bright rather than smudged.
  c.shadowBlur = 0
  ICONS[type](c)
  c.restore()

  // Type badge, top right.
  c.font = '500 20px "JetBrains Mono", ui-monospace, monospace'
  c.textAlign = 'right'
  c.fillStyle = accent
  c.fillText(type, LW - PAD - 26, 74)

  // Rule under the header.
  c.beginPath()
  c.moveTo(PAD + 26, 152)
  c.lineTo(LW - PAD - 26, 152)
  c.strokeStyle = 'rgba(255,238,218,0.12)'
  c.lineWidth = 2
  c.stroke()

  // Label + meta, in the page's own bone and warm grey rather than the cool
  // greys these were.
  c.textAlign = 'left'
  c.font = '600 46px Inter, system-ui, sans-serif'
  c.fillStyle = '#F7F2E9'
  c.fillText(label, PAD + 26, 214)

  c.font = '400 23px "JetBrains Mono", ui-monospace, monospace'
  c.fillStyle = 'rgba(186,170,150,0.95)'
  c.fillText(meta, PAD + 26, 250)

  // Status LEDs, bottom right — one lit, two dormant.
  const ledY = LH - PAD - 30
  for (let i = 0; i < 3; i++) {
    const x = LW - PAD - 34 - i * 22
    c.beginPath()
    c.arc(x, ledY, 5, 0, Math.PI * 2)
    if (i === 0) {
      c.fillStyle = accent
      c.shadowColor = accent
      c.shadowBlur = 12
    } else {
      c.fillStyle = 'rgba(255,238,218,0.16)'
      c.shadowBlur = 0
    }
    c.fill()
  }
  c.shadowBlur = 0
}

/**
 * Returns a cached face texture. Textures are keyed by their full content, so
 * two nodes with identical copy share one upload.
 */
export function getNodeFaceTexture(
  type: NodeType,
  label: string,
  meta: string,
  accent: string,
): THREE.CanvasTexture {
  const key = `${type}|${label}|${meta}|${accent}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H

  paint(canvas, type, label, meta, accent)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // The face is viewed at a raking angle for most of the scroll, which is
  // exactly the case trilinear filtering handles badly and anisotropy fixes.
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true

  // Inter and JetBrains Mono almost certainly aren't parsed on first paint.
  // Redraw once they are, otherwise every node ships with fallback metrics.
  document.fonts?.ready
    .then(() => {
      paint(canvas, type, label, meta, accent)
      texture.needsUpdate = true
    })
    .catch(() => {})

  cache.set(key, texture)
  return texture
}

/** Frees every cached face texture. Called when the scene unmounts. */
export function disposeNodeFaceTextures(): void {
  for (const texture of cache.values()) texture.dispose()
  cache.clear()
}
