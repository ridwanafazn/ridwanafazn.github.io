# MIGRATION LOG — Execution Tracking
## Portofx v2: Sanity → Neon + Astro 7 Static + per-route SSR + Cloudflare Workers

> **Format**: Tanggal | Fase | Task | Status | Notes/Decisions/Blockers
> **Updated**: Setiap commit `chore(migration): log ...`
> **State terbaru / handoff:** lihat **`docs/HANDOFF.md`**
> **Stack final**: Astro 7.4.5, Drizzle 0.45.4, Neon 1.2.0, Better Auth 1.7.20, Cloudinary, Cloudflare Workers 14.4.7

---

## 2026-11-11 — Project Kickoff & Documentation

| Time | Phase | Task | Status | Notes |
|---|---|---|---|---|
| 09:30 | 0 | Analisis current state (codebase review) | ✅ Done | Astro 7.4.5 Static + Sanity + GitHub Pages confirmed |
| 10:15 | 0 | Diskusi arsitektur target (SSR, Neon, Admin) | ✅ Done | Static + per-route SSR, Neon, Better Auth, Cloudflare Workers |
| 11:00 | 0 | Setup `/docs` folder & create AGENTS, PRD, TRD, ERD, TASKS, DESIGN, MIGRATION_LOG | ✅ Done | All core docs created |
| 11:45 | 0 | Commit baseline docs | ✅ Done | `chore(docs): add initial documentation suite` |
| 12:00 | 0 | Koreksi 7 isu (Astro 7, Better Auth, Workers, secrets, env, data model) | ✅ Done | Docs v1.1 |

**Decisions Made:**
- Target stack: **Astro 7.4.5 Static + per-route SSR** + Neon + Drizzle + Better Auth + Cloudinary + Cloudflare Workers
- Migration phases: 0→5 (7 hari estimasi)
- Admin UI: Shadcn/UI React islands only di `/admin`
- Assets: Cloudinary signed upload + Media Library Widget
- Auth: Better Auth + scrypt (`@noble/hashes`), RBAC admin/editor
- Deploy: **Cloudflare Workers** (`wrangler deploy`), bukan Pages
- Data model: **flat first** (Fase 1) + blocks (Fase 3) + pages (Fase 4)

**Open Questions:**
- [x] Custom domain: `ridwanafazn.my.id` → Cloudflare Workers (bukan GitHub Pages).
- [ ] Deploy hook untuk rebuild static setelah publish? Atau rely on GitHub Actions on push to `main`?
- [ ] Preview password protection needed? Atau public draft URL dengan noindex?

---

## 2026-11-11 — Phase 0: Baseline (Done)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | `git checkout -b migrate/astro-ssr-neon` | ✅ Done | Branch aktif |
| - | `pnpm install` (lockfile) | ✅ Done | 190 packages, approve-builds |
| - | `pnpm build` verify | ✅ Done | 13 halaman, 16s |
| - | Create `.env.example` + `docs/ENV.md` | ✅ Done | |
| - | Create `wrangler.jsonc` | ✅ Done | Workers + KV bindings |
| - | Create root `AGENTS.md` | ✅ Done | Pointer ke docs |
| - | Sanity dataset export | ⏳ Pending | Butuh `sanity` CLI |
| - | Neon project create + branches | ⏳ Pending | Butuh console Neon |

---

## 2026-11-11 — Phase 1: Infra & Data Layer (In Progress)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | Install deps (drizzle@0.45.4, neon@1.2.0, better-auth@1.7.20, zod@4.5.4) | ✅ Done | `pnpm install` + `approve-builds` |
| - | Drizzle config + schemas (auth, portfolio, content) | ✅ Done | 11 tabel, enums |
| - | `pnpm db:generate` | ✅ Done | `0000_dear_goblin_queen.sql` |
| - | `pnpm db:migrate` | ⏳ Pending | Butuh Neon project |
| - | Zod validation schemas | ✅ Done | portfolio, auth, content |
| - | Migration script Sanity → Neon (flat) | ✅ Done | `scripts/migrate-sanity-to-neon.ts` |
| - | Run migration, verify counts | ⏳ Pending | Butuh Neon |
| - | Seed script + Drizzle Studio verify | ⏳ Pending | Butuh Neon |

**Plan 3 hari (kompres):**
- **Hari 1:** Fase 0 + Fase 1 (Neon setup, schema, migrate, seed, migrasi Sanity)
- **Hari 2:** Fase 2 + Fase 3 (Cloudflare adapter, Better Auth, admin core CRUD)
- **Hari 3:** Fase 4 + Fase 5 (preview/publish, deploy, cutover)

---

## 2026-11-11 — Neon Provisioning & Seed (Done)

