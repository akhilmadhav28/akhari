import { BRAND, NAV_LINKS } from '@/constants/brand'
import { scrollToHash } from '@/lib/scroll/useSmoothScroll'

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-abyss">
      <div className="wrap py-14">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div>
            <img
              src="/brand/logo-lockup.png"
              alt={BRAND.wordmark}
              width={132}
              height={92}
              loading="lazy"
              className="h-16 w-auto opacity-90"
            />
            <p className="mt-5 max-w-[24rem] text-[0.9rem] text-muted">
              {BRAND.tagline} in {BRAND.location}. Built and maintained by Akhil Madhav.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToHash(link.href)
                    }}
                    className="text-[0.9rem] text-muted transition-colors hover:text-ink"
                    data-cursor-target
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-2.5">
            <a
              href={`mailto:${BRAND.email}`}
              className="text-[0.9rem] text-muted transition-colors hover:text-accent"
              data-cursor-target
            >
              {BRAND.email}
            </a>
            <a
              href={`tel:${BRAND.phoneHref}`}
              className="text-[0.9rem] text-muted transition-colors hover:text-accent"
              data-cursor-target
            >
              {BRAND.phone}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-line pt-7">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="mono-tag text-faint">
              &copy; {new Date().getFullYear()} {BRAND.wordmark}
            </p>
            <a
              href="/privacy"
              className="mono-tag text-faint transition-colors hover:text-ink"
              data-cursor-target
            >
              Privacy Policy
            </a>
          </div>
          <p className="mono-tag flex items-center gap-2 text-faint">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />4 systems live
          </p>
        </div>
      </div>
    </footer>
  )
}
