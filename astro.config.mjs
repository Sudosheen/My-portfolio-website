// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Host-portable: a custom domain or EU static host is a config change
// (SITE_URL=https://example.eu SITE_BASE=/ npm run build).
const site = process.env.SITE_URL ?? 'https://sudosheen.github.io';
const base = process.env.SITE_BASE ?? '/My-portfolio-website/';

// Fonts come from pinned npm packages (offline, reproducible builds) and are
// self-hosted from the build output: no third-party font requests at runtime.
/** @param {string} pkg @param {string} file */
const font = (pkg, file) => `${pkg}/files/${file}.woff2`;

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    react(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en-GB', fr: 'fr-FR' } } }),
  ],

  vite: {
    plugins: [tailwindcss()],
    // Imported dynamically on the card page; pre-bundle it so dev never serves a stale hash.
    optimizeDeps: { include: ['@splinetool/viewer'] },
  },

  // No code blocks on this site; Shiki's inline styles would also fight the strict CSP.
  markdown: { syntaxHighlight: false },

  fonts: [
    {
      name: 'Fraunces',
      cssVariable: '--font-face-display',
      provider: fontProviders.local(),
      options: {
        variants: [
          { weight: '100 900', style: 'normal', src: [font('@fontsource-variable/fraunces', 'fraunces-latin-wght-normal')] },
        ],
      },
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      display: 'swap',
    },
    {
      name: 'IBM Plex Sans',
      cssVariable: '--font-face-sans',
      provider: fontProviders.local(),
      options: {
        variants: [
          { weight: '100 700', style: 'normal', src: [font('@fontsource-variable/ibm-plex-sans', 'ibm-plex-sans-latin-wght-normal')] },
        ],
      },
      fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      display: 'swap',
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-face-mono',
      provider: fontProviders.local(),
      options: {
        variants: [
          { weight: 400, style: 'normal', src: [font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal')] },
        ],
      },
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      display: 'swap',
    },
  ],

  // Strict by default; pages that need more (the Spline card) add resources
  // at render time through Astro.csp.* so the exception never leaks sitewide.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
