import { motionIsOn } from './motion';
import { addScrollEffect } from './scrollfx';

/**
 * Back-to-top button (phones; BackToTop.astro). It shows once the reader is past the first screen, and its
 * ring (--p, 0..1) follows the scroll progress. Progress is position feedback, so it works with motion off too.
 * Geometry is measured once per layout change (scrollfx.ts); each scroll frame is arithmetic and at most one
 * custom property. Without scripts the link is a plain "#top" anchor, always visible.
 */
export function initToTop(): void {
    const button = document.querySelector<HTMLAnchorElement>('[data-to-top]');
    if (!button) return;

    let max = 0;
    let shown: boolean | undefined;
    let progress = -1;

    addScrollEffect({
        measure() {
            max = document.documentElement.scrollHeight - window.innerHeight;
        },
        apply(y, vh) {
            const on = y > vh * 0.8;
            if (on !== shown) {
                shown = on;
                button.toggleAttribute('data-show', on);
            }
            const p = max > 0 ? Math.round(Math.min(1, Math.max(0, y / max)) * 1000) / 1000 : 0;
            if (p !== progress) {
                progress = p;
                button.style.setProperty('--p', String(p));
            }
        },
        clear() {
            /* position feedback stays with motion off */
        },
    });

    // Scroll with the page's own smooth scrolling (instant with motion off), keep the address clean, and leave
    // focus somewhere sensible: the button is about to hide.
    button.addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: motionIsOn() ? 'smooth' : 'auto' });
        document.querySelector<HTMLElement>('.name-link')?.focus({ preventScroll: true });
    });
}
