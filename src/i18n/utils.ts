import { getRelativeLocaleUrl } from 'astro:i18n';
import { defaultLang, isLang, ui, type Dict, type Lang } from './ui';

export function langFrom(locale: string | undefined): Lang {
    return isLang(locale) ? locale : defaultLang;
}

export function useUi(lang: Lang): Dict {
    return ui[lang];
}

/** Locale-aware URL that respects the configured `base` (e.g. /My-portfolio-website/). */
export function href(lang: Lang, path = ''): string {
    return getRelativeLocaleUrl(lang, path);
}

/** The same page in the other language, derived from the current pathname. */
export function otherLangHref(pathname: string, to: Lang): string {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    let rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
    rest = rest.replace(/^\/(fr|en)(?=\/|$)/, '');
    return getRelativeLocaleUrl(to, rest.replace(/^\/+/, ''));
}

/** "2024-11" -> "11/2024". */
export function monthYear(value: string | null | undefined): string | null {
    if (!value) return null;
    const [y, m] = value.split('-');
    return `${m}/${y}`;
}
