# PRD — Product Requirements Document
## Portofx v2: Personal Portfolio dengan Custom Admin Panel

> **Reality check (2026-11-15):** dokumen ini **riwayat produk**, bukan status. MVP sudah live di `https://ridwanafazn.my.id`. Yang **belum** dari daftar P0 di bawah: OG/Twitter card, JSON-LD, `meta description`, halaman 404, rate limit login. 13 project di Neon, **0 cover**, 54 gambar galeri.

> **Catatan implementasi (2026-11-11):** Public pages kini **SSR + edge cache 60s** (bukan prerendered) agar edit dari admin langsung tampil. Sanity sudah dihapus. State terbaru: **`docs/HANDOFF.md`**.

> **Version**: 2.0 (Migration from Sanity/Astro Static)
> **Status**: ✅ **Shipped** (MVP live). Phase 3–4 (block editor, page builder) belum dikerjakan.
> **Owner**: Ridwan Afazn
> **Target Launch**: 3 hari dari kickoff migrasi (kompresi)
> **Stack**: Astro 7.4.5 + Neon + Drizzle + Better Auth + Cloudinary + Cloudflare Workers

---

## 1. Problem Statement

**Current Pain Points (Sanity + Static):**
- **Vendor lock-in**: Sanity pricing naik, fitur gratis terbatas, migrasi sulit
- **No draft/preview workflow**: Publish = live instan, tidak bisa review perubahan sebelum deploy
- **Asset management lemah**: Sanity CDN tidak punya transform on-the-fly, Cloudinary lebih powerful
- **Static-only**: Tidak bisa personalisasi/preview per user, A/B test, atau dynamic content
- **Backend control minim**: Ingin full control schema, auth, RBAC, audit log, webhook

**Opportunity:**
- Showcase backend engineering skill (Postgres, Drizzle, Auth, Workers, Edge)
- Portfolio jadi *living proof* kemampuan fullstack + infra
- Zero recurring cost (Neon free + Cloudflare Workers free + Cloudinary free)

---

## 2. User Personas

| Persona | Needs | Pain Points |
|---|---|---|
| **Ridwan (Owner/Dev)** | Full control konten, draft→preview→publish, asset management, analytics event tracking | Sanity UI rigid, tidak bisa custom workflow, vendor dependency |
| **Visitor/Recruiter** | Fast load, SEO friendly, clean UX, project detail lengkap | Current static sudah bagus, pertahankan perf |
| **Future Client (Freelance)** | Bisa lihat "CMS custom buatan sendiri" sebagai portfolio project | N/A |

---

## 3. Core Features (MVP Scope)

### 3.1 Public Website (SSR + edge cache 60s)
| Feature | Description | Priority |
|---|---|---|
| **Home (/)** | HeroAbstract (poster), spec strip Based in/Fokus/Kontak, Featured Projects (ledger), Tech Stack, GitHub heatmap | P0 |
| **About (/about)** | Record ledger: experience berindeks, Education, Certifications, Volunteering/Activities | P0 |
| **Projects List (/projects)** | ProjectLedger (indeks + thumbnail + role + stack) + ImageTrail desktop; filter belum ada | P0 |
| **Project Detail (/projects/[id])** | Meta plate, lead image, narasi `##`, Hasil, galeri slider, next project | P0 |
| **SEO & Social** | ✅ sitemap (tahan DB kosong), robots, meta description, OG/Twitter (default `/og.png`), canonical hanya halaman indexable, JSON-LD Person (home), 404 + 500 khusus | P0 |
| **Performance** | Lighthouse a11y/BP/SEO **100** di seluruh halaman publik. LCP/CLS belum diukur formal; globe lazy desktop-only | P0 |

