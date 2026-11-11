# HANDOFF — Current State Snapshot
> **Terakhir diperbarui:** 2026-11-11
> **Tujuan:** agar sesi/agent baru bisa lanjut tanpa menggali ulang.
> **Jangan taruh secret di file ini.** Semua kredensial ada di `.env.local` (gitignored) / Cloudflare secrets.

---

## 1. Ringkasan 1 paragraf

Portfolio pribadi (`portofx-v2`) sudah **migrasi total dari Sanity ke Neon Postgres + Cloudinary**, punya **admin panel custom** (CRUD project + upload asset), **public pages SSR dengan edge cache 60 detik**, dan **sudah deploy ke Cloudflare Workers**. Yang tersisa utama: **custom domain `ridwanafazn.my.id`** (masih DNS di `dnscloud.id`, mengarah ke GitHub Pages) dan **upload gambar project asli**.

---

## 2. Status deploy & URL

| Item | Nilai |
|---|---|
| **Live (Workers)** | https://portofx-v2.ridwanafzn.workers.dev |
| **Worker name** | `portofx-v2` |
| **Versi terakhir** | `502a15d0-abf0-4ccc-a769-b1b968ab030a` (cek ulang: `wrangler deployments list`) |
| **Akun Cloudflare** | `491877dfe9bd12e5bce536e6da18da15` (ridwanafzn@gmail.com) |
| **KV SESSION** | `0caf957ffab8428687ada2d8bef1e809` |
| **Domain target** | `https://ridwanafazn.my.id` |
| **Domain saat ini** | NS `candra.ns.dnscloud.id` / `dewi.ns.dnscloud.id` → A record GitHub Pages `185.199.108-111.153`, `www` CNAME `ridwanafazn.github.io` |
| **Admin login** | `https://portofx-v2.ridwanafzn.workers.dev/admin/login` |
| **Dev server** | `http://localhost:4321/` (jalankan `pnpm dev`) |

---

## 3. Stack & versi

- **Astro 7.4.5** — public pages `prerender = false` (SSR), admin/preview SSR
- **@astrojs/cloudflare 14.4.7** — Workers, `wrangler deploy` (Pages **tidak** didukung)
- **wrangler 4.159.0**
- **Neon Postgres 18** + **Drizzle ORM 0.45.4** (`drizzle-kit 0.31.11`)
- **Better Auth 1.7.20** — scrypt via `@noble/hashes`, **bukan** Lucia/argon2
- **Cloudinary** — signed upload, transform URL (tanpa SDK)
- **Tailwind CSS 4** (`@tailwindcss/vite`)
- Node 24.20.0, pnpm 12.14.0

---

## 4. Infrastruktur data

| Item | Nilai |
|---|---|
| Neon project | `portofx-v2` — id `odd-rice-47100012` |
| Region | `aws-ap-southeast-1` (Singapore) |
| Default branch | `main` — `br-cold-art-a134abi2` |
| Database | `neondb` |
| `.neon` link | ada (gitignored), CLI `neon` sudah login |
| DB nyasar | DB `portofx-v2` di project **Orchestrix** sudah **dihapus** |

### Isi database (saat ini)
| Tabel | Jumlah |
|---|---|
| portfolios | 10 (semua `published`) |
| featured (`is_top_project`) | 3 — `jymz`, `neuroplastisism`, `smile-fest` |
| activities | 2 |
| profile | 1 |
| skills | 1 (4 kategori) |
| assets | 1 (`portfolio/resized_image`) |
| users/accounts | 1 (admin) |

Slug project: `open-house`, `smile-fest`, `jymz`, `neuroplastisism`, `vessel`, `orchestrix`, `zenithxzn`, `maqdis-travel`, `nourishify`, `bakerman`.

---

## 5. Auth & kredensial (JANGAN commit)

