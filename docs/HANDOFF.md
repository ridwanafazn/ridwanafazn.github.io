# HANDOFF — Current State Snapshot
> **Terakhir diperbarui:** 2026-11-15
> **Tujuan:** agar sesi/agent baru bisa lanjut tanpa menggali ulang.
> **Jangan taruh secret di file ini.** Semua kredensial ada di `.env.local` (gitignored) / Cloudflare secrets.

---

## 1. Ringkasan 1 paragraf

Portfolio pribadi (`portofx-v2`) sudah **migrasi total dari Sanity ke Neon Postgres + Cloudinary**, punya **admin panel custom** (CRUD project + upload asset), **public pages SSR dengan edge cache 60 detik**, dan **live di Cloudflare Workers pada `https://ridwanafazn.my.id`** (`www` → 301 apex; GitHub Pages sudah dilepas). Sisa: **cover image project — 0 dari 13 project punya cover**; galeri sudah terisi 54 foto.

---

## 2. Status deploy & URL

| Item | Nilai |
|---|---|
| **Live (canonical)** | https://ridwanafazn.my.id |
| **Fallback** | https://portofx-v2.ridwanafazn.workers.dev |
| **Worker name** | `portofx-v2` |
| **Versi terakhir** | `d4855a69-b15a-405a-80b9-0c266829f9b2` (deploy 2026-11-11 06:05 UTC; cek ulang: `wrangler deployments list`) |
| **Akun Cloudflare** | `491877dfe9bd12e5bce536e6da18da15` (ridwanafzn@gmail.com) |
| **KV SESSION** | `0caf957ffab8428687ada2d8bef1e809` |
| **Custom domain** | `ridwanafazn.my.id` + `www` (Workers Custom Domain, sertifikat aktif) |
| **DNS** | NS Cloudflare `bart` + `keira`; apex & `www` proxied ke Worker; record GitHub Pages sudah dihapus |
| **Admin login** | `https://ridwanafazn.my.id/admin/login` |
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

### Isi database (diverifikasi 2026-11-15)
| Tabel | Jumlah |
|---|---|
| portfolios | **13** (semua `published`) |
| cover terpasang (`cover_image_id`) | **0 dari 13** ⚠️ |
| gambar galeri (total baris) | **54** |
| featured (`is_top_project`) | 3 — `neuroplastisism`, `smile-fest`, `jymz` |
| activities | 2 |
| profile | 1 |
| skills | 1 (4 kategori) |
| assets | **55** (bukan 1) |
| users/accounts | 1 (admin) |

Slug project (13, urutan tampil + jumlah foto galeri):
`neuroplastisism` (20), `zledger` (10), `arta` (0), `sela` (0), `open-house` (4), `smile-fest` (5), `jymz` (4), `vessel` (0), `orchestrix` (0), `zenithxzn` (0), `maqdis-travel` (0), `nourishify` (0), `bakerman` (11).

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
10. **Domain kanonik** `ridwanafazn.my.id` (cookie host-only). Login admin di domain ini; `www` di-redirect 301 di middleware sebelum auth. workers.dev tetap di trusted origins sebagai fallback.
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
24. **Admin styling sharp**: tidak ada `rounded-*`, tanpa backdrop blur, transisi 150ms (color/opacity), tanpa hover translate. Jangan tambahkan kembali komponen rounded di area admin.
25. **Multi-upload asset**: `/admin/assets` menerima banyak file sekaligus (input `multiple` + drag & drop), upload paralel maks 3, signature Cloudinary diminta sekali per batch, progress bar + daftar error per file.
26. **Galeri project**: transform Cloudinary `c_limit,w_1600,q_auto,f_auto` (rasio asli, bukan resolusi penuh). Layout **slider Play Store style** (`.gallery-track` + `.gallery-item`, scroll-snap per kartu, lebar `clamp(15rem,38vw,21rem)`), tanpa scrollbar bawaan; tombol prev/next dengan state disabled + progress bar tipis. Tile `aspect-[16/10] object-cover` supaya ringkas. Caption = nama file tanpa ekstensi, teks polos tanpa background. Klik gambar membuka lightbox blur dengan counter + prev/next + keyboard (Escape/←/→); klik area luar gambar menutup. Dirender lewat slot `overlay` di `Layout` agar menutup navbar. Navbar publik memakai frosted glass (`backdrop-blur-md`). Urutan halaman: cover → galeri → ringkasan. Cover dibatasi `max-h-[250px]` (mobile) / `max-h-[360px]` (desktop).
27. **Middleware cache juga jalan di dev.** HTML publik di-cache 60s oleh `caches.default` (kunci tanpa query string). Setelah edit komponen, request biasa masih mengembalikan HTML **lama**. Selalu buka dengan `?v=<timestamp>` saat verifikasi dev (atau tunggu 60 dtk). Ini bukan bug produksi — `?v=` memang bypass.
28. **Navbar scroll-state** memakai atribut `[data-scrolled]` + aturan CSS unlayered di akhir `global.css`. Jangan pindahkan aturan itu ke dalam `@layer utilities` — utility Tailwind (`bg-background/70`) akan menang dan navbar tidak pernah solid.

