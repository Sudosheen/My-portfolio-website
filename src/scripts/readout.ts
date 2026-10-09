import { onMotion } from './motion';

const INTERVAL = 4000;

/**
 * Status strip: one fact at a time, stepped flip every ~4 s. Rotation runs only with motion on and
 * stops while offscreen, hidden, hovered, focused or paused by the visitor (WCAG 2.2.2, with the
 * global MOTION toggle). Without scripts or with motion off, all facts show as one static line.
 */
export function initReadout(): void {
    const root = document.querySelector<HTMLElement>('[data-readout]');
    const button = root?.querySelector<HTMLButtonElement>('.readout-pause');
    const facts = root ? Array.from(root.querySelectorAll<HTMLElement>('[data-fact]')) : [];
    if (!root || !button || facts.length < 2) return;

    let index = 0;
    let timer: number | undefined;
    let motion = false;
    let onscreen = true;
    let hover = false;
    let focus = false;
    let paused = false;

    const stop = () => {
        window.clearInterval(timer);
        timer = undefined;
    };

    const show = (next: number) => {
        facts[index].removeAttribute('data-active');
        index = next;
        const fact = facts[index];
        fact.removeAttribute('data-enter');
        void fact.offsetWidth; // restart the flip
        fact.setAttribute('data-active', '');
        fact.setAttribute('data-enter', '');
    };

    const evaluate = () => {
        const run = motion && onscreen && !hover && !focus && !paused && !document.hidden;
        if (run && timer === undefined) timer = window.setInterval(() => show((index + 1) % facts.length), INTERVAL);
        else if (!run) stop();
    };

    onMotion((on) => {
        motion = on;
        root.toggleAttribute('data-rotating', on);
        button.hidden = !on;
        if (!on) {
            facts.forEach((f) => f.removeAttribute('data-enter'));
            facts.forEach((f, i) => f.toggleAttribute('data-active', i === index));
        }
        evaluate();
    });

    button.addEventListener('click', () => {
        paused = !paused;
        button.setAttribute('aria-pressed', String(paused));
        evaluate();
    });
    root.addEventListener('pointerenter', () => ((hover = true), evaluate()));
    root.addEventListener('pointerleave', () => ((hover = false), evaluate()));
    root.addEventListener('focusin', () => ((focus = true), evaluate()));
    root.addEventListener('focusout', () => ((focus = false), evaluate()));
    document.addEventListener('visibilitychange', evaluate);
    new IntersectionObserver((entries) => {
        onscreen = entries[entries.length - 1].isIntersecting;
        evaluate();
    }).observe(root);
}
