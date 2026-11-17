# HANDOFF — Current State Snapshot
> **Terakhir diperbarui:** 2026-11-16
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
| **Fallback** | https://portofx-v2.ridwanafzn.workers.dev |
| **Worker name** | `portofx-v2` |
| **Versi produksi** | manual terakhir `7c01fdaf-b5ac-4767-b3aa-a3fe688fe70a`; **sumber kebenaran** `wrangler deployments status`. CI hanya build/typecheck — step deploy **skipped** selama secret `CLOUDFLARE_API_TOKEN` belum di-set. |
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

- **Cache publik:** `/`, `/about`, `/projects*`, `/sitemap.xml` → `max-age=60, s-maxage=60, stale-while-revalidate=300` + `x-cache: HIT|MISS|BYPASS`. Kunci cache tanpa query string agar `?utm_*` tidak memecah cache. **`?v=` hanya bypass saat dev**; di produksi diabaikan (cegah cache-busting/DoS).
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
  components/ProjectLedger.astro      # daftar proyek + thumbnail + hover preview
  components/Icon.astro               # inline SVG (tanpa icon font)
  components/HeroGlobe.astro          # globe three.js (dynamic import, ≥1024px)
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
8. **Cache publik 60s:** perubahan DB tidak langsung jika URL sama. Di dev gunakan `?v=timestamp` (response `x-cache: BYPASS`); di produksi `?v=` **diabaikan**, tunggu ≤60 dtk atau hard refresh.
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
27. **Middleware cache juga jalan di dev.** HTML publik di-cache 60s oleh `caches.default` (kunci tanpa query string). Setelah edit komponen, request biasa masih mengembalikan HTML **lama**. Di dev buka dengan `?v=<timestamp>` (bypass); di produksi `?v=` diabaikan.
28. **Navbar scroll-state** memakai atribut `[data-scrolled]` + aturan CSS unlayered di akhir `global.css`. Jangan pindahkan aturan itu ke dalam `@layer utilities` — utility Tailwind (`bg-background/70`) akan menang dan navbar tidak pernah solid.
29. **Browser Cache TTL Cloudflare = `0` sejak 2026-11-16.** Sebelumnya `14400`, sehingga setiap response `CF-Cache-Status: HIT` membawa `max-age=14400` (4 jam): browser pengunjung menahan HTML lama sampai 4 jam, dan HTML lama itu bisa menunjuk aset ber-hash yang sudah tidak ada setelah deploy. Dengan `0` (“Respect Existing Headers”), HTML memakai `max-age=60` dari `src/middleware.ts`; aset ber-hash tetap `max-age=31536000, immutable`. Pengunjung yang sudah terlanjur menyimpan salinan 4 jam tidak bisa dipaksa update (purge Cloudflare tidak menyentuh browser) — hard refresh atau tunggu kedaluwarsa.
30. **Globe tidak boleh melempar error.** Semua jalur gagal (WebGL tidak ada, renderer gagal, tekstur 404, `webglcontextlost`) harus berakhir di `data-failed`. Jangan hapus cek `webglAvailable()` / `try/catch` renderer; kalau dihapus, satu GPU bermasalah membuat unhandled rejection dan halaman terlihat setengah jadi.
31. **`prefers-reduced-motion` mematikan rotasi globe**, bukan memperlambat. Kalau ingin mengubah perilaku, ubah `syncMotion()` di `src/scripts/hero-globe.ts` — jangan menambah `ROTATION_SPEED` baru yang selalu jalan.
32. **OG image selalu dirender** oleh `Layout.astro` dengan default `/og.png`. Jangan kembalikan ke conditional `ogImage && ...`; project tanpa cover/galeri akan kehilangan kartu share.
33. **Canonical hanya untuk halaman indexable.** `Layout` melewatkan `<link rel="canonical">` bila `noindex` (404/500/preview). Jangan menambahkan canonical manual di halaman error — itu menyuruh Google mengindeks halaman yang justru dilarang.
34. **`getProjectById` mengembalikan `null` untuk slug tidak ada**, bukan throw. Throw hanya untuk kegagalan DB supaya tampil 500. Jangan kembalikan `throw` untuk not-found: nanti semua error database berubah jadi 404 palsu.
35. **Data publik kosong bukan error.** `getAllProjects`/`getSkills`/`getActivities` boleh `[]`; `getTopProjects` fallback ke 3 project teratas. Halaman wajib punya empty state, bukan asumsi minimal 1 baris.
36. **CSP punya allowlist** di `contentSecurityPolicy()` (`src/middleware.ts`). Script/style eksternal, font, atau iframe baru harus ditambahkan ke situ. `'unsafe-inline'` disengaja untuk inline script Astro; jangan hapus tanpa memberi nonce/hash.
37. **Rate limit login** = binding `LOGIN_RATE_LIMIT` (10/60 dtk per IP, `wrangler.jsonc`). Middleware fail-open; Better Auth memakai `cf-connecting-ip` lewat `advanced.ipAddress`. Jangan hapus binding saat mengubah Worker.
38. **`import.meta.env.DEV` salah di dev Cloudflare** (`false` karena `NODE_ENV=production`). Untuk percabangan dev pakai `import.meta.env.MODE === 'development'`. Kalau memakai `DEV`, bypass `?v=` mati dan CSP dev memakai aturan produksi.
39. **`astro:env` server `access: 'public'` di-inline saat build.** Nilai dari `.env.local` ikut masuk ke bundle produksi, jadi jangan dipakai untuk konfigurasi yang berbeda per environment (URL, trusted origins). Gunakan `access: 'secret'` agar dibaca dari Worker env saat runtime. Ini penyebab bug “Invalid origin” 2026-11-16.