### Fase A revamp — SELESAI (2026-11-15)
- Font self-host: Bricolage Grotesque (display) + Public Sans (UI) + JetBrains Mono, 3 file WOFF2 (~97 KB), preload.
- Palet baru: mineral `#E4E6E1`, tinta `#111110`, aksen verdigris `#2C6558`.
- Material Symbols dihapus dari public → `src/components/Icon.astro` (inline SVG, `aria-hidden`).
- Reveal progressive (tanpa JS tetap terlihat), `prefers-reduced-motion` untuk reveal/hero/count-up.
- `lang="id"`, skip-link, `:focus-visible` global, meta description + OG/Twitter + canonical.
- Mono 8–10px → 12px, `text-justify` dihapus, kicker di atas heading dihapus.
- Hasil: Lighthouse **100 a11y / 100 BP / 100 SEO** di `/`, `/about`, `/projects`, `/projects/[slug]`, `/admin/login`; `impeccable detect` homepage = **0 anti-pattern**.

### Fase B revamp — SELESAI (2026-11-16)
- Hero asimetris 7/5 + strip spesifikasi (Fokus / Sejak / Stack / Kontak); StatBar count-up dihapus.
- `/projects` carousel → **ProjectLedger**: 13 baris berindeks (01–13), role + 3 stack, tanpa gambar.
- Homepage featured → 3 baris ledger (tanpa indeks).
- Globe: `three` dipindah ke `src/scripts/hero-globe.ts`, **dynamic import** hanya ≥1024px setelah idle. Di <1024 canvas `display:none`; texture 420 KB + 139 KB JS tidak lagi diunduh mobile.
- `ClientRouter` + `view-transition-name` `project-<slug>` di judul (ledger → detail); navbar `transition:persist`.
- Browser surfaces: scrollbar, caret, selection, tabular numerals.
- Komponen dihapus: `ProjectCard.astro`, `StatBar.astro`; CSS carousel dihapus dari `global.css`.
- `impeccable detect`: homepage 0, `/about` 0, `/projects` 0 (sisa 3 advisory nomor proses di HowIBuild).

### Fase C revamp — SELESAI (2026-11-16)
- Detail proyek jadi case study: h1 + **meta plate** (Peran / Stack / Tautan) menggantikan eyebrow + chip tengah + tombol tengah.
- Narasi dari `longDescription` dengan penanda `## Heading` (parser di halaman). Tanpa `##` tetap tampil sebagai "Ringkasan".
- `highlights` dirender sebagai **Hasil** (daftar bergaris), bukan checklist ikon.
- Galeri: slider → **grid 6 gambar** + tombol "Lihat semua N gambar" (lightbox membaca JSON `#gallery-data`, 20 gambar tetap bisa dinavigasi).
- Gambar galeri: `srcset` `w_480/800/1600` + `sizes` (tile 30vw, mobile 46vw). Lightbox pakai `w_1600`.
- Cover: 16/9 lebar (`md:-mx-6 lg:-mx-12`), **hanya jika `coverImage` ada**.
- **Next project** di akhir halaman.
- `line-length` diperbaiki (`max-w-[68ch]`), `edge-flush-cards` & eyebrow hilang.
- Debt: `/preview/portfolio/[slug]` belum ikut layout baru; ekstrak komponen bersama saat menyentuh preview.

### Fase D revamp — SELESAI (2026-11-16)
- **404** khusus: `src/pages/404.astro` (SSR, `noindex`, tautan beranda + arsip).
- **OG image**: `scripts/generate-og.mjs` → `public/og.svg` + `public/og.png` (1200×630, 29 KB). Halaman utama memakai `/og.png`; halaman proyek memakai `ogImage` Cloudinary (`c_fill,w_1200,h_630,g_auto`) dari cover → gambar galeri pertama.
- **JSON-LD** `Person` di homepage (name, jobTitle, sameAs, email).
- **Hover preview ledger** (desktop, `(hover:hover) and (pointer:fine)`): gambar `w_480` mengikuti kursor, `pointer-events-none`, tanpa impact mobile.
- **Skill proyek**: `.opencode/skills/portfolio-design/SKILL.md` — token, larangan, struktur, checklist. Aktif otomatis untuk sesi agent berikutnya.
- Catatan: cover tetap 0/13, jadi 7 project belum punya preview/OG image sampai cover diisi.

