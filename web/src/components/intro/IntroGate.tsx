import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

/**
 * The cold open.
 *
 * A ~1-second beat before the site, in Akhari's own visual language: two
 * connectors — copper and brass, the two founders — snap in from the edges and
 * plug together at centre. The join throws a pulse and a warm bloom that the
 * page cross-dissolves out of. Quick — a flash, not a film.
 *
 * No video, no photography, no neon — drawn from the same port-nub and cable
 * motif as the 3D scene, in the same warm palette (`index.css`).
 *
 * Runs once per browser session, never under `prefers-reduced-motion` and never
 * when the URL points at a section. A click or Escape skips.
 *
 * The whole thing — including the fade-out at the end — is CSS on `transform`
 * and `opacity`. The React node then unmounts on a generous JS timer; by the
 * time that fires the overlay is already invisible.
 *
 * `App` holds the 3D scene unmounted until this fires `INTRO_DONE_EVENT` at
 * `VISUAL_MS`. three.js init is a heavy main-thread block; mounting it any
 * earlier — even behind the opaque overlay — stalls the compositor hand-off of
 * the intro's own animation and drags a one-second beat out past two. The scene
 * chunk still downloads during the intro; only the mount waits.
 */

const SEEN_KEY = 'akhari:intro-seen'
export const INTRO_DONE_EVENT = 'akhari:intro-done'
/** When the overlay has faded itself out (matches the `.intro-gate` keyframe). */
const VISUAL_MS = 950

/** Whether a fresh load will show the intro — `App` reads this to decide
 *  whether to hold the 3D scene back. */
export function willPlayIntro(): boolean {
  return shouldPlay()
}

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

let released = false
/** Tell `App` the scene may mount now — once per load. */
function releaseScene() {
  if (released) return
  released = true
  document.documentElement.removeAttribute('data-intro')
  window.dispatchEvent(new Event(INTRO_DONE_EVENT))
}

export function IntroGate() {
  const [gone, setGone] = useState(() => !shouldPlay())
  const dismiss = useCallback(() => {
    releaseScene()
    setGone(true)
  }, [])

  useLayoutEffect(() => {
    if (gone) return
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-intro', 'playing')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Once the overlay has visually cleared: free the page and let the scene
    // mount — independent of the (possibly late) React unmount below.
    const release = window.setTimeout(() => {
      document.body.style.overflow = prevOverflow
      releaseScene()
    }, VISUAL_MS)

    return () => {
      window.clearTimeout(release)
      document.body.style.overflow = prevOverflow
      releaseScene()
    }
  }, [gone])

  useEffect(() => {
    if (gone) return
    const cleanup = window.setTimeout(() => setGone(true), VISUAL_MS + 600)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(cleanup)
      window.removeEventListener('keydown', onKey)
    }
  }, [gone, dismiss])

  if (gone) return null

  const centre = { transformBox: 'view-box', transformOrigin: '602px 375px' } as const

  return (
    <div
      role="presentation"
      onClick={dismiss}
      data-lenis-prevent
      className="intro-gate fixed inset-0 z-[300] overflow-hidden bg-void"
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
          {[0, 1, 2, 3].map((i) => (
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
              bright while the overlay fades off it. */}
          <circle className="intro-bloom" cx="602" cy="375" r="200" fill="url(#intro-glow)" style={centre} />
        </g>
      </svg>

      <style>{`
        .intro-gate  { animation: intro-gate 0.95s linear both; }
        .intro-pool  { opacity: 0.03; animation: intro-pool 0.82s ease-in both; }
        .intro-scene { animation: intro-zoom 0.74s cubic-bezier(0.6, 0, 0.5, 1) 0.12s both; }

        .intro-left  { animation: intro-left  0.32s cubic-bezier(0.36, 0.7, 0.2, 1) both; }
        .intro-right { animation: intro-right 0.32s cubic-bezier(0.36, 0.7, 0.2, 1) both; }

        .intro-spark { opacity: 0; animation: intro-spark 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both; }
        .intro-bloom { opacity: 0; animation: intro-bloom 0.4s cubic-bezier(0.4, 0, 0.5, 1) 0.42s both; }

        .intro-ring   { opacity: 0; }
        .intro-ring-0 { animation: intro-ring 0.48s cubic-bezier(0.25, 0, 0.5, 1) 0.2s  both; }
        .intro-ring-1 { animation: intro-ring 0.48s cubic-bezier(0.25, 0, 0.5, 1) 0.3s  both; }
        .intro-ring-2 { animation: intro-ring 0.48s cubic-bezier(0.25, 0, 0.5, 1) 0.4s  both; }
        .intro-ring-3 { animation: intro-ring 0.48s cubic-bezier(0.25, 0, 0.5, 1) 0.5s  both; }

        @keyframes intro-gate {
          0%, 66% { opacity: 1; }
          100%    { opacity: 0; visibility: hidden; }
        }
        @keyframes intro-left {
          0%   { transform: translateX(-880px); opacity: 0.15; }
          70%  { opacity: 1; }
          86%  { transform: translateX(0); }
          93%  { transform: translateX(-6px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes intro-right {
          0%   { transform: translateX(880px); opacity: 0.15; }
          70%  { opacity: 1; }
          86%  { transform: translateX(0); }
          93%  { transform: translateX(6px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes intro-spark {
          0%   { transform: scale(0);   opacity: 0; }
          35%  { transform: scale(1.8); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0; }
        }
        @keyframes intro-ring {
          0%   { transform: scale(0.35); opacity: 0; }
          18%  { opacity: 0.75; }
          100% { transform: scale(7); opacity: 0; }
        }
        @keyframes intro-zoom {
          0%   { transform: scale(1); }
          100% { transform: scale(2.7); }
        }
        @keyframes intro-bloom {
          0%   { transform: scale(0.4); opacity: 0; }
          58%  { transform: scale(2.3); opacity: 0.9; }
          100% { transform: scale(3.4); opacity: 0.92; }
        }
        @keyframes intro-pool {
          0%   { opacity: 0.03; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}
