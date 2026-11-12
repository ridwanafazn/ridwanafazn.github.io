# AGENTS.md — Portofx v2

> **Pointer root.** Konteks lengkap: [`docs/AGENTS.md`](docs/AGENTS.md) · **state terbaru: [`docs/HANDOFF.md`](docs/HANDOFF.md)**

## Stack

- **Astro 7.4.5** — public **SSR + edge cache 60s**, admin/preview SSR (`prerender = false`)
- **Neon Postgres** — Drizzle ORM 0.45.4
- **Better Auth 1.7.20** — scrypt (`@noble/hashes`), bukan Lucia/argon2
- **Cloudinary** — signed upload, transform URL
- **Cloudflare Workers** — `@astrojs/cloudflare@14.4.7`, `wrangler deploy` (bukan Pages)

## Aturan cepat

1. **Jangan** `output: 'hybrid'` (dihapus Astro 7).
2. **Jangan** `lucia` / `argon2`.
3. **Jangan** `wrangler pages deploy`.
4. **Jangan** taruh secrets di `wrangler.jsonc` vars.
5. **Jangan** hapus `optimizeDeps.exclude` better-auth.
6. **PATCH parsial** harus filter key yang dikirim (Zod default leak).
7. **Jangan** commit `.env.local`.

## Status

- Migrasi Sanity → Neon **selesai** (10 project, profile, skills, 2 activities).
- Admin panel + galeri gambar **selesai**; public **SSR + cache**.
- **Live**: https://ridwanafazn.my.id (`www` → 301 apex) · fallback https://portofx-v2.ridwanafzn.workers.dev
- **Sisa**: upload gambar project.

## Dokumen

| Dokumen | Path |
|---|---|
| **HANDOFF** | [`docs/HANDOFF.md`](docs/HANDOFF.md) |
| Instruksi lengkap | [`docs/AGENTS.md`](docs/AGENTS.md) |
| PRD | [`docs/PRD.md`](docs/PRD.md) |
| TRD | [`docs/TRD.md`](docs/TRD.md) |
| ERD | [`docs/ERD.md`](docs/ERD.md) |
| TASKS | [`docs/TASKS.md`](docs/TASKS.md) |
| DESIGN | [`docs/DESIGN.md`](docs/DESIGN.md) |
| ENV | [`docs/ENV.md`](docs/ENV.md) |
| RUNBOOK | [`docs/RUNBOOK.md`](docs/RUNBOOK.md) |
| MIGRATION_LOG | [`docs/MIGRATION_LOG.md`](docs/MIGRATION_LOG.md) |

## Konteks untuk agent baru

> "Baca `docs/HANDOFF.md` dulu. Project: portfolio Astro 7 SSR di Cloudflare Workers, DB Neon, auth Better Auth, asset Cloudinary. Sanity sudah dihapus. Admin panel & galeri sudah jalan; live di https://ridwanafazn.my.id (www → 301 apex). Sisa: upload gambar project. Jangan pakai `output:'hybrid'`, Lucia, argon2, atau `wrangler pages deploy`."
