import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/My-portfolio-website/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'build' },
});
