// Removes build artifacts in dist/_astro that nothing references (for example the
// React client runtime that the integration emits even when no island uses it).
// They would never be downloaded by visitors, but they have no business in a deploy.
import { readdir, readFile, rm } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.json', '.txt', '.svg', '.webmanifest']);

async function walk(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(full)));
        else out.push(full);
    }
    return out;
}

const removed = [];
for (;;) {
    const files = await walk(dist);
    const texts = new Map();
    for (const f of files) {
        if (TEXT.has(extname(f))) texts.set(f, await readFile(f, 'utf8'));
    }

    const orphans = files.filter((f) => {
        const rel = relative(dist, f);
        if (!rel.startsWith('_astro/')) return false;
        const name = rel.split('/').pop();
        for (const [path, content] of texts) {
            if (path !== f && content.includes(name)) return false;
        }
        return true;
    });

    if (orphans.length === 0) break;
    for (const f of orphans) {
        await rm(f);
        removed.push(relative(dist, f));
    }
}

console.log(removed.length ? `Pruned ${removed.length} unreferenced file(s):\n  ${removed.join('\n  ')}` : 'No orphaned assets.');
