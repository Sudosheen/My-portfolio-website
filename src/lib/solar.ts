/**
 * Sunrise / sunset from latitude, longitude and date. NOAA general solar position
 * formulae (no network, no API). Longitude is positive east. Accuracy is about a
 * minute, plenty for a display readout.
 */

export interface SunTimes {
    /** Minutes after 00:00 UTC of the given UTC calendar day. */
    riseUtcMin: number;
    setUtcMin: number;
    daylightMin: number;
}

const RAD = Math.PI / 180;

function dayOfYear(date: Date): number {
    const start = Date.UTC(date.getUTCFullYear(), 0, 1);
    const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor((today - start) / 86_400_000) + 1;
}

/** Returns null during polar day or polar night. */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes | null {
    const g = ((2 * Math.PI) / 365) * (dayOfYear(date) - 1);

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

    const cosHourAngle =
        Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(declination)) -
        Math.tan(lat * RAD) * Math.tan(declination);

    if (cosHourAngle < -1 || cosHourAngle > 1) return null;

    const hourAngleDeg = Math.acos(cosHourAngle) / RAD;
    const riseUtcMin = 720 - 4 * (lon + hourAngleDeg) - equationOfTime;
    const setUtcMin = 720 - 4 * (lon - hourAngleDeg) - equationOfTime;

    return { riseUtcMin, setUtcMin, daylightMin: setUtcMin - riseUtcMin };
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

/** 0 at sunrise, 1 at sunset, clamped. Returns null when the sun never rises or sets. */
export function dayProgress(date: Date, times: SunTimes | null): number | null {
    if (!times) return null;
    const now = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
    return Math.max(0, Math.min(1, (now - times.riseUtcMin) / (times.setUtcMin - times.riseUtcMin)));
}

export function isDaylight(date: Date, times: SunTimes | null): boolean {
    if (!times) return false;
    const now = date.getUTCHours() * 60 + date.getUTCMinutes();
    return now >= times.riseUtcMin && now <= times.setUtcMin;
}

/** "11h29" */
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes - h * 60);
    return `${h}h${String(m).padStart(2, '0')}`;
}
