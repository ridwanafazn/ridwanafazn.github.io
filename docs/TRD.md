# TRD — Technical Requirements Document
## Portofx v2: Astro 7 Static + per-route SSR + Neon + Custom Admin Panel

> **Version**: 1.1 (koreksi Astro 7 / Cloudflare Workers / Better Auth)
> **Status**: 🟡 Draft — Aligned dengan PRD v2.0
> **Stack**: Astro 7.4.5, Drizzle ORM 0.45.4, Neon Postgres 1.2.0, Better Auth 1.7.20, Cloudinary, Cloudflare Workers 14.4.7

> **Koreksi penting dibanding v1.0:**
> - `output: 'hybrid'` **sudah dihapus** di Astro 7 → pakai `output: 'static'` + `export const prerender = false` per route.
> - `Lucia` **deprecated** → pakai **Better Auth**.
> - `argon2` **tidak jalan di Workers** → pakai **scrypt** (`@noble/hashes`, sudah dibawa Better Auth).
> - `@astrojs/cloudflare` v14 **tidak mendukung Cloudflare Pages** → pakai **Cloudflare Workers** (`wrangler deploy`).
> - `wrangler.toml` → **`wrangler.jsonc`**, `main = "@astrojs/cloudflare/entrypoints/server"`.
> - Secrets **tidak boleh** di `[vars]` → `wrangler secret put`.

> **Koreksi v1.2 (state aktual, 2026-11-11):**
> - **Public pages sekarang SSR + edge cache 60s** (`s-maxage=60`), bukan prerendered — agar edit admin langsung tampil.
> - Cache HTML diimplementasikan di `src/middleware.ts` via `caches.default`.
> - Sitemap: **`/sitemap.xml`** (SSR + cache 60s, bukan `sitemap-index.xml`).
> - `/preview/*` wajib login (guard middleware yang sama dengan admin).
> - Sanity **sudah dihapus**; data di Neon. Admin panel & galeri sudah jalan.
> - Detail state: **`docs/HANDOFF.md`**.

---

## 1. Arsitektur Sistem (Detail)

### 1.1 Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE NETWORK                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              CLOUDFLARE WORKERS (Astro 7.4.5)                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Public Pages │  │  /admin/*    │  │ /preview/*   │              │    │
│  │  │  (SSR+cache) │  │  (SSR)       │  │  (SSR)       │              │    │
│  │  │  HTML 60s    │  │  Better Auth │  │  Auth guard  │              │    │
│  │  │  Drizzle/Neon│  │  Drizzle/Neon│  │  Drizzle/Neon│              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   NEON POSTGRES     │   │    CLOUDINARY       │   │  CLOUDFLARE KV      │
│   (Primary DB)      │   │    (Asset CDN)      │   │  (Rate Limit,       │
│   - Drizzle ORM     │   │   - Signed Upload   │   │   Session cache,    │
│   - Branch per env  │   │   - Transform URL   │   │   Deploy hooks)     │
│   - HTTP Driver     │   │   - Auto WebP/AVIF  │   │                     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### 1.2 Request Flow

#### Public Page (Prerendered) — `/`, `/projects`, `/projects/[id]`
```
User → Cloudflare Edge → Static Assets (ASSETS binding) → 200 OK (HTML)
                                    ↑
                              Build time: `astro build`
                              Generates static files ke `dist/`
                              Deploy via `wrangler deploy`
```

#### Admin Page (SSR) — `/admin/portfolio`
```
User → Cloudflare Edge → Worker (Astro SSR)
                    │
                    ├── Middleware: Better Auth session
                    │       ├── Valid → locals.user = user, continue
                    │       └── Invalid → Redirect /admin/login
                    │
                    ├── Route: /admin/portfolio
                    │       ├── Drizzle query Neon (HTTP)
                    │       ├── Render AdminLayout + React Islands
                    │       └── Return HTML + Hydration script
                    │
                    └── Response → User
```

