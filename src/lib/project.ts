import type { CollectionEntry } from 'astro:content';
import type { Dict, Lang } from '../i18n/ui';
import { monthYear } from '../i18n/utils';

export function periodText(start: string | null, end: string | null): string | null {
    const s = monthYear(start);
    const e = monthYear(end);
    if (!s) return null;
    if (!e) return `${s} →`;
    return e === s ? s : `${s} → ${e}`;
}

export interface SpecRow {
    key: keyof Dict['projects']['fields'];
    label: string;
    value: string;
}

/**
 * Rows for a project's spec: only the fields that have a value. An empty field is left out
 * rather than shown as unknown; it appears as soon as the content gains it.
 */
export function specRows(entry: CollectionEntry<'projects'>, lang: Lang, t: Dict['projects']): SpecRow[] {
    const d = entry.data;
    const text = d[lang];
    const rows: Array<{ key: SpecRow['key']; label: string; value: string | null }> = [
        { key: 'period', label: t.fields.period, value: periodText(d.start, d.end) },
        { key: 'role', label: t.fields.role, value: text.role },
        { key: 'status', label: t.fields.status, value: t.statuses[d.status] },
        { key: 'stack', label: t.fields.stack, value: d.stack.length ? d.stack.join(' · ') : null },
        { key: 'architecture', label: t.fields.architecture, value: text.architecture },
        { key: 'license', label: t.fields.license, value: text.license },
        { key: 'privacy', label: t.fields.privacy, value: text.privacy },
        { key: 'hosting', label: t.fields.hosting, value: text.hosting },
    ];
    return rows.flatMap(({ key, label, value }) => (value ? [{ key, label, value }] : []));
}
