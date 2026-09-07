import { Suspense, lazy, useEffect, useState } from 'react'
import { useSmoothScroll } from '@/lib/scroll/useSmoothScroll'
import { IntroGate, INTRO_DONE_EVENT, willPlayIntro } from '@/components/intro/IntroGate'
import { Nav } from '@/components/ui/Nav'
import { Cursor } from '@/components/ui/Cursor'
import { Footer } from '@/components/ui/Footer'
import { Hero } from '@/components/sections/Hero'
import { WorkflowHUD } from '@/components/sections/WorkflowHUD'
import { About } from '@/components/sections/About'
import { Services } from '@/components/sections/Services'
import { Projects } from '@/components/sections/Projects'
import { CTA } from '@/components/sections/CTA'
import { SceneBoundary } from '@/components/3d/SceneBoundary'

/**
 * The 3D layer is code-split and mounted after the document paints. three.js is
 * by far the largest thing on the page, and the hero must be readable before
 * any of it is parsed — the scene is the story, but it is not the content.
 */
const WorkflowScene = lazy(() =>
  import('@/components/3d/WorkflowScene').then((m) => ({ default: m.WorkflowScene })),
)

/**
 * Page order is also build order.
 *
 * Scene progress is measured from the top of #top to the bottom of #contact, and
 * each section owns one or two modules of the workflow: reaching About connects
 * the API, What I Build brings the AI and the database, Selected Work branches
 * it, and the closing section lands the last cable — which completes the graph
 * and wakes the system. There is no synthetic scroll spacer; the content itself
 * provides the distance.
 */
export default function App() {
  useSmoothScroll()

  // Hold the 3D scene back until the cold open is done. three.js init is a
  // ~1s main-thread block; mounting it under the intro would freeze the
  // animation on its last frame and stall the timer that ends it. The chunk
  // still downloads during the intro — only the mount waits.
  const [sceneOn, setSceneOn] = useState(() => !willPlayIntro())
  useEffect(() => {
    if (sceneOn) return
    void import('@/components/3d/WorkflowScene')
    const on = () => {
      setSceneOn(true)
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    }
    window.addEventListener(INTRO_DONE_EVENT, on)
    const safety = window.setTimeout(on, 4000)
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, on)
      window.clearTimeout(safety)
    }
  }, [sceneOn])

  return (
    <>
      <IntroGate />

      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-void"
      >
        Skip to content
      </a>

      <Cursor />
      <Nav />

      {sceneOn && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <WorkflowScene />
          </Suspense>
        </SceneBoundary>
      )}

      <WorkflowHUD />

      {/* z-10 lifts the document above the fixed canvas at z-0. */}
      <main className="relative z-10">
        <Hero />
        <About />
        <Services />
        <Projects />
        <CTA />
      </main>

      <Footer />
    </>
  )
}
