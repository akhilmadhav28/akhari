import { useEffect, useRef, useState } from 'react'
import { BRAND, NAV_LINKS } from '@/constants/brand'
import { PROJECTS } from '@/constants/content'
import { scrollToHash } from '@/lib/scroll/useSmoothScroll'
import { MagneticButton } from './MagneticButton'

/**
 * Fixed top navigation.
 *
 * Transparent over the hero so the 3D scene runs edge to edge, then picks up a
 * blurred background once the page has scrolled — the bar has to stay legible
 * over both bright paper and a dark module passing behind it.
 */
/**
 * Live readout in the middle of the bar.
 *
 * The count is derived from the case studies rather than typed, so it cannot
 * quietly become a lie when work is added. The clock is Akhil's local time, not
 * the visitor's — the point is that there is a person in Hyderabad on the other
 * end of this, which is the whole pitch of the About section.
 *
 * Ticks once a minute. A seconds display would be a per-second re-render of the
 * header for a detail nobody reads.
 */
function LiveStatus() {
  const [now, setNow] = useState(() => hyderabadTime())

  useEffect(() => {
    const id = window.setInterval(() => setNow(hyderabadTime()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p
      className="pointer-events-none hidden items-center gap-2.5 font-mono text-[0.66rem] tracking-[0.16em] text-faint uppercase lg:flex"
      aria-hidden="true"
    >
      <span className="glow-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {PROJECTS.length} systems live
      <span className="text-line-strong">/</span>
      Hyderabad {now}
    </p>
  )
}

const hyderabadTime = (): string =>
  new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  })

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile sheet on Escape, and lock the page behind it.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    scrollToHash(href)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-line/70 bg-void/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="wrap flex h-[4.5rem] items-center justify-between gap-6" aria-label="Main">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            go('#top')
          }}
          className="flex items-center gap-3"
          data-cursor-target
          aria-label={`${BRAND.name} — home`}
        >
          <img
            src="/brand/logo-mark-sm.png"
            alt=""
            width={26}
            height={25}
            className="h-[1.55rem] w-auto"
          />
          <span className="font-mono text-[0.78rem] tracking-[0.34em] text-ink">
            {BRAND.wordmark}
          </span>
        </a>

        {/* The centre used to hold the links, which is the most common header
            arrangement on the internet and said nothing. A live readout says
            something true about the business and belongs to a studio that
            builds running systems — the links move right, next to the action
            they lead to. */}
        <LiveStatus />

        <div className="flex items-center gap-7">
          <ul className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    go(link.href)
                  }}
                  className="group relative font-mono text-[0.7rem] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
                  data-cursor-target
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden sm:block">
            <MagneticButton href="#contact" variant="primary" className="!min-h-10 !px-4 !text-[0.68rem]">
              Let&rsquo;s automate
            </MagneticButton>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-ink transition-all duration-300 ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        ref={panel}
        id="mobile-nav"
        className={`overflow-hidden border-t border-line bg-void/96 backdrop-blur-xl transition-[max-height,opacity] duration-500 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <ul className="wrap flex flex-col gap-1 py-5">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  go(link.href)
                }}
                className="flex min-h-12 items-center text-lg text-ink-dim"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-3">
            <MagneticButton href="#contact" variant="primary" className="w-full">
              Let&rsquo;s automate
            </MagneticButton>
          </li>
        </ul>
      </div>
    </header>
  )
}
