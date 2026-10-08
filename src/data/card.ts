/**
 * Spline scenes for the 3D card. The scenes themselves are edited at spline.design;
 * only their public URLs live here. Spline is the one third-party origin on this
 * site, and it is contacted only after a visitor clicks "Load the 3D card".
 */
import type { PageCsp } from '../lib/csp';

export const splineOrigin = 'https://prod.spline.design';
/** The scene's text objects reference Google Fonts files, fetched by the viewer at runtime. */
export const fontsOrigin = 'https://fonts.gstatic.com';

/**
 * Extra Content Security Policy, applied to the card page only; the rest of the site
 * keeps `default-src 'self'`. Found by loading the production build and reading the
 * browser's violation reports, so each line has a reason:
 * - the scene host, plus Google's static font host for the scene's text objects (WASM is
 *   self-hosted instead of fetched from unpkg, see scripts/card.ts),
 * - `eval` (the physics engine builds functions at runtime),
 * - two exact inline <style> blocks the viewer injects (hashes change if the viewer is
 *   upgraded: reload the card with the console open and copy the new hashes).
 * The page holds no secrets and renders no user content.
 */
export const cardCsp: PageCsp = {
    directives: [
        `connect-src ${splineOrigin} ${fontsOrigin}`,
        `img-src ${splineOrigin} data: blob:`,
        'worker-src blob:',
    ],
    script: ["'self'", "'unsafe-eval'"],
    // The portrait (phone) scene sets many inline style attributes; they cannot be hashed.
    style: [{ resource: "'unsafe-inline'", kind: 'attribute' }],
    styleHashes: [
        'sha256-Z32ccy7QPW25v8ZP9N0ADkG7eUPd0OcScukf0wQvV60=',
        'sha256-BuK84zxUyg+v+8yY7TdPzxLxgnG6GGIrv7TtJ40YnbE=',
    ],
};

export const cardScenes = {
    mobile: `${splineOrigin}/VZtZ6j1iur7oC7ny/scene.splinecode`,
    desktop: `${splineOrigin}/GvsgZL4oq7cauXNz/scene.splinecode`,
} as const;
