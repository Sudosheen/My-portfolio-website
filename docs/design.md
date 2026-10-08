# Design concept and decisions

## Concept
A warm solarpunk **habitat** (narrative: large radii, pods, contour lines, a sun/moon) with an open-hardware
**instrument** interface set inside it (hairline modules, mono labels, LEDs, dot-matrix, corner ticks, snapping
motion). Narrative content lives on the habitat; factual or structured content (log, specs, scope, contact,
colophon) lives in instrument modules.

| | Habitat | Instrument |
|---|---|---|
| Shape | large radii, arch, pods | 2px radius, 1px hairlines, corner ticks |
| Type | Fraunces (weight ~340-360) | IBM Plex Sans body, IBM Plex Mono micro-labels |
| Buttons | pill (`.pill-btn`) | square (`.sq-btn`) |
| Motion | none | stepped snaps |

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

## Technical gotchas
- Spline fetches WASM from unpkg and fonts from fonts.gstatic.com at runtime. WASM is self-hosted via pinned
  `@splinetool/*-wasm@1.9.44` and a fetch shim in `src/scripts/card.ts`. Keep viewer and wasm versions identical.
  The card page also needs `unsafe-eval`, two exact style hashes and `style-src-attr 'unsafe-inline'`.
- Hero sun is a CSS disc positioned by percentage inside `.arch`, not inside the cropped SVG.
- Card stage: landscape 16:10 for the desktop scene, portrait 5:8 for the phone scene, capped at the visible viewport.
- Fluid `.page-title` plus hyphenation keep long French titles from overflowing at 280 px.
- Programmatic checks cannot trigger real hover in a hidden browser pane; read computed styles with transitions disabled.
