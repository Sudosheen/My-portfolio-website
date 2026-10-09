/**
 * MOTION control. The head script in Base.astro sets html[data-motion="on|off"] before first paint
 * (a stored choice, else prefers-reduced-motion). A choice is stored only when the visitor clicks,
 * so nothing is written by default. Everything animated, in CSS or script, keys off this attribute.
 */
export type Motion = 'on' | 'off';

const root = document.documentElement;

export function motionIsOn(): boolean {
    return root.dataset.motion !== 'off';
}

/** What the page should do when nothing has been chosen: follow the OS. */
export function motionDefault(prefersReduced: boolean): Motion {
    return prefersReduced ? 'off' : 'on';
}

function sync(): void {
    const on = motionIsOn();
    document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]').forEach((button) => {
        button.setAttribute('aria-pressed', String(on));
    });
}

function apply(motion: Motion, persist: boolean): void {
    root.dataset.motion = motion;
    if (persist) {
        try {
            localStorage.setItem('motion', motion);
        } catch {
            /* storage unavailable: the choice simply lasts for this page */
        }
    }
    sync();
    window.dispatchEvent(new CustomEvent('motionchange', { detail: motion }));
}

/** Runs `fn` now and on every change; returns an unsubscribe. */
export function onMotion(fn: (on: boolean) => void): () => void {
    const handler = () => fn(motionIsOn());
    window.addEventListener('motionchange', handler);
    handler();
    return () => window.removeEventListener('motionchange', handler);
}

export function initMotion(): void {
    sync();

    document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]').forEach((button) => {
        button.addEventListener('click', () => apply(motionIsOn() ? 'off' : 'on', true));
    });

    // Follow the OS setting while the visitor has not chosen.
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        try {
            if (localStorage.getItem('motion')) return;
        } catch {
            /* ignore */
        }
        apply(motionDefault(event.matches), false);
    });
}