#### Preview Page (SSR) — `/preview/portfolio/[slug]`
```
User → Cloudflare Edge → Worker (Astro SSR)
                    │
                    ├── Middleware: Optional auth (preview bisa public dengan secret token)
                    │
                    ├── Route: /preview/portfolio/[slug]
                    │       ├── Query Neon: portfolio WHERE slug = $1 AND status = 'draft'
                    │       ├── If found → Render Public Layout + Data
                    │       ├── Inject banner "MODE PREVIEW" + toolbar "Kembali ke Edit"
                    │       └── Return HTML
                    │
                    └── Response → User
```

---

## 2. Database Schema (Drizzle ORM)

### 2.1 Enum & Type Definitions

```typescript
// db/schema/enums.ts
export const PortfolioStatus = ['draft', 'published', 'archived'] as const;
export type PortfolioStatus = typeof PortfolioStatus[number];

export const BlockType = [
  'hero', 'gallery', 'text', 'video', 'embed', 'tech_stack', 'links', 'divider'
] as const;
export type BlockType = typeof BlockType[number];

export const ActivityType = ['Volunteer', 'Publication', 'Leadership'] as const;
export type ActivityType = typeof ActivityType[number];

export const UserRole = ['admin', 'editor'] as const;
export type UserRole = typeof UserRole[number];
```

### 2.2 Auth Tables (Better Auth compatible)

```typescript
// db/schema/auth.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { UserRole } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: varchar('role', { length: 20 }).$type<UserRole>().default('admin').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('users_email_idx').on(t.email),
]);

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('sessions_user_id_idx').on(t.userId),
  index('sessions_token_idx').on(t.token),
  index('sessions_expires_at_idx').on(t.expiresAt),
]);

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 100 }).notNull(),
  password: text('password'), // scrypt hash (Better Auth)
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('accounts_user_id_idx').on(t.userId),
  uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
]);

export const verifications = pgTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('verifications_identifier_idx').on(t.identifier),
  index('verifications_expires_at_idx').on(t.expiresAt),
]);
```

### 2.3 Portfolio Tables (Fase 1: flat + cover + gallery)

```typescript
// db/schema/portfolio.ts
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { PortfolioStatus, BlockType } from './enums';

const statusEnum = pgEnum('portfolio_status', PortfolioStatus);
const blockTypeEnum = pgEnum('block_type', BlockType);

export const portfolios = pgTable('portfolios', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 180 }).unique().notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  coverImageId: uuid('cover_image_id').references(() => assets.id, { onDelete: 'set null' }),
  gallery: jsonb('gallery').$type<{
    assetId: string;
    caption?: string;
    alt?: string;
  }[]>().default([]),
  techStack: text('tech_stack').array().default([]).notNull(),
  highlights: text('highlights').array().default([]).notNull(),
  links: jsonb('links').$type<{
    label: string;
    url: string;
    icon: string;
  }[]>().default([]),
  isTopProject: boolean('is_top_project').default(false).notNull(),
  status: statusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  seo: jsonb('seo').$type<{
    title?: string;
    description?: string;
    ogImage?: string;
    noIndex?: boolean;
  }>(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('portfolios_status_idx').on(t.status),
  index('portfolios_slug_idx').on(t.slug),
  index('portfolios_order_idx').on(t.order),
  index('portfolios_deleted_at_idx').on(t.deletedAt),
]);

// Fase 3 — optional; v1 tetap render flat fields
export const portfolioBlocks = pgTable('portfolio_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id').references(() => portfolios.id, { onDelete: 'cascade' }).notNull(),
  type: blockTypeEnum('type').notNull(),
  content: jsonb('content').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('portfolio_blocks_portfolio_id_idx').on(t.portfolioId),
  index('portfolio_blocks_order_idx').on(t.portfolioId, t.order),
]);

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }).unique().notNull(),
  originalName: varchar('original_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes'),
  format: varchar('format', { length: 20 }),
  folder: varchar('folder', { length: 100 }).default('portfolio'),
  tags: text('tags').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('assets_folder_idx').on(t.folder),
  index('assets_created_at_idx').on(t.createdAt),
  index('assets_deleted_at_idx').on(t.deletedAt),
]);
```

