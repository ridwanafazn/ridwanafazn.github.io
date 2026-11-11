# ADR 0001 — Architecture: Astro 7 Static + per-route SSR, Cloudflare Workers, Neon, Better Auth

- **Status**: Accepted
- **Date**: 2026-11-11
- **Supersedes**: Dokumen v1.0 yang memakai `output: 'hybrid'`, Lucia, argon2, dan Cloudflare Pages

---

## Context

Portofx v2 memindahkan konten dari Sanity (hosted CMS) ke database sendiri (Neon Postgres), dengan admin panel custom. Target deploy: Cloudflare Workers, asset: Cloudinary, auth: session-based.

Dokumen v1.0 memakai asumsi yang sudah tidak valid di stack 2026:

- `output: 'hybrid'` dihapus di Astro 7.
- `lucia` deprecated.
- `argon2` native tidak jalan di Cloudflare Workers.
- `@astrojs/cloudflare` v14 tidak mendukung Cloudflare Pages.
- `wrangler.toml` dengan `[vars]` berisi secrets.
- `PUBLIC_*` dianggap runtime, padahal build-time.
- Data model `blocks`/`pages`/`drafts` tidak cocok dengan kode flat saat ini.

---

## Decision

### 1. Astro output

Gunakan **`output: 'static'`** (default) + `export const prerender = false` di route `/admin/*` dan `/preview/*`.

**Alasan:** `hybrid` sudah dihapus; `static` + per-route adalah cara resmi Astro 7 untuk mencampur prerendered dan SSR.

**Konsekuensi:** Public pages tetap static; admin/preview SSR. Tidak ada `output: 'hybrid'`.

### 2. Auth

Gunakan **Better Auth 1.7.20** + `drizzleAdapter` + **scrypt** (`@noble/hashes`).

**Alasan:** Lucia deprecated; `argon2` native tidak bisa di-bundle ke Workers. Better Auth membawa `@noble/hashes` (pure JS) dan Drizzle adapter.

**Konsekuensi:** Tabel `users`, `sessions`, `accounts`, `verifications`. Password disimpan di `accounts.password`, bukan `users.password_hash`.

### 3. Deploy

Gunakan **Cloudflare Workers** (`wrangler deploy`), bukan Pages.

**Alasan:** `@astrojs/cloudflare` v14 menghapus dukungan Pages. Workers adalah jalur resmi.

**Konsekuensi:** `wrangler.jsonc` dengan `main = "@astrojs/cloudflare/entrypoints/server"`, `assets = { directory: "./dist", binding: "ASSETS" }`. `wrangler deploy` / `wrangler deploy --env preview`.

### 4. Secrets

Secrets **tidak** di `wrangler.jsonc` `vars`; gunakan `wrangler secret put`.

**Alasan:** `vars` plaintext, terlihat di dashboard. Secrets harus terenkripsi.

**Konsekuensi:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_PASSWORD_HASH`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `SENTRY_DSN` → secret. `BETTER_AUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `AUTH_COOKIE_*` → vars.

### 5. Env

`PUBLIC_*` = **build-time** (Astro inline). Runtime secret = `astro:env/server` dengan `access: 'secret'`.

**Alasan:** Astro meng-inline `PUBLIC_*` saat build; tidak bisa diubah runtime. Untuk runtime, `astro:env` + `wrangler secret put`.

**Konsekuensi:** `PUBLIC_SITE_URL`, `PUBLIC_CLOUDINARY_CLOUD_NAME`, `PUBLIC_CLOUDINARY_UPLOAD_PRESET` → GitHub Actions build env. `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_SECRET` → runtime secret.

### 6. Data model

**Fase 1:** flat fields (`portfolios.longDescription`, `techStack`, `highlights`, `links`, `gallery`, `coverImageId`) + `status` (`draft`/`published`/`archived`). **Tidak ada** `drafts` table, **tidak ada** `portfolio_blocks` di Fase 1.

**Fase 3:** `portfolio_blocks` opsional.

**Fase 4:** `pages` untuk `/` dan `/about`.

**Alasan:** kode saat ini render flat fields; migrasi ke blocks adalah rewrite halaman publik. Flat-first menghindari rewrite di Fase 1.

**Konsekuensi:** `drafts` table dihapus; `status` di `portfolios` yang menjadi source of truth. `portfolio_blocks`/`pages` ditandai Fase 3/4.

### 7. Versions

| Package | Version |
|---|---|
| `astro` | 7.4.5 |
| `@astrojs/cloudflare` | 14.4.7 |
| `@astrojs/react` | 7.1.7 |
| `@astrojs/sitemap` | 3.7.4 |
| `@astrojs/check` | 0.9.12 |
| `drizzle-orm` | 0.45.4 |
| `drizzle-kit` | 0.31.4+ |
| `@neondatabase/serverless` | 1.2.0 |
| `better-auth` | 1.7.20 |
| `zod` | 4.5.4 |
| `wrangler` | 4.125+ |

---

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Astro + `output: 'hybrid'`** | Dihapus di Astro 7; build gagal. |
| **Lucia** | Deprecated; tidak ada update. |
| **Argon2** | Native addon; tidak jalan di Workers. |
| **Cloudflare Pages** | Tidak didukung adapter v14. |
| **Cloudflare D1** | Tidak dipilih; Neon lebih cocok (Postgres, branching, Drizzle). |
| **Sanity tetap** | Vendor lock-in; user ingin backend control. |
| **Blocks-first** | Rewrite halaman publik; terlalu besar untuk Fase 1. |
| **Full SPA admin** | Overkill; React islands cukup. |

---

## Consequences

- **Positif:** build tidak gagal; auth jalan di Workers; deploy sesuai platform; secrets aman; data model konsisten dengan kode.
- **Negatif:** Better Auth + Drizzle schema butuh penyesuaian; `portfolio_blocks`/`pages` ditunda; Workers free tier 10ms CPU perlu diukur.
- **Risiko:** Better Auth session cookie di Workers perlu diuji hari pertama; Neon cold start; Cloudinary CORS.

---

## References

- Astro 7 config schema: `node_modules/astro/dist/core/config/schemas/base.js` (output hybrid removed)
- `@astrojs/cloudflare@14.4.7` docs: Pages removed, `main` = `@astrojs/cloudflare/entrypoints/server`
- `npm view lucia deprecated` → deprecated
- `npm view better-auth@1.7.20 dependencies` → `@noble/hashes`
- `npm view @astrojs/cloudflare@14.4.7 peerDependencies` → `astro ^7.4.0`, `wrangler ^4.125.0`
