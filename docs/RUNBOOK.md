# RUNBOOK — Deploy, Rollback, Incident

> **Stack**: Astro 7.4.5 (SSR public + cache 60s) + Cloudflare Workers + Neon + Cloudinary + Better Auth
> **Live**: https://portofx-v2.ridwanafzn.workers.dev
> **Deploy**: `pnpm build` lalu `wrangler deploy` (bukan `wrangler pages deploy`)
> **Domain target**: `https://ridwanafazn.my.id` (pending pindah NS ke Cloudflare)

---

## 1. Prerequisites

```bash
# Node 22.12+
node -v

# pnpm 12.14+
pnpm -v

# Wrangler 4.125+
pnpm exec wrangler --version

# Login Cloudflare
pnpm exec wrangler login
```

Pastikan:

- [ ] `wrangler.jsonc` sudah ada
- [ ] KV bindings `SESSION` sudah dibuat (`0caf957ffab8428687ada2d8bef1e809`)
- [ ] Secrets sudah di-set (`wrangler secret list`)
- [ ] Neon project + branches sudah ada (`odd-rice-47100012` / `main`)
- [ ] Cloudinary upload preset sudah dibuat (`ml_default`, Signed)
- [ ] `DATABASE_URL` / `DATABASE_URL_UNPOOLED` valid
- [ ] `BETTER_AUTH_SECRET` valid

---

## 2. Local Development

```bash
# Install
pnpm install --frozen-lockfile

# Dev (workerd)
pnpm dev

# Preview production-like
pnpm build
pnpm preview

# DB
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:seed
```

> **Catatan:** `astro dev` di Astro 7 + Cloudflare adapter memakai **workerd**. Jangan pakai `wrangler dev` untuk aplikasi Astro; gunakan `astro dev` / `astro preview`.

---

## 3. Deploy Production

### 3.1 Manual

```bash
# 1. Build (PUBLIC_* = production; sitemap sekarang SSR, tidak query DB saat build)
$env:PUBLIC_SITE_URL='https://ridwanafazn.my.id'
$env:PUBLIC_SITE_NAME='Ridwan Afazn'
$env:PUBLIC_CLOUDINARY_CLOUD_NAME='a5e2n4lq'
$env:PUBLIC_CLOUDINARY_UPLOAD_PRESET='ml_default'
pnpm build

# 2. Deploy ke Workers
pnpm deploy

# 3. Verify
pnpm exec wrangler deployments list
curl -I https://portofx-v2.ridwanafzn.workers.dev
```

**Secrets (sekali / saat rotasi):**
```bash
# file JSON: {"KEY":"value", ...}
pnpm exec wrangler secret bulk .secrets.json
pnpm exec wrangler secret list
```

**Catatan cache:** public pages + `/sitemap.xml` SSR dengan cache 60 dtk (`s-maxage=60`). Setelah edit admin, tunggu ≤60 dtk atau buka `?v=timestamp` (bypass total; response `x-cache: BYPASS`).

### 3.2 CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

- `push` ke `main` → build + deploy production
- `pull_request` → build + deploy preview (`wrangler deploy --env preview`)

### 3.3 Deploy Preview

```bash
pnpm deploy:preview
```

### 3.4 Deploy Command

```bash
pnpm exec wrangler deploy
```

---

## 4. Rollback

### 4.1 Workers Rollback

```bash
# Lihat deployment
pnpm exec wrangler deployments list

# Rollback ke versi sebelumnya
pnpm exec wrangler rollback

# Rollback ke versi tertentu
pnpm exec wrangler rollback <deployment-id>
```

### 4.2 Database Rollback (Neon PITR)

1. Neon Console → **Branches** → **Restore**
2. Pilih **Point-in-Time** sebelum migrasi
3. Restore ke branch baru (jangan overwrite `main`)
4. Update `DATABASE_URL` / `DATABASE_URL_UNPOOLED` ke branch restore
5. Deploy ulang

### 4.3 Code Rollback

