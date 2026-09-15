import { useEffect } from 'react'
import { BRAND } from '@/constants/brand'

/**
 * 404. Same plain-page shape as Privacy/Founders — no Lenis, no WorkflowScene.
 *
 * The Site has no server logic (static hosting via Vercel, `vercel.json`
 * rewrites every path to `/index.html`), so this can't carry a real HTTP 404
 * status — the response is 200 regardless. `main.tsx` renders this for any
 * pathname not in its `PAGES` map, which used to silently fall through to the
 * full homepage: a typo'd link or dead bookmark looked like it worked, and a
 * crawler following a broken link indexed homepage content under the wrong
 * URL. The `noindex` tag below is the client-side mitigation for the missing
 * status code — it tells a crawler not to index this response even though it
 * technically succeeded.
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
    <div className="flex min-h-screen flex-col bg-void">
      <header className="border-b border-line">
        <div className="wrap-narrow flex h-20 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label={`${BRAND.name} · home`}>
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
          className="mono-tag mt-9 inline-flex w-fit items-center gap-2 text-accent transition-colors hover:text-ink"
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
