// Runs after `vite build` (npm's `postbuild` hook).
//
// Vercel serves `404.html` from the build output, with a real 404 status, for
// any path that matches no file and no rewrite. Copying the built index.html
// there means an unknown URL loads the same app, whose `main.tsx` renders the
// NotFound page for that pathname, but the response is a genuine 404 that
// crawlers and link checkers can see, instead of a 200.
//
// The hashed /assets/ URLs inside index.html are absolute, so they resolve
// from any path.
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
if (!existsSync(src)) {
  console.error(`copy-404: ${src} not found, did the build run?`)
  process.exit(1)
}
copyFileSync(src, 'dist/404.html')
console.log('copy-404: dist/404.html written')
