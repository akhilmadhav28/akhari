# CLAUDE.md — the website

Guidance for the web app in `web/`. The `CLAUDE.md` at the repo root describes a
**different project** — the Python WAT scaffold (`tools/`, `workflows/`) that
shares this repo. Nothing in it applies here: there is no `uv` in this
directory, and `site/` at the root is a stale static version that is not the
live source. This folder is the site.

## What it is

A one-page site for Akhari, a solo AI-automation studio. Its argument is made by
the page itself: a seven-module automation graph assembles in 3D as you scroll,
one module per section, and completes as the closing section arrives.

React 19 · TypeScript · Vite · Tailwind 4 · three.js + @react-three/fiber ·
GSAP ScrollTrigger · Lenis.

```powershell
npm run dev        # vite, http://localhost:5173
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b --noEmit — run this before committing
```

## How the scroll system fits together

One fixed WebGL canvas sits behind the document and never unmounts, which is
what makes the scene continuous rather than a series of adjacent animations.

- `lib/scroll/useSmoothScroll.ts` installs Lenis and hands its interpolated
  position to ScrollTrigger. One master trigger spans `#top` → `#contact` and
  writes progress into the scroll store.
- `lib/scroll/scrollStore.ts` is a **mutable singleton, deliberately not React
  state.** Scroll updates at up to 120Hz; routing that through `useState` would
  re-render the tree every frame. Read it inside `useFrame`; never subscribe.
- `lib/scene/anchors.ts` measures where each module arrives **from the DOM**, on
  every ScrollTrigger refresh. Never hardcode a scroll offset — copy edits and
  new cards would silently desynchronise the choreography from the sections.
- `constants/workflow.ts` is the single source of truth for the graph: node
  placement, wiring, which section each module belongs to, and one camera
  framing per section.

## Things that look safe and are not

- **No CSS blend modes or stacked compositing layers over the canvas.** This is
  not a style preference. A `<video>` with `mix-blend-mode` plus an animated
  opacity took this machine's GPU process down, and the blend could never have
  worked anyway — `<main>` carries `z-index: 10`, so the canvas is outside its
  stacking context and can never be part of its backdrop. `3d/RobotFigure.tsx`
  has the full account. Composite inside the scene instead, where additive
  blending makes black disappear by construction.
- **Every section needs two scrims, not one.** Desktop gets a directional scrim
  (copy in one half, module in the other); portrait has no spare half and needs
  a vertical one. `ui/SplitSection.tsx` carries both. `sections/CTA.tsx` rolls
  its own because its copy is centred — and for a long time only had the desktop
  one, which left the last 40% of every line on a phone sitting on the robot
  figure with no scrim at all. If you add a section, give it both.
- **`SCRIM_COMPACT` is held flat on purpose.** `SCRIM_FEATHER` already masks the
  element's first and last 9%. A gradient that also fades at its own ends
  double-feathers and leaves the bottom of the section unprotected — which on
  portrait is still copy.
- **The bloom pass has a threshold and things are tuned under it.** Module faces
  must never bloom: their glow is painted into the canvas texture, and letting
  the material cross the threshold smears the label text. Bloom belongs to the
  pulses, the LEDs and the figure. See `3d/ScenePost.tsx`.
- **`useFrame` callbacks must not allocate.** Use the helpers in
  `lib/animation/math.ts` and scratch objects created in `useMemo`.
- **Everything expensive keys off `lib/perf/device.ts`.** Tier decides pixel
  ratio, shadows, bloom, curve subdivision and dust count. Respect it rather
  than adding a flag.
- **`prefers-reduced-motion` is honoured at the source**, not just in CSS. Lenis
  is skipped, the scene still assembles, motion just stops driving itself.

## Design constraints that are decisions, not defaults

The palette is warm — espresso ground, bone type, copper accent — chosen
specifically because electric cyan and violet on blue-black is what every
generated site converges on. `index.css` puts it plainly: if a colour looks like
it belongs on a synthwave album cover, it does not belong here. The display
serif exists for the same reason and is used at headline sizes only; it goes
fragile below ~2rem, which is why `h3` and down stay sans.

`--text-h1`'s cap is coupled to `DESKTOP_FRAMING.top.aimX` — the copy column's
width decides where the module has to sit beside it. Changing one means
re-measuring the other at 1920. (Vertical hero spacing is *not* coupled; that was
checked.)

## Verifying a change

**Screenshots lie about this site.** Parallax, orbital drift and the idle breath
only exist in motion and with a pointer that moves — a still frame captured with
the mouse parked at the origin shows none of them, and has already produced one
confidently wrong critique. Drive it: Playwright with `recordVideo`, sweep
`page.mouse.move`, scroll in steps, then extract frames.

For mobile, pass `hasTouch: true` and `isMobile: true` — `detectProfile()` keys
off `(pointer: coarse)` and `(max-width: 900px)` to choose `MOBILE_FRAMING`, the
reduced node set and the mid tier. Without them you are still testing desktop at
a narrow width.

Check `console --errors` too: a shader that fails to compile leaves the page
rendering and reports nothing else.

## Environment gotchas

- `node_modules` copied from another machine breaks on Rollup's optional
  platform binary. Delete `node_modules` and `package-lock.json`, reinstall.
- Playwright's bundled ffmpeg decodes only its own WebM screencasts. For an
  H.264 `.mp4` it reports "Invalid data found when processing input" on a
  perfectly good file — inspect those through Chromium instead (a `<video>`,
  seek, screenshot).
- Windows PowerShell word-splits here-strings passed to `git commit -m`; a bare
  `/` in the message aborts the commit as a pathspec while a chained `git push`
  still prints "Everything up-to-date". Use `git commit -F <file>`.
