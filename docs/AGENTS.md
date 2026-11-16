# AGENTS.md — Instruksi untuk AI Agent (OpenCode / Cursor / Claude Code)

> **Tujuan**: konteks permanen agar agent baru bisa direct lanjut.
> **Detail state terbaru ada di [`docs/HANDOFF.md`](HANDOFF.md)** — baca itu dulu.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | `portofx-v2` — Personal Portfolio |
| **Owner** | Ridwan Afazn (`ridwanafazn`) |
| **Repo** | `github.com/ridwanafazn/portofx-v2` |
| **Branch aktif** | `main` (20 commit, working tree bersih) — `migrate/astro-ssr-neon` sudah selesai |
| **Stack** | **Astro 7.4.5** (SSR + edge cache) · **Neon Postgres** · **Drizzle ORM 0.45.4** · **Better Auth 1.7.20** · **Cloudinary** · **Cloudflare Workers 14.4.7** |
| **Status** | Migrasi Sanity selesai, admin panel + galeri jalan, deploy Workers jalan, **custom domain `ridwanafazn.my.id` live**. Sisa: **cover image 0/13** (galeri 54 foto sudah ada) |

---

## 2. Arsitektur

```
Cloudflare Workers (portofx-v2)
├─ Public  : /, /about, /projects, /projects/[slug] → SSR + cache 60s
├─ Admin   : /admin/* (guard Better Auth) + /admin/api/*
├─ Preview : /preview/portfolio/[slug]
├─ Auth    : /api/auth/*
├─ SEO     : /sitemap.xml (SSR + cache 60s), /robots.txt
├─ Neon Postgres (Drizzle HTTP)
└─ Cloudinary (signed upload + transform)
```

- Public **SSR** (bukan static) supaya edit admin langsung tampil (cache ≤60 dtk).
- Cache pakai `caches.default` di `src/middleware.ts`, header `max-age=60, s-maxage=60, stale-while-revalidate=300`.
- Admin/preview selalu SSR (`export const prerender = false`) dan wajib login (guard `src/middleware.ts`).
- Cache: `x-cache: HIT|MISS|BYPASS`; **`?v=` bypass hanya di dev** (`import.meta.env.DEV`). Produksi mengabaikannya.
- URL dengan trailing slash di-301-kan ke tanpa slash (menjaga canonical & cache key tetap satu).

---

## 3. Konvensi wajib

### Code
- TypeScript strict, ESM, path alias `@/*`, `@db/*`, `@lib/*`
- Zod 4 untuk validasi
- **Jangan** pakai `output: 'hybrid'` (dihapus Astro 7)
- **Jangan** pakai Lucia/argon2 (deprecated / tidak jalan di Workers)
- **Jangan** pakai `wrangler pages deploy` (Pages tidak didukung adapter v14)
- **Jangan** taruh secrets di `wrangler.jsonc` vars → `wrangler secret put/bulk`
- **Jangan** hapus `optimizeDeps.exclude: ['better-auth','@neondatabase/serverless','drizzle-orm']`

### Database
- Migrasi versioned: `db:generate` → commit SQL → `db:migrate`
- `snake_case` kolom, soft delete (`deleted_at`), audit (`created_at`,`updated_at`)
- `DATABASE_URL` pooled = runtime; `DATABASE_URL_UNPOOLED` = migrasi

### Git
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `migrate:`)
- Branch aktif `main`; kerja fitur pakai branch baru + PR sebelum merge

### Dokumentasi (wajib, bukan opsional)
Setiap perubahan kode **harus** memperbarui `.md` terkait **di commit yang sama**. Jangan menunda ke commit `docs:` terpisah kecuali darurat.

