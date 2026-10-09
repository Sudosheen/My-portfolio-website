import { dialPoint, type DialGeometry } from '../lib/dial';
import { subscribeTick } from './tick';

/**
 * Clock module: day/night state and the sun/moon marker on the solar dial. The dot-matrix time and
 * the sunrise/sunset text are filled by the shared tick loop (tick.ts) through data-dm-live and
 * data-live; this file only reacts to the solar phase. The dial position is set with SVG attributes
 * (never a style attribute: the production CSP blocks those).
 */
function mount(el: HTMLElement): void {
    const dial = el.querySelector<SVGSVGElement>('[data-dial]');
    const marker = el.querySelector<SVGGElement>('[data-dial-marker]');
    if (!dial || !marker) return;

    const geometry: DialGeometry = {
        cx: Number(dial.dataset.cx),
        cy: Number(dial.dataset.cy),
        rx: Number(dial.dataset.rx),
        ry: Number(dial.dataset.ry),
    };

    subscribeTick(({ phase }) => {
        el.dataset.phase = phase.phase;
        const { x, y } = dialPoint(phase.phase, phase.progress, geometry);
        marker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    });
}

export function initClock(): void {
    document.querySelectorAll<HTMLElement>('[data-clock]').forEach(mount);
}
