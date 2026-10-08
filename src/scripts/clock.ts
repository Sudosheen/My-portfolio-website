import { dotMatrix } from '../lib/dotmatrix';
import { dayProgress, formatDuration, formatUtcMinutes, isDaylight, sunTimes } from '../lib/solar';

/**
 * Dot-matrix clock plus solar readout (sunrise, sunset, daylight) for one place.
 * Pure arithmetic and Intl: no network, no API. Pauses while the tab is hidden.
 */
function mount(el: HTMLElement): void {
    const lat = Number(el.dataset.lat);
    const lon = Number(el.dataset.lon);
    const timeZone = el.dataset.tz ?? 'UTC';
    const labelSun = el.dataset.labelSun ?? 'Sun';
    const labelDaylight = el.dataset.labelDaylight ?? 'Daylight';
    const labelNight = el.dataset.labelNight ?? 'Night';

    const svg = el.querySelector<SVGSVGElement>('[data-dm]');
    const timeEl = el.querySelector<HTMLElement>('[data-clock-text]');
    const sunEl = el.querySelector<HTMLElement>('[data-sun-text]');
    const marker = el.querySelector<HTMLElement>('[data-sun-marker]');
    if (!svg || !timeEl || !sunEl || !marker) return;

    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastMinute = '';
    let timer: number | undefined;

    const zoneName = (now: Date): string => {
        try {
            return (
                new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' })
                    .formatToParts(now)
                    .find((part) => part.type === 'timeZoneName')?.value ?? ''
            );
        } catch {
            return '';
        }
    };

    function tick(): void {
        const now = new Date();
        const hhmm = now.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

        if (hhmm !== lastMinute) {
            lastMinute = hhmm;
            const dots = dotMatrix(hhmm);
            svg!.setAttribute('viewBox', dots.viewBox);
            svg!.innerHTML = dots.inner;
            timeEl!.textContent = `${hhmm} ${zoneName(now)}`.trim();

            const times = sunTimes(now, lat, lon);
            const progress = dayProgress(now, times);
            marker!.style.left = `${((progress ?? 0) * 100).toFixed(1)}%`;
            if (times) {
                const rise = formatUtcMinutes(times.riseUtcMin, now, timeZone);
                const set = formatUtcMinutes(times.setUtcMin, now, timeZone);
                const state = isDaylight(now, times)
                    ? `${labelDaylight} ${formatDuration(times.daylightMin)}`
                    : labelNight;
                sunEl!.textContent = `${labelSun} ${rise} / ${set} · ${state}`;
            } else {
                sunEl!.textContent = labelSun;
            }
        }

        // Mechanical colon blink (steps, not a fade); still when motion is reduced.
        svg!.querySelector('.colon')?.toggleAttribute('data-off', !calm && now.getSeconds() % 2 === 1);
    }

    function start(): void {
        tick();
        window.clearInterval(timer);
        timer = window.setInterval(tick, 1000);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) window.clearInterval(timer);
        else start();
    });

    start();
}

export function initClock(): void {
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach(mount);
}
