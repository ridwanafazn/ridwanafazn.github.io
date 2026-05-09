import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Ganti dengan URL domain GitHub Pages kamu nanti
  site: 'https://ridwanafazn.github.io',
  base: '/ridwanafazn.github.io-2', 
  vite: {
    plugins: [tailwindcss()]
  }
});