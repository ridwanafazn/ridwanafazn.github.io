import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ridwanafazn.github.io',
  base: '/',
  integrations: [
    react(),
    sanity({
      projectId: 'exvebwem',
      dataset: 'production',
      apiVersion: '2024-01-01',
      useCdn: false, // false untuk static build agar selalu data terbaru
      studioBasePath: '/studio', // akses studio di /studio (local dev only)
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
