# TASKS — Actionable Task Breakdown
## Portofx v2 Migration: Sanity → Neon + Astro 7 Static + per-route SSR + Cloudflare Workers

> **Methodology**: Fase-based, checkbox-driven, commit-per-task
> **Plan**: **3 hari** (kompresi) — Hari 1: Fase 0–1, Hari 2: Fase 2–3, Hari 3: Fase 4–5
> **Branch**: `migrate/astro-ssr-neon`
> **Tracking**: Update `[x]` saat selesai, commit `chore(tasks): update phase X progress`
> **Stack**: Astro 7.4.5, Drizzle 0.45.4, Neon 1.2.0, Better Auth 1.7.20, Cloudinary, Cloudflare Workers 14.4.7

---

## 📋 Phase 0: Baseline & Persiapan (0.25 hari)

### 0.1 Repository Setup
- [ ] `git checkout -b migrate/astro-ssr-neon`
- [ ] `pnpm install --frozen-lockfile` → verify no vulnerability
- [ ] `pnpm build` → confirm current static build success
- [ ] `pnpm dev` → confirm local dev works (Sanity connected)

### 0.2 Documentation & Env
- [x] Create `/docs` folder dengan: AGENTS, PRD, TRD, ERD, TASKS, DESIGN, MIGRATION_LOG
- [ ] Create `/docs/ENV.md` → environment variables + where to set
- [ ] Create `/docs/RUNBOOK.md` → deploy/rollback/incident
- [ ] Create `/docs/ADR/` → architecture decision records
- [ ] Create root `AGENTS.md` → pointer ke `docs/AGENTS.md`
- [ ] Create `.env.example` dengan semua var target (Neon, Cloudinary, Better Auth, Cloudflare)
- [ ] Create `.env.migration` untuk script migrasi (SANITY_API_TOKEN, DATABASE_URL_UNPOOLED)
- [ ] Create `wrangler.jsonc` (bukan `wrangler.toml`)
- [ ] Update `.gitignore` → ignore `.env*`, `.dev.vars`, `.wrangler/`, `dist/`, `node_modules/`

### 0.3 Sanity Backup
- [ ] `sanity dataset export production backup-$(date +%Y%m%d)` → simpan di `backups/sanity/`
- [ ] Verify export JSON readable, count documents per type
- [ ] Document current Sanity schema version di `MIGRATION_LOG.md`