| Perubahan | Dokumen yang wajib diperbarui |
|---|---|
| Schema / migrasi DB | `docs/ERD.md`, `docs/TRD.md`, `docs/HANDOFF.md` |
| API / admin flow | `docs/TRD.md`, `docs/AGENTS.md` (gotchas) |
| UI, token, komponen, motion | `docs/DESIGN.md` |
| Routing / middleware / cache | `docs/AGENTS.md` (§2), `docs/HANDOFF.md`, `docs/RUNBOOK.md` |
| Env / secret / deploy | `docs/ENV.md`, `docs/RUNBOOK.md`, `docs/HANDOFF.md` |
| Versi deploy | `docs/HANDOFF.md` (§2, Version ID) |
| Keputusan arsitektur | `docs/ADR/` |
| Riwayat migrasi | `docs/MIGRATION_LOG.md` |

Checklist sebelum commit: `grep` istilah yang berubah di `docs/` + `AGENTS.md` + `README.md`, pastikan tidak ada klaim lama yang tertinggal.

---

## 4. Struktur file (ringkas)

```
db/schema/{enums,auth,portfolio,content,index}.ts
db/client.ts        # dipakai script; load .env.local
db/seed.ts          # admin + credential (hashPassword)
src/lib/{db,auth,content,queries,cloudinary}.ts
src/lib/validation/*
src/middleware.ts   # admin guard + public cache
src/layouts/{Layout,AuthLayout,AdminLayout}.astro
src/components/ProjectLedger.astro   # daftar proyek + thumbnail + hover preview
src/components/Icon.astro            # inline SVG
src/components/HeroGlobe.astro       # globe (≥1024px, dynamic import)
src/components/admin/AssetPicker.astro
src/pages/{index,about,sitemap.xml}.astro|ts
src/pages/projects/{index,[id]}.astro
src/pages/preview/portfolio/[slug].astro
src/pages/admin/{index,login,portfolio/*,profile,skills,activities,assets}
src/pages/admin/api/*
src/pages/api/auth/[...all].ts
```

---

## 5. Environment (ringkas — detail di `docs/ENV.md`)

**Wajib (dev, `.env.local`)**: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`, `PUBLIC_SITE_URL`, `PUBLIC_SITE_NAME`, `PUBLIC_CLOUDINARY_CLOUD_NAME`, `PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

**Opsional**: `AUTH_TRUSTED_ORIGINS` (comma-separated), `CLOUDINARY_FOLDER`, `CF_*`.

- `PUBLIC_*` = build-time. Secret = Worker secret.
- Production vars ada di `wrangler.jsonc`; secrets via `wrangler secret bulk`.
- Lokasi kredensial: `.env.local` (JANGAN commit).

---

## 6. Commands

```bash
pnpm dev / build / preview / deploy / typecheck
pnpm db:generate / db:migrate / db:studio / db:seed
pnpm exec wrangler secret list | deployments list | rollback | tail
neon status | branches list | connection-string --pooled
```

> `pnpm build` tidak merender route yang query DB (sitemap sudah SSR). Jangan jalankan build saat dev server hidup. `wrangler deploy` tidak build.

---

## 7. Gotchas penting