| Item | Lokasi |
|---|---|
| Admin email | `admin@portofx.dev` |
| Admin password | di `.env.local` → `ADMIN_PASSWORD` (default seed `admin12345` — **ganti sebelum go-live**) |
| DB URL | `.env.local` (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` direct) |
| Cloudinary | cloud `a5e2n4lq`, preset `ml_default` (Signed); key/secret di `.env.local` |
| Better Auth secret | `.env.local` (dev) & Worker secret (prod, random) |

Worker **secrets** (sudah di-set): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Worker **vars** (`wrangler.jsonc`): `NODE_ENV`, `BETTER_AUTH_URL`, `AUTH_COOKIE_NAME`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE`, `AUTH_TRUSTED_ORIGINS` (`https://ridwanafazn.my.id,https://portofx-v2.ridwanafzn.workers.dev`), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_FOLDER`.

> Neon MCP API key pernah dibuat (`id 3522743`, account-wide). Revoke bila perlu: `neon api-keys revoke 3522743`.

---

## 6. Arsitektur final

```
Internet
  │
  ▼
Cloudflare Workers (portofx-v2)
  ├─ Public: /, /about, /projects, /projects/[slug]  → SSR + cache 60s (caches.default)
  ├─ /admin/*  → SSR, guard Better Auth (middleware)
  ├─ /preview/portfolio/[slug] → SSR (draft preview)
  ├─ /api/auth/* → Better Auth handler
  ├─ /admin/api/* → CRUD (portfolio, assets, profile, skills, activities)
  ├─ /sitemap.xml → SSR + cache 60s (query DB, project baru langsung masuk)
  └─ /robots.txt → static
        │
        ├── Neon Postgres (Drizzle HTTP)
        └── Cloudinary (gambar)
```

- **Cache publik:** `/`, `/about`, `/projects*`, `/sitemap.xml` → `s-maxage=60, stale-while-revalidate=300` + `x-cache: HIT|MISS|BYPASS`. Edit admin tampil ≤60 dtk, atau pakai `?v=timestamp` (bypass total, tanpa baca/tulis cache). Kunci cache tanpa query string agar `?utm_*` tidak memecah cache.
- **Preview:** `/preview/*` wajib login (guard middleware yang sama dengan admin).
- `build.format: 'file'` masih aktif; **tidak ada route prerender** — semua halaman/endpoint SSR (kecuali aset statis).
- Middleware admin hanya jalan untuk `/admin/*`; public GET di-cache.

---

## 7. Peta file penting

```
db/
  schema/enums.ts|auth.ts|portfolio.ts|content.ts|index.ts
  client.ts            # Neon HTTP, load .env.local via dotenv
  seed.ts              # admin + credential account (hashPassword) + sample
  migrations/0000_*.sql
src/
  lib/db.ts            # Neon client runtime (astro:env/server DATABASE_URL)
  lib/auth.ts          # Better Auth + drizzleAdapter + trustedOrigins
  lib/content.ts       # data publik (Neon) + resolve cover/gallery
  lib/queries.ts       # data admin (CRUD, stats, asset map)
  lib/cloudinary.ts    # signUploadParams + getTransformUrl
  lib/validation/*     # Zod
  middleware.ts        # admin guard + public edge cache
  layouts/AdminLayout.astro   # sidebar/drawer/toast admin
  layouts/AuthLayout.astro    # shell login (tanpa sidebar/navbar)
  layouts/Layout.astro        # layout publik
  components/ProjectCard.astro        # cover di card
  components/admin/AssetPicker.astro  # pilih cover + galeri
  pages/index.astro|about.astro|projects/index.astro|projects/[id].astro  # SSR
  pages/preview/portfolio/[slug].astro
  pages/sitemap.xml.ts
  pages/admin/*        # dashboard, portfolio (list/new/edit), profile, skills, activities, assets
  pages/admin/api/*    # portfolio (+publish/archive/duplicate), assets (+sign-upload), profile, skills, activities
  pages/api/auth/[...all].ts
```

---

## 8. Gotchas / hal yang mudah bikin bingung

1. **Astro 7:** `output: 'hybrid'` **sudah dihapus**. Pakai `output: 'static'` + `prerender=false` per route (sekarang public SSR).
2. **`getStaticPaths` dev caching:** dulu bikin data baru 404 di dev. Sekarang public sudah SSR; tidak relevan.
3. **Zod `.partial()` mewarisi `.default()`** → PATCH parsial pernah menimpa `status/techStack/highlights/links`. **Sudah diperbaiki** dengan memfilter hanya key yang dikirim (`src/pages/admin/api/portfolio/[id].ts`). Jangan hapus filter itu.
4. **`astro:env` types** digenerate saat build. Setelah menambah env var baru, `pnpm typecheck` bisa gagal sampai `pnpm build` dijalankan sekali.
5. **Script Node** (`db/seed.ts`, dll.) membaca `.env.local` via `dotenv.config({ path: ['.env.local','.env'] })` — jangan ganti ke `import 'dotenv/config'` (hanya `.env`).
6. **better-auth di workerd:** `optimizeDeps.exclude: ['better-auth', '@neondatabase/serverless', 'drizzle-orm']` di `astro.config.mjs` — jangan dihapus.
7. **Cloudinary:** preset `ml_default` (Signed). Upload lewat `/auto/upload`; signed params dari `/admin/api/assets/sign-upload`. Hapus asset dari admin = **soft delete DB saja** (objek Cloudinary belum dihapus) → TODO.
8. **Cache publik 60s:** perubahan DB tidak langsung jika URL sama. Gunakan `?v=timestamp` untuk melihat instan (response `x-cache: BYPASS`).
9. **Deploy:** `pnpm build` → `pnpm exec wrangler deploy`. `wrangler deploy` **tidak** build. Sitemap sekarang SSR, jadi build tidak lagi merender halaman yang query DB (CI tetap menyuplai `DATABASE_URL` untuk env schema).
10. **Login di workers.dev** sudah diizinkan via trusted origins; cookie host-only.
11. **Sanity** sudah dihapus dari kode/deps. Project Sanity (`exvebwem`) masih ada di cloud tapi tidak dipakai; token tidak disimpan.
12. **Jangan** taruh `BETTER_AUTH_SECRET`/API secret di `wrangler.jsonc` vars.
13. **Jangan jalankan `pnpm build` saat `pnpm dev` hidup** — dev server (workerd) bisa korup dan semua route jadi 500 (`fetch failed`). Kalau terjadi: `pnpm exec astro dev stop` lalu `pnpm dev` lagi.
14. **`/preview/*` wajib login**; kalau tidak, middleware redirect ke `/admin/login?redirect=...`. Jangan hapus guard ini (draft bisa bocor).
15. **Form login admin harus submit via `fetch`** ke `/api/auth/sign-in/email` (JSON), bukan `<form method="post" action=...>` native — native POST akan mendarat di response JSON Better Auth, bukan redirect ke `/admin`.
16. **Halaman login pakai `AuthLayout`** (tanpa sidebar/navbar admin). Jangan ganti balik ke `AdminLayout`.
17. **`profile.cv_url`** (migrasi `0001_*`) = satu sumber URL CV untuk tombol Resume desktop dan mobile. Edit lewat `/admin/profile`.
18. **Activities editable** lewat tombol Edit di `/admin/activities` (PATCH). PATCH memfilter key yang dikirim agar `order`/`highlights` tidak ter-reset default Zod.
19. **Profile PUT di-merge dengan row existing** — jangan kembalikan ke `upsertProfile(parsed)` langsung, karena form hanya mengirim sebagian field (experience/education/stats bisa hilang).
20. **Sidebar admin collapsible** (desktop): state di `localStorage['admin-sidebar']`, kelas `sidebar-collapsed` di `<html>`. Judul dokumen memakai **Ridwan Pages**; brand sidebar **ridwanafazn**.
21. **Urutan project** diubah lewat drag & drop di `/admin/portfolio` (endpoint `POST /admin/api/portfolio/reorder`, body `{ ids: string[] }`). Drag hanya aktif saat filter **Semua**; kolom `order` tidak ditampilkan.
22. **Pengalaman** diedit di `/admin/profile` (tambah/hapus/seret urutan). Urutan array = urutan tampil di `/about`; disimpan saat form disubmit.
23. **Dashboard** memakai grid stat + aksi cepat; tombol `+ Project` di header sudah dihapus (buat project dari halaman Portfolio atau aksi cepat).

---

## 9. TODO / next steps

### Wajib untuk go-live domain
1. Cloudflare Dashboard → **Add site** `ridwanafazn.my.id` → ganti NS di registrar (`dnscloud.id`) ke NS Cloudflare.
2. Setelah zone **Active**:
   - Tambahkan **Workers → Custom Domains**: `ridwanafazn.my.id` (+ `www`).
   - Hapus `public/CNAME`.
   - Disable **GitHub Pages** di repo settings.
   - Verifikasi HTTPS/HSTS, login admin di domain baru.
3. (Opsional) Redirect `www` → apex.

### Konten
4. Upload gambar via `/admin/assets`, lalu edit project → pilih **cover** + **galeri** (urutan klik = urutan tampil).
5. Ganti `ADMIN_PASSWORD` produksi (seed ulang user/account atau update via Better Auth).
6. URL CV diatur di `/admin/profile` → kolom `profile.cv_url`. Satu nilai dipakai tombol Resume desktop dan mobile.

### Engineering (opsional)
6. Hapus objek Cloudinary saat asset dihapus (panggil `image/destroy`).
7. Rate limit login (KV `RATE_LIMIT`), CSP/HSTS headers.
8. Block editor (Fase 3) & page builder `/`/`/about` (Fase 4) — saat ini flat fields.
9. OG image dinamis + JSON-LD.
10. Git: **belum ada commit** di branch `migrate/astro-ssr-neon`; commit semua + tag `sanity-era` (di commit sebelum migrasi) / `v2.0.0`.

---

## 10. Command cheatsheet

```bash
pnpm dev                 # dev (workerd)
pnpm build               # build (butuh DATABASE_URL)
pnpm preview             # preview build
pnpm deploy              # wrangler deploy
pnpm typecheck           # tsc --noEmit
pnpm db:generate         # migrasi SQL
pnpm db:migrate          # apply ke Neon
pnpm db:studio           # drizzle studio
pnpm db:seed             # admin + sample

# Cloudflare
pnpm exec wrangler secret list
pnpm exec wrangler secret bulk .secrets.json
pnpm exec wrangler deployments list
pnpm exec wrangler rollback
pnpm exec wrangler tail
pnpm exec wrangler kv namespace list

# Neon
neon status
neon branches list
neon connection-string --pooled
neon projects list
```

---

## 11. Riwayat singkat keputusan

1. **Astro 7 static + Sanity** → pindah ke **Neon + Cloudinary + Workers**.
2. Auth: Lucia/argon2 **tidak** dipakai → **Better Auth + scrypt**.
3. Deploy: Cloudflare **Pages tidak didukung** adapter v14 → **Workers**.
4. Data: migrasi Sanity → Neon (10 project, profile, skills, 2 activities).
5. Admin panel dibangun bertahap (CRUD → media → galeri → UX).
6. Public pages: static → **SSR + edge cache** agar edit langsung tampil.
7. Sanity dihapus total (deps, studio, kode, script).
8. Deploy ke Workers + 5 secrets + KV SESSION.

Detail kronologis: `docs/MIGRATION_LOG.md`.