### 3.2 Admin Panel (SSR, Protected)
| Feature | Description | Priority |
|---|---|---|
| **Auth** | Login/Logout, Better Auth session cookie, scrypt, rate limit, remember me | P0 |
| **Dashboard** | Stats: total projects, draft, published, assets, last activity | P0 |
| **Portfolio CRUD** | List (sort, filter, search), Create, Edit, Duplicate, Archive, Delete | P0 |
| **Detail Editor (v1)** | Flat fields: title, role, description, longDescription, techStack, highlights, links, cover, gallery | P0 |
| **Draft & Preview** | Edit dengan `status='draft'` → "Preview" buka tab baru `/preview/...` → "Publish" promote ke `published` | P0 |
| **Asset Manager** | Custom: multi-upload + drag&drop (paralel 3), signed upload Cloudinary, pick cover/galeri (bukan Media Library Widget) | P0 |
| **Profile Editor** | Singleton: name, role, tagline, bio, stats, current focus, experience, education, certs, howIBuild | P0 |
| **Skills Editor** | Singleton: categories + items array | P0 |
| **Activities CRUD** | Volunteer, Publication, Leadership — list + create/edit/delete | P1 |
| **Block Editor (Fase 3)** | Detail project pakai blocks: Hero, Gallery, Text, Video, Embed, Tech Stack, Links | P1 |
| **Page Builder (Fase 4)** | `/` dan `/about` editable via blocks/typed sections | P2 |

### 3.3 Infrastructure & DevOps
| Feature | Description | Priority |
|---|---|---|
| **Neon Postgres** | Branch per env (main, preview, dev), PITR, connection pooling | P0 |
| **Drizzle ORM** | Type-safe, migrasi versioned, seed script | P0 |
| **Cloudflare Workers** | Static public + per-route SSR, edge, free tier | P0 |
| **Cloudinary** | Signed upload, auto format/quality, transform URL, folder org | P0 |
| **CI/CD** | GitHub Actions: typecheck + build ✅; lint/test/preview/prod deploy ⚠️ belum aktif (token deploy kosong, deploy manual) | P1 |
| **Monitoring** | Sentry (error), Logtail (logs), Neon query insights | P1 |

---

## 4. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | Public pages SSR + edge cache 60s, TTFB < 100ms (edge/hit), LCP < 1.5s | P0 |
| **Availability** | 99.9% (Cloudflare SLA), Neon 99.95% | P0 |
| **Security** | HTTPS only, CSP, HSTS, X-Frame-Options, Better Auth + scrypt, CSRF protection | P0 |
| **Scalability** | Workers auto-scale, Neon auto-scale storage, Cloudinary CDN | P0 |
| **Maintainability** | TypeScript strict, Drizzle type-safe, Zod 4 validation, Conventional Commits | P0 |
| **Cost** | $0/month (free tiers), max $5 kalau scale | P0 |
| **Developer Experience** | `pnpm dev` < 3s (workerd), hot reload, `pnpm db:studio`, `astro preview` | P0 |

---

## 5. Out of Scope (v2.0)

- Multi-user collaboration (hanya 1 admin = Ridwan)
- Comments/guestbook di project
- Analytics dashboard (pakai Plausible/GA4 external)
- Newsletter subscription
- Multi-language (i18n) — English only dulu
- Full page builder untuk `/` dan `/about` (v2.1)
- Webhook ke Notion/Slack/Discord (v2.1)
- Custom domain SSL management (Cloudflare handle)

---

## 6. Success Metrics (KPI)

| Metric | Baseline (Current) | Target (v2.0) |
|---|---|---|
| **Lighthouse Performance** | 95 | 100 |
| **LCP (mobile)** | ~1.8s | < 1.5s |
| **Time to First Byte** | ~200ms (GitHub Pages) | < 100ms (CF Workers edge) |
| **Deploy Time** | ~2 min (GitHub Actions) | < 60s (wrangler deploy) |
| **Content Update Latency** | Manual PR + rebuild | < 30s (Admin → Preview → Publish) |
| **Monthly Cost** | $0 | $0 |
| **Admin Panel Load** | N/A | < 500ms |

---

## 7. Assumptions & Dependencies

