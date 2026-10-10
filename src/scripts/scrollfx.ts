import { fillFraction } from '../lib/scrollfx';
import { onMotion } from './motion';

/**
 * Scripted scroll effects: the Scope packet (scope.ts) and the Log spine and nodes (below). They run in
 * script, not as CSS scroll timelines, so they behave the same in every browser (Firefox and Zen have no
 * scroll timelines) and stay cheap: geometry is measured once per layout change, and each scroll frame is
 * arithmetic plus a transform or one custom property. One passive scroll listener, throttled to a frame,
 * serves every effect. All of it only runs with motion on; off, the static final state shows.
 */
export interface ScrollEffect {
    /** Reads geometry (document coordinates). Called on layout changes, never per scroll frame. */
    measure(): void;
    /** Writes the effect for the current scroll position. */
    apply(scrollY: number, viewport: number): void;
    /** Back to the static final state (motion off). */
    clear(): void;
}

const effects: ScrollEffect[] = [];
let started = false;
let frame = 0;

function run(): void {
    frame = 0;
    const y = window.scrollY;
    const vh = window.innerHeight;
    effects.forEach((e) => e.apply(y, vh));
}

function schedule(): void {
    if (!frame) frame = requestAnimationFrame(run);
}

function measureAll(): void {
    effects.forEach((e) => e.measure());
    schedule();
}

export function addScrollEffect(effect: ScrollEffect): void {
    effects.push(effect);
    if (!started) {
        started = true;
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', measureAll, { passive: true });
        // Drawers opening, fonts loading or a language change move everything below: measure again.
        new ResizeObserver(measureAll).observe(document.body);
        document.fonts?.ready.then(measureAll);
        onMotion((on) => {
            if (on) measureAll();
            else effects.forEach((e) => e.clear());
        });
    }
    effect.measure();
    schedule();
}

const remPx = (): number => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/** Log: the spine fills down to the middle of the viewport and each node lights as it passes that line. */
function logEffect(list: HTMLElement): ScrollEffect {
    const items = Array.from(list.children) as HTMLElement[];
    let spineTop = 0;
    let spineLength = 0;
    let nodes: number[] = [];
    let lit: boolean[] = [];
    let fill = -1;

    return {
        measure() {
            const rem = remPx();
            const box = list.getBoundingClientRect();
            const offset = 0.9375 * rem; // where the first node and the spine start (see schematic.css)
            spineTop = box.top + window.scrollY + offset;
            spineLength = box.height - offset;
            nodes = items.map((li) => li.getBoundingClientRect().top + window.scrollY + offset);
        },
        apply(y, vh) {
            const line = y + vh * 0.5;
            list.setAttribute('data-fx', '');
            const next = Math.round(fillFraction(spineTop, spineLength, line) * 1000) / 1000;
            if (next !== fill) {
                fill = next;
                list.style.setProperty('--fill', String(next));
            }
            items.forEach((li, i) => {
                const on = nodes[i] <= line;
                if (on === lit[i]) return;
                lit[i] = on;
                li.toggleAttribute('data-lit', on);
            });
        },
        clear() {
            list.removeAttribute('data-fx');
            list.style.removeProperty('--fill');
            items.forEach((li) => li.removeAttribute('data-lit'));
            fill = -1;
            lit = [];
        },
    };
}

export function initScrollFx(): void {
    document.querySelectorAll<HTMLElement>('.log-list').forEach((list) => addScrollEffect(logEffect(list)));
}
