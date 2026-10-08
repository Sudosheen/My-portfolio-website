import { describe, expect, it } from 'vitest';
import { dayProgress, formatDuration, formatUtcMinutes, sunTimes } from './solar';

const MONTPELLIER = { lat: 43.6108, lon: 3.8767, tz: 'Europe/Paris' };

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
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

    it('reports progress between 0 and 1 and formats durations', () => {
        const date = new Date('2026-10-07T10:00:00Z');
        const t = sunTimes(date, MONTPELLIER.lat, MONTPELLIER.lon);
        const p = dayProgress(date, t);
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
        expect(formatDuration(689)).toBe('11h29');
    });
});
