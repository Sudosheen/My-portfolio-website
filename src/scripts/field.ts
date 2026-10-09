import { fieldAllowed } from '../lib/field';
import { motionIsOn, onMotion } from './motion';

/**
 * Gate for the live contour fields (hero tile, hero backdrop, sage pods, dividers). This part is tiny
 * and always loaded; the WebGL code is one shared lazy chunk, fetched only when motion is on, data
 * saving is off, the device is capable, and a field's host is near the viewport, then started when
 * the browser is idle. Each host starts on its own; otherwise its static poster simply stays.
 * A host is any [data-field-host] with a direct-child canvas[data-field]; tuning is by data-field-*.
 */
export function initField(): void {
    const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-field-host]'));
    if (!hosts.length) return;

    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const allowed = () =>
        motionIsOn() && fieldAllowed({ motion: true, saveData: nav.connection?.saveData, deviceMemory: nav.deviceMemory });
    const whenIdle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200));

    hosts.forEach((host) => {
        const canvas = host.querySelector<HTMLCanvasElement>(':scope > canvas[data-field]');
        if (!canvas) return;
        let requested = false;

        const start = () => {
            if (requested || !allowed()) return;
            requested = true;
            whenIdle(() => {
                import('./contour-field')
                    .then(({ startField }) => startField(host, canvas))
                    .catch(() => {
                        /* the poster stays */
                    });
            });
        };

        const near = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                near.disconnect();
                start();
            },
            { rootMargin: '200px' },
        );

        // Motion may be switched on later (it was off at load): look again then.
        onMotion((on) => {
            if (on && !requested) near.observe(host);
        });
    });
}
