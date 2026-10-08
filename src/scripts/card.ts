/**
 * 3D card loader. Nothing from Spline is requested until the visitor clicks.
 * The viewer is bundled from npm and imported on demand.
 *
 * The viewer hardcodes fetches of its WebAssembly modules from unpkg.com. We bundle the
 * same pinned binaries with the site and redirect those fetches to them, so the only
 * outside request left is the scene file itself.
 */
import booleanWasm from '@splinetool/boolean-wasm/build/boolean.wasm?url';
import modellingWasm from '@splinetool/modelling-wasm/build/process.wasm?url';
import navmeshWasm from '@splinetool/navmesh-wasm/build/navmesh.wasm?url';
import uiWasm from '@splinetool/ui-wasm/build/ui.wasm?url';

const SELF_HOSTED_WASM: Record<string, string> = {
    'boolean.wasm': booleanWasm,
    'process.wasm': modellingWasm,
    'navmesh.wasm': navmeshWasm,
    'ui.wasm': uiWasm,
};
const UNPKG_WASM = /^https:\/\/unpkg\.com\/@splinetool\/[^/]+\/build\/([^/?#]+\.wasm)(?:[?#].*)?$/;

function redirectWasmToSelfHosted(): void {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const local = SELF_HOSTED_WASM[UNPKG_WASM.exec(url)?.[1] ?? ''];
        return nativeFetch(local ?? input, init);
    };
}

interface Scenes {
    mobile: string;
    desktop: string;
}

function pickScene(scenes: Scenes): string {
    const portrait = window.innerHeight > window.innerWidth;
    return window.innerWidth <= 768 || portrait ? scenes.mobile : scenes.desktop;
}

function mount(root: HTMLElement): void {
    const button = root.querySelector<HTMLButtonElement>('[data-card-load]');
    const stage = root.querySelector<HTMLElement>('[data-card-stage]');
    const status = root.querySelector<HTMLElement>('[data-card-status]');
    if (!button || !stage || !status) return;

    const scenes: Scenes = {
        mobile: root.dataset.sceneMobile ?? '',
        desktop: root.dataset.sceneDesktop ?? '',
    };

    button.addEventListener('click', async () => {
        button.disabled = true;
        status.textContent = root.dataset.textLoading ?? '';

        try {
            redirectWasmToSelfHosted();
            await import('@splinetool/viewer');
        } catch {
            status.textContent = root.dataset.textFailed ?? '';
            button.disabled = false;
            return;
        }

        const viewer = document.createElement('spline-viewer');
        viewer.setAttribute('url', pickScene(scenes));
        viewer.setAttribute('loading-anim-type', 'spinner-big-light');
        stage.replaceChildren(viewer);
        stage.dataset.loaded = '';
        status.textContent = '';
        root.querySelector<HTMLElement>('[data-card-body]')?.setAttribute('hidden', '');

        // Portrait phones and desktops get different scenes; follow the viewport.
        let timer: number | undefined;
        const retarget = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                const next = pickScene(scenes);
                if (viewer.getAttribute('url') !== next) viewer.setAttribute('url', next);
            }, 200);
        };
        window.addEventListener('resize', retarget);
        window.addEventListener('orientationchange', retarget);
    });
}

document.querySelectorAll<HTMLElement>('[data-card]').forEach(mount);
