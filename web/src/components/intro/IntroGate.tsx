import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The cold open.
 *
 * A ~2.3-second beat before the site, in Akhari's own visual language: two
 * connectors — copper and brass, the two founders — travel in from the edges
 * and plug together at centre. The join fires a pulse that rushes the viewer
 * down the wire and out onto the page.
 *
 * No video, no photography, no neon — drawn from the same port-nub and cable
 * motif as the 3D scene, in the same warm palette (`index.css`).
 *
 * Runs once per browser session, never under `prefers-reduced-motion` and never
 * when the URL points at a section. While it plays, `data-intro="playing"` on
 * `<html>` holds the scene's boot ramp shut (see `3d/WorkflowScene` SceneClock)
 * so the rig powers on as the viewer lands rather than behind the animation.
 * A click or Escape skips; a hard timer unmounts it regardless.
 */

const SEEN_KEY = 'akhari:intro-seen'
/** Must match the end of the CSS timeline below. */
const DURATION_MS = 1950
const FADE_MS = 360

function shouldPlay(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false
  } catch {
    /* private mode — just play it */
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const h = window.location.hash
  if (h && h !== '#' && h !== '#top') return false
  return true
}

export function IntroGate() {
  const [state, setState] = useState<'playing' | 'leaving' | 'gone'>(() =>
    shouldPlay() ? 'playing' : 'gone',
  )
  const ending = useRef(false)

  const finish = useCallback(() => {
    if (ending.current) return
    ending.current = true
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    document.documentElement.removeAttribute('data-intro')
    setState('leaving')
    window.setTimeout(() => setState('gone'), FADE_MS)
  }, [])

  // Claim the scene's boot ramp before the lazy 3D chunk has even loaded.
  useLayoutEffect(() => {
    if (state !== 'playing') return
    document.documentElement.setAttribute('data-intro', 'playing')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      document.documentElement.removeAttribute('data-intro')
    }
  }, [state])

  useEffect(() => {
    if (state !== 'playing') return
    const t = window.setTimeout(finish, DURATION_MS)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [state, finish])

  if (state === 'gone') return null

  const centre = { transformBox: 'view-box', transformOrigin: '602px 375px' } as const

  return (
    <div
      role="presentation"
      onClick={finish}
      data-lenis-prevent
      className={`fixed inset-0 z-[300] overflow-hidden bg-void transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)] ${
        state === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 750"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="intro-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f6e8d6" />
            <stop offset="10%" stopColor="#e0803f" />
            <stop offset="46%" stopColor="#b85f22" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#0f0c0a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* A subtle warm ground, held low the whole way — matches the hero light pool. */}
        <circle className="intro-pool" cx="602" cy="375" r="560" fill="url(#intro-glow)" />

        <g className="intro-scene" style={centre}>
          {/* Pulse rings — the wire, rushing past. */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              className={`intro-ring intro-ring-${i}`}
              cx="602"
              cy="375"
              r="40"
              fill="none"
              stroke={i % 2 ? '#c9a227' : '#e0803f'}
              strokeWidth="2.5"
              style={centre}
            />
          ))}

          {/* Left connector — copper. Prongs point right. */}
          <g className="intro-left">
            <path d="M -300 375 H 578" stroke="#443a31" strokeWidth="4" fill="none" />
            <path d="M 430 375 H 578" stroke="#e0803f" strokeWidth="4" fill="none" />
            <rect x="548" y="351" width="34" height="48" rx="7" fill="#17130f" stroke="#e0803f" strokeWidth="2.5" />
            <rect x="582" y="361" width="22" height="6" rx="3" fill="#e0803f" />
            <rect x="582" y="383" width="22" height="6" rx="3" fill="#e0803f" />
          </g>

          {/* Right connector — brass. Socket the prongs enter. */}
          <g className="intro-right">
            <path d="M 1500 375 H 622" stroke="#443a31" strokeWidth="4" fill="none" />
            <path d="M 770 375 H 622" stroke="#c9a227" strokeWidth="4" fill="none" />
            <rect x="600" y="345" width="46" height="60" rx="9" fill="#17130f" stroke="#c9a227" strokeWidth="2.5" />
            <rect x="600" y="359" width="18" height="11" rx="3" fill="#0f0c0a" />
            <rect x="600" y="381" width="18" height="11" rx="3" fill="#0f0c0a" />
          </g>

          {/* The join. */}
          <circle className="intro-spark" cx="602" cy="375" r="11" fill="url(#intro-glow)" style={centre} />

          {/* The light we come out into — grows to fill the frame and holds
              bright while the page cross-dissolves out of it. */}
          <circle className="intro-bloom" cx="602" cy="375" r="200" fill="url(#intro-glow)" style={centre} />
        </g>
      </svg>

      <style>{`
        .intro-pool  { opacity: 0.03; animation: intro-pool 2.2s ease-in both; }
        .intro-scene { animation: intro-zoom 1.7s cubic-bezier(0.7, 0, 0.55, 1) 0.46s both; }

        .intro-left  { animation: intro-left  0.55s cubic-bezier(0.34, 0.72, 0.24, 1) both; }
        .intro-right { animation: intro-right 0.55s cubic-bezier(0.34, 0.72, 0.24, 1) both; }

        .intro-spark { opacity: 0; animation: intro-spark 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.46s both; }
        .intro-bloom { opacity: 0; animation: intro-bloom 0.6s cubic-bezier(0.45, 0, 0.55, 1) 1.44s both; }

        .intro-ring   { opacity: 0; }
        .intro-ring-0 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 0.46s both; }
        .intro-ring-1 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 0.60s both; }
        .intro-ring-2 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 0.76s both; }
        .intro-ring-3 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 0.94s both; }
        .intro-ring-4 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 1.14s both; }
        .intro-ring-5 { animation: intro-ring 0.9s cubic-bezier(0.25, 0, 0.5, 1) 1.36s both; }

        @keyframes intro-left {
          0%   { transform: translateX(-880px); opacity: 0.15; }
          72%  { opacity: 1; }
          88%  { transform: translateX(0); }
          94%  { transform: translateX(-6px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes intro-right {
          0%   { transform: translateX(880px); opacity: 0.15; }
          72%  { opacity: 1; }
          88%  { transform: translateX(0); }
          94%  { transform: translateX(6px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes intro-spark {
          0%   { transform: scale(0);   opacity: 0; }
          35%  { transform: scale(1.8); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0; }
        }
        @keyframes intro-ring {
          0%   { transform: scale(0.35); opacity: 0; }
          16%  { opacity: 0.75; }
          100% { transform: scale(7); opacity: 0; }
        }
        @keyframes intro-zoom {
          0%   { transform: scale(1); }
          100% { transform: scale(2.7); }
        }
        @keyframes intro-bloom {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(2.3); opacity: 0.9; }
          100% { transform: scale(3.4); opacity: 0.92; }
        }
        @keyframes intro-pool {
          0%   { opacity: 0.03; }
          60%  { opacity: 0.12; }
          100% { opacity: 0.16; }
        }
      `}</style>
    </div>
  )
}
