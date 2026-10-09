import { describe, expect, it } from 'vitest';
import { formatDuration, formatUtcMinutes, solarPhase, solarPosition, sunTimes } from './solar';

const MONTPELLIER = { lat: 43.6108, lon: 3.8767, tz: 'Europe/Paris' };
const LOS_ANGELES = { lat: 34.05, lon: -118.24 };
const TROMSO = { lat: 69.65, lon: 18.96 };

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

/** Highest elevation reached during a UTC day, scanning every 5 minutes. */
function maxElevation(day: string, p: { lat: number; lon: number }): number {
    const start = Date.parse(`${day}T00:00:00Z`);
    let best = -90;
    for (let m = 0; m < 1440; m += 5) {
        best = Math.max(best, solarPosition(new Date(start + m * 60_000), p.lat, p.lon).elevation);
    }
    return best;
}

describe('sunTimes (Montpellier)', () => {
    // Reference values: NOAA calculator, local time (CEST = UTC+2, CET = UTC+1).
    const cases: Array<[string, string, string, string]> = [
        ['2026-10-07T10:00:00Z', 'early October', '07:47', '19:16'],
        ['2026-06-21T10:00:00Z', 'summer solstice', '06:02', '21:29'],
        ['2026-12-21T10:00:00Z', 'winter solstice', '08:14', '17:10'],
    ];

    it.each(cases)('%s (%s) rises %s and sets %s within 2 minutes', (iso, _label, rise, set) => {
        const date = new Date(iso);
        const t = sunTimes(date, MONTPELLIER.lat, MONTPELLIER.lon);
        expect(t).not.toBeNull();
        const gotRise = toMinutes(formatUtcMinutes(t!.riseUtcMin, date, MONTPELLIER.tz));
        const gotSet = toMinutes(formatUtcMinutes(t!.setUtcMin, date, MONTPELLIER.tz));
        expect(Math.abs(gotRise - toMinutes(rise))).toBeLessThanOrEqual(2);
        expect(Math.abs(gotSet - toMinutes(set))).toBeLessThanOrEqual(2);
    });

    it('returns null during polar night', () => {
        expect(sunTimes(new Date('2026-12-21T10:00:00Z'), 80, 15)).toBeNull();
    });

    it('formats durations', () => {
        expect(formatDuration(689)).toBe('11h29');
    });
});

describe('solarPosition (Montpellier)', () => {
    it('peaks at about 69.8 degrees on the June solstice', () => {
        expect(maxElevation('2026-06-21', MONTPELLIER)).toBeCloseTo(69.8, 0);
        expect(Math.abs(maxElevation('2026-06-21', MONTPELLIER) - 69.8)).toBeLessThan(0.3);
    });

    it('peaks at about 46.4 degrees at the March equinox', () => {
        expect(Math.abs(maxElevation('2026-03-20', MONTPELLIER) - 46.4)).toBeLessThan(0.5);
    });

    it('sits at about -0.83 degrees at the computed sunrise and sunset', () => {
        const day = Date.UTC(2026, 9, 7);
        const t = sunTimes(new Date(day), MONTPELLIER.lat, MONTPELLIER.lon)!;
        for (const minutes of [t.riseUtcMin, t.setUtcMin]) {
            const { elevation } = solarPosition(new Date(day + minutes * 60_000), MONTPELLIER.lat, MONTPELLIER.lon);
            expect(Math.abs(elevation + 0.83)).toBeLessThan(0.3);
        }
    });
});

describe('solarPhase', () => {
    const { lat, lon } = MONTPELLIER;

    it('is day with progress between 0 and 1 at midday', () => {
        const p = solarPhase(new Date('2026-10-07T11:00:00Z'), lat, lon);
        expect(p.phase).toBe('day');
        expect(p.polar).toBe(false);
        expect(p.progress).toBeGreaterThan(0.3);
        expect(p.progress).toBeLessThan(0.7);
        expect(p.next).not.toBeNull();
    });

    it('is nearly 1 just before sunset and nearly 0 just after, as night', () => {
        const day = Date.UTC(2026, 9, 7);
        const set = day + sunTimes(new Date(day), lat, lon)!.setUtcMin * 60_000;
        const before = solarPhase(new Date(set - 60_000), lat, lon);
        const after = solarPhase(new Date(set + 60_000), lat, lon);
        expect(before.phase).toBe('day');
        expect(before.progress).toBeGreaterThan(0.99);
        expect(after.phase).toBe('night');
        expect(after.progress).toBeLessThan(0.01);
    });

    it('is about halfway through the night at solar midnight', () => {
        const p = solarPhase(new Date('2026-10-07T23:33:00Z'), lat, lon);
        expect(p.phase).toBe('night');
        expect(Math.abs(p.progress - 0.5)).toBeLessThan(0.05);
    });

    it('handles a sunset after UTC midnight (Los Angeles)', () => {
        const dusk = solarPhase(new Date('2026-10-08T00:30:00Z'), LOS_ANGELES.lat, LOS_ANGELES.lon); // 17:30 PDT
        const night = solarPhase(new Date('2026-10-08T02:00:00Z'), LOS_ANGELES.lat, LOS_ANGELES.lon); // 19:00 PDT
        expect(dusk.phase).toBe('day');
        expect(dusk.progress).toBeGreaterThan(0.8);
        expect(dusk.progress).toBeLessThan(1);
        expect(night.phase).toBe('night');
        expect(night.progress).toBeLessThan(0.15);
    });

    it('reports polar day and polar night (Tromso)', () => {
        const summer = solarPhase(new Date('2026-06-21T12:00:00Z'), TROMSO.lat, TROMSO.lon);
        const winter = solarPhase(new Date('2026-12-21T12:00:00Z'), TROMSO.lat, TROMSO.lon);
        expect(summer).toMatchObject({ phase: 'day', polar: true, next: null });
        expect(winter).toMatchObject({ phase: 'night', polar: true, next: null });
        for (const p of [summer, winter]) {
            expect(p.progress).toBeGreaterThanOrEqual(0);
            expect(p.progress).toBeLessThanOrEqual(1);
        }
    });
});
