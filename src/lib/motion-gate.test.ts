import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

/** The real inline script from Base.astro, run against stubbed browser globals. */
const source = readFileSync(new URL('../layouts/Base.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1] ?? '';

interface Env {
    stored?: Record<string, string>;
    reduce?: boolean;
    dark?: boolean;
    storageThrows?: boolean;
    referrer?: string;
    navType?: string;
}

function run({ stored = {}, reduce = false, dark = false, storageThrows = false, referrer = '', navType = 'navigate' }: Env) {
    const classes = new Set<string>();
    const dataset: Record<string, string> = {};
    runInNewContext(script, {
        URL,
        document: { documentElement: { classList: { add: (c: string) => classes.add(c) }, dataset }, referrer },
        location: { origin: 'https://example.org' },
        performance: { getEntriesByType: () => [{ type: navType }] },
        localStorage: {
            getItem: (key: string) => {
                if (storageThrows) throw new Error('blocked');
                return stored[key] ?? null;
            },
        },
        matchMedia: (query: string) => ({
            matches: query.includes('reduced-motion') ? reduce : query.includes('color-scheme: dark') ? dark : false,
        }),
    });
    return { classes, dataset };
}

describe('head script: motion gate', () => {
    it('found the script', () => {
        expect(script).toContain("dataset.motion");
    });

    it.each([
        // stored, reduce, expected
        [undefined, false, 'on'],
        [undefined, true, 'off'],
        ['on', false, 'on'],
        ['on', true, 'on'], // an explicit MOTION ON beats the OS setting
        ['off', false, 'off'],
        ['off', true, 'off'],
    ] as const)('stored=%s, prefers-reduced-motion=%s gives %s', (stored, reduce, expected) => {
        const { dataset } = run({ stored: stored ? { motion: stored } : {}, reduce });
        expect(dataset.motion).toBe(expected);
    });

    it('ignores a junk stored value', () => {
        expect(run({ stored: { motion: 'maybe' }, reduce: false }).dataset.motion).toBe('on');
        expect(run({ stored: { motion: 'maybe' }, reduce: true }).dataset.motion).toBe('off');
    });

    it('still decides when storage is blocked', () => {
        expect(run({ storageThrows: true, reduce: false }).dataset.motion).toBe('on');
        expect(run({ storageThrows: true, reduce: true }).dataset.motion).toBe('off');
    });
});

describe('head script: theme and boot', () => {
    it('adds js always, and dark-mode from storage or the OS', () => {
        expect(run({}).classes.has('js')).toBe(true);
        expect(run({ dark: true }).classes.has('dark-mode')).toBe(true);
        expect(run({ stored: { theme: 'light' }, dark: true }).classes.has('dark-mode')).toBe(false);
        expect(run({ stored: { theme: 'dark' }, dark: false }).classes.has('dark-mode')).toBe(true);
    });

    it('plays the boot on a fresh navigation without a referrer', () => {
        expect(run({}).dataset.boot).toBeUndefined();
        expect(run({ referrer: 'https://elsewhere.net/page' }).dataset.boot).toBeUndefined();
    });

    it('skips the boot on internal navigation, reload and back/forward', () => {
        expect(run({ referrer: 'https://example.org/fr/' }).dataset.boot).toBe('skip');
        expect(run({ navType: 'reload' }).dataset.boot).toBe('skip');
        expect(run({ navType: 'back_forward' }).dataset.boot).toBe('skip');
    });
});
