import { monthsSince, yearsMonths } from './career';
import { formatDuration, formatUtcMinutes, solarPhase, solarPosition, sunTimes, type SolarPhase } from './solar';

export interface LiveConfig {
    lat: number;
    lon: number;
    timeZone: string;
    /** "YYYY-MM" of the first digital-project role. */
    since: string;
}

export interface Snapshot {
    phase: SolarPhase;
    /** Text for every `[data-live=key]` element on the page. */
    values: {
        time: string;
        zone: string;
        utc: string;
        sunrise: string;
        sunset: string;
        daylight: string;
        elevation: string;
        'career-years': string;
        'career-months': string;
    };
}

/**
 * What the page prints before the first tick (and with scripts off): honest placeholders for anything
 * time-sensitive, and the career counter, which only changes monthly, computed at build time.
 */
export function idleValues(now: Date, since: string): Snapshot['values'] {
    const { years, months } = yearsMonths(monthsSince(since, now));
    return {
        time: '--:--',
        zone: '',
        utc: 'UTC',
        sunrise: '--:--',
        sunset: '--:--',
        daylight: '--h--',
        elevation: '--.-',
        'career-years': String(years).padStart(2, '0'),
        'career-months': String(months).padStart(2, '0'),
    };
}

function zonePart(now: Date, timeZone: string, style: 'short' | 'shortOffset'): string {
    try {
        return (
            new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: style })
                .formatToParts(now)
                .find((part) => part.type === 'timeZoneName')?.value ?? ''
        );
    } catch {
        return '';
    }
}

/** Everything the page shows "live", computed from the clock alone: no network, no API. */
export function buildSnapshot(now: Date, { lat, lon, timeZone, since }: LiveConfig): Snapshot {
    const times = sunTimes(now, lat, lon);
    const { elevation } = solarPosition(now, lat, lon);
    const { years, months } = yearsMonths(monthsSince(since, now));
    const offset = zonePart(now, timeZone, 'shortOffset').replace(/^GMT/, 'UTC');

    return {
        phase: solarPhase(now, lat, lon),
        values: {
            time: now.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
            zone: zonePart(now, timeZone, 'short'),
            utc: offset === 'UTC' ? 'UTC+0' : offset,
            sunrise: times ? formatUtcMinutes(times.riseUtcMin, now, timeZone) : '--:--',
            sunset: times ? formatUtcMinutes(times.setUtcMin, now, timeZone) : '--:--',
            daylight: times ? formatDuration(times.daylightMin) : '--h--',
            elevation: `${elevation >= 0 ? '+' : '-'}${Math.abs(elevation).toFixed(1)}`,
            'career-years': String(years).padStart(2, '0'),
            'career-months': String(months).padStart(2, '0'),
        },
    };
}