### Fase A revamp — SELESAI (2026-11-15)
- Font self-host: Bricolage Grotesque (display) + Public Sans (UI) + JetBrains Mono, 3 file WOFF2 (~97 KB), preload.
- Palet baru: mineral `#E4E6E1`, tinta `#111110`, aksen verdigris `#2C6558`.
- Material Symbols dihapus dari public → `src/components/Icon.astro` (inline SVG, `aria-hidden`).
- Reveal progressive (tanpa JS tetap terlihat), `prefers-reduced-motion` untuk reveal/hero/spec-cell.
- `lang="id"`, skip-link, `:focus-visible` global, meta description + OG/Twitter + canonical.
- Mono 8–10px → 12px, `text-justify` dihapus, kicker di atas heading dihapus.
- Hasil: Lighthouse **100 a11y / 100 BP / 100 SEO** di `/`, `/about`, `/projects`, `/projects/[slug]`, `/admin/login`; `impeccable detect` homepage = **0 anti-pattern**.

### Fase B revamp — SELESAI (2026-11-16)
- Hero asimetris 7/5 + strip spesifikasi (Fokus / Sejak / Stack / Kontak); StatBar count-up dihapus.
- `/projects` carousel → **ProjectLedger**: 13 baris berindeks (01–13). Thumbnail ditambahkan pada polish pass.
- Homepage featured → 3 baris ledger (tanpa indeks).
- Globe: `three` dipindah ke `src/scripts/hero-globe.ts`, **dynamic import** hanya ≥1024px setelah idle. Di <1024 canvas `display:none`; texture 420 KB + 139 KB JS tidak lagi diunduh mobile.
- `ClientRouter` + `view-transition-name` `project-<slug>` di judul (ledger → detail); navbar `transition:persist`. **Kemudian dilepas** (lihat F1/MPA) karena view transition abort di mobile.
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
- `line-length` diperbaiki (sekarang `max-w-[60ch]`; `68ch` masih menghasilkan ~89 karakter per baris di Public Sans), `edge-flush-cards` & eyebrow hilang.
- Debt: `/preview/portfolio/[slug]` belum ikut layout baru; ekstrak komponen bersama saat menyentuh preview.

