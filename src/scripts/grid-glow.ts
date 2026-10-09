/**
 * Pointer-lit grid, site-wide: a fixed instrument grid behind all content fades in around the mouse
 * and out again when it leaves, like probing a board. Position is set with CSSOM custom properties
 * (the production CSP blocks style attributes). Only with motion on (the layer is display:none
 * otherwise), and only for mouse and pen: touch scrolling never lights it.
 */
export function initGridGlow(): void {
    const glow = document.querySelector<HTMLElement>('[data-grid-glow]');
    if (!glow) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
        frame = 0;
        glow.style.setProperty('--mx', `${x}px`);
        glow.style.setProperty('--my', `${y}px`);
    };

    window.addEventListener(
        'pointermove',
        (event) => {
            if (event.pointerType === 'touch') return;
            x = event.clientX;
            y = event.clientY;
            glow.setAttribute('data-on', '');
            if (!frame) frame = requestAnimationFrame(paint);
        },
        { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => glow.removeAttribute('data-on'));
}
