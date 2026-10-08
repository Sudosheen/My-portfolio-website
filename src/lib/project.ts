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
    value: string | null;
}

/**
 * Rows for a project's spec drawer. Known fields always show; the sovereignty
 * trio (license, privacy impact, hosting) always shows for featured projects so
 * unknowns are visible rather than hidden. `all` forces every row (case-study page).
 */
export function specRows(entry: CollectionEntry<'projects'>, lang: Lang, t: Dict['projects'], all = false): SpecRow[] {
    const d = entry.data;
    const text = d[lang];
    const always = d.featured || all;
    const rows: Array<SpecRow & { force: boolean }> = [
        { key: 'period', label: t.fields.period, value: periodText(d.start, d.end), force: false },
        { key: 'role', label: t.fields.role, value: text.role, force: false },
        { key: 'status', label: t.fields.status, value: t.statuses[d.status], force: false },
        { key: 'stack', label: t.fields.stack, value: d.stack.length ? d.stack.join(' · ') : null, force: false },
        { key: 'architecture', label: t.fields.architecture, value: text.architecture, force: false },
        { key: 'license', label: t.fields.license, value: text.license, force: always },
        { key: 'privacy', label: t.fields.privacy, value: text.privacy, force: always },
        { key: 'hosting', label: t.fields.hosting, value: text.hosting, force: always },
    ];
    return rows.filter((r) => r.value || r.force).map(({ key, label, value }) => ({ key, label, value }));
}
