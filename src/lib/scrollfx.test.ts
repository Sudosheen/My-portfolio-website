import { describe, expect, it } from 'vitest';
import { between, coverProgress, fillFraction, reachedIndex } from './scrollfx';

describe('coverProgress', () => {
    it('runs from entering at the bottom to leaving at the top', () => {
        expect(coverProgress(800, 200, 800)).toBe(0); // top edge at the viewport bottom
        expect(coverProgress(-200, 200, 800)).toBe(1); // bottom edge at the viewport top
        expect(coverProgress(300, 200, 800)).toBeCloseTo(0.5, 5);
        expect(coverProgress(2000, 200, 800)).toBe(0);
        expect(coverProgress(-2000, 200, 800)).toBe(1);
    });
});

describe('between', () => {
    it('maps a sub-range onto 0..1 and clamps', () => {
        expect(between(0.2, 0.2, 0.8)).toBe(0);
        expect(between(0.5, 0.2, 0.8)).toBeCloseTo(0.5, 5);
        expect(between(0.8, 0.2, 0.8)).toBe(1);
        expect(between(0, 0.2, 0.8)).toBe(0);
        expect(between(1, 0.2, 0.8)).toBe(1);
    });
});

describe('reachedIndex', () => {
    const starts = [0, 100, 250, 400];
    it('returns the last position passed, and 0 before the first', () => {
        expect(reachedIndex(starts, -5)).toBe(0);
        expect(reachedIndex(starts, 0)).toBe(0);
        expect(reachedIndex(starts, 99)).toBe(0);
        expect(reachedIndex(starts, 100)).toBe(1);
        expect(reachedIndex(starts, 399)).toBe(2);
        expect(reachedIndex(starts, 9999)).toBe(3);
    });
});

describe('fillFraction', () => {
    it('is how much of the spine the reading line has passed', () => {
        expect(fillFraction(100, 400, 50)).toBe(0);
        expect(fillFraction(100, 400, 300)).toBeCloseTo(0.5, 5);
        expect(fillFraction(100, 400, 900)).toBe(1);
        expect(fillFraction(100, 0, 0)).toBe(1);
    });
});
