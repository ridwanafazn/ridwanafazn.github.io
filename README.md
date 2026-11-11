# Portofx v2 — Personal Portfolio

> **Live**: https://portofx-v2.ridwanafazn.workers.dev
> **Stack**: Astro 7.4.5 (SSR public + edge cache) · Cloudflare Workers · Neon Postgres · Drizzle ORM · Better Auth · Cloudinary · Tailwind CSS 4

Portfolio pribadi dengan admin panel custom: CRUD project, cover & galeri gambar, profile/skills/activities, SEO, preview draft, publish/archive.

> **Status & handoff sesi baru:** baca [`docs/HANDOFF.md`](docs/HANDOFF.md).

---

## 📚 Dokumentasi

| Dokumen | Isi |
|---|---|
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | **Snapshot state terbaru (mulai dari sini)** |
| [`docs/AGENTS.md`](docs/AGENTS.md) | Instruksi lengkap untuk AI agent |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements |
| [`docs/TRD.md`](docs/TRD.md) | Technical spec |
| [`docs/ERD.md`](docs/ERD.md) | Database schema & diagram |
| [`docs/TASKS.md`](docs/TASKS.md) | Breakdown task per fase |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system & admin UX |
| [`docs/ENV.md`](docs/ENV.md) | Environment variables |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Deploy / rollback / incident |
| [`docs/MIGRATION_LOG.md`](docs/MIGRATION_LOG.md) | Execution tracking |
| [`docs/ADR/`](docs/ADR/) | Architecture decision records |

---

## 🚀 Quick Start

```bash
# 1. Install
pnpm install

# 2. Copy env
cp .env.example .env.local
# isi DATABASE_URL, BETTER_AUTH_SECRET, CLOUDINARY_*

# 3. Dev
pnpm dev

# 4. Build
pnpm build

# 5. Deploy
pnpm deploy
```

---

## 🗂️ Struktur

```
portofx-v2/
├── docs/            # Dokumentasi lengkap
├── db/              # Drizzle schema + client + migrations
├── src/
│   ├── lib/         # auth, db, cloudinary, validation
│   ├── pages/       # /, /about, /projects/*, /admin/*, /preview/*
│   ├── components/  # UI (Astro + React islands)
│   └── layouts/
├── scripts/         # (kosong — migrasi Sanity sudah selesai)
├── wrangler.jsonc   # Cloudflare Workers config
├── astro.config.mjs
└── drizzle.config.ts
```

---

## 🧭 Arsitektur

- **Public pages** (`/`, `/about`, `/projects/*`) → **SSR + edge cache** (`s-maxage=60`)
- **Admin** (`/admin/*`) & **Preview** (`/preview/*`) → **SSR**
- **DB** → Neon Postgres (HTTP driver, Drizzle ORM)
- **Assets** → Cloudinary (signed upload, transform URL)
- **Auth** → Better Auth (session cookie + scrypt)
- **Deploy** → Cloudflare Workers (`wrangler deploy`)

---

## 📜 Commands

```bash
pnpm dev            # dev server
pnpm build          # build
pnpm preview        # preview
pnpm deploy         # deploy to Workers
pnpm db:generate    # generate migration
pnpm db:migrate     # apply to Neon
pnpm db:studio      # Drizzle Studio
pnpm db:seed        # seed dev data
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier
```

---

## ⚠️ Aturan

- **Jangan** pakai `output: 'hybrid'` (dihapus di Astro 7).
- **Jangan** pakai `lucia` / `argon2` (deprecated / tidak jalan di Workers).
- **Jangan** pakai `wrangler pages deploy` (Cloudflare Pages tidak didukung adapter v14).
- **Jangan** taruh secrets di `wrangler.jsonc` `vars` — pakai `wrangler secret put`.
- `PUBLIC_*` = build-time; secret runtime = `astro:env/server`.

---

## License

MIT
