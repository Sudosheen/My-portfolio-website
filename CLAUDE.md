# Osheen Turner personal website

Bilingual (EN `/`, FR `/fr/`) static portfolio for Osheen Turner, a digital-sovereignty project manager
with a developer background (Montpellier). A 3D business card lives at `/card/`.
Live: https://sudosheen.github.io/My-portfolio-website/ (base path `/My-portfolio-website/`).
Default branch `main`; v2 rebuild landed from `site-v2` (PR #2).

More detail: [docs/design.md](docs/design.md) (concept, tokens, decisions), [docs/agents.md](docs/agents.md)
(operator model, sub-agent roster, ticket intake), [docs/open-items.md](docs/open-items.md) (what waits on the owner).

## Stack
Astro 7 static, React 19 only for build-time Untitled UI icons (no islands), Tailwind v4, fonts self-hosted
through the Astro Fonts API (Fraunces display, IBM Plex Sans, IBM Plex Mono), Spline viewer pinned to exact
`1.9.44` (with matching `@splinetool/*-wasm@1.9.44`), loaded only on `/card/` after a click. Node 24.
No animation library: CSS (scroll-driven animations inside `@supports`, static fallback), one shared tick loop
(`src/scripts/tick.ts`), and one hand-written WebGL2 shader (`src/scripts/contour-field.ts`, a lazy chunk that only
loads with motion on, no data saving and a capable device). Any element with `data-field-host` and a direct-child
`canvas[data-field]` becomes a live contour field when near the viewport (hero Location tile, sage pods), tuned by `data-field-*` attributes (see `src/lib/field.ts`); its static poster is the fallback.
Scroll-linked effects must not sit inside `overflow: hidden/auto` boxes (those become the scroller): use
`overflow-clip` on pods.

## Commands
```bash
npm ci
npm run dev            # http://localhost:4321/My-portfolio-website/
npm run check          # astro check: must be 0 errors, warnings, hints
npm test               # vitest (solar, i18n parity + French typography, contour, dot matrix)
npm run build          # also prunes orphan assets
npm run preview        # serves dist/ (use for CSP and /card/ testing)
npm run audit:site     # budgets + third-party scan; audit:write regenerates src/data/audit.json (generated)
npm run a11y           # axe-core over every built page
```
Definition of done for any change: `check`, `test`, `build`, `audit:site`, `a11y` all pass, and the change is
looked at in light AND dark mode, EN AND FR, at about 375 px and 1280 px.

## Where things are
- Pages: `src/pages/` (+ `fr/`), bodies in `src/components/pages/`; sections in `src/components/sections/`;
  habitat (narrative) in `src/components/habitat/`; instrument (hairline modules) in `src/components/instrument/`.
- Copy: `src/i18n/ui.ts` (EN is the source of truth; FR is a typed `Dict`, so a missing key fails the check).
- Content: `src/content/{experience,projects,education}` (en/fr fields), schemas in `src/content.config.ts`.
- Identity data: `src/data/profile.ts`; card config: `src/data/card.ts`.
- Styles: `src/styles/` (`open-spec.css` palette and tokens, `habitat.css`, `instrument.css`, `globals.css`;
  `theme.css` is Untitled UI and stays untouched).
- Logic: `src/lib/` (solar, dotmatrix, contour, csp, project, build-info); client scripts `src/scripts/`.
- Gates: `scripts/audit.mjs`, `scripts/a11y.mjs`; deploy: `.github/workflows/deploy.yml`.

## Invariants (a fix that breaks one is a regression)
1. Zero third-party requests on every page except `/card/` (Spline scene host and fonts.gstatic.com, disclosed in its copy).
2. Strict CSP, zero violations. Astro renders the CSP meta with `<head>`, so per-page directives go in
   `src/layouts/Base.astro` frontmatter via `applyCsp` (`src/lib/csp.ts`), never in body components.
3. No cookies, no analytics. Theme and language persist only after an explicit toggle; default follows the OS.
4. Layout is rem-based with a fluid root font size. No fixed px except 1px hairlines and `9999px` radii.
5. Day/Night is the `.dark-mode` class (the theme toggle). The hero solar dial shows the real sky over Montpellier
   (sun by day, moon by night), independent of the theme. Use `--on-amber` for text on amber.
6. French typography: NBSP before `: ; ! ?` and inside « ». Tests enforce it.
7. Home (EN) budget: total <= 230 KB gzipped (HTML 25, CSS 20, eager JS 12, lazy JS 8 reported on its own line, fonts 110).
8. No testimonials or references page. None may be added.
9. Accessibility target WCAG 2.2 AA; it is a self-assessment, never claim "compliant". Prefer native elements
   (`details/summary`) over ARIA; state is never carried by colour alone.
10. Motion. Instrument motion (modules, text, LEDs, readouts) is stepped (`steps()`) and never flickers. Ambient motion
    (contour drift, parallax) may be smooth but is scroll-linked or finite (< 5 s). The only continuous motion (clock
    colon, readout, optional shader) stops with the MOTION toggle. Everything animated is declared under
    `:root[data-motion="on"]` (set before paint: a stored choice, else `prefers-reduced-motion`); `off` is instant.
11. No inline `style=""` attributes: the production CSP blocks them and `npm run audit:site` fails on any. Use classes,
    data attributes, SVG presentation attributes (`opacity`, `transform`) or CSSOM (`el.style.setProperty`). The dev
    server has no CSP, so verify policy issues on `npm run preview`.

## Publication rules (the repo and site are public)
- Never commit referee quotes or contact details, Xref internals (client name, ticket IDs, colleague names),
  the reference PDFs, or phone numbers. `src/assets/_pending/` screenshots are not served and need the owner's
  permission before publishing.
- The phone number is read from `PUBLIC_PHONE_FR_E164` (local `.env`, git-ignored; repository secret in CI).
  Unset, the phone row is not rendered. Never hard-code it.
- Region/employer wording mirrors the public job posting and is draft until the owner supplies real achievements.

## Working rules
- Commit, push and deploy only when the owner asks. Stage explicit paths, never `git add -A`.
- Be concise. Match surrounding code style and comment density. Use they/them when pronouns are unknown.
- Fix the cause in the shared token or class rather than per-page overrides.
- Local-only quirks you do not need in the cloud: npm cache and Astro telemetry sandbox workarounds
  (`ASTRO_TELEMETRY_DISABLED=1` is already in the npm scripts).
- Before upgrading `@splinetool/viewer`, re-test `/card/` from `npm run preview` with the console open.
