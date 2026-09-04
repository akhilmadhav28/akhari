# Akhari — web

The marketing site. A single scroll-driven 3D scene, built with React 19,
TypeScript, three.js / React Three Fiber, GSAP ScrollTrigger and Lenis.

This lives alongside the Python WAT framework in the repo root and shares
nothing with it — `uv` owns the Python environment, `npm` owns this one.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/
npm run typecheck
```

## The idea

One WebGL canvas is fixed behind the entire document and never unmounts. Scroll
drives a single value, `0 → 1`, spanning the top of the hero to the bottom of
the closing section. It controls the camera, which modules exist, how they are
wired, and what is executing.

**Each module of the workflow belongs to a page section.** Reaching About
connects the API; What I Build brings the AI and the database; Selected Work
branches it; the closing section lands the last cable — which completes the
graph and wakes the system. There is no synthetic scroll spacer: the content
itself provides the distance, and the camera follows the build.

| Section | Modules that connect | Copy side |
| --- | --- | --- |
| Hero | Trigger (already assembled) | left |
| About | API | left |
| What I Build | AI, Database | right |
| Selected Work | Logic, Notify | left |
| Start here | Output → **system online** | left |

## Why arrival points are measured, not hardcoded

`src/lib/scene/anchors.ts` measures where each anchor section actually sits and
converts that to a progress value, recomputing on every ScrollTrigger refresh.

Hardcoding a progress number per module would break the moment anyone edits
copy, adds a case study, or opens the site on a shorter viewport — the modules
would drift away from the sections they belong to. Deriving them from the DOM
means the choreography survives content changes, which it will have to.

The camera keys off the same numbers, so the move and the connection are caused
by the same thing and cannot fall out of sync.

## How the scroll story is wired

One master ScrollTrigger writes to a **mutable singleton**
(`src/lib/scroll/scrollStore.ts`) rather than React state.

That is deliberate. Scroll fires up to 120 times a second; routing it through
`useState` would re-render the tree every frame and make the scene stutter.
Instead `useFrame` consumers read `scroll.smoothed` directly — no
reconciliation, no allocation, no re-render. The only component that re-renders
is the HUD, which subscribes to `onConnect` and updates once per module.

`Workflow.tsx` does every piece of timing maths once per frame and writes the
result into `src/lib/scene/flowState.ts`. Nodes, cables and pulses each read
their own slice and apply it to their transforms.

## One shot per section

`DESKTOP_FRAMING` / `MOBILE_FRAMING` are keyed by **section**, not by which side
the copy occupies. They used to be keyed by side, which meant all three
left-copy sections shared one identical setup — same distance, same height,
same field of view — so every module appeared at the same size from the same
angle five times running and the scroll read as one move repeated.

| Section | Shot |
| --- | --- |
| Hero | held medium; module well right so the headline has room |
| About | closer and lower, looking slightly up |
| What I Build | the close-up — the face is big enough to read |
| Selected Work | pulled right back; several modules and the cables between |
| Start here | opening out, on its way to the closing wide shot |

Two things bite when tuning these:

- **The usable `aimX` shrinks with distance.** The frame is only ~5 world units
  wide on the close-up and ~15 on the wide shot, so the same offset moves the
  module a completely different fraction of the screen.
- **`aimX` is scaled by viewport aspect at runtime** (`REF_ASPECT` in
  `CameraController`). Without that, a fixed world offset covers a smaller
  proportion of a wider frame, so on ultrawide the module drifts back toward the
  centre exactly as the centred copy column moves right to meet it — which is
  what put the hero's final full stop on the trigger module at 2560.

`--text-h1` is coupled to `DESKTOP_FRAMING.top`. It could only be raised to 7rem
because the hero gained its own shot with a larger `aimX`. Re-measure at 2560 if
either changes.

## Breaking the rhythm

Two deliberate exceptions to the page's own template, both there because four
identical `SplitSection`s in a row read as monotony however well each one is
set:

- **Selected Work is not a `SplitSection`.** The featured case bleeds off the
  right edge of the viewport and the rest are a full-width list. See the header
  in `sections/Projects.tsx`.
- **The live demo panel is `paper`** — the one surface on the page that is not
  espresso. It works by redefining the theme's colour variables on one element,
  so every utility inside inverts with no extra classes; the note in `index.css`
  explains why a whole light *section* was rejected.

The scene's lighting also dips cooler and dimmer through the middle of the
document and blazes past its opening warmth on `scroll.reveal` (`Relight` in
`SceneEnvironment`). That is the only other change of value on the page.

## Keeping the graph visible

There is no global dimming layer. Each section is a `SplitSection` that claims
one half of the viewport and carries a *directional* scrim — opaque under the
copy, clear over the half where the module is connecting. `ANCHOR_SIDES` tells
the camera which side to frame into, so the two never fight for the same space.

On a portrait viewport there is no spare half, so the scrim becomes a soft
vertical one and the camera aims upward instead, dropping the graph into the
band between sections.

## Layout of the source

```
src/
  constants/
    workflow.ts       the graph, section anchors, camera framing — start here
    content.ts        all page copy and case-study data
    brand.ts          brand strings + hex values three.js needs as numbers
  lib/
    scroll/           Lenis + ScrollTrigger, the progress store
    scene/            anchors (DOM measurement) + per-frame runtime state
    three/            canvas-drawn textures, curve construction
    perf/             device tiering
    animation/        allocation-free maths and easing
    demo/             the intake extractor behind the live demo (no DOM, no three)
  components/
    3d/               WorkflowScene, Workflow, WorkflowNode, Connection,
                      DataPulse, CameraController, SceneEnvironment,
                      ScenePost, RobotFigure
    sections/         Hero, About, Services, Projects, CTA, PipelineDemo,
                      WorkflowHUD
    ui/               Nav, Footer, SplitSection, Cursor, MagneticButton,
                      Reveal, SplitHeading
