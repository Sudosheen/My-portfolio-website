/** Pure helpers for the scripted scroll effects (src/scripts/scrollfx.ts): the Scope packet and the Log spine. */

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * How far an element has travelled through the viewport: 0 as its top edge enters at the bottom, 1 as its
 * bottom edge leaves at the top (what CSS calls the "cover" range of a view timeline). `top` is the
 * element's top relative to the viewport.
 */
export function coverProgress(top: number, height: number, viewport: number): number {
    return clamp01((viewport - top) / (viewport + height));
}

/** Maps t from the range [from, to] onto 0..1 (clamped). */
export function between(t: number, from: number, to: number): number {
    return clamp01((t - from) / (to - from));
}

/** Index of the last position that is at or before `at` (0 when none is). Positions ascend. */
export function reachedIndex(positions: number[], at: number): number {
    let reached = 0;
    positions.forEach((p, i) => {
        if (at >= p) reached = i;
    });
    return reached;
}

/** How much of a spine of `length`, starting at `start`, a reading line has passed (all in the same units). */
export function fillFraction(start: number, length: number, line: number): number {
    return length > 0 ? clamp01((line - start) / length) : 1;
}
