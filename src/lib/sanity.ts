// src/lib/sanity.ts
// Query data dari Sanity via GROQ.
// Konten sepenuhnya berasal dari Sanity — tidak ada fallback JSON lokal.
// Kalau Sanity kosong atau tidak bisa diakses, build sengaja GAGAL KERAS
// supaya halaman kosong tidak pernah ikut ter-deploy diam-diam.

import { createClient } from '@sanity/client';
import type { Project, Profile, SkillCategory, Activity } from '../types';

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'exvebwem',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

function fail(what: string, hint: string): never {
  const { projectId, dataset } = sanityClient.config();
  throw new Error(
    `[sanity] ${what} kosong atau tidak bisa diambil. ${hint} ` +
      `Cek koneksi ke project "${projectId}" / dataset "${dataset}", lalu pastikan ` +
      `dokumennya sudah diisi dan di-publish di Sanity Studio. ` +
      `Build dihentikan supaya halaman kosong tidak ter-deploy.`
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  const data = await sanityClient.fetch<Project[]>(
    `*[_type == "project"] | order(order asc, _createdAt asc) {
      "id": id.current,
      title,
      role,
      description,
      longDescription,
      techStack,
      highlights,
      isTopProject,
      status,
      links[] { label, url, icon }
    }`
  );
  if (!data?.length) fail('Daftar project', 'Tidak ada dokumen bertipe "project".');
  return data;
}

export async function getTopProjects(): Promise<Project[]> {
  const data = await sanityClient.fetch<Project[]>(
    `*[_type == "project" && isTopProject == true] | order(order asc, _createdAt asc) {
      "id": id.current,
      title,
      role,
      description,
      techStack,
      highlights,
      isTopProject,
      status,
      links[] { label, url, icon }
    }`
  );
  if (!data?.length) fail('Project unggulan', 'Tidak ada project dengan isTopProject == true.');
  return data;
}

export async function getProjectById(id: string): Promise<Project> {
  const data = await sanityClient.fetch<Project | null>(
    `*[_type == "project" && id.current == $id][0] {
      "id": id.current,
      title,
      role,
      description,
      longDescription,
      techStack,
      highlights,
      isTopProject,
      status,
      links[] { label, url, icon }
    }`,
    { id }
  );
  if (!data) fail(`Project "${id}"`, 'Slug-nya tidak ada di dataset.');
  return data;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile> {
  const data = await sanityClient.fetch<Profile | null>(
    `*[_type == "profile" && _id == "singleton-profile"][0] {
      name,
      nickname,
      role,
      tagline,
      bio,
      stats[] { label, value },
      currentFocus { title, description },
      experience[] { role, organization, period, description },
      education[] { institution, degree, gpa, highlights },
      certifications[] { name, issuer },
      howIBuild { summary, steps[] { step, detail }, why }
    }`
  );
  if (!data) fail('Profil', 'Dokumen "singleton-profile" tidak ditemukan.');
  return data;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export async function getSkills(): Promise<SkillCategory[]> {
  const result = await sanityClient.fetch<{ categories: SkillCategory[] } | null>(
    `*[_type == "skills" && _id == "singleton-skills"][0] {
      categories[] { category, items }
    }`
  );
  if (!result?.categories?.length) {
    fail('Skill', 'Dokumen "singleton-skills" belum punya isi categories.');
  }
  return result.categories;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function getActivities(): Promise<Activity[]> {
  const data = await sanityClient.fetch<Activity[]>(
    `*[_type == "activity"] | order(_createdAt asc) {
      "id": id.current,
      type,
      title,
      organization,
      description,
      highlights
    }`
  );
  if (!data?.length) fail('Activity', 'Tidak ada dokumen bertipe "activity".');
  return data;
}
