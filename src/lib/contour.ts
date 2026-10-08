/**
 * Deterministic topographic contour rings. Generated at build time from a seed,
 * so the art is a few hundred bytes of path data and never shifts between builds.
 */

function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const f = (n: number) => Math.round(n);

/** Closed Catmull-Rom spline through points, converted to cubic Beziers. */
function closedSpline(pts: Array<[number, number]>): string {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return `${d}Z`;
}

export interface ContourOptions {
    cx: number;
    cy: number;
    rings: number;
    /** Radius of the innermost ring and the growth per ring. */
    r0: number;
    step: number;
    seed?: number;
    points?: number;
}

export function contourRings({ cx, cy, rings, r0, step, seed = 7, points = 12 }: ContourOptions): string[] {
    const rand = mulberry32(seed);
    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;

    return Array.from({ length: rings }, (_, i) => {
        const r = r0 + i * step;
        const pts: Array<[number, number]> = Array.from({ length: points }, (_, k) => {
            const theta = (k / points) * Math.PI * 2;
            const field =
                1 +
                0.11 * Math.sin(2 * theta + phase1 + i * 0.16) +
                0.07 * Math.sin(3 * theta + phase2 - i * 0.21) +
                (rand() - 0.5) * 0.035;
            return [cx + Math.cos(theta) * r * field, cy + Math.sin(theta) * r * field];
        });
        return closedSpline(pts);
    });
}