### 2.4 Content Tables (Fase 1 + Fase 4)

```typescript
// db/schema/content.ts
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { ActivityType } from './enums';

const activityTypeEnum = pgEnum('activity_type', ActivityType);

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Singleton: hanya 1 row, enforce via application logic
  name: varchar('name', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 50 }),
  role: varchar('role', { length: 100 }).notNull(),
  tagline: varchar('tagline', { length: 200 }),
  bio: text('bio'),
  stats: jsonb('stats').$type<{ label: string; value: string }[]>().default([]),
  currentFocus: jsonb('current_focus').$type<{ title: string; description: string }>(),
  experience: jsonb('experience').$type<{
    role: string;
    organization: string;
    period: string;
    description?: string;
  }[]>().default([]),
  education: jsonb('education').$type<{
    institution: string;
    degree: string;
    gpa: string;
    highlights: string[];
  }[]>().default([]),
  certifications: jsonb('certifications').$type<{
    name: string;
    issuer: string;
  }[]>().default([]),
  howIBuild: jsonb('how_i_build').$type<{
    summary: string;
    steps: { step: string; detail: string }[];
    why: string;
  }>(),
  seo: jsonb('seo').$type<{ title?: string; description?: string }>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Singleton
  categories: jsonb('categories').$type<{
    category: string;
    items: string[];
  }[]>().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 180 }).unique().notNull(),
  type: activityTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  organization: varchar('organization', { length: 200 }).notNull(),
  description: text('description'),
  highlights: text('highlights').array().default([]),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('activities_type_idx').on(t.type),
  index('activities_order_idx').on(t.order),
]);

// Fase 4 — page builder untuk / dan /about
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  path: varchar('path', { length: 180 }).unique().notNull(), // '/', '/about'
  title: varchar('title', { length: 200 }).notNull(),
  blocks: jsonb('blocks').$type<{
    type: BlockType;
    content: Record<string, unknown>;
    order: number;
  }[]>().default([]),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  seo: jsonb('seo').$type<{ title?: string; description?: string; ogImage?: string }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('pages_path_idx').on(t.path),
]);
```

### 2.5 Zod Schemas (Validation Layer)

