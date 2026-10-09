# Osheen Turner: personal site

Bilingual (EN at `/`, FR at `/fr/`) static site. Astro, Tailwind v4, Untitled UI tokens and icons.
Design concept: a warm, still **habitat** (narrative: intro, values, quotes) with an open-hardware
**instrument** interface set inside it (facts: log, project specs, schematic, status, contact).

Live: <https://sudosheen.github.io/My-portfolio-website/>

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at `http://localhost:4321/My-portfolio-website/` |
| `npm run build` | Static build to `dist/`, then prunes unreferenced assets |
| `npm run preview` | Serve `dist/` (use this to test the real CSP) |
| `npm run check` | `astro check` (types, templates) |
| `npm test` | Unit tests (solar maths, EN/FR parity, art generators) |
| `npm run audit:site` | Page-weight budgets, third-party origins, page structure |
| `npm run audit:write` | Same, and records the numbers in `src/data/audit.json` (shown on the colophon) |
| `npm run a11y` | axe-core (WCAG 2.2 A/AA + best practices) on every built page |

Telemetry is disabled in the scripts. If `npm` fails to write its cache in a locked-down sandbox,
set `npm_config_cache` to a writable directory.

## Where things live

```
src/content/        experience, projects, education (JSON, schema in content.config.ts)
src/i18n/ui.ts      every UI string, EN source of truth, FR type-checked against it
src/data/           profile.ts (identity, contact), card.ts (Spline scenes + card CSP), audit.json
src/components/     habitat/ (shell), instrument/ (modules), sections/, pages/
src/styles/         open-spec.css (tokens), habitat.css, instrument.css, motion.css (all animation),
                    hero-panel.css, schematic.css, header-motion.css, readout.css, theme.css (Untitled UI, untouched)
src/scripts/        tick (one live loop), motion, boot, clock, field + contour-field (lazy WebGL), readout, spy,
                    scope, theme, contact, card
src/lib/            solar, snapshot, dial, career, dotmatrix, contour, readout (pure, unit-tested)
scripts/            audit.mjs, a11y.mjs, prune-orphans.mjs
```

## Editing content

- **Add an experience or project**: copy a JSON file in `src/content/<collection>/`. Every text field
  has `en` and `fr`. Unknown values stay `null` and render as an honest "—".
- **Strings**: edit `src/i18n/ui.ts`. `npm test` fails if EN and FR drift apart, and checks French
  spacing (non-breaking space before `: ; ! ?`).
- **Contact details** live in `src/data/profile.ts`. Phone numbers render only after a click.

## Motion

Everything animated is declared under `html[data-motion="on"]`, which a small head script sets before
first paint: a stored MOTION choice wins (stored only when the visitor clicks the header switch),
otherwise `prefers-reduced-motion` decides. Instrument things move in steps (power-on, reveals, LEDs,
readouts); ambient things (pod contours, wave dividers, the log spine) drift smoothly but only as you
scroll. Scroll effects use CSS scroll-driven animations inside `@supports`, so other browsers get a still
page. Contour fields (hero Location tile, sage pods) are drawn by one small hand-written
WebGL2 shader, loaded lazily and only when motion is on; each field's static SVG poster is the fallback.
There is no animation library.

## Design system

Tokens are in `src/styles/open-spec.css`: a raw palette that flips with `.dark-mode`, and Untitled UI's
semantic tokens re-pointed at it so any Untitled UI component inherits the look. Contrast rules worth
remembering: light-mode amber fill is 1.8:1 so it never carries meaning alone; terracotta text on a
clay tint must use `--terracotta-strong`; functional borders use `--edge` (>= 3:1), decorative
dividers use `--hair`.

Add Untitled UI components on demand (`npx untitledui@latest add <name>`); presentational ones render
at build time with no client JavaScript.

## Budgets and checks

`npm run audit:site` fails the build when, for the EN home page (gzip): HTML > 25 KB, CSS > 20 KB,
eager JS > 12 KB, lazy JS chunks > 8 KB, fonts > 110 KB, total > 230 KB, or any third-party origin
appears. It also fails on any inline `style=""` attribute (the production CSP blocks them; the dev
server has no CSP, so they look fine locally) and on any inline script or style after the CSP meta
whose hash is missing from the policy. A strict CSP (`default-src 'self'`) enforces the rest at runtime.

## The 3D card (`/card/`)

Spline's runtime is large (about 1.5 MB gzipped), so nothing loads until the visitor clicks.
Production testing showed the viewer needs more than a bundled script, handled in `src/scripts/card.ts`
and `src/data/card.ts`:

- It fetches four WebAssembly modules from `unpkg.com`. They are installed as pinned packages
  (`@splinetool/*-wasm@1.9.44`, same version as the viewer), bundled as local assets, and the fetches
  are redirected. Keep these five versions identical when upgrading.
- Its scene text loads Google Fonts files, so `fonts.gstatic.com` is allowed on this page only.
- It needs `eval` and two inline `<style>` blocks, allowed on this page only (the style blocks by exact
  hash). If the viewer is upgraded, load `/card/` from `npm run preview` with the console open and copy
  any new hashes the browser reports.
- The stage is landscape (16:10) for the desktop scene and portrait (5:8) for the phone scene, chosen by the same media query the script uses, and never taller than the visible viewport.
- Text baked into the scene (title, employer, dates, website URL, QR codes) is edited in Spline, not here.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) runs tests, type-check, build, audit and axe, then
publishes `dist/`. One-time setup: repository Settings, Pages, Source: **GitHub Actions**.

The phone number is not stored in the repository. It is read from `PUBLIC_PHONE_FR_E164` (E.164, for
example `+33612345678`): put it in a local `.env` (git-ignored) and in a repository secret of the same
name for CI. When unset, the phone row is not rendered.

The build is host-portable. For a custom domain or another static host:

```bash
SITE_URL=https://example.eu SITE_BASE=/ npm run build
```

## Licence

Not yet chosen. The code is public; texts and design are © Osheen Turner.
