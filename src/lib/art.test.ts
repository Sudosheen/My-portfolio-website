import { describe, expect, it } from 'vitest';
import { contourRings } from './contour';
import { dotMatrix } from './dotmatrix';

describe('contourRings', () => {
    const options = { cx: 100, cy: 262, rings: 9, r0: 26, step: 16, seed: 11 };

    it('is deterministic: same seed, same art, every build', () => {
        expect(contourRings(options)).toEqual(contourRings(options));
    });

    it('draws the requested number of closed paths and stays small', () => {
        const rings = contourRings(options);
        expect(rings).toHaveLength(9);
        for (const d of rings) {
            expect(d.startsWith('M')).toBe(true);
            expect(d.endsWith('Z')).toBe(true);
        }
        expect(rings.join('').length).toBeLessThan(3000);
    });

    it('a different seed gives different art', () => {
        expect(contourRings({ ...options, seed: 12 })).not.toEqual(contourRings(options));
    });
});

describe('dotMatrix', () => {
    it('renders a 5x7 grid per digit plus a one-column colon', () => {
        const { inner } = dotMatrix('12:34');
        const circles = inner.match(/<circle/g)?.length ?? 0;
        expect(circles).toBe(4 * 35 + 7);
        expect(inner).toContain('class="colon"');
    });

    it('only lights dots that belong to the glyph', () => {
        const { inner } = dotMatrix('1');
        expect(inner.match(/class="on"/g)?.length).toBe(10);
    });

    it('computes a viewBox from the layout', () => {
        const { viewBox, width, height } = dotMatrix('88');
        expect(viewBox).toBe(`0 0 ${width} ${height}`);
        expect(width).toBeGreaterThan(0);
    });

    it('falls back to a blank glyph for unknown characters', () => {
        expect(() => dotMatrix('x')).not.toThrow();
    });
});
