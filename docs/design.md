# Design concept and decisions

## Concept
A warm solarpunk **habitat** (narrative: large radii, sage pods, contour lines) with an open-hardware
**instrument** interface set inside it (hairline modules, mono labels, LEDs, dot-matrix, corner ticks, snapping
motion). Narrative content lives on the habitat; factual or structured content (log, specs, scope, contact,
colophon) lives in instrument modules.

| | Habitat | Instrument |
|---|---|---|
| Shape | large radii, pods | 2px radius, 1px hairlines, corner ticks |
| Type | Fraunces (weight ~340-360) | IBM Plex Sans body, IBM Plex Mono micro-labels |
| Buttons | pill (`.pill-btn`) | square (`.sq-btn`) |
| Motion | smooth but scroll-linked drift (pods, waves, log spine) | stepped: power-on, reveals, LEDs, readouts |

## Tokens (`src/styles/open-spec.css`)
Light: canvas `#f1ecdf`, surface `#faf7ee`, sage `#dce5ce`, ink `#1f2620`, moss `#3a5a2e`, amber `#e3a82b`
(text on amber: `--on-amber` `#1f2620`), edge `#7a8077`. Dark ("night garden"): canvas `#121713`, surface `#1a211b`,
sage `#243024`, ink `#ede8da`, amber `#f0b63a`. Amber fill is 1.8:1 on light canvas, so it never carries meaning alone.
Terracotta text is not used on clay tint (fails contrast).

## Scaling
Root font size is `min(175%, max(100%, calc(1.311vw - 0.049rem)))`: 1.0x up to 1280 px, about 1.5x at 1890 px.
The owner wants content to fill most of a wide screen. Containers are `max-w-[70rem]`.

## Decisions taken with the owner
- Astro static + Untitled UI tokens/icons; EN + FR; GitHub Pages for now (build is host-portable via `SITE_URL`, `SITE_BASE`).
- Headings use Fraunces (the first choice, a condensed serif, looked too squished).
- "How I work" is a pre-flight checklist (native `details`, one open at a time) with a plus/minus indicator.
- "Contact" reuses the same sage pod with contour lines (`PodContours.astro`).
- Hero buttons: "Get in touch", "CV", "3D card" (FR "Carte 3D", short so they fit on one row at 360 px+).
- Hover and focus on `.pill-btn` flip the pill (outlined to ink, ink to amber); copy button is icon-only with a status message.
- The card page is a static poster until the visitor opts in to load the 3D scene.
- Oct 2026, "too basic, make it dynamic": the arch with the sun/moon was replaced by a **live control panel**
  (clock with a solar dial showing the real sky over Montpellier, a sage Location tile, Build and Career tiles),
  a status readout strip, a header section meter with scroll-spy, a Scope pipeline with a scroll-linked
  packet, a Log timeline spine, and stepped scroll reveals on every module below the hero.
- Motion is **hybrid** and opt-out: instrument motion stepped, ambient motion smooth but scroll-linked;
  a MOTION switch in the header (stored only when clicked) and `prefers-reduced-motion` turn it all off.
  No animation library (owner allowed one; native CSS was enough). After seeing the static poster, the owner
  asked for the animated version: the Location tile now runs a hand-written WebGL2 contour field (2 KB lazy
  chunk, drifting iso-lines that bend around the pointer, theme-coloured, 30 fps, DPR <= 1.5, paused offscreen
  and frozen when motion is off). The SVG poster stays underneath as the fallback.
- Oct 2026, the owner liked the Location tile's background and asked for more of it: the same field now also
  runs inside the How I work and Contact pods, tuned per host (opacity, zoom, seed, render scale, frame
  rate). Tried and removed at the owner's request: a faint field behind the hero, and live strips in the
  dividers ("doesn't look like a divider"). Also added: rolling dot-matrix digits when a
  value changes, section titles that resolve from the halftone as they scroll in, and a grid that lights up
  around the pointer, behind all content on every page (first hero-only, then site-wide at the owner's request).

## Technical gotchas
- Spline fetches WASM from unpkg and fonts from fonts.gstatic.com at runtime. WASM is self-hosted via pinned
  `@splinetool/*-wasm@1.9.44` and a fetch shim in `src/scripts/card.ts`. Keep viewer and wasm versions identical.
  The card page also needs `unsafe-eval`, two exact style hashes and `style-src-attr 'unsafe-inline'`.
- The dev server has no CSP. Inline `style=""` attributes are blocked in production (this once shipped
  10 violations unnoticed); the audit now fails on any, and on any inline script/style after the CSP meta
  that is not hashed. Scripts before the meta (the theme/motion head script) are not governed by it.
- One tick loop (`src/scripts/tick.ts`) wakes once a minute and fills every `[data-live]` element; values are
  computed in `src/lib/snapshot.ts` (pure, tested). The colon blink is CSS.
- `solarPhase` works from absolute rise/set instants on three UTC days, so far-west sunsets after UTC midnight
  and polar day/night are handled; elevation uses the NOAA hour term.
- A scroll-linked animation inside an `overflow: hidden` ancestor tracks that ancestor, not the page (the pod
  drift and the pod titles silently did nothing until the pods used `overflow-clip`).
- Registered custom properties (`@property`) cannot use `rem` in `initial-value`; the halftone uses a px fallback.
- Card stage: landscape 16:10 for the desktop scene, portrait 5:8 for the phone scene, capped at the visible viewport.
- Fluid `.page-title` plus hyphenation keep long French titles from overflowing at 280 px.
- Programmatic checks cannot trigger real hover in a hidden browser pane; read computed styles with transitions disabled.
