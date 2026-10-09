const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeHtml(text: string): string {
    return text.replace(/[&<>"]/g, (c) => ESC[c]);
}

/**
 * Turns a copy template into HTML: `{sha}` becomes the build hash, every other `{key}` becomes a
 * `<span data-live="key">` holding its idle value (tick.ts fills it live). Unknown keys stay as text.
 */
export function factHtml(template: string, values: Record<string, string>, sha: string): string {
    return template
        .split(/(\{[a-z-]+\})/)
        .map((part) => {
            const match = /^\{([a-z-]+)\}$/.exec(part);
            if (!match) return escapeHtml(part);
            const key = match[1];
            if (key === 'sha') return escapeHtml(sha);
            if (key in values) return `<span data-live="${key}">${escapeHtml(values[key])}</span>`;
            return escapeHtml(part);
        })
        .join('');
}
