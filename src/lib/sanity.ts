// src/lib/sanity.ts
// Helper functions untuk query data dari Sanity via GROQ
// Fallback ke JSON lokal saat Sanity dataset kosong / belum diisi

import { sanityClient } from 'sanity:client';
import type { Project, Profile, SkillCategory, Activity } from '../types';

// JSON fallbacks
import profileJson from '../data/profile.json';
import projectsJson from '../data/projects.json';
import skillsJson from '../data/skills.json';
import activitiesJson from '../data/activities.json';

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
  return data?.length ? data : (projectsJson as Project[]);
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
  if (data?.length) return data;
  return (projectsJson as Project[]).filter((p) => p.isTopProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
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
  if (data) return data;
  return (projectsJson as Project[]).find((p) => p.id === id) ?? null;
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
      currentFocus,
      experience[] { role, organization, period, description },
      education[] { institution, degree, gpa, highlights },
      certifications[] { name, issuer },
      howIBuild { summary, steps[] { step, detail }, why }
    }`
  );
  return data ?? (profileJson as unknown as Profile);
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export async function getSkills(): Promise<SkillCategory[]> {
  const result = await sanityClient.fetch<{ categories: SkillCategory[] } | null>(
    `*[_type == "skills" && _id == "singleton-skills"][0] {
      categories[] { category, items }
    }`
  );
  return result?.categories?.length ? result.categories : (skillsJson as SkillCategory[]);
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
  return data?.length ? data : (activitiesJson as Activity[]);
}