| Task | Status | Notes |
|---|---|---|
| Neon CLI install | ✅ Done | `neon@9.3.2` |
| `neon login` | ✅ Done | profile DEFAULT |
| Neon skills (opencode, global) | ✅ Done | neon, neon-postgres, neon-auth, neon-functions, neon-object-storage, neon-ai-gateway, neon-realtime |
| Neon MCP (opencode, global) | ✅ Done | `https://mcp.neon.tech/mcp` (API key) |
| Create project `portofx-v2` | ✅ Done | id `odd-rice-47100012`, region `aws-ap-southeast-1`, PG 18 |
| Link project | ✅ Done | `.neon` (gitignored) |
| `.env.local` DATABASE_URL/UNPOOLED | ✅ Done | pooled + direct |
| `pnpm db:migrate` | ✅ Done | 11 tabel + 3 enum |
| `pnpm db:seed` | ✅ Done | admin `admin@portofx.dev` + credential account (password di `.env.local`) |
| `pnpm migrate:sanity` | ✅ Done | **10 projects**, 2 activities, profile + skills (singleton di-update) |
| Data cleanup | ✅ Done | sample seed dihapus; semua project `published`; 3 featured (`isTopProject`) |
| Assets dari Sanity | ⏳ Pending | butuh Cloudinary creds (cover/gallery belum dimigrasi) |
| Login E2E | ✅ Done | sign-in API 200 + dashboard |

> Kredensial DB & password ada di `.env.local` (gitignored). Jangan commit.

---

## 2026-11-11 — Phase 2: Static + per-route SSR + Cloudflare Adapter (Done)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | `astro add cloudflare` | ✅ Done | `@astrojs/cloudflare@14.4.7` |
| - | Update `astro.config.mjs` → `output: 'static'` + adapter | ✅ Done | `optimizeDeps.exclude` better-auth |
| - | Create `wrangler.jsonc` | ✅ Done | Workers + KV bindings |
| - | Better Auth setup + middleware | ✅ Done | `src/lib/auth.ts`, `src/middleware.ts` |
| - | Login/logout + `/api/auth/[...all]` | ✅ Done | `/admin` → 302 ke login |
| - | Verify prerendered routes still work | ✅ Done | `/` 200, 13 halaman |
| - | Admin dashboard SSR route | ✅ Done | `/admin/login` 200 |

---

## 2026-11-11 — Admin UX, Gallery, SSR Public (Done)

| Task | Status | Notes |
|---|---|---|
| Hapus DB nyasar `portofx-v2` di project Orchestrix | ✅ Done | verified gone |
| Admin shell baru | ✅ Done | sidebar desktop, drawer mobile, toast, top bar |
| Dashboard | ✅ Done | stat cards + project terbaru + aksi cepat |
| Portfolio list | ✅ Done | filter status, tabel desktop, kartu mobile, thumbnail cover |
| Portfolio editable | ✅ Done | cover, galeri, links, order, featured |
| Asset manager | ✅ Done | dropzone upload, grid, toast, hapus |
| Galeri project publik | ✅ Done | scroll-snap horizontal (Play Store style) + cover + prev/next |
| Public pages → SSR + edge cache | ✅ Done | edit tampil ≤60s (cache `s-maxage=60`) |
| Sitemap dinamis | ✅ Done | `/sitemap.xml` (semua project) |
| Fix bug PATCH default Zod | ✅ Done | update parsial tidak lagi menimpa status/techStack |
| Restore data terklobber | ✅ Done | open-house & vessel dipulihkan dari Sanity |
| Deploy | ✅ Done | https://portofx-v2.ridwanafzn.workers.dev |


---

## 2026-11-11 — Deploy Cloudflare Workers (Done) + Domain (Pending)

