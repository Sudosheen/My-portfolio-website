/** Copy-to-clipboard and click-to-reveal phone numbers (kept out of plain page text). */

function initCopy(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
        // Icon-only button: the label lives in aria-label; a status region announces the result.
        const status = button.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
        let timer: number | undefined;

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copy ?? '');
            } catch {
                return; // The mailto link beside it still works.
            }
            button.dataset.done = '';
            if (status) status.textContent = button.dataset.copied ?? 'Copied';
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                delete button.dataset.done;
                if (status) status.textContent = '';
            }, 1800);
        });
    });
}

function initReveal(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-reveal]').forEach((button) => {
        button.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = `tel:${button.dataset.number ?? ''}`;
            link.textContent = button.dataset.display ?? '';
            link.className = 'underline decoration-1';
            button.replaceWith(link);
            link.focus();
        });
    });
}

function initPrint(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-print]').forEach((button) => {
        button.addEventListener('click', () => window.print());
    });
}

export function initContact(): void {
    initCopy();
    initReveal();
    initPrint();
}
