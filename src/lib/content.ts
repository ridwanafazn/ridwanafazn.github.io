// src/lib/content.ts — data layer publik (Neon via Drizzle)
import { and, asc, eq, isNull } from 'drizzle-orm';
import { PUBLIC_CLOUDINARY_CLOUD_NAME } from 'astro:env/client';
import { db } from './db';
import { portfolios, profile, skills, activities, assets } from '@db/schema';
import type { Project, Profile, SkillCategory, Activity } from '../types';

const publishedOnly = and(eq(portfolios.status, 'published'), isNull(portfolios.deletedAt));

function cdn(publicId: string, w = 1200) {
  return `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_${w},q_auto,f_auto/${publicId}`;
}

async function assetMap() {
  const rows = await db
    .select({ id: assets.id, publicId: assets.cloudinaryPublicId })
    .from(assets)
    .where(isNull(assets.deletedAt));
  return new Map(rows.map((r) => [r.id, r.publicId]));
}

function toProject(
  row: typeof portfolios.$inferSelect,
  byId: Map<string, string>,
): Project {
  const coverPublicId = row.coverImageId ? byId.get(row.coverImageId) : undefined;
  const gallery: { url: string; caption?: string; alt?: string }[] = [];
  for (const g of row.gallery ?? []) {
    const publicId = byId.get(g.assetId);
    if (!publicId) continue;
    gallery.push({ url: cdn(publicId, 1400), caption: g.caption, alt: g.alt });
  }

  return {
    id: row.slug,
    title: row.title,
    role: row.role,
    description: row.description,
    longDescription: row.longDescription ?? undefined,
    techStack: row.techStack ?? [],
    highlights: row.highlights ?? [],
    isTopProject: row.isTopProject,
    coverImage: coverPublicId ? cdn(coverPublicId, 1200) : undefined,
    gallery,
    links: row.links ?? [],
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const [rows, byId] = await Promise.all([
    db
      .select()
      .from(portfolios)
      .where(publishedOnly)
      .orderBy(asc(portfolios.order), asc(portfolios.createdAt)),
    assetMap(),
  ]);
  if (!rows.length) {
    throw new Error('[content] Tidak ada portfolio published di Neon. Jalankan migrasi/seed dulu.');
  }
  return rows.map((r) => toProject(r, byId));
}

export async function getTopProjects(): Promise<Project[]> {
  const [rows, byId] = await Promise.all([
    db
      .select()
      .from(portfolios)
      .where(and(publishedOnly, eq(portfolios.isTopProject, true)))
      .orderBy(asc(portfolios.order), asc(portfolios.createdAt)),
    assetMap(),
  ]);
  if (!rows.length) {
    throw new Error('[content] Tidak ada project featured (isTopProject=true) di Neon.');
  }
  return rows.map((r) => toProject(r, byId));
}

export async function getProjectById(id: string): Promise<Project> {
  const [row, byId] = await Promise.all([
    db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.slug, id), publishedOnly))
      .limit(1),
    assetMap(),
  ]);
  if (!row[0]) throw new Error(`[content] Project "${id}" tidak ditemukan di Neon.`);
  return toProject(row[0], byId);
}

export async function getProfile(): Promise<Profile> {
  const row = (await db.select().from(profile).limit(1))[0];
  if (!row) throw new Error('[content] Profile belum ada di Neon.');
  return {
    name: row.name,
    nickname: row.nickname ?? '',
    role: row.role,
    tagline: row.tagline ?? '',
    bio: row.bio ?? '',
    cvUrl: row.cvUrl ?? '',
    currentFocus: row.currentFocus ?? { title: '', description: '' },
    stats: row.stats ?? [],
    experience: row.experience ?? [],
    education: row.education ?? [],
    certifications: row.certifications ?? [],
    howIBuild: row.howIBuild ?? { summary: '', steps: [], why: '' },
  };
}

export async function getSkills(): Promise<SkillCategory[]> {
  const row = (await db.select().from(skills).limit(1))[0];
  if (!row?.categories?.length) throw new Error('[content] Skills kosong di Neon.');
  return row.categories;
}

export async function getActivities(): Promise<Activity[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(isNull(activities.deletedAt))
    .orderBy(asc(activities.order), asc(activities.createdAt));
  if (!rows.length) throw new Error('[content] Activities kosong di Neon.');
  return rows.map((a) => ({
    id: a.slug,
    type: a.type,
    title: a.title,
    organization: a.organization,
    description: a.description ?? '',
    highlights: a.highlights ?? [],
  }));
}
