/**
 * Header scroll furniture: section meter, progress fill and scroll-spy.
 * Only runs on pages that have the home sections; elsewhere the meter stays hidden.
 * Progress is position feedback, so it works with motion off (no transitions at all).
 */
const IDS = ['intro', 'principles', 'scope', 'log', 'projects', 'education', 'contact'];

export function initSpy(): void {
    const sections = IDS.map((id) => document.getElementById(id));
    if (sections.some((s) => !s)) return;
    const els = sections as HTMLElement[];

    const meter = document.querySelector<HTMLElement>('[data-spy-meter]');
    const bar = document.querySelector<HTMLElement>('[data-spy-bar]');
    const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-spy-cell]'));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spy-link]'));
    const progress = Array.from(document.querySelectorAll<HTMLElement>('[data-spy-p]'));
    if (bar) {
        bar.hidden = false;
        progress.push(bar);
    }
    if (meter) meter.hidden = false;

    let active = -1;
    let frame = 0;

    function setActive(index: number): void {
        if (index === active) return;
        active = index;
        const id = IDS[index];
        cells.forEach((cell, i) => {
            cell.dataset.state = i < index ? 'done' : i === index ? 'active' : 'todo';
        });
        links.forEach((link) => {
            const on = link.dataset.spyLink === id;
            if (on) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
            link.querySelector<HTMLElement>('.led')?.setAttribute('data-state', on ? 'on' : 'idle');
        });
    }

    function update(): void {
        frame = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
        progress.forEach((el) => el.style.setProperty('--p', p.toFixed(4)));
        if (max > 0 && max - scrollY < 2) {
            setActive(IDS.length - 1);
        } else {
            // The last section whose top has crossed the 30% line.
            const line = innerHeight * 0.3;
            let index = 0;
            els.forEach((el, i) => {
                if (el.getBoundingClientRect().top <= line) index = i;
            });
            setActive(index);
        }
    }

    function schedule(): void {
        if (!frame) frame = requestAnimationFrame(update);
    }

    // Sections entering or leaving the line 30% down the viewport (also catches layout shifts)
    // wake the update, which reads the geometry once per frame.
    const observer = new IntersectionObserver(schedule, { rootMargin: '-30% 0px -70% 0px' });
    els.forEach((el) => observer.observe(el));

    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    schedule();
}
