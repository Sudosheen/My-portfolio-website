import { between, coverProgress, reachedIndex } from '../lib/scrollfx';
import { addScrollEffect } from './scrollfx';

/**
 * Scope schematic. Without JavaScript every readout is visible as a plain list.
 * With it, the node buttons (toggle buttons, aria-pressed) show one readout at a time.
 * While the packet travels the pipeline on scroll (motion on), the node it has reached is selected
 * automatically. Those automatic changes are not announced (the live region is muted for them);
 * a click selects and announces as usual.
 */
function mount(root: HTMLElement): void {
    const nodes = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-node]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
    const list = root.querySelector<HTMLElement>('[data-node-list]');
    const wires = root.querySelector<HTMLElement>('.scope-nodes');
    const packet = root.querySelector<HTMLElement>('.scope-packet');
    const live = root.querySelector<HTMLElement>('[aria-live]');
    if (!nodes.length || !panels.length || !list) return;

    let current = -1;

    function select(index: number, announce: boolean): void {
        if (index === current) return;
        current = index;
        if (live && !announce) live.setAttribute('aria-live', 'off');
        nodes.forEach((node, i) => node.setAttribute('aria-pressed', String(i === index)));
        // Index of the selected node: CSS energizes the wires up to it.
        if (wires) wires.dataset.active = String(index);
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.panel !== nodes[index].dataset.node;
        });
        if (live && !announce) requestAnimationFrame(() => live.setAttribute('aria-live', 'polite'));
    }

    list.hidden = false;
    root.dataset.ready = '';
    nodes.forEach((node, i) => node.addEventListener('click', () => select(i, true)));
    select(0, true);

    if (!packet) return;
    const track = packet.parentElement;
    if (!track) return;

    // The packet travels the pipeline as the section passes through the viewport, and the node it has
    // reached is selected. Position and node starts are measured once per layout change; each scroll frame
    // is arithmetic and one transform (see scrollfx.ts).
    let vertical = false;
    let length = 0;
    let trackTop = 0;
    let trackHeight = 0;
    let size = 0;
    let starts: number[] = [];
    addScrollEffect({
        measure() {
            vertical = wires ? getComputedStyle(wires).flexDirection === 'column' : false;
            const t = track.getBoundingClientRect();
            trackTop = t.top + window.scrollY;
            trackHeight = t.height;
            length = vertical ? t.height : t.width;
            size = vertical ? packet.offsetHeight : packet.offsetWidth;
            starts = nodes.map((node) => {
                const n = node.getBoundingClientRect();
                return vertical ? n.top - t.top : n.left - t.left;
            });
        },
        apply(y, vh) {
            const p = between(coverProgress(trackTop - y, trackHeight, vh), 0.2, 0.8);
            const at = p * Math.max(0, length - size);
            packet.setAttribute('data-live', '');
            packet.style.transform = vertical ? `translateY(${at}px)` : `translateX(${at}px)`;
            select(reachedIndex(starts, at + size / 2), false);
        },
        clear() {
            packet.removeAttribute('data-live');
            packet.style.transform = '';
        },
    });
}

export function initScope(): void {
    document.querySelectorAll<HTMLElement>('[data-scope]').forEach(mount);
}
