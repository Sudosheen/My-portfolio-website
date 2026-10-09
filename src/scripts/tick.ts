import { dotMatrix } from '../lib/dotmatrix';
import { buildSnapshot, type LiveConfig, type Snapshot } from '../lib/snapshot';
import { motionIsOn } from './motion';

/**
 * One shared clock for everything that is "live" on the page: the dot-matrix time, the solar dial,
 * the readouts. It wakes once a minute (aligned to the minute), never while the tab is hidden, and
 * writes to the DOM only when a value changed. Nothing here is an aria-live region.
 * Configuration comes from the first [data-live-config] element; without one the loop never starts.
 */
type Listener = (snapshot: Snapshot) => void;

const listeners = new Set<Listener>();
let config: LiveConfig | null = null;
let timer: number | undefined;
let latest: Snapshot | null = null;

function readConfig(): LiveConfig | null {
    const el = document.querySelector<HTMLElement>('[data-live-config]');
    if (!el) return null;
    const lat = Number(el.dataset.lat);
    const lon = Number(el.dataset.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, timeZone: el.dataset.tz ?? 'UTC', since: el.dataset.since ?? '2023-04' };
}

function render(snapshot: Snapshot): void {
    const { values } = snapshot;

    document.querySelectorAll<HTMLElement>('[data-live]').forEach((el) => {
        const next = values[el.dataset.live as keyof typeof values];
        if (next !== undefined && el.textContent !== next) el.textContent = next;
    });

    // Dot-matrix readouts (time, career digits): redraw only when the text changed.
    document.querySelectorAll<SVGSVGElement>('[data-dm-live]').forEach((svg) => {
        const next = values[svg.dataset.dmLive as keyof typeof values];
        if (next === undefined || svg.dataset.value === next) return;
        const dots = dotMatrix(next);
        const previous = svg.dataset.value ?? '';
        svg.dataset.value = next;
        svg.setAttribute('viewBox', dots.viewBox);
        // Safe: markup comes from our own dotMatrix() (circles with numeric attributes), never from input.
        svg.innerHTML = dots.inner;
        // Glyphs that changed roll in like a split-flap display (CSS, motion on only); one group per character.
        if (motionIsOn() && previous) {
            [...next].forEach((ch, i) => {
                if (ch !== previous[i]) svg.children[i]?.classList.add('roll');
            });
        }
    });
}

function run(): void {
    if (!config) return;
    latest = buildSnapshot(new Date(), config);
    render(latest);
    listeners.forEach((fn) => fn(latest!));
    schedule();
}

function schedule(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 60_000 - (Date.now() % 60_000) + 50);
}

/** Calls `fn` with the current snapshot now and after every update; returns an unsubscribe. */
export function subscribeTick(fn: Listener): () => void {
    listeners.add(fn);
    if (latest) fn(latest);
    return () => listeners.delete(fn);
}

export function initTick(): void {
    config = readConfig();
    if (!config) return;
    run();
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) window.clearTimeout(timer);
        else run();
    });
}