### Fase D revamp — SELESAI (2026-11-16)
- **404** khusus: `src/pages/404.astro` (SSR, `noindex`, tautan beranda + arsip).
- **OG image**: `scripts/generate-og.mjs` → `public/og.svg` + `public/og.png` (1200×630, 29 KB). Halaman utama memakai `/og.png`; halaman proyek memakai `ogImage` Cloudinary (`c_fill,w_1200,h_630,g_auto`) dari cover → gambar galeri pertama.
- **JSON-LD** `Person` di homepage (name, jobTitle, sameAs, email).
- **Hover preview ledger** (desktop, `(hover:hover) and (pointer:fine)`): gambar `w_480` mengikuti kursor, `pointer-events-none`, tanpa impact mobile.
- **Skill proyek**: `.opencode/skills/portfolio-design/SKILL.md` — token, larangan, struktur, checklist. Aktif otomatis untuk sesi agent berikutnya.
- Catatan: cover tetap 0/13, jadi 7 project belum punya preview/OG image sampai cover diisi. Sejak F3, project tanpa gambar memakai OG default `/og.png`.

### Pilot palette olive + orange — BRANCH (2026-11-17)
- Branch `design/olive-orange-pilot`, belum di-merge/deploy.
- Token: kertas `#E2E5D6`, ink `#17180F`, olive `#4F5638` (struktur), orange `#C2410C` (signal), teks orange `#A8360E`, olive-soft `#C3C8A9` untuk permukaan gelap. Kertas sengaja hijau (G > R) agar tidak terbaca cream.
- Diterapkan: `global.css` (token, focus ring, selection, caret, nav progress), Navbar (underline aktif, CTA Hire Me), hero (titik orange pada h1), link section, panah ledger saat hover, border atas HowIBuild, tint globe olive.
- `FloatingNav` dilepas dari homepage: dot-nya menimpa panah ledger di layar <768px. Komponen tetap ada di repo.
- Ledger: kotak thumbnail kosong tidak lagi digambar (hanya border kalau ada `previewImage`).
- Baris narasi case study `max-w-68ch` → `60ch`; 68ch terbukti menghasilkan ~89 karakter per baris.
- `impeccable detect`: 0 anti-pattern di `/`, `/projects`, `/about`, `/projects/zledger` (desktop 1280 dan mobile 390), sisa 3 advisory nomor HowIBuild.
- Kontras: muted 5.8:1, olive 6.1:1, `signal-strong` 5.2:1, putih di `signal` 5.18:1.
- Belum: cover 0/13, rewrite `/about`, diagram per project.

### Polish footer — SELESAI (2026-11-16)
- “Built with Astro” disembunyikan di `max-width: 767px` (`hidden md:inline`), sehingga baris copyright di mobile tetap satu baris. Di desktop teks tetap tampil.

### Polish ledger — SELESAI (2026-11-16)
- Kolom stack di `/projects` dibatasi **2 item pertama + `+N`** (sebelumnya 3 item lalu terpotong “…”). Lebar kolom stack 13rem → 14rem; `+N` tidak ikut terpotong (`shrink-0`), nama item di-truncate hanya bila benar-benar panjang.
- `title` berisi daftar stack lengkap untuk hover; halaman detail tetap menampilkan seluruh stack.

### Perbaikan login “Invalid origin” — SELESAI (2026-11-16)
- **Gejala**: login admin gagal dengan `Invalid origin` meski URL `https://ridwanafazn.my.id`. Request **tanpa cookie** lolos (origin check dilewati), request **dengan cookie** (sesi lama) ditolak.
- **Akar masalah**: `BETTER_AUTH_URL` dan `AUTH_TRUSTED_ORIGINS` dideklarasikan `astro:env` server dengan `access: 'public'`. Astro **meng-inline nilai build-time**; karena build memakai `.env.local`, Worker produksi berisi `http://localhost:4321` dan `http://192.168.100.12:4321`, bukan domain apex.
- **Perbaikan**: kedua variabel diubah ke `access: 'secret'` (dibaca runtime dari Worker env). Chunk `auth_*.mjs` tidak lagi memuat `localhost`; produksi memakai `wrangler.jsonc` vars.
- **Verifikasi**: dengan cookie + `Origin: https://ridwanafazn.my.id` → `401 Invalid email or password` (bukan 403 origin); `Origin: https://evil.example` → `403 Invalid origin`. Cookie lama pengguna tidak perlu dihapus; login ulang berhasil.

