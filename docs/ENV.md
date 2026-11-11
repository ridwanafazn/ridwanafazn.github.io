# ENV — Environment Variables & Where to Set

> **Stack**: Astro 7.4.5, Cloudflare Workers, Neon, Cloudinary, Better Auth
> **Aturan**: `PUBLIC_*` = build-time (Astro inline). Secret = runtime (`wrangler secret put`). Non-sensitive = `wrangler.jsonc` `vars`.

---

## 0. MINIMAL — yang benar-benar wajib

| Var | Untuk |
|---|---|
| `DATABASE_URL` | Neon pooled (runtime) |
| `DATABASE_URL_UNPOOLED` | Neon direct (migrasi) |
| `BETTER_AUTH_SECRET` | Session signing (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL auth (`http://localhost:4321` / domain) |
| `AUTH_TRUSTED_ORIGINS` | Origin yang diizinkan (comma-separated). Opsional; default = `BETTER_AUTH_URL` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Signed upload preset (sekarang: `ml_default`) |
| `PUBLIC_SITE_URL` | Canonical URL |
| `PUBLIC_SITE_NAME` | Nama site |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | Widget client |
| `PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Widget client |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin (opsional, ada default) |

> **Nilai aktual ada di `.env.local`** (dev) dan `wrangler.jsonc` vars + Worker secrets (prod). Ringkasan state: `docs/HANDOFF.md`.
> **Sisanya opsional** (Cloudflare CI/CD, Sentry, Resend, analytics). Lihat `.env.example`.

---

## 1. Build vs Runtime vs Secret

| Kategori | Contoh | Disimpan di | Kapan dibaca |
|---|---|---|---|
| **Build-time public** | `PUBLIC_SITE_URL`, `PUBLIC_CLOUDINARY_CLOUD_NAME` | GitHub Actions `env` / `.env.local` | Saat `astro build` (di-inline) |
| **Build-time secret** | `DATABASE_URL` | GitHub Actions `secrets` | Runtime (Neon pooled); CI masih menyuplai saat build untuk env schema |
| **Runtime secret** | `BETTER_AUTH_SECRET`, `CLOUDINARY_API_SECRET` | `wrangler secret put` | Saat request |
| **Runtime var** | `BETTER_AUTH_URL`, `CLOUDINARY_CLOUD_NAME` | `wrangler.jsonc` → `vars` | Saat request |
| **Local dev** | Semua | `.dev.vars` (atau `.env.local`) | Saat `astro dev` |

---

## 2. Daftar Lengkap

### 2.1 App / Public

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `PUBLIC_SITE_URL` | ✅ | ✅ | ❌ | ❌ | Canonical URL |
| `PUBLIC_SITE_NAME` | ✅ | ✅ | ❌ | ❌ | Nama site |
| `PUBLIC_SITE_DESCRIPTION` | ❌ | ✅ | ❌ | ❌ | Meta description |
| `PUBLIC_CONTACT_EMAIL` | ✅ | ✅ | ❌ | ❌ | Email kontak |
| `PUBLIC_GITHUB_USERNAME` | ✅ | ✅ | ❌ | ❌ | GitHub |
| `PUBLIC_LINKEDIN_URL` | ❌ | ✅ | ❌ | ❌ | LinkedIn |
| `PUBLIC_TWITTER_URL` | ❌ | ✅ | ❌ | ❌ | X/Twitter |
| `PUBLIC_OG_IMAGE` | ❌ | ✅ | ❌ | ❌ | Default OG image |
| `PUBLIC_LOCALE` | ❌ | ✅ | ❌ | ❌ | `id-ID` |
| `PUBLIC_TIMEZONE` | ❌ | ✅ | ❌ | ❌ | `Asia/Jakarta` |

### 2.2 Neon (Database)

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ | ✅ | ✅ | Pooled connection |
| `DATABASE_URL_UNPOOLED` | ✅ | ✅ | ✅ | ✅ | Direct connection (migrasi) |
| `NEON_API_KEY` | ❌ | ✅ | ❌ | ✅ | Neon API (CI) |
| `NEON_PROJECT_ID` | ❌ | ✅ | ❌ | ✅ | Neon project |
| `NEON_BRANCH_ID` | ❌ | ✅ | ❌ | ✅ | Neon branch |
| `NEON_DATABASE_NAME` | ❌ | ✅ | ❌ | ❌ | `neondb` |
| `NEON_ROLE_NAME` | ❌ | ✅ | ❌ | ❌ | `neondb_owner` |
| `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` / `PGPORT` / `PGSSLMODE` | ❌ | ❌ | ❌ | ✅ | Tooling psql/drizzle-kit |

### 2.3 Better Auth

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `BETTER_AUTH_SECRET` | ✅ | ❌ | ✅ | ✅ | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | ❌ | ✅ | ❌ | `https://portofx.ridwanafazn.dev` |
| `AUTH_COOKIE_NAME` | ❌ | ❌ | ✅ | ❌ | `auth_session` |
| `AUTH_COOKIE_DOMAIN` | ❌ | ❌ | ✅ | ❌ | `portofx.ridwanafazn.dev` |
| `AUTH_COOKIE_SECURE` | ❌ | ❌ | ✅ | ❌ | `true` |
| `AUTH_TRUSTED_ORIGINS` | ✅ | ❌ | ✅ | ❌ | Domain production |
| `ADMIN_EMAIL` | ✅ | ❌ | ✅ | ❌ | Bootstrap admin |
| `ADMIN_PASSWORD_HASH` | ✅ | ❌ | ✅ | ✅ | scrypt hash |
| `CSRF_SECRET` | ✅ | ❌ | ✅ | ✅ | `openssl rand -hex 32` |
| `RATE_LIMIT_MAX` | ❌ | ❌ | ✅ | ❌ | `5` |
| `RATE_LIMIT_WINDOW` | ❌ | ❌ | ✅ | ❌ | `60` |

### 2.4 Cloudinary

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | ✅ | ❌ | ✅ | ❌ | Cloud name |
| `CLOUDINARY_API_KEY` | ✅ | ❌ | ✅ | ✅ | API key |
| `CLOUDINARY_API_SECRET` | ✅ | ❌ | ✅ | ✅ | API secret |
| `CLOUDINARY_URL` | ❌ | ❌ | ✅ | ✅ | `cloudinary://key:secret@cloud` |
| `CLOUDINARY_UPLOAD_PRESET` | ✅ | ❌ | ✅ | ❌ | `ml_default` (Signed) |
| `CLOUDINARY_FOLDER` | ❌ | ❌ | ✅ | ❌ | `portfolio` |
| `CLOUDINARY_MAX_UPLOAD_SIZE` | ❌ | ❌ | ✅ | ❌ | `10485760` |
| `CLOUDINARY_WEBHOOK_SECRET` | ❌ | ❌ | ✅ | ✅ | Optional |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | ✅ | ❌ | ❌ | Untuk widget client |
| `PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ✅ | ✅ | ❌ | ❌ | Untuk widget client |

### 2.5 Cloudflare (CI/CD)

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ | ✅ | ❌ | ✅ | Scopes: Workers Scripts:Edit, KV:Edit, R2:Edit, Account:Read, Zone:Read |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | ✅ | ❌ | ✅ | Dashboard |
| `CLOUDFLARE_ZONE_ID` | ❌ | ✅ | ❌ | ❌ | Custom domain |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | ❌ | ✅ | ❌ | ❌ | `portofx-v2.workers.dev` |
| `CLOUDFLARE_ENV` | ❌ | ✅ | ❌ | ❌ | `production` / `preview` |
| `CLOUDFLARE_DEPLOY_HOOK_URL` | ❌ | ✅ | ❌ | ❌ | Workers Builds |
| `CF_ACCESS_TEAM_DOMAIN` | ❌ | ❌ | ✅ | ❌ | Optional Cloudflare Access |
| `CF_ACCESS_AUD` | ❌ | ❌ | ✅ | ❌ | Optional Cloudflare Access |
| `PUBLIC_TURNSTILE_SITE_KEY` | ❌ | ✅ | ❌ | ❌ | Optional Turnstile |
| `TURNSTILE_SECRET_KEY` | ❌ | ❌ | ✅ | ✅ | Optional Turnstile |

> **KV bindings** (bukan env var, di `wrangler.jsonc`):
> - `SESSION` — dipakai `@astrojs/cloudflare` untuk session store. Buat: `wrangler kv namespace create SESSION`.
> - `RATE_LIMIT` — untuk rate limit login. Buat: `wrangler kv namespace create RATE_LIMIT`.

### 2.6 Legacy Sanity (migration only)

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `SANITY_PROJECT_ID` | ✅ (migrasi) | ✅ | ❌ | ❌ | `exvebwem` |
| `SANITY_DATASET` | ✅ (migrasi) | ✅ | ❌ | ❌ | `production` |
| `SANITY_API_VERSION` | ❌ | ✅ | ❌ | ❌ | `2025-01-01` |
| `SANITY_API_TOKEN` | ✅ (migrasi) | ✅ | ❌ | ✅ | Sanity API token |
| `SANITY_WEBHOOK_SECRET` | ❌ | ✅ | ❌ | ✅ | Optional |
| `PUBLIC_SANITY_PROJECT_ID` | ❌ | ✅ | ❌ | ❌ | Legacy |
| `PUBLIC_SANITY_DATASET` | ❌ | ✅ | ❌ | ❌ | Legacy |

### 2.7 Optional Services

| Variable | Wajib | Build | Runtime | Secret | Keterangan |
|---|---|---|---|---|---|
| `SENTRY_DSN` | ❌ | ❌ | ✅ | ✅ | Error tracking |
| `SENTRY_AUTH_TOKEN` | ❌ | ✅ | ❌ | ✅ | Source maps |
| `SENTRY_ORG` | ❌ | ✅ | ❌ | ❌ | |
| `SENTRY_PROJECT` | ❌ | ✅ | ❌ | ❌ | |
| `SENTRY_ENVIRONMENT` | ❌ | ❌ | ✅ | ❌ | |
| `RESEND_API_KEY` | ❌ | ❌ | ✅ | ✅ | Contact form |
| `CONTACT_EMAIL_TO` | ❌ | ❌ | ✅ | ❌ | |
| `CONTACT_EMAIL_FROM` | ❌ | ❌ | ✅ | ❌ | |
| `PUBLIC_UMAMI_WEBSITE_ID` | ❌ | ✅ | ❌ | ❌ | Analytics |
| `PUBLIC_UMAMI_SCRIPT_URL` | ❌ | ✅ | ❌ | ❌ | Analytics |
| `PUBLIC_PLAUSIBLE_DOMAIN` | ❌ | ✅ | ❌ | ❌ | Analytics |
| `REVALIDATE_SECRET` | ❌ | ❌ | ✅ | ✅ | On-demand revalidate |
| `CRON_SECRET` | ❌ | ❌ | ✅ | ✅ | Cron jobs |
| `UPSTASH_REDIS_REST_URL` | ❌ | ❌ | ✅ | ✅ | Jika tidak pakai CF KV |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | ❌ | ✅ | ✅ | Jika tidak pakai CF KV |

---

## 3. Cara Menaruh Value

### 3.1 GitHub Actions (build + CI)

```yaml
env:
  PUBLIC_SITE_URL: ${{ vars.PUBLIC_SITE_URL }}
  PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ vars.PUBLIC_CLOUDINARY_CLOUD_NAME }}
  PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${{ vars.PUBLIC_CLOUDINARY_UPLOAD_PRESET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SANITY_API_TOKEN: ${{ secrets.SANITY_API_TOKEN }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 3.2 Cloudflare Workers (runtime secrets)

```bash
wrangler secret put DATABASE_URL
wrangler secret put DATABASE_URL_UNPOOLED
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put AUTH_SECRET
wrangler secret put CSRF_SECRET
wrangler secret put ADMIN_PASSWORD_HASH
wrangler secret put CLOUDINARY_API_KEY
wrangler secret put CLOUDINARY_API_SECRET
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put SENTRY_DSN
```

### 3.3 Cloudflare Workers (runtime vars)

`wrangler.jsonc` → `vars`:

```jsonc
{
  "vars": {
    "NODE_ENV": "production",
    "BETTER_AUTH_URL": "https://portofx.ridwanafazn.dev",
    "AUTH_COOKIE_NAME": "auth_session",
    "AUTH_COOKIE_DOMAIN": "portofx.ridwanafazn.dev",
    "AUTH_COOKIE_SECURE": "true",
    "AUTH_TRUSTED_ORIGINS": "https://portofx.ridwanafazn.dev",
    "CLOUDINARY_CLOUD_NAME": "your-cloud",
    "CLOUDINARY_UPLOAD_PRESET": "ml_default",
    "CLOUDINARY_FOLDER": "portfolio"
  }
}
```

### 3.4 Local dev

`.dev.vars` (root, gitignored):

```bash
DATABASE_URL="postgresql://...-pooler...neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://...neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:4321"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="ml_default"
PUBLIC_SITE_URL="http://localhost:4321"
PUBLIC_CLOUDINARY_CLOUD_NAME="..."
PUBLIC_CLOUDINARY_UPLOAD_PRESET="ml_default"
```

> `astro dev` di Astro 7 + Cloudflare adapter memakai **workerd**; `.dev.vars` adalah sumber lokal yang benar.

---

## 4. Generate Secrets

```bash
# Better Auth
openssl rand -base64 32

# CSRF / revalidate / cron
openssl rand -hex 32

# scrypt hash (Better Auth)
node -e "const { scrypt } = require('@noble/hashes/scrypt'); console.log(Buffer.from(scrypt('password', 'salt', { N: 16384, r: 8, p: 1 })).toString('hex'))"
```

---

## 5. Cloudflare API Token Scopes

Buat di **Dashboard → My Profile → API Tokens → Create Token**:

| Scope | Permission |
|---|---|
| Workers Scripts | Edit |
| Workers KV Storage | Edit |
| Workers R2 Storage | Edit (jika pakai R2) |
| Account Settings | Read |
| Zone | Read (jika custom domain) |

---

## 6. Cloudinary Setup

1. **Dashboard → Cloud name** → `CLOUDINARY_CLOUD_NAME`
2. **Dashboard → API Key** → `CLOUDINARY_API_KEY`
3. **Dashboard → API Secret** → `CLOUDINARY_API_SECRET`
4. **Settings → Upload → Upload presets → Add**:
   - Name: `ml_default`
   - Signing Mode: **Signed**
   - Folder: `portfolio`
   - Allowed formats: `jpg, png, webp, avif, pdf, mp4, mov`
   - Max file size: `20MB`
5. **Settings → Upload → Upload presets** → `CLOUDINARY_UPLOAD_PRESET`

---

## 7. Neon Setup

1. **Neon Console → Project** → `portofx-v2`
2. **Connection Details** → **Pooled** → `DATABASE_URL`
3. **Connection Details** → **Direct** → `DATABASE_URL_UNPOOLED`
4. **Account → API Keys** → `NEON_API_KEY`
5. **Project Settings** → `NEON_PROJECT_ID`
6. **Branches** → `NEON_BRANCH_ID`

---

## 8. Cloudflare Workers Setup

1. **Dashboard → Workers & Pages → Create** → `portofx-v2`
2. **Account ID** → `CLOUDFLARE_ACCOUNT_ID`
3. **Workers → Custom Domains** → `portofx.ridwanafazn.dev`
4. **Zone ID** → `CLOUDFLARE_ZONE_ID`
5. **Workers → Settings → Variables** → `vars` (non-sensitive)
6. **Workers → Settings → Secrets** → `wrangler secret put`

---

> **Update this file** kalau ada env var baru. Commit: `docs(env): add <VAR>`.
