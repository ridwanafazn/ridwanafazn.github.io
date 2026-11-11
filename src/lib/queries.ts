// src/lib/queries.ts — data access untuk admin (Neon via Drizzle)
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  portfolios,
  assets,
  profile,
  skills,
  activities,
  type PortfolioStatus,
} from '@db/schema';

export type PortfolioRow = typeof portfolios.$inferSelect;

// ─── Portfolios ──────────────────────────────────────────────────────────────

export async function listPortfolios(opts: { status?: string; limit?: number } = {}) {
  const conditions = [isNull(portfolios.deletedAt)];
  if (opts.status) conditions.push(eq(portfolios.status, opts.status as PortfolioStatus));
  return db
    .select()
    .from(portfolios)
    .where(and(...conditions))
    .orderBy(asc(portfolios.order), desc(portfolios.createdAt))
    .limit(opts.limit ?? 100);
}

export async function getPortfolio(id: string) {
  return db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1).then((r) => r[0] ?? null);
}

export async function getPortfolioBySlug(slug: string) {
  return db.select().from(portfolios).where(eq(portfolios.slug, slug)).limit(1).then((r) => r[0] ?? null);
}

export async function createPortfolio(data: Partial<PortfolioRow>) {
  return db.insert(portfolios).values(data as never).returning().then((r) => r[0]);
}

export async function updatePortfolio(id: string, data: Partial<PortfolioRow>) {
  return db
    .update(portfolios)
    .set({ ...data, updatedAt: new Date() } as never)
    .where(eq(portfolios.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

export async function publishPortfolio(id: string) {
  return db
    .update(portfolios)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(portfolios.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

export async function archivePortfolio(id: string) {
  return db
    .update(portfolios)
    .set({ status: 'archived', publishedAt: null, updatedAt: new Date() })
    .where(eq(portfolios.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

export async function softDeletePortfolio(id: string) {
  return db
    .update(portfolios)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(portfolios.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function listAssets(opts: { folder?: string; limit?: number } = {}) {
  const conditions = [isNull(assets.deletedAt)];
  if (opts.folder) conditions.push(eq(assets.folder, opts.folder));
  return db
    .select()
    .from(assets)
    .where(and(...conditions))
    .orderBy(desc(assets.createdAt))
    .limit(opts.limit ?? 100);
}

export async function getAssetUrlMap() {
  const rows = await db
    .select({ id: assets.id, publicId: assets.cloudinaryPublicId })
    .from(assets)
    .where(isNull(assets.deletedAt));
  return new Map(rows.map((r) => [r.id, r.publicId]));
}

export async function createAsset(data: Partial<typeof assets.$inferInsert>) {
  return db.insert(assets).values(data as never).returning().then((r) => r[0]);
}

export async function softDeleteAsset(id: string) {
  return db
    .update(assets)
    .set({ deletedAt: new Date() })
    .where(eq(assets.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

// ─── Profile (singleton) ─────────────────────────────────────────────────────

export async function getProfile() {
  return db.select().from(profile).limit(1).then((r) => r[0] ?? null);
}

export async function upsertProfile(data: Partial<typeof profile.$inferInsert>) {
  const existing = await getProfile();
  if (existing) {
    return db.update(profile).set(data as never).where(eq(profile.id, existing.id)).returning().then((r) => r[0]);
  }
  return db.insert(profile).values(data as never).returning().then((r) => r[0]);
}

// ─── Skills (singleton) ──────────────────────────────────────────────────────

export async function getSkills() {
  return db.select().from(skills).limit(1).then((r) => r[0] ?? null);
}

export async function upsertSkills(data: Partial<typeof skills.$inferInsert>) {
  const existing = await getSkills();
  if (existing) {
    return db.update(skills).set(data as never).where(eq(skills.id, existing.id)).returning().then((r) => r[0]);
  }
  return db.insert(skills).values(data as never).returning().then((r) => r[0]);
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function listActivities() {
  return db
    .select()
    .from(activities)
    .where(isNull(activities.deletedAt))
    .orderBy(asc(activities.order), desc(activities.createdAt))
    .limit(100);
}

export async function createActivity(data: Partial<typeof activities.$inferInsert>) {
  return db.insert(activities).values(data as never).returning().then((r) => r[0]);
}

export async function updateActivity(id: string, data: Partial<typeof activities.$inferInsert>) {
  return db
    .update(activities)
    .set({ ...data, updatedAt: new Date() } as never)
    .where(eq(activities.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

export async function softDeleteActivity(id: string) {
  return db
    .update(activities)
    .set({ deletedAt: new Date() })
    .where(eq(activities.id, id))
    .returning()
    .then((r) => r[0] ?? null);
}

// ─── Users (bootstrap admin) ─────────────────────────────────────────────────

export async function listUsers() {
  return db.select().from(users).limit(50);
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [p] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`(count(*) filter (where ${portfolios.status} = 'published'))::int`,
      draft: sql<number>`(count(*) filter (where ${portfolios.status} = 'draft'))::int`,
    })
    .from(portfolios)
    .where(isNull(portfolios.deletedAt));

  const [a] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assets)
    .where(isNull(assets.deletedAt));

  const [act] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(activities)
    .where(isNull(activities.deletedAt));

  return {
    portfolios: p?.total ?? 0,
    published: p?.published ?? 0,
    draft: p?.draft ?? 0,
    assets: a?.n ?? 0,
    activities: act?.n ?? 0,
  };
}
