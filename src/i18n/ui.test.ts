import { describe, expect, it } from 'vitest';
import { ui } from './ui';

/** Reduces a value to its structure: keys, array lengths and leaf types. */
function shape(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(shape);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
    }
    return typeof value;
}

function leaves(value: unknown, path = ''): Array<[string, string]> {
    if (typeof value === 'string') return [[path, value]];
    if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
    }
    return [];
}

describe('i18n', () => {
    it('EN and FR share exactly the same keys, array lengths and types', () => {
        expect(shape(ui.fr)).toEqual(shape(ui.en));
    });

    it('no long French string is a leftover copy of the English one', () => {
        // Proper nouns and brand strings that are legitimately identical in both languages.
        const allowed = new Set(['hero.org', 'meta.siteName']);
        const en = new Map(leaves(ui.en));
        const copied = leaves(ui.fr).filter(([path, text]) => text.length > 40 && en.get(path) === text && !allowed.has(path));
        expect(copied).toEqual([]);
    });

    it('French uses a non-breaking space before a colon, as French typography requires', () => {
        const offenders = leaves(ui.fr).filter(([, text]) => /[^\s ]\s?:(?!\/\/)(\s|$)/.test(text) && / :/.test(text) && !/ :/.test(text));
        expect(offenders).toEqual([]);
    });
});