### Hardening F5 — SELESAI (2026-11-16)
- **Security headers** di semua response (middleware): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation/payment/usb off), `X-Frame-Options: DENY`.
- **CSP moderat**: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri/form-action 'self'`, `script-src 'self' 'unsafe-inline'` + `static.cloudflareinsights.com` (Web Analytics zona aktif), `img-src` Cloudinary, `connect-src` Cloudinary upload + `cloudflareinsights.com`, `upgrade-insecure-requests` hanya di HTTPS. Tidak ada iframe/object.
- **HSTS**: `Strict-Transport-Security: max-age=15552000` (180 hari), tanpa `includeSubDomains`/`preload`, hanya dikirim lewat HTTPS.
- **Cache privat**: `/admin`, `/preview`, `/api` → `Cache-Control: no-store` + `Pragma: no-cache`.
- **Rate limit login**: binding Workers `LOGIN_RATE_LIMIT` (10 permintaan / 60 dtk per IP) untuk `POST /api/auth/sign-in/email` dan `/sign-up/email`; respons 429 JSON + `Retry-After: 60`. Fail-open bila binding error agar admin tidak terkunci.
- **Better Auth IP**: `advanced.ipAddress.ipAddressHeaders = ['cf-connecting-ip','x-forwarded-for']` — sebelumnya rate limit internal memakai satu bucket global (bisa mengunci semua user).
- **Dev detection diperbaiki**: `import.meta.env.DEV` ternyata `false` di dev Cloudflare (karena `NODE_ENV=production` dari `wrangler.jsonc`), sehingga bypass `?v=` tidak pernah aktif. Sekarang memakai `MODE === 'development'`; `?v=` kembali `x-cache: BYPASS`.
- **workers.dev** tetap dipertahankan sebagai fallback (tidak di-disable).
- Verifikasi lokal: CSP tanpa pelanggaran di `/`, `/projects/zledger`, `/admin/login`; login ke-11 dalam 60 dtk → 429 pesan Indonesia; header HSTS tidak muncul di HTTP dev.
- Verifikasi produksi: semua header tampil di `/` dan 404 (`Strict-Transport-Security`, `Content-Security-Policy`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`); `/admin/login` → `Cache-Control: no-store` + `Pragma: no-cache`; beacon `static.cloudflareinsights.com` dimuat tanpa error console; `?v=` di produksi tetap diabaikan (`x-cache: HIT`); Lighthouse 100/100/100 di `/`, `/projects`, `/projects/zledger`.
- Binding `LOGIN_RATE_LIMIT` terkonfirmasi saat deploy (`env.LOGIN_RATE_LIMIT (10 requests/60s)`). Rate limit **tidak** diuji dengan 11 request di produksi agar IP admin tidak terkunci 60 dtk; perilaku identik sudah diuji di dev dengan binding yang sama.

### Hardening F4 — SELESAI (2026-11-16)
- **Canonical hanya untuk halaman indexable.** `Layout` tidak lagi merender `<link rel="canonical">` saat `noindex` (404, 404 project, 500, preview). `og:url` tetap memakai URL halaman.
- **Halaman 500 khusus** (`src/pages/500.astro`, `noindex`): error SSR/DB menampilkan pesan yang bisa dibaca, bukan halaman default Astro.
- **Data kosong tidak 500**: `getAllProjects`/`getSkills`/`getActivities` mengembalikan `[]`; `getTopProjects` jatuh ke 3 project teratas bila belum ada yang featured.
- **404 vs 500 dipisah**: `getProjectById` mengembalikan `null` untuk slug tidak ada (→ 404); error DB tetap dilempar (→ 500), tidak lagi disamarkan menjadi 404.
- **Empty state** di `/projects`, featured homepage, Tech Stack, dan Volunteering.
- **Sitemap tahan gangguan**: bila DB gagal, sitemap tetap mengirim 3 URL statis (bukan 500) dan nilai `<loc>` di-escape XML.
- **Stack hero tetap editorial** (`FE·BE·Cloud·Mobile·AI·ML`) sesuai keputusan desain; yang data-driven adalah section Tech Stack dan stack per project.

