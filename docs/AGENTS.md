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
| **Branch aktif** | `migrate/astro-ssr-neon` (belum ada commit migrasi) |
| **Stack** | **Astro 7.4.5** (SSR + edge cache) · **Neon Postgres** · **Drizzle ORM 0.45.4** · **Better Auth 1.7.20** · **Cloudinary** · **Cloudflare Workers 14.4.7** |
| **Status** | Migrasi Sanity selesai, admin panel + galeri jalan, deploy Workers jalan, **custom domain `ridwanafazn.my.id` live**. Sisa: upload gambar project |

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
- Cache pakai `caches.default` di `src/middleware.ts`, header `s-maxage=60, stale-while-revalidate=300`.
- Admin/preview selalu SSR (`export const prerender = false`) dan wajib login (guard `src/middleware.ts`).
- Cache: `x-cache: HIT|MISS|BYPASS`; `?v=timestamp` = bypass total.

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
- Branch `migrate/astro-ssr-neon`; PR sebelum `main`

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
src/components/ProjectCard.astro
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
4. Cache publik 60 dtk; `?v=timestamp` bypass total (`x-cache: BYPASS`), kunci cache tanpa query string.
5. Cloudinary: preset `ml_default` (Signed), upload `/auto/upload`; hapus asset = soft delete DB (objek Cloudinary belum dihapus → TODO).
6. Deploy: build dulu baru `wrangler deploy`.
7. Login admin: `login.astro` submit via `fetch` JSON ke `/api/auth/sign-in/email` lalu `location.assign(redirect)`; jangan pakai native form POST. Halaman login pakai `AuthLayout` (tanpa sidebar).
8. Profile PUT di-merge dengan row existing (form admin hanya mengirim sebagian field). `profile.cv_url` = satu sumber tombol Resume desktop + mobile.
9. Activities bisa diedit (PATCH). Filter key yang dikirim agar default Zod tidak mereset `order`/`highlights`.
10. Sidebar admin collapse/expand: state `localStorage['admin-sidebar']`, kelas `sidebar-collapsed` di `<html>`. Judul dokumen `Ridwan Pages`, brand `ridwanafazn`.

---

## 8. Yang TIDAK perlu ditanyakan lagi

- Stack: Neon + Drizzle + Better Auth + Cloudinary + Cloudflare Workers ✅
- Public SSR + edge cache, admin/preview SSR ✅
- Sanity **sudah dihapus** ✅
- Data 10 project sudah di Neon ✅
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
