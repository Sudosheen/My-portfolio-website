import type { APIRoute } from 'astro';

// Generated from the configured site and base, so a domain move needs no edit here.
export const GET: APIRoute = ({ site }) => {
    const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site).href;
    return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