### Perbaikan Browser Cache TTL — SELESAI (2026-11-16)
- Zona Cloudflare `ridwanafazn.my.id`: `browser_cache_ttl` `14400` → **`0`** (“Respect Existing Headers”), diubah via API (bukan dashboard). Ini satu-satunya perubahan yang tidak lewat deploy Worker.
- Efek: response HTML `CF-Cache-Status: HIT` kini `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=300` (sebelumnya `max-age=14400`). Edge tetap 60 dtk; aset `/_astro/*` tetap `max-age=31536000, immutable`; font tetap `max-age=0, must-revalidate` (tidak berubah).
- Cache HTML di-purge sekali (17 URL) agar header baru langsung terpakai.
- Batasan: browser yang sudah menyimpan HTML 4 jam sebelum perubahan tidak bisa dipaksa update — purge Cloudflare tidak menyentuh cache browser. Kunjungan baru/hard refresh langsung mendapat 60 dtk.

### Hardening F3 — SELESAI (2026-11-16)
- **Globe tanpa WebGL**: cek konteks dulu (`webgl2`/`webgl`); kalau tidak ada, renderer gagal dibuat, tekstur gagal dimuat, atau konteks hilang (`webglcontextlost`), wrap diberi `data-failed` (CSS `display:none`) dan loop render dihentikan. Tidak ada error/unhandled rejection di halaman.
- **`prefers-reduced-motion`**: rotasi otomatis globe **berhenti total** (sebelumnya hanya diperlambat 3×). Globe tetap bisa diputar manual; perubahan pref OS ditangani lewat listener `change`.
- **Render dijeda** saat tab tidak terlihat (`document.hidden`) atau globe di luar viewport.
- **OG image selalu ada**: `Layout` memakai `/og.png` (1200×630) sebagai default. 7 project tanpa cover & galeri (`sela`, `arta`, `vessel`, `orchestrix`, `zenithxzn`, `maqdis-travel`, `nourishify`) kini tetap punya kartu share; `og:image:alt` diisi judul.
- **Lightbox bersih**: overlay tidak dirender sama sekali jika project tidak punya gambar (`#lightbox` absen, tidak ada dialog kosong / `src` undefined). Project bergambar tetap memakai focus trap + `inert`.
- **Catatan**: cover tetap 0/13, jadi 7 project tetap tanpa thumbnail ledger/lead image — hanya kartu share-nya yang kini jatuh ke `/og.png`.

### Hardening F1 + F2 — SELESAI (2026-11-16)
- **Trailing slash** → 301 ke URL tanpa slash (middleware), supaya canonical & cache konsisten.
- **`?v=` bypass hanya di dev** (`import.meta.env.DEV`); produksi tidak bisa dipaksa origin render.
- **Nav tanpa JavaScript**: `<noscript>` berisi link Home/About/Projects/Email (mobile), dan hamburger disembunyikan saat `html:not(.js)`.
- **Focus management**: menu & lightbox memindahkan fokus saat dibuka, mengunci Tab, mengembalikan fokus saat ditutup, dan memakai `inert` pada konten di belakang overlay.
- **bfcache**: `pageshow` (persisted) menutup menu dan melepas scroll lock.
- **Cache-Control** kini menyertakan `max-age=60`. Cloudflare zone dulu menimpanya jadi 4 jam; **sudah diperbaiki** dengan `browser_cache_ttl: 0` (lihat gotcha 29).
- **Bersih-bersih sisa ClientRouter**: atribut `transition:name` di ledger/detail dihapus, style `view-transition` tidak lagi dirender. `theme-color` diperbaiki ke `#E4E6E1`.

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
