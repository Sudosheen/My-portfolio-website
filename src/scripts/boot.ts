/**
 * The power-on sequence is pure CSS (motion.css). This only ends it: on the first real input or
 * once it has had time to play, html gets .booted, which cancels any animation still pending and
 * lifts the name's halftone mask. It never runs when motion is off or the head script chose to
 * skip the sequence (internal navigation, reload, back/forward).
 */
export function initBoot(): void {
    const root = document.documentElement;
    if (root.dataset.motion !== 'on' || root.dataset.boot === 'skip') return;

    const inputs = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    let finished = false;
    let timers: number[] = [];

    function finish(): void {
        if (finished) return;
        finished = true;
        root.classList.add('booted');
        inputs.forEach((type) => window.removeEventListener(type, finish));
        window.removeEventListener('scroll', finish);
        timers.forEach((t) => window.clearTimeout(t));
        timers = [];
    }

    inputs.forEach((type) => window.addEventListener(type, finish, { passive: true }));
    // A restored scroll position fires a scroll event at load; only count scrolling after a short grace.
    timers.push(window.setTimeout(() => window.addEventListener('scroll', finish, { passive: true }), 300));
    timers.push(window.setTimeout(finish, 1600));
}