1. Setelah menambah env schema baru, `pnpm typecheck` bisa gagal sampai `pnpm build` sekali (types `.astro/env.d.ts` digenerate saat build).
2. `Zod .partial()` mewarisi `.default()` → **PATCH parsial harus filter key yang dikirim** (sudah diterapkan di `src/pages/admin/api/portfolio/[id].ts`). Jangan hapus.
3. Script Node pakai `dotenv.config({ path: ['.env.local','.env'] })`.
4. Cache publik 60 dtk; **`?v=timestamp` hanya bypass di dev** (`x-cache: BYPASS`). Di produksi `?v=` diabaikan; tunggu ≤60 dtk atau hard refresh. Kunci cache tanpa query string.
5. Cloudinary: preset `ml_default` (Signed), upload `/auto/upload`; hapus asset = soft delete DB (objek Cloudinary belum dihapus → TODO).
6. Deploy: build dulu baru `wrangler deploy`.
7. Login admin: `login.astro` submit via `fetch` JSON ke `/api/auth/sign-in/email` lalu `location.assign(redirect)`; jangan pakai native form POST. Halaman login pakai `AuthLayout` (tanpa sidebar).
8. Profile PUT di-merge dengan row existing (form admin hanya mengirim sebagian field). `profile.cv_url` = satu sumber tombol Resume desktop + mobile.
9. Activities bisa diedit (PATCH). Filter key yang dikirim agar default Zod tidak mereset `order`/`highlights`.
10. Sidebar admin collapse/expand: state `localStorage['admin-sidebar']`, kelas `sidebar-collapsed` di `<html>`. Judul dokumen `Ridwan Pages`, brand `ridwanafazn`.
11. **Public site BUKAN zero-JS.** Halaman publik memuat three.js (globe, ±139 KB), IntersectionObserver reveal, slider, lightbox, dan menu mobile. Jangan menuliskan/mengarahkan "zero-JS" untuk public.
12. **`AUTH_COOKIE_NAME` / `AUTH_COOKIE_DOMAIN` / `AUTH_COOKIE_SECURE` di `wrangler.jsonc` tidak dibaca kode.** `src/lib/auth.ts` hanya memakai `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_TRUSTED_ORIGINS`; nama cookie memakai default Better Auth. Jangan menganggapnya sebagai konfigurasi aktif.
13. **`pnpm lint` belum bisa jalan** — `eslint` tidak ada di `devDependencies` dan tidak ada config. Pakai `pnpm typecheck` dulu sampai lint di-setup.
14. **Cloudflare menimpa `max-age` HTML jadi 4 jam** pada response `CF-Cache-Status: HIT`, meski Worker mengirim `max-age=60`. Perbaikan ada di dashboard (Caching → Browser Cache TTL → “Respect Existing Headers”), bukan di kode.
15. **Menu mobile & lightbox memakai `inert`** pada konten di belakang overlay + focus trap. Jangan hapus `inert`/trap saat mengubah markup, atau keyboard user bisa masuk ke halaman belakang.
16. **Tanpa JavaScript** menu mobile tidak bisa dibuka; penggantinya `<noscript>` di `Layout.astro` (`.no-js-nav`). Jangan hapus blok itu.
17. **Globe punya jalur gagal.** WebGL tidak tersedia, renderer gagal, tekstur gagal, atau `webglcontextlost` → wrap diberi `data-failed` (CSS `display:none`) tanpa error. `prefers-reduced-motion` mematikan rotasi total. Jangan hapus guard di `src/scripts/hero-globe.ts`.
18. **OG/Twitter selalu dirender** oleh `Layout.astro` dengan default `/og.png` (1200×630). Project tanpa cover/galeri tetap punya kartu share. Lightbox di `/projects/[id]` hanya dirender jika galeri tidak kosong — jangan kembalikan dialog kosong.

---

## 8. Yang TIDAK perlu ditanyakan lagi

- Stack: Neon + Drizzle + Better Auth + Cloudinary + Cloudflare Workers ✅
- Public SSR + edge cache, admin/preview SSR ✅
- Sanity **sudah dihapus** ✅
- Data 13 project sudah di Neon ✅ (cover: 0/13; galeri: 54 foto)
- Deploy: Workers (`wrangler deploy`) ✅
- Auth: session cookie + scrypt ✅

---

## 9. Referensi

| Doc | Path |
|---|---|
| **HANDOFF (current state)** | `docs/HANDOFF.md` |
| PRD | `docs/PRD.md` |
| TRD | `docs/TRD.md` |
| ERD | `docs/ERD.md` |
| TASKS | `docs/TASKS.md` |
| DESIGN | `docs/DESIGN.md` |
| ENV | `docs/ENV.md` |
| RUNBOOK | `docs/RUNBOOK.md` |
| MIGRATION LOG | `docs/MIGRATION_LOG.md` |
| ADR | `docs/ADR/` |
