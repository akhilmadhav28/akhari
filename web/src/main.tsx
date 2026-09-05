import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Privacy } from './pages/Privacy'
import { Founders } from './pages/Founders'
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
  '/privacy': Privacy,
  '/founders': Founders,
}

const Page = PAGES[window.location.pathname] ?? App

createRoot(root).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