```

## Type

Three faces, each with one job, and the split is deliberate.

`--font-display` (Instrument Serif) is used at headline sizes **only** — h1 and
h2, nothing smaller. It is a display face; its thin strokes go fragile at card
titles and body sizes, so h3 and below stay on Inter. Monospace carries the
technical labels.

This is the highest-leverage anti-template decision in the stylesheet. Inter is
what every generated site, starter template and one-click deploy ships with,
and a headline set in it reads as machine-made before a visitor has processed a
word. Everything else on the page can be right and that one choice will still
give it away.

The display face is also used, in italic, for the client pull quote in Selected
Work — the only place it appears below headline size, which is exactly what a
pull quote is for.

Section numerals are set enormous and near-invisible behind each heading rather
than as small digits in front of it. The page had almost no type-scale contrast
otherwise, and four identically-sized numbered eyebrows was much of what made
the sections read as identical slides.

## The live demo

`sections/PipelineDemo.tsx` plus `lib/demo/extract.ts`. A visitor types a real
incoming message and watches it come out as fields, a route, a log entry and a
drafted reply.

It genuinely reads the input — change the day and the resolved date changes,
delete the phone number and the field disappears, write it as a complaint and it
routes elsewhere with a different SLA. It is rules rather than a model, and the
page says so in as many words. That is a choice, not a shortcut: a demo needing
a server, a key and a rate limiter is a demo that is broken the week the link
gets pasted into a group chat.

`extract()` is the single function a real deployment swaps for a model call.
Everything around it — the staging, the readout, the graph wiring — stays.

Each step calls `pingNode()`, which lights the corresponding module in the 3D
scene. `NodeRuntime.demo` exists as its own channel because `glow` is
overwritten every frame by the execution loop, so anything written there from
the DOM would survive one frame and never be seen.

## The camera it is photographed through

`3d/ScenePost.tsx` runs a threshold bloom, a vignette and film grain, and takes
over the render loop from R3F (hence `useFrame(..., 1)`).

The distinction that matters: this is a **threshold** pass, so only pixels
already brighter than the rest of the frame bleed — the screens, the LEDs, the
pulses. The blackened-steel bodies never cross it. An earlier version used flat
additive quads behind every module at constant intensity, which is light with no
source, identical on every object, and reads as generated on sight.

The bloom is tinted copper per mip, and the radius is deliberately small; a wide
radius is the uniform haze of every AI render. Built from three's own
`UnrealBloomPass` rather than `@react-three/postprocessing`, which requires
three ≥ 0.182 — going direct also makes the per-mip tinting reachable.

Off entirely on the low tier.

**Only the bloom's own mip chain is downscaled — never the composer.** Scaling
`composer.setPixelRatio` reduces *every* pass, so the modules, their screen text
and the cables all render small and get upscaled to the display; the scene goes
soft and blocky and the bloom looks like the culprit when it is not. A blur is
the one effect whose lost resolution is invisible. Same trap in
`lib/perf/device.ts`: the low end of each `dpr` range is a floor, and putting it
below the display's own device pixel ratio means anything that costs a frame
sends the whole scene out of focus.

The threshold also sits above the module screens' own brightness on purpose. Any
lower and the white label text on each node face blooms, haloing the type that
is meant to be the sharpest thing in the scene. If node faces ever start looking
soft, check `THRESHOLD` and `faceMat.emissiveIntensity` before anything else.

## Editing it

**Copy** is in `src/constants/content.ts`. Nothing else needs touching.

**Moving a module to a different section** — change its `anchor` and
`anchorAt` in `src/constants/workflow.ts`. Everything else follows: the camera
stop, the cable, the pulse routing, the socket.

**Adding a module** — add an entry to `NODES` and an edge to `EDGES`. Give it a
`position`, a `mobilePosition`, an `anchor` and an `anchorAt`.

Three constraints worth knowing:

- Edges sharing a `depth` fire at the same moment. That is what makes branches
  execute in parallel — give a step the same depth as its sibling.
- Keep every module above `y = -6.2`. The ground plane sits there and will
  silently clip anything below it.
- Modules must be listed in `NODES` in the order they connect. The camera walks
  that array to decide where to travel next.

**Adding a section** — add its id to `AnchorId` and `ANCHOR_SIDES`, wrap it in
`SplitSection`, and point a module's `anchor` at it.

## The closing reveal

`3d/RobotFigure.tsx` is the figure that wakes when the graph completes. It is
driven by exactly one input — `scroll.reveal`, which ramps 0→1 once the last
cable lands.

**This is the interim version.** A graded clip on a plane in the scene. The
planned three.js figure — built from the same bevelled-metal and emissive
language as the modules, lit by the same rig — replaces the mesh behind the same
trigger. No other file changes.

**It lives in the 3D scene, not the DOM, and it must stay there.** It was a
`<video>` with `mix-blend-mode: screen` in the CTA section for a long time, and
that cannot work: a blended element blends with the backdrop inside its own
stacking context, and both the wrapper's animated opacity and `<main>`'s
`z-index: 10` form one. The canvas is outside both, so it can never be part of
the backdrop. The symptom was a hard-edged box, once "fixed" with a painted
gradient that was itself covering the network with flat page colour. The full
account is in that component's header — read it before moving the figure back
into the document.

In the scene it is additively blended, so black adds nothing and the background
is absent by construction rather than hidden. The bloom pass then treats the
figure as a light source like everything else, and cables genuinely pass in
front of it.

**The feed.** `RobotLink`, in the same file, runs a cable from the Output module
to a lit port on the figure's head and sends current down it. Without it the
ending is two unrelated events — a graph finishing off to one side, and a figure
fading up on its own timer. With it the graph is visibly what switches the
figure on, and each packet arriving lifts it (`link.arrive`).

It is deliberately **not** in `EDGES`. Everything there is part of the scroll
choreography — measured anchors, camera stops, parallel depth groups, the HUD's
module count — and a run whose far end is not a module would need special-casing
in all of them. It owns its own clock and reads only `scroll.reveal`. It does
share the cable shader, exported from `Connection.tsx`, so it cannot drift into
looking like a different kind of wire.

The socket is expressed in the clip's UV space (`SOCKET_UV`), so it stays on the
figure if the plane is moved or resized.

Source clip: `public/media/robot.mp4` (314KB, 5s, no audio). Encoded with a
separable falloff taking luma and chroma to **exactly zero at every border** —
verify with `signalstats` after any re-encode, because additive blending turns
any residual edge value straight back into a visible rectangle. Graded warm
(`hue=s=0.22`, `colortemperature=3100`) so the figure reads bronze and its eyes
read as warm lamps; the source's cyan eyes were the one piece of neon left on
the page. Fetched only once `scroll.progress > 0.62`.

## The portrait slot

`About.tsx` shows a framed plate beside the opening paragraph. Set
`BRAND.portrait` to `'/brand/portrait.jpg'` once a real photograph is in
`public/brand/`. Until then the frame shows the Akhari mark — pointing at a file
that isn't there would 404 on every page load, and no stand-in face is invented.
Roughly 4:5, 900px wide or better.

Brand assets in `public/brand/` were derived from `AI.png` — white on
transparent, for the dark ground.

## Performance

Everything expensive keys off a device tier (`src/lib/perf/device.ts`), which
combines core count, memory, pointer type and the unmasked GPU string.

| | low | mid | high |
| --- | --- | --- | --- |
| Pixel ratio | 1 | ≤1.5 | ≤2 |
| Shadows | — | — | yes |
| Env reflections | — | — | yes |
| Curve segments | 18 | 28 | 48 |
| Dust motes | 0 | 90 | 220 |
| Modules | 5 | 5 | 7 |

On top of that: `PerformanceMonitor` drops pixel ratio if frames get expensive,
rendering stops entirely when the tab is hidden, three.js loads in its own chunk
after the document paints, and every pulse in the scene is one instanced draw
call.

Compact viewports get a genuinely different scene — a stacked vertical graph
with two modules removed and camera framing to match — rather than the desktop
scene scaled down.

## Reduced motion

Under `prefers-reduced-motion`, Lenis is skipped, GSAP entrance tweens never
run, camera drift and pointer parallax are disabled, the execution pulses are
driven by scroll position instead of a clock, and the reveal holds its
powered-on frame rather than playing. The story still plays; nothing moves
unless the visitor moves it. No content depends on a tween to become visible.
