import { useEffect } from 'react'
import { BRAND } from '@/constants/brand'

/**
 * 404. Same plain-page shape as Privacy/Founders — no Lenis, no WorkflowScene.
 *
 * The Site has no server logic (static hosting via Vercel). `vercel.json`
 * rewrites only the real pages in `main.tsx`'s `PAGES` map to `/index.html`;
 * every other path falls through to `404.html`, a copy of the built
 * index.html made by `scripts/copy-404.mjs`, which Vercel serves with a real
 * HTTP 404 status. That copy boots the same app, and `main.tsx` renders this
 * page for any pathname not in `PAGES`. It used to fall through to the full
 * homepage, so a typo'd link or dead bookmark looked like it worked.
 *
 * Keep the two lists in step: a page added to `PAGES` also needs adding to the
 * `vercel.json` rewrite, or it will be served as a 404. The `noindex` tag
 * below stays as a second layer for crawlers.
 */
export function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · Akhari'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-void">
      <header className="border-b border-line">
        <div className="wrap-narrow flex h-20 items-center justify-between">
          <a href="/" className="tap flex items-center gap-3" aria-label={`${BRAND.name} · home`}>
            <img
              src="/brand/logo-mark-sm.png"
              alt=""
              width={26}
              height={25}
              className="h-6 w-auto"
            />
            <span className="font-mono text-[0.78rem] tracking-[0.34em] text-ink">
              {BRAND.wordmark}
            </span>
          </a>
        </div>
      </header>

      <main className="wrap-narrow flex flex-1 flex-col justify-center py-20">
        <p className="eyebrow">
          <b>404</b>
          <span className="h-px w-6 bg-line-strong" />
          Nothing here
        </p>

        <h1 className="mt-5 text-[2.25rem] sm:text-[2.75rem]">That page doesn't exist.</h1>

        <p className="mt-6 max-w-[34rem] text-[1.05rem] leading-relaxed text-ink-dim">
          The link that brought you here is either old or mistyped: nothing on{' '}
          <span className="text-ink">akhari.in</span> lives at this address.
        </p>

        <a
          href="/"
          className="tap mono-tag mt-9 inline-flex w-fit items-center gap-2 text-accent transition-colors hover:text-ink"
        >
          ← Back to the homepage
        </a>
      </main>

      <div className="border-t border-line">
        <div className="wrap-narrow py-8">
          <p className="mono-tag text-faint">
            &copy; {new Date().getFullYear()} {BRAND.wordmark}
          </p>
        </div>
      </div>
    </div>
  )
}
