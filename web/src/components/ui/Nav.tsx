import { useEffect, useRef, useState } from 'react'
import { BRAND } from '@/constants/brand'
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
 * quietly become a lie when work is added. The clock is the founders' local
 * time, not the visitor's — the point is that there is a person in Hyderabad on
 * the other end of this, which is the whole pitch of the About section.
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
      className="pointer-events-none hidden items-center gap-2.5 font-mono text-[0.66rem] tracking-[0.16em] text-faint uppercase xl:flex"
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

/**
 * Every link the site has, in one place, so the desktop dropdown and the
 * mobile sheet can't quietly drift apart. `kind: 'anchor'` scrolls within the
 * homepage via `scrollToHash`; `kind: 'page'` is a real navigation.
 */
const MENU_LINKS = [
  { label: 'About', href: '#about', kind: 'anchor' },
  { label: 'Services', href: '#services', kind: 'anchor' },
  { label: 'Work', href: '#projects', kind: 'anchor' },
  { label: 'Meet the founders', href: '/founders', kind: 'page' },
  { label: 'Is automation for you?', href: '/is-automation-for-you', kind: 'page' },
] as const

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile sheet on Escape, and lock the page behind it so a scroll
  // gesture on the full-screen menu doesn't drag the document underneath. On
  // phones Lenis leaves touch scrolling native, so `overflow: hidden` is enough.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // The desktop dropdown is a small, weightless panel rather than a full
  // sheet, so it closes on Escape and on an outside click too — both are
  // expected of a dropdown in a way neither is of the full-screen mobile menu.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    const onClick = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  const go = (href: string) => {
    setOpen(false)
    setMenuOpen(false)
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
          aria-label={`${BRAND.name} · home`}
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
            something true about the business and belongs to a partner that
            runs live systems — the links move right, next to the action
            they lead to. */}
        <LiveStatus />

        <div className="flex items-center gap-7">
          {/* One trigger instead of five links in a row — was the plain
              inline list until "Meet the founders" and "Is automation for
              you?" joined the three anchors and the bar started fighting
              LiveStatus for room around 1024px. A dropdown holds all five at
              any width instead of trading one problem for another. */}
          <div className="relative hidden md:block" ref={menu}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="group flex items-center gap-1.5 font-mono text-[0.7rem] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
              data-cursor-target
            >
              Menu
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div
              className={`absolute top-full right-0 mt-4 w-64 rounded-lg border border-line bg-void/98 py-2 backdrop-blur-2xl transition-all duration-200 ${
                menuOpen
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0'
              }`}
            >
              {MENU_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={
                    link.kind === 'anchor'
                      ? (e) => {
                          e.preventDefault()
                          go(link.href)
                        }
                      : () => setMenuOpen(false)
                  }
                  className={`block px-4 py-2.5 text-[0.85rem] transition-colors hover:bg-surface ${
                    link.href === '/is-automation-for-you'
                      ? 'text-accent hover:text-accent-deep'
                      : 'text-ink-dim hover:text-ink'
                  }`}
                  data-cursor-target
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

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

      {/*
        A full sheet below the bar, not a dropdown that stops after the last
        link. The collapsing panel it replaced was only as tall as its own
        contents, so the hero's own copy and buttons sat visible underneath it
        and the open menu never read as a deliberate surface of its own.
      */}
      <div
        ref={panel}
        id="mobile-nav"
        data-lenis-prevent
        className={`fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto border-t border-line bg-void/98 backdrop-blur-2xl transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ul className="wrap flex flex-col gap-1 py-8">
          {MENU_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={
                  link.kind === 'anchor'
                    ? (e) => {
                        e.preventDefault()
                        go(link.href)
                      }
                    : undefined
                }
                className={`flex min-h-14 items-center border-b border-line text-xl ${
                  link.href === '/is-automation-for-you' ? 'text-accent' : 'text-ink-dim'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-6">
            <MagneticButton href="#contact" variant="primary" className="w-full">
              Let&rsquo;s automate
            </MagneticButton>
          </li>
        </ul>
      </div>
    </header>
  )
}
