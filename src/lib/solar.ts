/**
 * Sunrise / sunset, solar elevation and day/night phase from latitude, longitude and time.
 * NOAA general solar position formulae (no network, no API). Longitude is positive east.
 * Accuracy is about a minute, plenty for a display readout.
 */

export interface SunTimes {
    /** Minutes after 00:00 UTC of the given UTC calendar day (may fall outside 0-1440 for far longitudes). */
    riseUtcMin: number;
    setUtcMin: number;
    daylightMin: number;
}

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;

function dayOfYear(date: Date): number {
    const start = Date.UTC(date.getUTCFullYear(), 0, 1);
    const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor((today - start) / DAY_MS) + 1;
}

/** Equation of time (minutes) and solar declination (radians) for the fractional-year angle `g`. */
function solarTerms(g: number): { equationOfTime: number; declination: number } {
    const equationOfTime =
        229.18 *
        (0.000075 +
            0.001868 * Math.cos(g) -
            0.032077 * Math.sin(g) -
            0.014615 * Math.cos(2 * g) -
            0.040849 * Math.sin(2 * g));

    const declination =
        0.006918 -
        0.399912 * Math.cos(g) +
        0.070257 * Math.sin(g) -
        0.006758 * Math.cos(2 * g) +
        0.000907 * Math.sin(2 * g) -
        0.002697 * Math.cos(3 * g) +
        0.00148 * Math.sin(3 * g);

    return { equationOfTime, declination };
}

/** Returns null during polar day or polar night. */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes | null {
    const g = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1);
    const { equationOfTime, declination } = solarTerms(g);

    const cosHourAngle =
        Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(declination)) -
        Math.tan(lat * RAD) * Math.tan(declination);

    if (cosHourAngle < -1 || cosHourAngle > 1) return null;

    const hourAngleDeg = Math.acos(cosHourAngle) / RAD;
    const riseUtcMin = 720 - 4 * (lon + hourAngleDeg) - equationOfTime;
    const setUtcMin = 720 - 4 * (lon - hourAngleDeg) - equationOfTime;

    return { riseUtcMin, setUtcMin, daylightMin: setUtcMin - riseUtcMin };
}

/** Geometric solar elevation in degrees above the horizon (no refraction) at an instant. */
export function solarPosition(date: Date, lat: number, lon: number): { elevation: number; solarMinutes: number } {
    const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    const g = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1 + (utcMin / 60 - 12) / 24);
    const { equationOfTime, declination } = solarTerms(g);

    const solarMinutes = utcMin + equationOfTime + 4 * lon; // true solar time, minutes
    const hourAngle = (solarMinutes / 4 - 180) * RAD;
    const cosZenith =
        Math.sin(lat * RAD) * Math.sin(declination) +
        Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle);
    const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));

    return { elevation: 90 - zenith / RAD, solarMinutes };
}

export interface SolarPhase {
    phase: 'day' | 'night';
    /** 0 to 1 through the current day (sunrise to sunset) or night (sunset to the next sunrise). */
    progress: number;
    /** Epoch ms of the next sunrise or sunset; null in polar day or night. */
    next: number | null;
    polar: boolean;
}

/**
 * Day or night right now, and how far through it. Works from absolute rise/set instants on the
 * UTC days before, of and after `now`, so a sunset that falls after UTC midnight (the Americas)
 * and nights that span midnight are handled.
 */
export function solarPhase(now: Date, lat: number, lon: number): SolarPhase {
    const t = now.getTime();
    const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const events: Array<{ at: number; kind: 'rise' | 'set' }> = [];
    for (const k of [-1, 0, 1]) {
        const base = dayStart + k * DAY_MS;
        const times = sunTimes(new Date(base), lat, lon);
        if (!times) continue;
        events.push({ at: base + times.riseUtcMin * 60_000, kind: 'rise' });
        events.push({ at: base + times.setUtcMin * 60_000, kind: 'set' });
    }
    events.sort((a, b) => a.at - b.at);

    const previous = [...events].reverse().find((e) => e.at <= t);
    const next = events.find((e) => e.at > t);
    if (previous && next && previous.kind !== next.kind) {
        return {
            phase: previous.kind === 'rise' ? 'day' : 'night',
            progress: (t - previous.at) / (next.at - previous.at),
            next: next.at,
            polar: false,
        };
    }

    // Polar day or night (or a transition week): follow the sign of the elevation, and let the
    // marker circle with solar time so it still moves (solar noon at the top of the day arc).
    const { elevation, solarMinutes } = solarPosition(now, lat, lon);
    const turn = (((solarMinutes / 1440) % 1) + 1) % 1;
    const day = elevation > 0;
    return { phase: day ? 'day' : 'night', progress: day ? turn : (turn + 0.5) % 1, next: null, polar: true };
}

/** "07:47" in the given IANA time zone for a minute offset within `date`'s UTC day. */
export function formatUtcMinutes(minutes: number, date: Date, timeZone: string, locale = 'en-GB'): string {
    const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return new Date(base + minutes * 60_000).toLocaleTimeString(locale, {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    });
}

/** "11h29" */
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes - h * 60);
    return `${h}h${String(m).padStart(2, '0')}`;
}