```bash
git revert <commit-sha>
git push origin main
```

---

## 5. Incident Response

### 5.1 500 Error di Workers

```bash
# 1. Lihat logs
pnpm exec wrangler tail

# 2. Cek error di Sentry
# 3. Cek Neon status
# 4. Rollback jika perlu
pnpm exec wrangler rollback
```

### 5.2 Auth Broken

```bash
# 1. Cek BETTER_AUTH_SECRET / BETTER_AUTH_URL
pnpm exec wrangler secret list

# 2. Cek session table
pnpm db:studio

# 3. Test login
curl -i https://portofx.ridwanafazn.dev/api/auth/get-session
```

### 5.3 Neon Connection Error

```bash
# 1. Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# 2. Cek Neon status
# 3. Cek pooled vs direct
# 4. Cek IP allowlist / Neon IP Allow
```

### 5.4 Cloudinary Upload Error

```bash
# 1. Cek signature
# 2. Cek upload preset (signed mode)
# 3. Cek CORS
# 4. Test manual
curl -X POST https://api.cloudinary.com/v1_1/<cloud>/image/upload
```

### 5.5 Build Gagal

```bash
# 1. Local build
pnpm build

# 2. Cek typecheck
pnpm typecheck

# 3. Cek env
pnpm exec astro check

# 4. Rollback
git revert <commit-sha>
```

---

## 6. Monitoring

| Tool | URL | Cek |
|---|---|---|
| **Cloudflare Workers** | Dashboard → Workers → `portofx-v2` | Requests, errors, CPU |
| **Cloudflare Analytics** | Dashboard → Analytics | Traffic, bandwidth |
| **Neon** | Console → Project → Insights | Query, connections, storage |
| **Sentry** | sentry.io → `portofx-v2` | Errors, traces |
| **Cloudinary** | Dashboard → Media Library | Storage, transformations |

---

## 7. Backup & Restore

### 7.1 Neon Backup

```bash
# Logical backup (pg_dump)
pg_dump "$DATABASE_URL_UNPOOLED" -Fc -f backups/neon-$(date +%Y%m%d).dump

# Restore
pg_restore -d "$DATABASE_URL_UNPOOLED" backups/neon-YYYYMMDD.dump
```

### 7.2 Sanity Backup (legacy)

```bash
sanity dataset export production backups/sanity-$(date +%Y%m%d).tar.gz
```

### 7.3 Cloudinary Backup

- Cloudinary free tier tidak menyediakan backup otomatis.
- Simpan `public_id` di `assets` table; asset asli bisa di-download ulang dari Cloudinary.
- Optional: backup ke R2/S3 via cron.

---

## 8. Custom Domain (status: PENDING)

Saat ini `ridwanafazn.my.id` ada di NS `dnscloud.id` dan mengarah ke GitHub Pages.

1. Cloudflare Dashboard → **Add a site** → `ridwanafazn.my.id` (Free).
2. Ganti nameserver di registrar ke NS Cloudflare.
3. Tunggu zone **Active**.
4. Workers → `portofx-v2` → **Custom Domains** → add `ridwanafazn.my.id` (+ `www`).
5. Hapus `public/CNAME`; disable GitHub Pages.
6. Verify:

```bash
curl -I https://ridwanafazn.my.id
```

---

## 9. Secrets Management

```bash
# List
pnpm exec wrangler secret list

# Put
pnpm exec wrangler secret put <KEY>

# Delete
pnpm exec wrangler secret delete <KEY>

# Local
# .dev.vars (gitignored)
```

---

## 10. Rollback Points

| Tag | Description |
|---|---|
| `sanity-era` | Last commit before migration |
| `phase1-complete` | After Neon + Drizzle + migration |
| `phase2-complete` | After Static + CF + Auth |
| `phase3-complete` | After Admin core CRUD |
| `phase4-complete` | After Preview/Publish |
| `v2.0.0` | Production release |

---

> **Update this file** setiap ada perubahan deploy/rollback. Commit: `docs(runbook): update ...`.
