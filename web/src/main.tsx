import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Privacy } from './pages/Privacy'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

/**
 * One route, checked once, before anything renders.
 *
 * The Site is a single scroll experience everywhere else, so this isn't a
 * router — it's a plain pathname branch. `/privacy` is the one page that
 * needs to exist independently of that experience: it must be linkable,
 * indexable, and load without the 3D scene. A real router would be the wrong
 * tool for a second static page.
 */
const page = window.location.pathname === '/privacy' ? <Privacy /> : <App />

createRoot(root).render(<StrictMode>{page}</StrictMode>)
