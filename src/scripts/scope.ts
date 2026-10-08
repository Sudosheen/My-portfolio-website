/**
 * Scope schematic. Without JavaScript every readout is visible as a plain list.
 * With it, the node buttons (toggle buttons, aria-pressed) show one readout at a time.
 */
function mount(root: HTMLElement): void {
    const nodes = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-node]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
    const list = root.querySelector<HTMLElement>('[data-node-list]');
    if (!nodes.length || !panels.length || !list) return;

    function select(id: string): void {
        nodes.forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.node === id)));
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.panel !== id;
        });
    }

    list.hidden = false;
    root.dataset.ready = '';
    nodes.forEach((node) => node.addEventListener('click', () => select(node.dataset.node ?? '')));
    select(nodes[0].dataset.node ?? '');
}

export function initScope(): void {
    document.querySelectorAll<HTMLElement>('[data-scope]').forEach(mount);
}
