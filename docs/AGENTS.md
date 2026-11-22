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
| **Status** | Migrasi Sanity selesai, admin panel + galeri jalan, deploy Workers jalan, **custom domain `ridwanafazn.my.id` live**. Hero homepage **HeroAbstract** + spotlight Rengoku/quote/SFX (marker kiri, hint dihapus; deploy `ca3e50c4`, 2026-11-22). Sisa: **cover image 0/13** (galeri 54 foto sudah ada) |

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
src/middleware.ts   # admin guard + public cache + security headers + rate limit
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
11. **Public site BUKAN zero-JS.** Halaman publik memuat IntersectionObserver reveal, slider galeri, lightbox, dan menu mobile. **Three.js/globe tidak lagi dipakai di homepage** (HeroGlobe tidak di-render); jangan menuliskan/mengarahkan "zero-JS" untuk public.
12. **`AUTH_COOKIE_NAME` / `AUTH_COOKIE_DOMAIN` / `AUTH_COOKIE_SECURE` di `wrangler.jsonc` tidak dibaca kode.** `src/lib/auth.ts` hanya memakai `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_TRUSTED_ORIGINS`; nama cookie memakai default Better Auth. Jangan menganggapnya sebagai konfigurasi aktif.
13. **`pnpm lint` belum bisa jalan** — `eslint` tidak ada di `devDependencies` dan tidak ada config. Pakai `pnpm typecheck` dulu sampai lint di-setup.
14. **Browser Cache TTL zona = `0` (“Respect Existing Headers”) sejak 2026-11-16.** Sebelumnya `14400` (4 jam), sehingga HTML yang di-cache edge dipaksa `max-age=14400` meski Worker mengirim 60. Jangan menaikkannya lagi: HTML harus ikut `max-age=60` dari `src/middleware.ts`; aset ber-hash tetap `max-age=31536000, immutable`.
15. **Menu mobile & lightbox memakai `inert`** pada konten di belakang overlay + focus trap. Jangan hapus `inert`/trap saat mengubah markup, atau keyboard user bisa masuk ke halaman belakang.
16. **Tanpa JavaScript** menu mobile tidak bisa dibuka; penggantinya `<noscript>` di `Layout.astro` (`.no-js-nav`). Jangan hapus blok itu.
17. **Globe punya jalur gagal.** WebGL tidak tersedia, renderer gagal, tekstur gagal, atau `webglcontextlost` → wrap diberi `data-failed` (CSS `display:none`) tanpa error. `prefers-reduced-motion` mematikan rotasi total. Jangan hapus guard di `src/scripts/hero-globe.ts`.
18. **OG/Twitter selalu dirender** oleh `Layout.astro` dengan default `/og.png` (1200×630). Project tanpa cover/galeri tetap punya kartu share. Lightbox di `/projects/[id]` hanya dirender jika galeri tidak kosong — jangan kembalikan dialog kosong.
19. **Canonical hanya untuk halaman indexable.** Saat `noindex` (404/500/preview), `Layout` tidak merender `<link rel="canonical">`. Jangan menambah canonical manual di halaman error.
20. **Data publik kosong bukan error.** `getAllProjects`/`getSkills`/`getActivities` → `[]`, `getTopProjects` fallback 3 project teratas, `getProjectById` → `null` untuk slug tidak ada (404); error DB tetap 500. Halaman wajib punya empty state, dan `sitemap.xml` tetap mengirim URL statis walau DB gagal.
21. **CSP ada allowlist.** Script/style hanya `'self'` + `'unsafe-inline'` (inline Astro) + `static.cloudflareinsights.com` (Web Analytics zona), gambar `res.cloudinary.com`, koneksi `api.cloudinary.com` + `cloudflareinsights.com`. Menambah script/font/iframe eksternal **wajib** memperbarui `contentSecurityPolicy()` di `src/middleware.ts`, atau fitur itu akan diblokir browser. Jangan menaikkan CSP ke `default-src *`.
22. **Rate limit login** memakai binding `LOGIN_RATE_LIMIT` (10/60 dtk per IP) di `wrangler.jsonc`. Middleware fail-open kalau binding error; Better Auth diberi `cf-connecting-ip` lewat `advanced.ipAddress.ipAddressHeaders` agar tidak memakai bucket global. Jangan hapus `ratelimits` saat mengubah konfigurasi Worker.
23. **`import.meta.env.DEV` bisa `false` di dev Cloudflare** karena `NODE_ENV=production` dari `wrangler.jsonc`; gunakan `import.meta.env.MODE === 'development'` untuk percabangan dev (dipakai bypass `?v=`). `PROD` juga bisa menyesatkan di dev.
24. **`astro:env` server `access: 'public'` = nilai build-time.** `.env.local` ikut ter-inline ke Worker produksi (pernah membuat `BETTER_AUTH_URL`/`AUTH_TRUSTED_ORIGINS` berisi `localhost`). Untuk nilai yang berbeda dev/produksi pakai `access: 'secret'` agar dibaca runtime. Jangan mengembalikan `BETTER_AUTH_URL`/`AUTH_TRUSTED_ORIGINS` ke `public`.
25. **Heatmap GitHub mengambil HTML publik** `https://github.com/users/ridwanafazn/contributions` (tanpa token). Hasil di-cache 6 jam di `caches.default` + memori dev; fetch timeout 2,5 dtk. Kalau fetch/parse gagal, `getGitHubContributions()` mengembalikan `null` dan section tidak dirender — **jangan** membuat halaman 500. Kalau markup GitHub berubah, ganti ke GraphQL + PAT read-only `GITHUB_TOKEN`.
26. **Homepage hero = `HeroAbstract`**, bukan hero Cold Steel/globe. `Software Engineer` h1 besar dua baris, tagline subtext kecil **Public Sans**, cutout portrait tengah, app GIS Sentry kanan; full-bleed `100vw`; **tanpa CTA/stiker**, label app dihapus; copy desktop `top: 35%`. Section setelah hero **tidak boleh ikut dirombak** saat menyentuh hero. Di ≤980px hero `100svh`: portrait mengisi row `1fr` (`object-fit:cover`), app satu grid cell dengan portrait di **kanan-bawah**, copy + marquee di dasar; **jangan** kembalikan app ke baris penuh atau `space-between`—itu membuat void/hero panjang. Marquee memakai diamond persegi + `AI APPLICATION ENGINEER`. **Spotlight foto** (2026-11-22): foto asli tampil penuh; **soft blob mask** (`reveal-blob.png`, bukan lingkaran) mengikuti kursor dan membuka easter egg Rengoku full-body yang sudah disejajarkan 1:1 dengan foto; hanya di JS + ≥981px + hover pointer presisi. Quote Inggris+Jepang A/B/C tampil di **kolom kiri bawah** lewat shuffle bag + dwell 160ms; SFX `fire-whoosh.mp3` default OFF lewat tombol `SFX OFF/ON` (kanan-atas portrait) + cooldown 1.2s. Tanpa class `is-spot-ready`/`is-spotting`, foto asli tetap tampil dan Rengoku/quote/SFX tidak muncul. Tracking pointer satu `requestAnimationFrame` + `--hero-spot-x/y`; jangan tambah listener pointer kedua.
27. **Navbar homepage digate.** `Layout` menerima `gateNav` + `bareHero`; `Navbar` memasang `data-nav-gate`; CSS gate ada di `global.css` (unlayered); `syncNav()` menampilkan navbar lama setelah **70% tinggi `#hero`**. Script Navbar berjalan sebelum `<main>`/hero ada — **jangan** menganggap hero yang belum ada sebagai “boleh tampil”; kalau hero null, navbar harus hidden. Jangan mengganti navbar ini dengan pill floating baru.
28. **Aset hero:** `public/images/ridwan-cutout.webp` (123 KB) + PNG fallback; easter egg spotlight memakai `public/images/rengoku.webp` (900×1200, ~67 KB, cutout **full-body** transparan—paha/kaki di bawah tangan ikut—yang sudah diskalakan 0.9× dan ditempatkan di `(23px,127px)` agar proporsi wajah sejajar dengan foto), `public/images/reveal-blob.png` (soft mask 400×440), dan `public/audio/fire-whoosh.mp3` (~67 KB, Mixkit “Fire woosh”, Mixkit Free License). Font Instrument Serif tidak dipakai lagi (preload/font-face dihapus); subtext memakai Public Sans. Kalau memindahkan foto ke Cloudinary, update CSP/`img-src` dan path `HeroAbstract`.
29. **Vite dev watch** mengabaikan `.taste-skill/**` dan `mockups/shots/**` (`astro.config.mjs`). Tanpa ini, Chrome profile dari screenshot tool memicu `EBUSY` dan error `No Astro CSS at index 0`; kalau dev korup: `pnpm exec astro dev stop` lalu `pnpm dev`.
30. **Gutter hero mobile:** `Layout` memasang class `page-home` di `<html>` hanya saat `bareHero`; `global.css` memberi gradient `#080907` 0–100svh lalu `--color-background` untuk menutup gutter scrollbar ±4px di kanan hero. Jangan jadikan background ini global—halaman non-home harus cream. Kalau mengubah tinggi hero mobile, ubah juga stop gradient `100svh`.

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