| Task | Status | Notes |
|---|---|---|
| Cloudinary creds | ✅ Done | cloud `a5e2n4lq`, preset `ml_default` (Signed) |
| Cloudinary E2E | ✅ Done | sign → upload → metadata → DB → destroy (ok) |
| Public pages → Neon | ✅ Done | `src/lib/content.ts`; `/`, `/about`, `/projects`, `/projects/[id]` |
| Sanity removal | ✅ Done | deps, studio, `src/lib/sanity.ts`, scripts dihapus (705 paket) |
| `build.format: 'file'` | ✅ Done | `/about` 200 tanpa redirect di Workers |
| KV `SESSION` | ✅ Done | id `0caf957ffab8428687ada2d8bef1e809` |
| Secrets production | ✅ Done | `DATABASE_URL`, `UNPOOLED`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_KEY/SECRET` |
| Deploy Workers | ✅ Done | https://portofx-v2.ridwanafzn.workers.dev |
| Custom domain `ridwanafazn.my.id` | ✅ Done | Live di Workers; `www` 301 → apex; GitHub Pages dilepas |
| Hapus `public/CNAME` + disable GH Pages | ⏳ Pending | setelah domain aktif |

---

## 2026-11-11 — Phase 3: Admin Core (Done)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | AdminLayout + nav | ✅ Done | Astro component (lean, tanpa React) |
| - | Dashboard quick actions | ✅ Done | `/admin` cards |
| - | Portfolio List + row actions | ✅ Done | tabel + publish/archive/delete |
| - | Portfolio New/Edit forms | ✅ Done | flat fields + slug + highlights |
| - | Cloudinary sign-upload + asset grid | ✅ Done | `/admin/assets` |
| - | Profile/Skills/Activities editors | ✅ Done | singleton + CRUD |
| - | Block Editor | ⏭️ Skip v1 | flat fields cukup |
| - | Rate limiting KV | ⏳ Pending | nanti |

**Verifikasi:** `/admin` → 302 login; semua `/admin/*` protected; `/` 200.

---

## 2026-11-11 — Phase 4: Workflow (Done)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | Draft management (create, duplicate, edit) | ✅ Done | `duplicate` endpoint + tombol |
| - | Preview route `/preview/portfolio/[slug]` | ✅ Done | render draft + banner |
| - | Publish action (transaction promote) | ✅ Done | `/publish` endpoint |
| - | Archive action | ✅ Done | `/archive` endpoint |
| - | Deploy hook (optional) | ⏭️ Skip | GitHub Actions on push |

---

## 2026-11-11 — Phase 5: Cutover (Partial)

| Time | Task | Status | Notes |
|---|---|---|---|
| - | SEO: sitemap, robots | ✅ Done | `sitemap-index.xml` + `robots.txt` |
| - | Security: CSP/HSTS/rate limit | ⏳ Pending | nanti |
| - | DNS cutover to Cloudflare Workers | ⏳ Pending | butuh account CF |
| - | Remove Sanity deps & code | ✅ Done | `@sanity/client`, `sanity`, `studio/`, `src/lib/sanity.ts`, scripts Sanity dihapus |
| - | Switch public pages → Neon | ✅ Done | `src/lib/content.ts`; 4 halaman pakai Neon |
| - | Cloudinary creds + E2E | ✅ Done | cloud `a5e2n4lq`, preset `ml_default`; upload test OK |
| - | Update README, CHANGELOG | ⏳ Pending | |
| - | Tag `sanity-era` | ⏳ Pending | |

---

## Blockers & Risks Tracker

| ID | Date | Blocker/Risk | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| B-001 | - | Neon cold start di Workers | High | Connection pooling, keep-alive | ⏳ Monitoring |
| B-002 | - | Workers bundle size > 3MB | High | Code split admin islands, analyze | ⏳ Monitoring |
| B-003 | - | Drizzle migration conflict | Medium | Branch per env, `db:check` di CI | ⏳ Ready |
| B-004 | - | Cloudinary CORS di Workers | Low | Test `astro dev` early | ⏳ Ready |
| B-005 | - | Better Auth session cookie tidak work di Workers | High | Test auth flow day 1 | ⏳ Ready |
| B-006 | - | Workers free CPU 10ms/request | Medium | Ukur; upgrade paid atau pindah Netlify/Vercel | ⏳ Monitoring |

---

## Performance Baselines (Pre-Migration)

| Metric | Current (GitHub Pages + Sanity) | Target (CF Workers + Neon) |
|---|---|---|
| LCP (mobile) | ~1.8s | < 1.5s |
| TTFB | ~200ms | < 100ms |
| Lighthouse Perf | 95 | 100 |
| Build Time | ~2 min | < 60s |
| Deploy Time | ~3 min | < 30s |
| Content Update | Manual PR + rebuild | < 30s (Admin → Preview → Publish) |
| Monthly Cost | $0 | $0 |

---

## Post-Migration Verification Checklist

- [ ] All public pages prerendered (view page source → no hydration scripts)
- [ ] Admin panel SSR (Network tab → document request returns HTML)
- [ ] Login/logout works, session persists refresh
- [ ] Portfolio CRUD: create draft → edit → preview → publish → archive → delete
- [ ] Flat detail editor: cover, gallery, tech stack, highlights, links
- [ ] Block editor (Fase 3): add/reorder/delete all block types
- [ ] Cloudinary upload → asset appears in manager → transform URL works
- [ ] Profile/Skills/Activities editable
- [ ] Preview mode shows banner, noindex, toolbar works
- [ ] Custom domain HTTPS, HSTS, CSP headers present
- [x] Sanity deps removed, build clean
- [ ] Lighthouse 100 on production URL
- [ ] Documentation updated

---

## Rollback Points (Git Tags)

| Tag | Description | Command |
|---|---|---|
| `sanity-era` | Last commit before migration start | `git tag sanity-era <commit-sha>` |
| `phase1-complete` | After Neon + Drizzle + migration done | `git tag phase1-complete` |
| `phase2-complete` | After Static + CF + Auth working | `git tag phase2-complete` |
| `phase3-complete` | After Admin core CRUD working | `git tag phase3-complete` |
| `phase4-complete` | After Preview/Publish workflow done | `git tag phase4-complete` |
| `v2.0.0` | Production release | `git tag v2.0.0` |

---

## Time Tracking (Actual vs Estimate)

| Phase | Estimate | Actual | Variance | Notes |
|---|---|---|---|---|
| 0: Baseline | 0.25 day | - | - | |
| 1: Infra & Data | 0.75 day | - | - | |
| 2: Static + CF | 0.5 day | - | - | |
| 3: Admin Core | 1 day | - | - | |
| 4: Workflow | 0.5 day | - | - | |
| 5: Cutover | 0.25 day | - | - | |
| **Total** | **3 day** | - | - | |

---

> **Update this file** setiap selesai task signifikan. Commit: `chore(migration): log phase X task Y completed`
