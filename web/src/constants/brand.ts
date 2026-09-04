/**
 * Brand constants. Anything a designer might want to change without reading
 * component code lives here — copy, contact details, and the colour values the
 * 3D scene needs as numbers (CSS custom properties can't reach WebGL).
 */

export const BRAND = {
  name: 'Akhari',
  wordmark: 'AKHARI',
  tagline: 'AI Automation Studio',
  location: 'Hyderabad, India',
  email: 'akhilmadhavt@gmail.com',
  phone: '+91 80089 84976',
  phoneHref: '+918008984976',

  /**
   * Portrait for the About section.
   *
   * Set this to '/brand/portrait.jpg' once a real photograph is in
   * `public/brand/`. While it is null the frame shows the Akhari mark instead —
   * pointing at a file that isn't there would 404 on every page load, and no
   * stand-in face is invented. Roughly 4:5, 900px wide or better.
   */
  portrait: null as string | null,
} as const

/**
 * Hex values mirrored from index.css @theme so three.js can use them.
 *
 * The scene is lit like a photographed rig on a dark table: warm key, blackened
 * steel bodies, brass fittings, amber-lit screens. Every hue is warm and aged
 * — no electric cyan, no violet, nothing that belongs on a synthwave cover.
 */
export const C = {
  /* Environment */
  void: '#0F0C0A',
  voidTop: '#0A0806',
  voidWarm: '#1A120C',
  surface: '#17130F',

  /* Objects */
  steel: '#2A2521',
  steelEdge: '#3E3630',
  brassMetal: '#8A6E33',
  /** Node accent for Logic — bright enough to read as an accent on a face,
   *  neutral enough not to add a fourth hue to the palette. */
  steelLight: '#C4BCAF',
  ink: '#F2EDE4',

  /* The one colour, plus two aged supports so seven modules aren't seven
     identical slabs. */
  accent: '#E0803F',
  accentDeep: '#B85F22',
  sage: '#7E9C86',
  brass: '#C9A227',
  rust: '#A4472A',
} as const

export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#projects' },
] as const