```typescript
// src/lib/validation/portfolio.ts
import { z } from 'zod';

export const portfolioBlockSchemas = {
  hero: z.object({
    headline: z.string().min(1).max(200),
    subheadline: z.string().max(300).optional(),
    ctaText: z.string().max(50).optional(),
    ctaLink: z.string().url().optional(),
    backgroundAssetId: z.string().uuid().optional(),
    alignment: z.enum(['left', 'center', 'right']).default('left'),
  }),
  gallery: z.object({
    layout: z.enum(['grid', 'masonry', 'carousel']).default('grid'),
    columns: z.number().min(1).max(4).default(3),
    images: z.array(z.object({
      assetId: z.string().uuid(),
      caption: z.string().max(200).optional(),
      alt: z.string().max(200).optional(),
    })).min(1),
  }),
  text: z.object({
    content: z.string().min(1),
    size: z.enum(['sm', 'base', 'lg', 'xl']).default('base'),
    alignment: z.enum(['left', 'center', 'right']).default('left'),
  }),
  video: z.object({
    provider: z.enum(['youtube', 'vimeo', 'cloudinary', 'direct']),
    videoId: z.string().min(1),
    title: z.string().max(200).optional(),
    caption: z.string().max(300).optional(),
    autoplay: z.boolean().default(false),
    loop: z.boolean().default(false),
  }),
  embed: z.object({
    url: z.string().url(),
    title: z.string().max(200).optional(),
    description: z.string().max(300).optional(),
    width: z.number().min(200).max(1200).default(800),
    height: z.number().min(150).max(800).default(450),
  }),
  tech_stack: z.object({
    title: z.string().max(100).default('Tech Stack'),
    categories: z.array(z.object({
      name: z.string().max(50),
      items: z.array(z.string().max(30)),
    })).min(1),
  }),
  links: z.object({
    items: z.array(z.object({
      label: z.string().max(50),
      url: z.string().url(),
      icon: z.string().max(50),
      variant: z.enum(['primary', 'secondary', 'outline']).default('outline'),
    })).min(1),
  }),
  divider: z.object({
    label: z.string().max(50).optional(),
    style: z.enum(['solid', 'dashed', 'dotted', 'gradient']).default('solid'),
  }),
} as const;

export const portfolioBlockUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), content: portfolioBlockSchemas.hero }),
  z.object({ type: z.literal('gallery'), content: portfolioBlockSchemas.gallery }),
  z.object({ type: z.literal('text'), content: portfolioBlockSchemas.text }),
  z.object({ type: z.literal('video'), content: portfolioBlockSchemas.video }),
  z.object({ type: z.literal('embed'), content: portfolioBlockSchemas.embed }),
  z.object({ type: z.literal('tech_stack'), content: portfolioBlockSchemas.tech_stack }),
  z.object({ type: z.literal('links'), content: portfolioBlockSchemas.links }),
  z.object({ type: z.literal('divider'), content: portfolioBlockSchemas.divider }),
]);

export type PortfolioBlock = z.infer<typeof portfolioBlockUnion>;

// v1 — flat fields (Fase 1)
export const portfolioCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
  role: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  longDescription: z.string().max(5000).optional(),
  coverImageId: z.string().uuid().optional(),
  gallery: z.array(z.object({
    assetId: z.string().uuid(),
    caption: z.string().max(200).optional(),
    alt: z.string().max(200).optional(),
  })).default([]),
  techStack: z.array(z.string().max(30)).min(1).default([]),
  highlights: z.array(z.string().max(200)).default([]),
  links: z.array(z.object({
    label: z.string().max(50),
    url: z.string().url(),
    icon: z.string().max(50),
  })).default([]),
  isTopProject: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  order: z.number().int().default(0),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    ogImage: z.string().url().optional(),
    noIndex: z.boolean().default(false),
  }).optional(),
  // Fase 3 — optional
  blocks: z.array(portfolioBlockUnion).optional(),
});

export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>;
```

---

## 3. API Routes (Astro Endpoints)