### 0.4 Neon Project Setup
- [ ] Create Neon project `portofx-v2` (region: Singapore/APAC closest to CF)
- [ ] Create branches: `main` (production), `preview` (staging), `dev` (development)
- [ ] Save connection strings: `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct)
- [ ] Enable "Auto-suspend" after 5 min idle (free tier)
- [ ] Test connection: `psql $DATABASE_URL -c "SELECT version()"`

---

## 📋 Phase 1: Infra & Data Layer (0.75 hari)

### 1.1 Dependencies & Config
- [x] `pnpm add drizzle-orm@0.45.4 @neondatabase/serverless@1.2.0 better-auth@1.7.20 zod@4.5.4`
- [x] `pnpm add -D drizzle-kit@0.31.4+ @types/node tsx dotenv`
- [x] `pnpm add -D wrangler@4.125+ @cloudflare/workers-types`
- [x] `pnpm add @astrojs/react@7.1.7 @astrojs/sitemap@3.7.4 @astrojs/check@0.9.12`
- [x] `pnpm add @astrojs/cloudflare@14.4.7`
- [x] Hapus `lucia`, `argon2` dari dependencies (jika ada)
- [x] Create `drizzle.config.ts`:
  ```ts
  export default defineConfig({
    schema: './db/schema/index.ts',
    out: './db/migrations',
    dialect: 'postgresql',
    driver: 'pg', // Neon HTTP driver
    dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  });
  ```
- [x] Create `db/client.ts` → Neon HTTP singleton
- [x] Create `db/schema/index.ts` → barrel export all schemas
- [x] Create `db/schema/enums.ts` → all PG enums
- [x] Create `db/schema/auth.ts` → users, sessions, accounts, verifications (Better Auth)
- [x] Create `db/schema/portfolio.ts` → portfolios, portfolio_blocks, assets
- [x] Create `db/schema/content.ts` → profile, skills, activities, pages
- [x] Run `pnpm db:generate` → verify `0000_initial_schema.sql` created
- [ ] Run `pnpm db:migrate` → apply ke Neon `dev` branch (butuh Neon)

### 1.2 Zod Validation Schemas
- [x] Create `src/lib/validation/portfolio.ts` → flat fields + block schemas, create/update schemas
- [x] Create `src/lib/validation/auth.ts` → login, register, password reset
- [x] Create `src/lib/validation/content.ts` → profile, skills, activities, pages
- [x] Create `src/lib/validation/index.ts` → barrel export

### 1.3 Migration Script (Sanity → Neon)
- [x] Create `scripts/migrate-sanity-to-neon.ts` (reference TRD §9.2)
- [x] Add script to `package.json`: `"migrate:sanity": "tsx scripts/migrate-sanity-to-neon.ts"`
- [ ] Run migration ke Neon `dev` branch: `pnpm migrate:sanity` (butuh Neon)
- [ ] Verify data integrity:
  - [ ] Count portfolios = Sanity projects
  - [ ] Count assets = cover images + gallery images
  - [ ] Profile, Skills, Activities migrated correctly
  - [ ] `portfolio_blocks` / `pages` **tidak** diisi di Fase 1
- [ ] Fix any data mismatch, re-run migration (idempotent)

### 1.4 Seed Script (Dev Only)
- [x] Create `db/seed.ts` → insert test user, sample portfolio, assets
- [x] Add `pnpm db:seed` script
- [ ] Test: `pnpm db:seed` → verify via `pnpm db:studio` (butuh Neon)

### 1.5 Drizzle Studio & Verification
- [ ] `pnpm db:studio` → explore data, verify relationships (butuh Neon)
- [ ] Run sample queries: portfolio flat fields, profile singleton, activities list
- [ ] Document any schema adjustment di `MIGRATION_LOG.md`

---

## 📋 Phase 2: Astro 7 Static + per-route SSR + Cloudflare Adapter (0.5 hari)

### 2.1 Adapter & Config
- [x] `pnpm astro add cloudflare` → installs `@astrojs/cloudflare@14.4.7`
- [x] `pnpm add -D wrangler@4.125+ @cloudflare/workers-types`
- [x] Update `astro.config.mjs`:
  ```js
  import { defineConfig, envField } from 'astro/config';
  import cloudflare from '@astrojs/cloudflare';
  import react from '@astrojs/react';
  import sitemap from '@astrojs/sitemap';
  import tailwindcss from '@tailwindcss/vite';

  export default defineConfig({
    site: 'https://portofx.ridwanafazn.dev',
    base: '/',
    output: 'static', // Astro 7: 'hybrid' sudah dihapus
    adapter: cloudflare({ imageService: 'passthrough' }),
    vite: { plugins: [tailwindcss()], optimizeDeps: { exclude: ['better-auth', '@neondatabase/serverless', 'drizzle-orm'] } },
    integrations: [react(), sitemap()],
    env: {
      schema: {
        DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
        DATABASE_URL_UNPOOLED: envField.string({ context: 'server', access: 'secret' }),
        BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret' }),
        BETTER_AUTH_URL: envField.string({ context: 'server', access: 'public' }),
        CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret' }),
        CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret' }),
        CLOUDINARY_CLOUD_NAME: envField.string({ context: 'server', access: 'public' }),
        CLOUDINARY_UPLOAD_PRESET: envField.string({ context: 'server', access: 'public' }),
        PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public' }),
        PUBLIC_CLOUDINARY_CLOUD_NAME: envField.string({ context: 'client', access: 'public' }),
        PUBLIC_CLOUDINARY_UPLOAD_PRESET: envField.string({ context: 'client', access: 'public' }),
      },
    },
  });
  ```
- [x] Create `wrangler.jsonc` dengan `main = "@astrojs/cloudflare/entrypoints/server"`, `compatibility_date = "2026-05-01"`, `compatibility_flags = ["nodejs_compat"]`, `assets = { directory: "./dist", binding: "ASSETS" }`
- [x] Create `.dev.vars`/`.env.local` (local) → `wrangler secret put` (production)
- [x] Create `.wranglerignore` → exclude `src/`, `db/`, `scripts/`, `docs/`, `*.md`

### 2.2 Middleware & Auth Foundation
- [x] Create `src/lib/auth.ts` → Better Auth + `drizzleAdapter` + scrypt (`@noble/hashes`)
- [x] Create `src/pages/api/auth/[...all].ts` → Better Auth handler
- [x] Create `src/middleware.ts` → auth guard, `auth.api.getSession`, `locals.user`
- [x] Create `src/pages/admin/login.astro` → login form (Astro, no React yet)
- [x] Test `astro dev` → login/logout flow works di local (workerd)
- [x] Test `astro preview` → production-like build (diverifikasi 2026-11-11: cache HIT/MISS/BYPASS, 404, redirect admin/preview)

### 2.3 Public Routes — SSR + Edge Cache Verification
- [x] Semua public route `/`, `/about`, `/projects`, `/projects/[slug]` pakai `export const prerender = false` (SSR)
- [x] `pnpm build` → tidak ada prerender route halaman (hanya aset statis)
- [x] `astro dev` + `astro preview` → public 200, `/projects/<slug>` 404 untuk slug tidak ada
- [x] `src/middleware.ts` → cache 60s (`s-maxage=60`) + `?v=` bypass + `x-cache` header

### 2.4 SSR Routes Setup
- [x] Create `src/pages/admin/index.astro` → dashboard (SSR, protected)
- [x] Add `export const prerender = false` di admin routes
- [x] Create `src/layouts/AdminLayout.astro` → base layout dengan sidebar
- [x] Verify SSR works: `astro dev` → access `/admin` redirect login → login → dashboard

---

## 📋 Phase 3: Auth + Admin Panel Core (1 hari)

### 3.1 Auth Polish
- [ ] Rate limiting login: Cloudflare KV `RATE_LIMIT` binding max 5/min
- [x] CSRF protection: Better Auth built-in + `CSRF_SECRET`; Origin check
- [ ] Password strength: min 12 char, entropy check (zxcvbn optional)
- [x] Session config: 30 days, rolling refresh, secure cookies (default Better Auth)
- [ ] Logout everywhere: delete all sessions for user

### 3.2 Admin UI Foundation (Lean — Astro components, bukan React islands)
- [x] Skip Shadcn/Radix dulu — admin pakai Astro components + Tailwind (cepat, zero JS di form)
- [ ] (Opsional nanti) Shadcn/UI + React islands kalau butuh interaksi kompleks

### 3.3 Admin Layout & Navigation
- [x] Create `AdminLayout.astro` → header + nav (Portfolio, Profile, Skills, Activities, Assets, Logout)
- [x] Responsive: nav sederhana, cukup untuk 1 admin

### 3.4 Dashboard (`/admin`)
- [x] Quick actions: New Project, Edit Profile, Upload Asset (cards)
- [ ] Stats cards + activity feed (butuh DB live; nanti)

### 3.5 Portfolio List (`/admin/portfolio`)
- [x] Create `src/pages/admin/portfolio/index.astro` → tabel + row actions
  - [x] Columns: Title, Role, Status, Order, Updated, Actions
  - [x] Row actions: Publish/Archive/Delete (fetch ke API)
  - [x] Empty state + error state (Neon belum diisi)
- [ ] Sorting/filtering/pagination (nanti, kalau banyak project)

### 3.6 Portfolio Create/Edit (`/admin/portfolio/new`, `/admin/portfolio/[id]`)
- [x] Create `src/pages/admin/portfolio/new.astro` → form (title, slug, role, description, longDescription, techStack, highlights, isTopProject)
- [x] Create `src/pages/admin/portfolio/[id].astro` → fetch data, form edit + publish
- [x] API routes: `POST /admin/api/portfolio`, `PATCH /admin/api/portfolio/[id]`
- [ ] Cover/Gallery/SEO fields (nanti, bareng AssetPicker)

### 3.7 Block Editor (Fase 3 — optional)
- [ ] Skip dulu — flat fields sudah cukup untuk v1

### 3.8 Asset Manager & Cloudinary Integration
- [x] Create `src/lib/cloudinary.ts` → signed upload params, transform URL
- [x] Create `src/pages/admin/api/assets/sign-upload.ts` → return signed params
- [x] Create `src/pages/admin/assets/index.astro` → grid + upload (signed) + delete
- [x] API: `GET /admin/api/assets`, `POST /admin/api/assets`, `DELETE /admin/api/assets/[id]`
- [ ] Cloudinary Media Library Widget (opsional)

### 3.9 Profile, Skills, Activities Editors
- [x] `src/pages/admin/profile.astro` → singleton form
- [x] `src/pages/admin/skills.astro` → category + items manager
- [x] `src/pages/admin/activities.astro` → list + create + **edit** + delete
- [x] API routes untuk masing-masing (`/admin/api/profile`, `/admin/api/skills`, `/admin/api/activities`)
- [x] URL CV editable di profile (`cv_url`), dipakai tombol Resume desktop + mobile

---

## 📋 Phase 4: Draft/Preview/Publish Workflow (0.5 hari)

### 4.1 Draft Management
- [x] Create draft on "New Project" → `status='draft'`, slug unique
- [x] "Duplicate to Draft" pada published → clone portfolio + flat fields, new slug
- [x] Edit draft → update existing draft (not published version)
- [ ] Draft list filter di Portfolio Table (nanti)

### 4.2 Preview Route (`/preview/portfolio/[slug]`)
- [x] Create `src/pages/preview/portfolio/[slug].astro` → SSR
- [x] Query: `portfolio WHERE slug = $1` (draft)
- [x] Render **public layout** (Layout.astro) dengan data draft
- [x] Inject preview banner: "🔍 Mode Preview — [Kembali ke Edit]"
- [x] Add `noindex, nofollow` meta tag (via AdminLayout robots + banner)
- [ ] Password protection via query param `?token=xxx` (opsional)

### 4.3 Publish Action
- [x] API: `POST /admin/api/portfolio/[id]/publish` → set `publishedAt`, `status = 'published'`
- [x] UI: "Publish" button di list + edit
- [ ] Transaction: archive versi published lama dengan slug sama (nanti, saat multi-revision)

### 4.4 Archive/Unpublish
- [x] API: `POST /admin/api/portfolio/[id]/archive` → `status = 'archived'`, `publishedAt = null`
- [x] UI: "Archive" button di published project

### 4.5 Deploy Hook (Optional)
- [x] Rely on GitHub Actions on push to `main` (simpler)

---

## 📋 Phase 5: Polish, Cutover & Cleanup (0.25 hari)

### 5.1 SEO & Performance
- [x] Sitemap custom `/sitemap.xml` (SSR + cache 60s; `@astrojs/sitemap` tidak dipakai)
- [x] `public/robots.txt` → allow all, disallow `/admin`, `/preview`
- [ ] Dynamic OG Image: Cloudinary transform dengan title overlay (nanti)
- [ ] JSON-LD schema: `Project`, `Person`, `WebSite` di public pages (nanti)
- [ ] Verify Lighthouse 100 di production URL (setelah deploy)

### 5.2 Security Hardening
- [ ] CSP header via middleware (nanti, setelah assets final)
- [ ] HSTS header (Cloudflare handle otomatis)
- [ ] Rate limit API routes (100 req/min/user via KV)
- [ ] Audit log table (optional Fase 5) → track publish, delete, login

### 5.3 DNS Cutover (Cloudflare Workers) — PENDING
- [ ] Add site `ridwanafazn.my.id` di Cloudflare + ganti NS di registrar (dnscloud.id)
- [ ] Setelah zone Active: Workers → Custom Domains `ridwanafazn.my.id` (+ `www`)
- [ ] Hapus `public/CNAME`; disable GitHub Pages
- [ ] Verify HTTPS, certificate, login admin di domain baru
- [x] Deploy Workers (workers.dev): https://portofx-v2.ridwanafazn.workers.dev

### 5.4 Cleanup Sanity Dependencies — DONE
- [x] Migrasi data Sanity → Neon (10 project, profile, skills, 2 activities)
- [x] Public pages pakai `src/lib/content.ts` (Neon)
- [x] Remove `@sanity/client`, `sanity` dari `package.json`
- [x] Remove `studio/`, scripts Sanity, `src/lib/sanity.ts`
- [x] Remove Sanity env dari `.env`/`.env.example`
- [x] Update `README.md` → stack baru
- [ ] `git tag sanity-era` → butuh commit dulu (belum ada commit)

### 5.5 Documentation Finalization
- [x] `docs/HANDOFF.md` — snapshot state untuk sesi baru
- [x] `docs/AGENTS.md`, `docs/RUNBOOK.md`, `docs/ENV.md` diperbarui
- [ ] Verify all `/docs` files accurate dengan implementasi final
- [ ] Create `CHANGELOG.md` dari conventional commits

### 5.6 Admin UX & Media — DONE (post-migration)
- [x] Admin shell: sidebar desktop, drawer mobile, toast, top bar
- [x] Dashboard stat cards + recent projects + quick actions
- [x] Portfolio list: filter status, tabel desktop + kartu mobile, thumbnail
- [x] Portfolio editable: cover, galeri, links, order, featured
- [x] Asset manager: upload dropzone, grid, delete
- [x] Galeri project publik (scroll-snap, Play Store style) + cover card
- [x] Public pages SSR + edge cache 60s
- [x] Sitemap dinamis `/sitemap.xml` (SSR, ikut cache 60s)
- [x] Activities editable (create + edit + delete)
- [x] URL CV editable, sinkron desktop dan mobile
- [x] Sidebar admin expand/shrink (persist localStorage)
- [x] Judul dokumen `Ridwan Pages`, brand sidebar `ridwanafazn`
- [x] Fix Zod default leak pada PATCH parsial
- [x] Restore data `open-house` & `vessel` dari Sanity

---

## 📋 Post-Launch (Phase 6+) — Backlog

- [ ] Page Builder untuk `/` dan `/about` (Fase 4)
- [ ] Analytics dashboard (Plausible/GA4 integration)
- [ ] Webhook ke Discord/Slack on publish
- [ ] Multi-language (i18n) support
- [ ] Newsletter subscription (Buttondown/ConvertKit)
- [ ] Project analytics (views, clicks via Cloudflare Analytics)
- [ ] Automated backup ke R2/S3
- [ ] Load testing (k6) untuk Workers + Neon

---

## 📝 Commit Convention (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Scope Examples | Description |
|---|---|---|
| `feat` | `auth`, `portfolio`, `admin`, `blocks`, `assets` | New feature |
| `fix` | `auth`, `middleware`, `db`, `deploy` | Bug fix |
| `chore` | `deps`, `config`, `scripts`, `tasks`, `docs` | Maintenance |
| `refactor` | `schema`, `components`, `api`, `validation` | Code restructure |
| `migrate` | `sanity-to-neon`, `db-schema` | Data/schema migration |
| `docs` | `readme`, `agents`, `prd`, `trd`, `erd`, `env` | Documentation |
| `style` | `tailwind`, `css`, `format` | Formatting only |
| `test` | `unit`, `integration`, `e2e` | Tests |
| `perf` | `query`, `bundle`, `cache` | Performance |
| `security` | `auth`, `csp`, `rate-limit` | Security |

**Examples:**
```
feat(portfolio): add flat detail editor with cover + gallery
feat(auth): add Better Auth with Drizzle adapter
fix(auth): session refresh not working on Workers
migrate(sanity-to-neon): migrate flat projects to Neon
chore(tasks): update phase 3 progress
docs(trd): add API routes specification
```

---

## 📊 Progress Tracking

| Phase | Tasks | Completed | % | Status |
|---|---|---|---|---|
| 0: Baseline | 21 | 1 | 5% | ⚠️ Checkbox stale (setup aktual sudah jalan) |
| 1: Infra & Data | 34 | 22 | 65% | 🟡 Sebagian (data sudah di Neon) |
| 2: Static + CF | 19 | 18 | 95% | ✅ Public SSR + CF Workers |
| 3: Admin Core | 30 | 21 | 70% | 🟡 Core + media jalan |
| 4: Workflow | 16 | 13 | 81% | 🟡 Preview/publish jalan, item opsional pending |
| 5: Cutover | 35 | 21 | 60% | 🟡 Deploy jalan; custom domain pending |
| **Total** | **155** | **96** | **62%** | |

> Angka dihitung dari checkbox per fase (2026-11-11). Beberapa checkbox Fase 0/1 stale karena pekerjaan dilakukan tanpa centang.

> Update tabel ini setiap commit `chore(tasks): update progress`

---

> **Next**: Lihat `/docs/DESIGN.md` untuk keputusan UI/UX, `/docs/ENV.md` untuk environment variables, `/docs/RUNBOOK.md` untuk deploy/rollback, `/docs/MIGRATION_LOG.md` untuk log eksekusi.
