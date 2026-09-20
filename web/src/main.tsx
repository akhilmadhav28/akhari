import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Privacy } from './pages/Privacy'
import { Founders } from './pages/Founders'
import { IsAutomationForYou } from './pages/IsAutomationForYou'
import { NotFound } from './pages/NotFound'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

/**
 * Routes, checked once, before anything renders.
 *
 * The Site is a single scroll experience everywhere else, so this isn't a
 * router — it's a plain pathname lookup. Each entry here is a page that needs
 * to exist independently of that experience: linkable, indexable, and loading
 * without the 3D scene. A real router would be the wrong tool for a handful
 * of static pages; it stops being the wrong tool well before this list gets
 * long enough to matter.
 */
const PAGES: Record<string, ComponentType> = {
  // Loaded on demand: the homepage is the only route that carries the 3D
  // scene, GSAP, Lenis and the CRM client. The plain pages below stay in the
  // entry chunk and never download any of it.
  '/': lazy(() => import('./App')),
  '/privacy': Privacy,
  '/founders': Founders,
  '/is-automation-for-you': IsAutomationForYou,
}

// Any other pathname used to fall through to `?? App` here, which silently
// rendered the full homepage for a typo'd link or dead bookmark — see
// `pages/NotFound.tsx` for why that's worse than it sounds.
const Page = PAGES[window.location.pathname] ?? NotFound

/**
 * Hold the first render until the three site fonts are ready, or 0.8s.
 *
 * The document is an empty `#root` until this runs, so waiting costs no visible
 * time: there is nothing on screen to delay. What it buys is that text is laid
 * out once, in its final typeface. Rendering first and letting the fonts swap
 * in afterwards reflowed every paragraph, which showed up as a layout shift on
 * the text-heavy pages (0.18 on /privacy over a slow connection). The files are
 * preloaded in index.html, so they are normally ready by now; the timeout only
 * matters if the font requests hang, and then the page renders in the fallback
 * faces exactly as it would have.
 */
const fontsReady = Promise.race([
  Promise.all([
    document.fonts.load('1em Inter'),
    document.fonts.load("1em 'Instrument Serif'"),
    document.fonts.load("1em 'JetBrains Mono'"),
  ]),
  new Promise((resolve) => window.setTimeout(resolve, 800)),
]).catch(() => undefined)

void fontsReady.then(() => {
  createRoot(root).render(
    <StrictMode>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </StrictMode>,
  )
})
