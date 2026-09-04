import { Suspense, lazy } from 'react'
import { useSmoothScroll } from '@/lib/scroll/useSmoothScroll'
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

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-void"
      >
        Skip to content
      </a>

      <Cursor />
      <Nav />

      <SceneBoundary>
        <Suspense fallback={null}>
          <WorkflowScene />
        </Suspense>
      </SceneBoundary>

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
