import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import preact from '@astrojs/preact';
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
      // Pre-bundle Preact supaya dev tidak re-optimize di tengah request
      // (pernah memicu `preact/hooks` __H undefined pada SSR pertama).
      include: ['preact', 'preact/hooks', 'preact/compat', 'preact/compat/client', 'preact/jsx-runtime'],
    },
    server: {
      watch: {
        // Chrome profile hasil screenshot tools + artefak review bukan source.
        ignored: ['**/.taste-skill/**', '**/mockups/shots/**'],
      },
    },
  },
  // React Bits components memakai API React; compat:true memetakan `react`
  // ke `preact/compat` (runtime jauh lebih kecil). Jangan ganti ke React penuh
  // tanpa mengukur bundle + LCP.
  integrations: [preact({ compat: true })],
  env: {
    schema: {
      // === Runtime secrets (server) ===
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      DATABASE_URL_UNPOOLED: envField.string({ context: 'server', access: 'secret' }),
      BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret' }),
      // === Runtime non-sensitive (server) ===
      // `access: 'secret'` = dibaca saat runtime dari Worker env, BUKAN
      // di-inline saat build. Kalau 'public', nilai `.env.local` (localhost)
      // ikut ter-bundle ke produksi dan membuat cek origin Better Auth gagal.
      BETTER_AUTH_URL: envField.string({ context: 'server', access: 'secret' }),
      AUTH_TRUSTED_ORIGINS: envField.string({ context: 'server', access: 'secret', optional: true }),
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
