/**
 * Day / night toggle. The initial class is set by a tiny inline script in <head>
 * (no flash). A choice is stored only when the visitor explicitly clicks, so
 * nothing is written to storage by default.
 */
const root = document.documentElement;

function isDark(): boolean {
    return root.classList.contains('dark-mode');
}

function sync(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((button) => {
        const wantsDark = button.dataset.themeSet === 'dark';
        button.setAttribute('aria-pressed', String(wantsDark === isDark()));
    });
}

function apply(theme: 'light' | 'dark', persist: boolean): void {
    root.classList.toggle('dark-mode', theme === 'dark');
    if (persist) {
        try {
            localStorage.setItem('theme', theme);
        } catch {
            /* storage unavailable: the choice simply lasts for this page */
        }
    }
    sync();
}

export function initTheme(): void {
    sync();

    document.querySelectorAll<HTMLButtonElement>('[data-theme-set]').forEach((button) => {
        button.addEventListener('click', () => apply(button.dataset.themeSet === 'dark' ? 'dark' : 'light', true));
    });

    // Follow the OS while the visitor has not chosen.
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        try {
            if (localStorage.getItem('theme')) return;
        } catch {
            /* ignore */
        }
        apply(event.matches ? 'dark' : 'light', false);
    });
}