### Polish pass — material visual (2026-11-16)
Memakai aset yang sudah ada (54 gambar galeri), tanpa isian baru:
- **Lead image** di halaman proyek: `coverImage ?? gallery[0]` (16/9, `fetchpriority=high`). Galeri grid otomatis mulai dari gambar ke-2 agar tidak duplikat.
- **Evidence band** di homepage: 3 screenshot asli (satu per featured project, ambil gambar ke-5 agar bukan halaman login) + caption + tautan. Full-bleed di mobile.
- **Thumbnail ledger**: 56×36 untuk 6 project yang punya gambar; 7 sisanya dapat slot kosong bergaris (konsisten). Row turun dari 72px → 65px.
- Hasil: 3 halaman tetap 100/100/100; `impeccable detect` 0 temuan.
- **Revisi galeri (2026-11-16):** grid 6 + "lihat semua" diganti **slider Play Store**: `scroll-snap x mandatory`, `scroll-snap-stop: always`, item terakhir `snap-align: end`, `overscroll-behavior-x: contain`. Tombol prev/next disabled di ujung, progress bar tipis, panah keyboard. Lightbox tetap; slide pertama membuka indeks 2 (lead image = indeks 1, tidak diduplikasi).

---

## 9. TODO / next steps

### Go-live domain — SELESAI (2026-11-12)
1. ✅ Zona `ridwanafazn.my.id` aktif di Cloudflare (NS `bart` + `keira`; registrar **idcloudhost**).
2. ✅ Workers Custom Domain: `ridwanafazn.my.id` + `www.ridwanafazn.my.id`.
3. ✅ `public/CNAME` dihapus; custom domain GitHub Pages dilepas (`cname: null`) + workflow deploy di-disable.
4. ✅ `www` → apex 301 (middleware); login admin diverifikasi di domain baru.
5. ⚠️ Sisa: ganti password admin sementara.

### Konten
1. **Cover image**: upload via `/admin/assets`, lalu edit project → pilih **cover**. Sekarang **0/13** punya cover, jadi kartu project di `/projects` tampil tanpa gambar. Galeri sudah terisi (54 foto).
2. Ganti `ADMIN_PASSWORD` produksi (seed ulang user/account atau update via Better Auth).
3. URL CV diatur di `/admin/profile` → kolom `profile.cv_url`. Satu nilai dipakai tombol Resume desktop dan mobile.

### Engineering (opsional)
1. Hapus objek Cloudinary saat asset dihapus (panggil `image/destroy`).
2. Rate limit login — **belum ada**; KV hanya punya binding `SESSION` (tidak ada namespace `RATE_LIMIT`). CSP/HSTS juga belum.
3. Block editor (Fase 3) & page builder `/`/`/about` (Fase 4) — saat ini flat fields.
4. **SEO belum lengkap**: tidak ada `meta description`, OG/Twitter card, canonical, JSON-LD. Lighthouse SEO = 80. Belum ada `src/pages/404.astro`.
5. Git: branch `migrate/astro-ssr-neon` **sudah selesai & di-merge**; sekarang `main`, 20 commit, working tree bersih. Tag `sanity-era` / `v2.0.0` masih belum dibuat.
6. **Fondasi UI/UX**: `docs/DESIGN.md` sudah dikoreksi ke kondisi aktual — pakai itu sebagai acuan sebelum restyle.

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
4. Data: migrasi Sanity → Neon (13 project saat ini; 20 commit di `main`).
5. Admin panel dibangun bertahap (CRUD → media → galeri → UX).
6. Public pages: static → **SSR + edge cache** agar edit langsung tampil.
7. Sanity dihapus total (deps, studio, kode, script).
8. Deploy ke Workers + 5 secrets + KV SESSION.
9. Domain `ridwanafazn.my.id` live (2026-11-12); `www` → 301 apex di middleware.
10. Agent tooling: skill `impeccable` (skills.sh) dipasang di `.opencode/` (2026-11-15).

Detail kronologis: `docs/MIGRATION_LOG.md`.
