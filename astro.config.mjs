import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ridwanafazn.my.id',
  base: '/',
  // Astro 7: 'hybrid' sudah dihapus. Default 'static' + per-route prerender=false.
  output: 'static',
  build: { format: 'file' },
  adapter: cloudflare({ imageService: 'passthrough' }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // better-auth subpath adapters (sqlite/mongodb/memory) tidak kompatibel
      // dengan dep optimizer workerd — exclude dari pre-bundle.
      exclude: ['better-auth', '@neondatabase/serverless', 'drizzle-orm'],
    },
  },
  integrations: [react()],
  env: {
    schema: {
      // === Runtime secrets (server) ===
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      DATABASE_URL_UNPOOLED: envField.string({ context: 'server', access: 'secret' }),
      BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret' }),
      // === Runtime non-sensitive (server) ===
      BETTER_AUTH_URL: envField.string({ context: 'server', access: 'public' }),
      AUTH_TRUSTED_ORIGINS: envField.string({ context: 'server', access: 'public', optional: true }),
      CLOUDINARY_CLOUD_NAME: envField.string({ context: 'server', access: 'public' }),
      CLOUDINARY_UPLOAD_PRESET: envField.string({ context: 'server', access: 'public' }),
      CLOUDINARY_FOLDER: envField.string({ context: 'server', access: 'public', default: 'portfolio' }),
      // === Build-time public (client) ===
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_SITE_NAME: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_CLOUDINARY_CLOUD_NAME: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_CLOUDINARY_UPLOAD_PRESET: envField.string({ context: 'client', access: 'public' }),
    },
  },
});
