// Runs axe-core (WCAG 2.0/2.1/2.2 A and AA, plus best practices) against every built page.
// jsdom has no layout engine, so colour contrast is excluded here: it is verified separately
// at the token level (see src/styles/open-spec.css) and by eye in a real browser.
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');

async function walk(dir) {
    const out = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        out.push(...(e.isDirectory() ? await walk(full) : [full]));
    }
    return out;
}

const pages = (await walk(dist)).filter((f) => extname(f) === '.html').sort();
let total = 0;

for (const page of pages) {
    const rel = relative(dist, page);
    const dom = new JSDOM(await readFile(page, 'utf8'), {
        runScripts: 'outside-only',
        pretendToBeVisual: true,
        url: `https://audit.invalid/${rel}`,
    });
    dom.window.eval(axeSource);

    const results = await dom.window.axe.run(dom.window.document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
        rules: { 'color-contrast': { enabled: false } },
    });

    total += results.violations.length;
    console.log(`${results.violations.length === 0 ? 'ok  ' : 'FAIL'} ${rel}  (${results.passes.length} rules passed)`);
    for (const v of results.violations) {
        console.log(`     [${v.impact}] ${v.id}: ${v.help}`);
        for (const node of v.nodes.slice(0, 3)) console.log(`       ${node.target.join(' ')}`);
    }
    dom.window.close();
}

if (total) {
    console.error(`\n${total} accessibility violation(s).`);
    process.exit(1);
}
console.log(`\nAccessibility scan passed on ${pages.length} pages.`);