### 3.1 Auth Routes

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/admin/login` | Login form | Public |
| POST | `/api/auth/*` | Better Auth handler (sign-in, sign-out, session) | Public / Required |
| GET | `/admin/me` | Current user info | Required |

### 3.2 Portfolio Admin Routes

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/admin/api/portfolio` | List (paginated, filter, sort) | Required |
| POST | `/admin/api/portfolio` | Create new draft | Required |
| GET | `/admin/api/portfolio/[id]` | Get single (with flat fields + optional blocks) | Required |
| PATCH | `/admin/api/portfolio/[id]` | Update draft | Required |
| POST | `/admin/api/portfolio/[id]/duplicate` | Clone to new draft | Required |
| POST | `/admin/api/portfolio/[id]/publish` | Promote draft → published | Required |
| POST | `/admin/api/portfolio/[id]/archive` | Published → archived | Required |
| DELETE | `/admin/api/portfolio/[id]` | Soft delete (draft only) | Required |

### 3.3 Asset Routes

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/admin/api/assets` | List (paginated, folder filter) | Required |
| POST | `/admin/api/assets/sign-upload` | Generate Cloudinary signed upload params | Required |
| DELETE | `/admin/api/assets/[id]` | Delete from Cloudinary + DB | Required |

### 3.4 Preview Route

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/preview/portfolio/[slug]` | Render draft portfolio (public atau token) | Optional |

---

## 4. Frontend Architecture

### 4.1 Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://portofx.ridwanafazn.dev',
  base: '/',
  // Astro 7: 'hybrid' sudah dihapus. Default 'static' + prerender=false per route.
  output: 'static',
  adapter: cloudflare({
    // v14: tidak ada opsi 'platform' lagi; Cloudflare Pages tidak didukung.
    imageService: 'passthrough', // Cloudinary yang menangani gambar
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@neondatabase/serverless'], // native module; argon2 TIDAK dipakai
    },
  },
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
  compressHTML: true,
  prefetch: true,
});
```

### 4.2 Middleware (Auth Guard)

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, redirect } = context;
  const path = new URL(request.url).pathname;

  // Public paths
  const publicPaths = ['/admin/login', '/api/auth'];
  const isPublic = publicPaths.some(p => path.startsWith(p));

  // Better Auth session
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    locals.user = session.user;
    locals.session = session.session;
  }

  // Protect admin routes
  if (path.startsWith('/admin') && !isPublic && !locals.user) {
    return redirect(`/admin/login?redirect=${encodeURIComponent(path)}`);
  }

  // Redirect logged-in users from login page
  if (path === '/admin/login' && locals.user) {
    return redirect('/admin');
  }

  return next();
});
```

### 4.3 React Islands (Admin UI Only)

```
src/components/ui/          # Shadcn/UI primitives (Button, Input, Dialog, Table, etc.)
src/components/admin/       # Admin-specific islands
  ├── PortfolioTable.tsx    # TanStack Table + row actions
  ├── PortfolioForm.tsx     # React Hook Form + Zod + flat fields
  ├── BlockEditor.tsx       # Fase 3: sortable blocks (dnd-kit)
  ├── AssetPicker.tsx       # Cloudinary Media Library Widget wrapper
  ├── CloudinaryUpload.tsx  # Signed upload component
  └── PreviewToolbar.tsx    # Floating bar di preview mode
```

### 4.4 Hydration Strategy

| Component | Hydration | Reason |
|---|---|---|
| Public pages | `client:visible` **tidak dipakai** | Zero JS, pure Astro HTML |
| Admin Layout | `client:idle` | Sidebar, navigation, theme toggle |
| PortfolioTable | `client:visible` | Sort, filter, paginate, row actions |
| PortfolioForm | `client:load` | Complex form, validation, flat fields |
| BlockEditor | `client:load` | Fase 3: drag-drop, dynamic forms |
| AssetPicker | `client:visible` | Cloudinary widget lazy load |
| PreviewToolbar | `client:load` | Persistent floating UI |

---

## 5. Cloudinary Integration

### 5.1 Signed Upload (Server-side Signature)

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { env } from 'astro:env/server';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function getSignedUploadParams(folder = 'portfolio') {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
  };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
  return { ...params, signature, api_key: env.CLOUDINARY_API_KEY };
}

export function getTransformUrl(publicId: string, options: {
  width?: number; height?: number; quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif'; crop?: 'fill' | 'scale' | 'thumb';
}) {
  return cloudinary.url(publicId, {
    transformation: [
      { width: options.width, height: options.height, crop: options.crop || 'scale' },
      { quality: options.quality || 'auto', fetch_format: options.format || 'auto' },
    ],
    secure: true,
  });
}

export async function deleteAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
```

### 5.2 Upload Preset Configuration (Cloudinary Dashboard)

```
Name: portfolio_admin_signed
Signing Mode: Signed
Folder: portfolio (dynamic via param)
Allowed Formats: jpg, png, webp, avif, pdf, mp4, mov
Max File Size: 20MB
Transformation on Upload:
  - quality: auto
  - fetch_format: auto
  - width: 1920 (max)
  - height: 1080 (max)
  - crop: limit
Eager Transformations:
  - thumbnail: w_400,h_300,c_fill,q_auto,f_auto
  - medium: w_800,q_auto,f_auto
  - large: w_1600,q_auto,f_auto
```

---

## 6. Deployment & CI/CD

### 6.1 Wrangler Configuration (`wrangler.jsonc`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "portofx-v2",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-05-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "observability": { "enabled": true },
  "vars": {
    "NODE_ENV": "production",
    "BETTER_AUTH_URL": "https://portofx.ridwanafazn.dev",
    "AUTH_COOKIE_NAME": "auth_session",
    "AUTH_COOKIE_DOMAIN": "portofx.ridwanafazn.dev",
    "AUTH_COOKIE_SECURE": "true",
    "AUTH_TRUSTED_ORIGINS": "https://portofx.ridwanafazn.dev",
    "CLOUDINARY_CLOUD_NAME": "your-cloud",
    "CLOUDINARY_UPLOAD_PRESET": "portfolio_admin_signed",
    "CLOUDINARY_FOLDER": "portfolio"
  },
  "env": {
    "preview": {
      "vars": {
        "NODE_ENV": "preview",
        "BETTER_AUTH_URL": "https://preview.portofx.ridwanafazn.dev"
      }
    }
  }
}
```

> **Secrets** (jangan di `vars`):
> ```bash
> wrangler secret put DATABASE_URL
> wrangler secret put DATABASE_URL_UNPOOLED
> wrangler secret put BETTER_AUTH_SECRET
> wrangler secret put AUTH_SECRET
> wrangler secret put CSRF_SECRET
> wrangler secret put ADMIN_PASSWORD_HASH
> wrangler secret put CLOUDINARY_API_KEY
> wrangler secret put CLOUDINARY_API_SECRET
> wrangler secret put TURNSTILE_SECRET_KEY
> wrangler secret put RESEND_API_KEY
> wrangler secret put SENTRY_DSN
> ```

### 6.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22.12.0'
  PNPM_VERSION: '12.14.0'

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: ${{ env.PNPM_VERSION }} }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: ${{ env.PNPM_VERSION }} }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test --run

  db-migrate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: ${{ env.PNPM_VERSION }} }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm db:migrate --dry-run
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}

  build:
    needs: [lint-typecheck, test, db-migrate-check]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: ${{ env.PNPM_VERSION }} }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }}, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          PUBLIC_SITE_URL: ${{ vars.PUBLIC_SITE_URL }}
          PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ vars.PUBLIC_CLOUDINARY_CLOUD_NAME }}
          PUBLIC_CLOUDINARY_UPLOAD_PRESET: ${{ vars.PUBLIC_CLOUDINARY_UPLOAD_PRESET }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist/ }
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist/ }
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

---

## 7. Security Checklist

| Area | Implementation |
|---|---|
| **Authentication** | Better Auth 1.7.20, scrypt (`@noble/hashes`), Secure/HttpOnly/SameSite=Lax cookies |
| **Authorization** | Middleware guard `/admin/*`, RBAC (admin/editor), API route checks |
| **Rate Limiting** | Cloudflare KV binding `RATE_LIMIT`: login 5/min/IP, API 100/min/user |
| **CSRF** | Better Auth built-in + `CSRF_SECRET`; SameSite=Lax + Origin check |
| **XSS** | Astro auto-escape; sanitize Markdown (DOMPurify) sebelum `dangerouslySetInnerHTML` |
| **SQL Injection** | Drizzle ORM parameterized queries, no raw SQL |
| **Secrets** | `wrangler secret put`, tidak di repo; `.dev.vars` untuk local |
| **CSP** | `Content-Security-Policy` header via middleware |
| **HTTPS** | Cloudflare forced HTTPS, HSTS header |
| **Dependencies** | `pnpm audit`, Dependabot alerts, pin versions |
| **Noindex** | `X-Robots-Tag: noindex` + meta robots untuk `/preview/*` dan `/admin/*` |

---

## 8. Monitoring & Observability

| Tool | Purpose | Integration |
|---|---|---|
| **Sentry** | Error tracking (client + server) | `@sentry/astro`, `@sentry/cloudflare` |
| **Logtail** | Structured logs (Workers) | `@cloudflare/workers-logtail` |
| **Neon Insights** | Query performance, connections | Built-in dashboard |
| **Cloudflare Analytics** | Requests, bandwidth, errors | Dashboard |
| **Lighthouse CI** | Performance regression | GitHub Action `treosh/lighthouse-ci-action` |

---

## 9. Migration Strategy (Sanity → Neon)

### 9.1 Fase 1: Flat fields (v1)

Migrasi **flat** dulu: `title`, `role`, `description`, `longDescription`, `techStack`, `highlights`, `links`, `isTopProject`, `status`, `order`, `coverImage`, `gallery`. `portfolio_blocks` dan `pages` **tidak** diisi di Fase 1; baru di Fase 3/4.

### 9.2 One-Time Migration Script

```typescript
// scripts/migrate-sanity-to-neon.ts
import { createClient } from '@sanity/client';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { portfolios, assets, profile, skills, activities } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' });

const sanity = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle(sql);

async function migrate() {
  console.log('🚀 Starting Sanity → Neon migration...');

  // 1. Projects (flat)
  const projects = await sanity.fetch(`*[_type == "project"] | order(order asc) {
    _id, id, title, role, description, longDescription, techStack, highlights,
    isTopProject, status, order, links[] { label, url, icon }, coverImage
  }`);

  for (const p of projects) {
    const slug = p.id?.current || p._id.replace('project-', '');
    await db.insert(portfolios).values({
      slug,
      title: p.title,
      role: p.role,
      description: p.description,
      longDescription: p.longDescription,
      techStack: p.techStack || [],
      highlights: p.highlights || [],
      links: p.links || [],
      isTopProject: p.isTopProject || false,
      status: p.status === 'Live' ? 'published' : 'draft',
      order: p.order || 0,
      seo: { title: p.title, description: p.description },
      createdAt: new Date(p._createdAt),
      updatedAt: new Date(p._updatedAt),
    }).onConflictDoNothing({ target: portfolios.slug });

    // Cover image → assets (jika ada)
    if (p.coverImage?.asset?._ref) {
      // Fetch asset detail dari Sanity, insert ke assets table, lalu update cover_image_id
    }
  }

  // 2. Profile (singleton)
  const profileData = await sanity.fetch(`*[_type == "profile" && _id == "singleton-profile"][0]`);
  if (profileData) {
    await db.insert(profile).values({
      name: profileData.name,
      nickname: profileData.nickname,
      role: profileData.role,
      tagline: profileData.tagline,
      bio: profileData.bio,
      stats: profileData.stats || [],
      currentFocus: profileData.currentFocus,
      experience: profileData.experience || [],
      education: profileData.education || [],
      certifications: profileData.certifications || [],
      howIBuild: profileData.howIBuild,
    }).onConflictDoNothing();
  }

  // 3. Skills (singleton)
  const skillsData = await sanity.fetch(`*[_type == "skills" && _id == "singleton-skills"][0]`);
  if (skillsData) {
    await db.insert(skills).values({
      categories: skillsData.categories || [],
    }).onConflictDoNothing();
  }

  // 4. Activities
  const activitiesData = await sanity.fetch(`*[_type == "activity"] | order(_createdAt asc)`);
  for (const a of activitiesData) {
    await db.insert(activities).values({
      slug: a.id?.current || a._id,
      type: a.type,
      title: a.title,
      organization: a.organization,
      description: a.description,
      highlights: a.highlights || [],
      order: a.order || 0,
    }).onConflictDoNothing({ target: activities.slug });
  }

  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
```

### 9.3 Fase 3: Blocks (opsional)

Setelah admin CRUD flat berjalan, tambahkan `portfolio_blocks` dan ubah halaman detail publik untuk render blocks. Data lama tetap valid; `longDescription`/`highlights`/`techStack`/`links` bisa dipetakan ke blocks.

---

## 10. Rollback Plan

| Scenario | Rollback Action |
|---|---|
| **Build fails di CI** | Revert commit; `main` tetap deploy production lama (GitHub Pages) |
| **Workers error 500** | `wrangler rollback` ke deployment sebelumnya (< 30 detik) |
| **Neon migration corrupt** | Neon Branch PITR (Point-in-Time Recovery) ke sebelum migrasi |
| **Auth broken** | Disable middleware sementara via feature flag env var |
| **Cloudinary upload fail** | Fallback ke local `public/assets` + static serve (dev only) |

---

> **Next**: Lihat `/docs/ERD.md` untuk diagram ER visual, `/docs/TASKS.md` untuk checklist actionable per fase, `/docs/DESIGN.md` untuk keputusan UI/UX, `/docs/ENV.md` untuk environment variables.
