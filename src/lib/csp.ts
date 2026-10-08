import type { APIContext } from 'astro';

type Csp = NonNullable<APIContext['csp']>;

/** A single CSP directive string, typed by Astro (for example "connect-src https://example.com"). */
export type CspDirective = Parameters<Csp['insertDirective']>[0];
export type CspScriptResource = Parameters<Csp['insertScriptResource']>[0];
export type CspStyleResource = Parameters<Csp['insertStyleResource']>[0];
export type CspStyleHash = Parameters<Csp['insertStyleHash']>[0];

/** Extra policy for one page. Everything else on the site keeps the strict default. */
export interface PageCsp {
    directives?: CspDirective[];
    /** Adding any script resource replaces the implicit 'self', so include it explicitly. */
    script?: CspScriptResource[];
    style?: CspStyleResource[];
    /** Exact hashes of inline <style> blocks injected at runtime by a third-party library. */
    styleHashes?: CspStyleHash[];
}

/**
 * Must run in the layout's frontmatter: Astro renders the policy together with <head>,
 * so anything inserted later (from a body component) is silently too late.
 */
export function applyCsp(csp: APIContext['csp'], extra: PageCsp = {}): void {
    if (!csp) return;
    extra.directives?.forEach((d) => csp.insertDirective(d));
    extra.script?.forEach((r) => csp.insertScriptResource(r));
    extra.style?.forEach((r) => csp.insertStyleResource(r));
    extra.styleHashes?.forEach((h) => csp.insertStyleHash(h));
}
