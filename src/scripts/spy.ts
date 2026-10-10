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
            // A link may cover several sections (data-spy-link="intro principles": the name link stays lit through "How I work").
            const on = (link.dataset.spyLink ?? '').split(' ').includes(id);
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

    // Switching language keeps the reader in the same section: the link gains that section's hash
    // just before it is followed (the two pages differ in height, so a section is the stable anchor).
    document.querySelectorAll<HTMLAnchorElement>('a[hreflang]:not([aria-current])').forEach((link) => {
        const keepSection = () => {
            update();
            const url = new URL(link.href);
            url.hash = active > 0 ? IDS[active] : '';
            link.href = url.href;
        };
        link.addEventListener('click', keepSection);
        link.addEventListener('auxclick', keepSection); // middle click opens the other language in a new tab
    });

    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    schedule();
}
