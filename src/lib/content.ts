// src/lib/content.ts — data layer publik (Neon via Drizzle)
import { and, asc, eq, isNull } from 'drizzle-orm';
import { PUBLIC_CLOUDINARY_CLOUD_NAME } from 'astro:env/client';
import { db } from './db';
import { portfolios, profile, skills, activities, assets } from '@db/schema';
import type { Project, Profile, SkillCategory, Activity } from '../types';

const publishedOnly = and(eq(portfolios.status, 'published'), isNull(portfolios.deletedAt));

function fileName(publicId: string) {
  const last = publicId.split('/').pop() ?? publicId;
  return last.replace(/\.[^.]+$/, '');
}

function cdn(publicId: string, w = 1600) {
  // c_limit = pertahankan rasio asli (tanpa crop), q_auto/f_auto = versi ringan.
  return `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_limit,w_${w},q_auto,f_auto/${publicId}`;
}

function ogImage(publicId: string) {
  // 1200x630 untuk kartu share (OG/Twitter), crop pintar.
  return `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_1200,h_630,g_auto,q_auto,f_auto/${publicId}`;
}

// Koma bisa dibaca sebagai pemisah kandidat di atribut `srcset`, sedangkan
// transformasi Cloudinary memakai koma. Encode khusus untuk srcset agar aman
// di semua parser; URL tunggal (`src`) tetap memakai koma asli.
function srcSet(publicId: string, widths: number[]) {
  return widths
    .map((width) => `${cdn(publicId, width).replace(/,/g, '%2C')} ${width}w`)
    .join(', ');
}

type AssetMeta = { publicId: string; width: number | null; height: number | null };

async function assetMap() {
  const rows = await db
    .select({
      id: assets.id,
      publicId: assets.cloudinaryPublicId,
      width: assets.width,
      height: assets.height,
    })
    .from(assets)
    .where(isNull(assets.deletedAt));
  return new Map<string, AssetMeta>(rows.map((r) => [r.id, r]));
}

function toProject(
  row: typeof portfolios.$inferSelect,
  byId: Map<string, AssetMeta>,
): Project {
  const cover = row.coverImageId ? byId.get(row.coverImageId) : undefined;
  const coverPublicId = cover?.publicId;
  // Dimensi asli ikut dikirim agar kartu galeri bisa memesan lebar
  // (tinggi seragam, lebar = rasio gambar) sebelum gambar selesai dimuat.
  const gallery: {
    url: string;
    srcset?: string;
    width?: number;
    height?: number;
    caption?: string;
    alt?: string;
    name?: string;
  }[] = [];
  let firstGalleryPublicId: string | undefined;
  for (const g of row.gallery ?? []) {
    const asset = byId.get(g.assetId);
    if (!asset) continue;
    const { publicId } = asset;
    firstGalleryPublicId ??= publicId;
    gallery.push({
      url: cdn(publicId, 1600),
      srcset: srcSet(publicId, [480, 800, 1600]),
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
      caption: g.caption,
      alt: g.alt,
      name: fileName(publicId),
    });
  }

  const sharePublicId = coverPublicId ?? firstGalleryPublicId;

  return {
    id: row.slug,
    title: row.title,
    role: row.role,
    description: row.description,
    longDescription: row.longDescription ?? undefined,
    techStack: row.techStack ?? [],
    highlights: row.highlights ?? [],
    isTopProject: row.isTopProject,
    coverImage: coverPublicId ? cdn(coverPublicId, 1600) : undefined,
    previewImage: sharePublicId ? cdn(sharePublicId, 480) : undefined,
    ogImage: sharePublicId ? ogImage(sharePublicId) : undefined,
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
  // Data kosong bukan error server: halaman menampilkan empty state.
  return rows.map((r) => toProject(r, byId));
}

export async function getTopProjects(): Promise<Project[]> {
  const [rows, byId] = await Promise.all([
    db
      .select()
      .from(portfolios)
      .where(publishedOnly)
      .orderBy(asc(portfolios.order), asc(portfolios.createdAt)),
    assetMap(),
  ]);
  // Kalau belum ada yang ditandai featured, pakai 3 project teratas supaya
  // homepage tidak 500 hanya karena flag `is_top_project` belum diisi.
  const featured = rows.filter((row) => row.isTopProject);
  const chosen = featured.length > 0 ? featured : rows.slice(0, 3);
  return chosen.map((r) => toProject(r, byId));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const [row, byId] = await Promise.all([
    db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.slug, id), publishedOnly))
      .limit(1),
    assetMap(),
  ]);
  // `null` = memang tidak ada (halaman 404). Error DB tetap dilempar supaya
  // tampil sebagai 500, bukan disamarkan jadi "tidak ditemukan".
  if (!row[0]) return null;
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
  // Array kosong = tampilan Tech Stack memberi empty state, bukan 500.
  return row?.categories ?? [];
}

export async function getActivities(): Promise<Activity[]> {
  const rows = await db
    .select()
    .from(activities)
    .where(isNull(activities.deletedAt))
    .orderBy(asc(activities.order), asc(activities.createdAt));
  return rows.map((a) => ({
    id: a.slug,
    type: a.type,
    title: a.title,
    organization: a.organization,
    description: a.description ?? '',
    highlights: a.highlights ?? [],
  }));
}
