import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Karena ini adalah repositori username.github.io, gunakan root domain
  site: 'https://ridwanafazn.github.io',
  base: '/', 
  vite: {
    plugins: [tailwindcss()]
  }
});