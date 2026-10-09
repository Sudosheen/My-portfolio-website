import { motionIsOn } from './motion';

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

    // Which node has the packet reached? Read its real (animated) position, so this always agrees
    // with what is on screen, whatever the layout (a row, or a column on small screens).
    let frame = 0;
    const follow = () => {
        frame = 0;
        if (!motionIsOn() || getComputedStyle(packet).display === 'none') return;
        const vertical = wires ? getComputedStyle(wires).flexDirection === 'column' : false;
        const p = packet.getBoundingClientRect();
        const at = vertical ? p.top + p.height / 2 : p.left + p.width / 2;
        let reached = 0;
        nodes.forEach((node, i) => {
            const n = node.getBoundingClientRect();
            if (at >= (vertical ? n.top : n.left)) reached = i;
        });
        select(reached, false);
    };
    addEventListener(
        'scroll',
        () => {
            if (!frame) frame = requestAnimationFrame(follow);
        },
        { passive: true },
    );
}

export function initScope(): void {
    document.querySelectorAll<HTMLElement>('[data-scope]').forEach(mount);
}
