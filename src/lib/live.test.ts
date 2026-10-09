import { describe, expect, it } from 'vitest';
import { monthsSince, yearsMonths } from './career';
import { dialPoint } from './dial';
import { buildSnapshot } from './snapshot';

const CONFIG = { lat: 43.6108, lon: 3.8767, timeZone: 'Europe/Paris', since: '2023-04' };

describe('career counter', () => {
    it('counts whole calendar months', () => {
        expect(monthsSince('2023-04', new Date('2026-10-09T10:00:00Z'))).toBe(42);
        expect(monthsSince('2023-04', new Date('2023-04-30T10:00:00Z'))).toBe(0);
        expect(monthsSince('2023-04', new Date('2023-03-01T10:00:00Z'))).toBe(0);
    });

    it('splits into years and months', () => {
        expect(yearsMonths(42)).toEqual({ years: 3, months: 6 });
        expect(yearsMonths(11)).toEqual({ years: 0, months: 11 });
    });
});

describe('dial geometry', () => {
    const g = { cx: 100, cy: 50, rx: 80, ry: 40 };

    it('runs sunrise (left) over the top to sunset (right) by day', () => {
        expect(dialPoint('day', 0, g).x).toBeCloseTo(20);
        expect(dialPoint('day', 0, g).y).toBeCloseTo(50);
        expect(dialPoint('day', 0.5, g).x).toBeCloseTo(100);
        expect(dialPoint('day', 0.5, g).y).toBeCloseTo(10);
        expect(dialPoint('day', 1, g).x).toBeCloseTo(180);
        expect(dialPoint('day', 1, g).y).toBeCloseTo(50);
    });

    it('runs sunset (right) under the horizon to sunrise (left) by night', () => {
        expect(dialPoint('night', 0, g).x).toBeCloseTo(180);
        expect(dialPoint('night', 0, g).y).toBeCloseTo(50);
        expect(dialPoint('night', 0.5, g).y).toBeCloseTo(90);
        expect(dialPoint('night', 1, g).x).toBeCloseTo(20);
    });

    it('clamps progress', () => {
        expect(dialPoint('day', 2, g).x).toBeCloseTo(180);
        expect(dialPoint('day', -1, g).x).toBeCloseTo(20);
    });
});

describe('live snapshot', () => {
    // 2026-10-07 13:09 UTC is 15:09 CEST in Montpellier.
    const s = buildSnapshot(new Date('2026-10-07T13:09:00Z'), CONFIG);

    it('formats local time and zone', () => {
        expect(s.values.time).toBe('15:09');
        expect(s.values.zone).toBe('CEST');
        expect(s.values.utc).toBe('UTC+2');
    });

    it('reports sunrise, sunset and daylight for the day', () => {
        const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
        expect(Math.abs(minutes(s.values.sunrise) - minutes('07:47'))).toBeLessThanOrEqual(2);
        expect(Math.abs(minutes(s.values.sunset) - minutes('19:16'))).toBeLessThanOrEqual(2);
        expect(s.values.daylight).toMatch(/^11h\d\d$/);
    });

    it('reports a positive elevation in the afternoon and the career counter', () => {
        expect(s.values.elevation.startsWith('+')).toBe(true);
        expect(s.values['career-years']).toBe('03');
        expect(s.values['career-months']).toBe('06');
        expect(s.phase.phase).toBe('day');
    });

    it('shows placeholders during polar night', () => {
        const polar = buildSnapshot(new Date('2026-12-21T12:00:00Z'), { ...CONFIG, lat: 80, lon: 15 });
        expect(polar.values.sunrise).toBe('--:--');
        expect(polar.values.daylight).toBe('--h--');
        expect(polar.phase.polar).toBe(true);
    });
});
