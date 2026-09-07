import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The cold open.
 *
 * Before the site itself, a ten-second film: the two founders plug in, and the
 * connection pulls the visitor through a tunnel and out the other side onto the
 * page. It runs once per browser session and never for someone who asked not to
 * be moved (`prefers-reduced-motion`) or who followed a deep link to a specific
 * section — in those cases the site is exactly where it always was.
 *
 * The scene behind this holds its boot ramp shut while `data-intro="playing"`
 * is on `<html>` (see `3d/WorkflowScene` SceneClock), so the rig powers on as
 * the tunnel clears rather than during a film nobody can see.
 *
 * Everything here fails open: a stalled download, a decode error or a browser
 * that refuses the file drops the visitor straight onto the site instead of a
 * black screen.
 */

const SEEN_KEY = 'akhari:intro-seen'
/** Start the hand-off this long before the clip actually ends, so the tunnel
 *  dims into the page instead of cutting to it. */
const HANDOFF_LEAD = 0.6
/** Absolute ceiling. If the video hasn't ended by now, something is wrong — leave. */
const SAFETY_MS = 14_000

function shouldPlay(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false
  } catch {
    /* private mode — fall through and just play it */
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  // A link to /#projects means the visitor wants that section, not a preamble.
  if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#top') {
    return false
  }
  return true
}

export function IntroGate() {
  const [state, setState] = useState<'playing' | 'leaving' | 'gone'>(() =>
    shouldPlay() ? 'playing' : 'gone',
  )
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
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
    // Match the CSS opacity transition below before unmounting.
    window.setTimeout(() => setState('gone'), 700)
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
    const el = video.current
    if (!el) return

    // Try with sound; browsers that block it hand back a rejected promise and
    // we retry muted, which always goes through.
    el.muted = false
    el.play().then(
      () => setMuted(false),
      () => {
        el.muted = true
        setMuted(true)
        el.play().catch(finish)
      },
    )

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish()
    window.addEventListener('keydown', onKey)
    const safety = window.setTimeout(finish, SAFETY_MS)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(safety)
    }
  }, [state, finish])

  if (state === 'gone') return null

  const onTime = () => {
    const el = video.current
    if (!el || !el.duration) return
    setProgress(el.currentTime / el.duration)
    if (el.duration - el.currentTime <= HANDOFF_LEAD) finish()
  }

  const toggleSound = () => {
    const el = video.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
    if (!el.muted) el.play().catch(() => undefined)
  }

  return (
    <div
      role="dialog"
      aria-label="Intro"
      data-lenis-prevent
      className={`fixed inset-0 z-[300] bg-black transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        state === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={video}
        className="h-full w-full object-cover"
        src="/media/intro.mp4"
        poster="/media/intro-poster.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={finish}
        onError={finish}
        onTimeUpdate={onTime}
      />

      {/* Feathered vignette so the clip's hard frame edge doesn't sit on the
          viewport edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 12rem 2rem rgba(0,0,0,0.55)' }}
      />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(1.25rem,4vw,2.25rem)]">
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.22em] text-white/55 uppercase transition-colors hover:text-white"
        >
          {muted ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" />
              </svg>
              Sound
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
              Sound on
            </>
          )}
        </button>

        <button
          type="button"
          autoFocus
          onClick={finish}
          className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.22em] text-white/55 uppercase transition-colors hover:text-white"
        >
          Skip intro
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 6l6 6-6 6M5 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* Progress hairline. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/12">
        <div
          className="h-full bg-white/70"
          style={{ width: `${progress * 100}%`, transition: 'width 120ms linear' }}
        />
      </div>
    </div>
  )
}