| Assumption | Risk if Wrong | Mitigation |
|---|---|---|
| Neon free tier cukup (512MB storage, 10GB transfer) | Project/assets melebihi quota | Monitor, upgrade $19/mo jika perlu |
| Cloudflare Workers free tier 100k req/day + 10ms CPU cukup | SSR + auth + Neon > 10ms CPU | Ukur; upgrade Workers Paid $5/mo (10M req) atau pindah Netlify/Vercel |
| Cloudinary free 25GB cukup | Asset video/hi-res banyak | Optimasi, hapus unused, upgrade $89/mo jika perlu |
| Drizzle + Neon HTTP stabil di Workers | Edge compatibility issue | Test `astro dev` early; fallback `@astrojs/node` |
| Better Auth + Drizzle adapter stabil di Workers | Auth bug di edge | Test login/refresh loop; `@noble/hashes` scrypt (bukan argon2) |

---

## 8. Timeline & Milestones

| Phase | Duration | Deliverable |
|---|---|---|
| **Phase 0: Baseline & Prep** | 0.25 hari | Branch, env template, Sanity backup, build verify |
| **Phase 1: Infra & Data Layer** | 0.75 hari | Neon + Drizzle + Schema + Migrasi Sanity→Neon + Seed |
| **Phase 2: Static + Per-route SSR** | 0.5 hari | `output: 'static'`, `wrangler.jsonc`, middleware, `prerender = false` di admin |
| **Phase 3: Auth + Admin Core** | 1 hari | Better Auth, login, dashboard, Project CRUD, Cloudinary upload |
| **Phase 4: Draft/Preview/Publish** | 0.5 hari | Draft workflow, preview route, publish action |
| **Phase 5: Polish & Cutover** | 0.25 hari | DNS switch, remove Sanity, README update, tag archive |

**Total Estimasi**: ~3 hari kerja (kompresi, tanpa buffer)

---

## 9. Acceptance Criteria (Definition of Done)

- [x] Semua halaman publik (`/`, `/about`, `/projects`, `/projects/[id]`) **SSR + edge cache 60s** (bukan prerendered), Lighthouse target 100
- [ ] Admin panel `/admin/*` **SSR** (`export const prerender = false`), login Better Auth, session persist refresh
- [ ] CRUD Project: create draft, edit, preview (tab baru), publish, archive, delete
- [ ] Detail editor v1: flat fields + cover + gallery (Cloudinary)
- [ ] Block editor project detail (Fase 3): Hero, Gallery, Text, Tech Stack, Links
- [ ] Cloudinary upload widget di admin, asset tersimpan di DB, transform URL jalan
- [ ] Profile, Skills, Activities editable di admin (singleton/list)
- [ ] Deploy ke **Cloudflare Workers** production (`wrangler deploy`), custom domain aktif, HTTPS
- [ ] Sanity deps dihapus, build tidak error, tidak ada referensi Sanity di kode
- [ ] Dokumentasi `/docs` lengkap & update (PRD, TRD, ERD, TASKS, DESIGN, ENV, RUNBOOK, MIGRATION_LOG)

---

## 10. Risks & Mitigations (Ringkasan)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Neon cold start di Workers | Medium | High | Connection pooling, keep-alive query, monitor |
| Workers bundle size > 1MB/3MB | Low | High | Code split admin islands, `nodejs_compat`, analyze bundle |
| Workers free CPU 10ms/request | Medium | High | Ukur; upgrade paid atau pindah Netlify/Vercel |
| Drizzle migration conflict | Low | High | Branch Neon per migrasi, `drizzle-kit check` di CI |
| Cloudinary signed upload CORS | Low | Medium | Test `astro dev` + production domain early |
| Better Auth session cookie tidak work di Workers | Low | High | Test `astro dev` auth flow day 1; fallback `@astrojs/node` |

---

> **Next**: Lihat `/docs/TRD.md` untuk spesifikasi teknis detail, `/docs/ERD.md` untuk skema DB, `/docs/TASKS.md` untuk breakdown actionable, `/docs/ENV.md` untuk environment variables.
