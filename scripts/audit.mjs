// Post-build audit: page-weight budgets, third-party origins, security-policy hygiene
// (no inline style attributes, every inline script/style hashed in the page's CSP) and page structure.
// Usage: node scripts/audit.mjs [--write]   (--write records the numbers in src/data/audit.json)
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const base = (process.env.SITE_BASE ?? '/My-portfolio-website/').replace(/\/?$/, '/');
const siteOrigin = new URL(process.env.SITE_URL ?? 'https://sudosheen.github.io').origin;
const write = process.argv.includes('--write');

const BUDGET_KB = { html: 25, css: 20, js: 12, jsLazy: 8, fonts: 110, total: 230 };

const gz = async (path) => gzipSync(await readFile(path), { level: 9 }).length / 1024;
const toDist = (url) => join(dist, url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, ''));

async function walk(dir) {
    const out = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        out.push(...(e.isDirectory() ? await walk(full) : [full]));
    }
    return out;
}

/** Static module graph of a script: what the browser must load before the page can run it. */
async function staticGraph(entry, seen = new Set()) {
    if (seen.has(entry)) return seen;
    seen.add(entry);
    const code = await readFile(entry, 'utf8');
    for (const m of code.matchAll(/(?:import|from)\s*["']\.\/([^"']+\.js)["']/g)) {
        await staticGraph(join(entry, '..', m[1]), seen);
    }
    return seen;
}

/** Chunks only reached through dynamic import("./x.js"): fetched later, counted on their own line. */
async function lazyGraph(eager) {
    const lazy = new Set();
    const queue = [...eager];
    while (queue.length) {
        const file = queue.pop();
        const code = await readFile(file, 'utf8');
        // The bundler may quote the path with backticks: import(`./chunk.js`).
        for (const m of code.matchAll(/import\s*\(\s*["'`]\.\/([^"'`]+\.js)["'`]\s*\)/g)) {
            const chunk = await staticGraph(join(file, '..', m[1]));
            for (const f of chunk) {
                if (eager.has(f) || lazy.has(f)) continue;
                lazy.add(f);
                queue.push(f);
            }
        }
    }
    return lazy;
}

/** Content of a page's CSP <meta>, or null. */
const cspOf = (html) => html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1] ?? null;

/**
 * Security-policy hygiene for one page. Production CSP has no 'unsafe-inline' for styles, so a style=""
 * attribute is silently blocked (the dev server has no CSP, which hides it), and an inline script/style
 * whose sha256 is missing from the policy would not run.
 */
function cspProblems(html, rel) {
    const csp = cspOf(html);
    if (!csp) return [`${rel}: no CSP meta tag`];
    const problems = [];
    const directive = (name) => csp.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${name} `)) ?? '';
    const allowsStyleAttr = /'unsafe-inline'/.test(directive('style-src-attr')) || /'unsafe-inline'/.test(directive('style-src'));

    const attrs = html.match(/<[a-zA-Z][^<>]*?\sstyle\s*=\s*["'][^"']*["'][^<>]*>/g) ?? [];
    if (attrs.length && !allowsStyleAttr) {
        problems.push(`${rel}: ${attrs.length} inline style="" attribute(s) blocked by CSP (use a class, an SVG attribute or CSSOM)`);
    }

    // A <meta> policy only governs content parsed AFTER it, so the inline style and the theme/motion
    // script that Base.astro places before it run unrestricted; everything after it must be hashed.
    const policyAt = html.search(/<meta http-equiv="content-security-policy"/i);

    for (const m of html.matchAll(/<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
        const [, tag, attrsText, body] = m;
        if (m.index < policyAt) continue;
        if (tag === 'script' && (/\bsrc=/.test(attrsText) || /type="(?:application\/(?:ld\+)?json|importmap)"/.test(attrsText))) continue;
        const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
        const scope = directive(tag === 'script' ? 'script-src' : 'style-src');
        if (!scope.includes(hash) && !/'unsafe-inline'/.test(scope)) {
            problems.push(`${rel}: inline <${tag}> (${body.trim().slice(0, 40).replace(/\s+/g, ' ')}...) is not hashed in ${tag}-src`);
        }
    }
    return problems;
}

async function auditHome(file) {
    const html = await readFile(file, 'utf8');
    const refs = [...html.matchAll(/<(?:link|script)[^>]+(?:href|src)="([^"]+)"[^>]*>/g)].map((m) => ({
        tag: m[0],
        url: m[1],
    }));

    const cssFiles = refs.filter((r) => /rel="stylesheet"/.test(r.tag)).map((r) => toDist(r.url));
    const jsEntries = refs.filter((r) => /<script/.test(r.tag)).map((r) => toDist(r.url));

    const jsFiles = new Set();
    for (const entry of jsEntries) await staticGraph(entry, jsFiles);
    const lazyFiles = await lazyGraph(jsFiles);

    // Fonts: every @font-face source declared in inline <style> or linked CSS (upper bound:
    // a face is only fetched when text uses it).
    const cssText = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    for (const c of cssFiles) cssText.push(await readFile(c, 'utf8'));
    const fontUrls = new Set();
    for (const css of cssText) {
        for (const m of css.matchAll(/url\(["']?([^"')]+\.(?:woff2?|ttf|otf))["']?\)/g)) fontUrls.add(m[1]);
    }
    const fontFiles = [...fontUrls].map(toDist);

    const sum = async (files) => (await Promise.all([...files].map(gz))).reduce((a, b) => a + b, 0);
    const htmlKb = gzipSync(Buffer.from(html), { level: 9 }).length / 1024;
    const cssKb = await sum(cssFiles);
    const jsKb = await sum(jsFiles);
    const jsLazyKb = await sum(lazyFiles);
    const fontsKb = await sum(fontFiles);

    // Third-party: absolute URLs in subresource positions (not plain <a> links or XML namespaces).
    const external = new Set();
    const consider = (u) => {
        try {
            const { origin } = new URL(u);
            if (origin !== siteOrigin) external.add(origin);
        } catch {
            /* relative */
        }
    };
    refs.forEach((r) => consider(r.url));
    for (const m of html.matchAll(/<(?:img|source|iframe|video|audio)[^>]+src="([^"]+)"/g)) consider(m[1]);
    for (const css of cssText) for (const m of css.matchAll(/url\(["']?(https?:[^"')]+)["']?\)/g)) consider(m[1]);

    return {
        htmlKb,
        cssKb,
        jsKb,
        jsLazyKb,
        fontsKb,
        totalKb: htmlKb + cssKb + jsKb + jsLazyKb + fontsKb,
        thirdParty: external.size,
        externalOrigins: [...external],
    };
}

function structure(html, rel) {
    const problems = [];
    if (!/<html[^>]+lang="/.test(html)) problems.push('missing <html lang>');
    if (!/<title>[^<]+<\/title>/.test(html)) problems.push('missing <title>');
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) problems.push(`expected exactly one <h1>, found ${h1}`);
    if (/<img(?![^>]*\balt=)[^>]*>/.test(html)) problems.push('<img> without alt');
    if (!/rel="canonical"/.test(html) && !/noindex/.test(html)) problems.push('missing canonical');
    return problems.map((p) => `${rel}: ${p}`);
}

const failures = [];

// Third-party scan and structure check on every page.
const pages = (await walk(dist)).filter((f) => extname(f) === '.html');
for (const page of pages) {
    const html = await readFile(page, 'utf8');
    failures.push(...structure(html, relative(dist, page)));
    failures.push(...cspProblems(html, relative(dist, page)));
}

// A timeline is reset-only in the `animation` shorthand, so `animation: ... view()` is invalid CSS
// and the browser drops the whole declaration. The minifier produces it when a rule pairs the
// shorthand with animation-timeline: scroll-driven rules must use longhands.
for (const css of (await walk(join(dist, '_astro'))).filter((f) => extname(f) === '.css')) {
    const bad = (await readFile(css, 'utf8')).match(/animation:[^;}]*(?:view\(|scroll\(|\s--[\w-]+\s*[;}])/g) ?? [];
    for (const b of bad) failures.push(`${relative(dist, css)}: invalid animation shorthand with a timeline: ${b.slice(0, 80)}`);
}

const home = await auditHome(join(dist, 'index.html'));
const homeFr = await auditHome(join(dist, 'fr', 'index.html'));

const checks = [
    ['HTML', home.htmlKb, BUDGET_KB.html],
    ['CSS', home.cssKb, BUDGET_KB.css],
    ['JS (eager)', home.jsKb, BUDGET_KB.js],
    ['JS (lazy chunks)', home.jsLazyKb, BUDGET_KB.jsLazy],
    ['Fonts (all faces)', home.fontsKb, BUDGET_KB.fonts],
    ['Total', home.totalKb, BUDGET_KB.total],
];

console.log('\nHome page (EN), gzip');
for (const [label, value, budget] of checks) {
    const ok = value <= budget;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(18)} ${value.toFixed(1).padStart(6)} KB  (budget ${budget})`);
    if (!ok) failures.push(`${label} ${value.toFixed(1)} KB exceeds ${budget} KB`);
}
for (const [label, h] of [['EN', home], ['FR', homeFr]]) {
    const ok = h.thirdParty === 0;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} Third-party origins (${label}) ${h.thirdParty}${ok ? '' : '  ' + h.externalOrigins.join(', ')}`);
    if (!ok) failures.push(`${label}: third-party origins: ${h.externalOrigins.join(', ')}`);
}
console.log(`  pages checked: ${pages.length} (structure, CSP hashes, style attributes)`);

if (write && failures.length === 0) {
    const r = (n) => Math.round(n * 10) / 10;
    const record = {
        audited: new Date().toISOString().slice(0, 10),
        home: {
            totalKb: r(home.totalKb),
            htmlKb: r(home.htmlKb),
            cssKb: r(home.cssKb),
            jsKb: r(home.jsKb),
            jsLazyKb: r(home.jsLazyKb),
            fontsKb: r(home.fontsKb),
            thirdParty: home.thirdParty,
        },
    };
    await writeFile(join(root, 'src/data/audit.json'), JSON.stringify(record, null, 2) + '\n');
    console.log('\nRecorded in src/data/audit.json');
}

if (failures.length) {
    console.error('\nAudit failed:\n  ' + failures.join('\n  '));
    process.exit(1);
}
console.log('\nAudit passed.');
