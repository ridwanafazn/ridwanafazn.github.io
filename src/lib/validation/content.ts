// src/lib/validation/content.ts
import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1).max(100),
  nickname: z.string().max(50).optional(),
  role: z.string().min(1).max(100),
  tagline: z.string().max(200).optional(),
  bio: z.string().optional(),
  cvUrl: z.string().url().max(500).optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  currentFocus: z.object({ title: z.string(), description: z.string() }).optional(),
  experience: z.array(z.object({
    role: z.string(),
    organization: z.string(),
    period: z.string(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    gpa: z.string(),
    highlights: z.array(z.string()),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
  })).optional(),
  howIBuild: z.object({
    summary: z.string(),
    steps: z.array(z.object({ step: z.string(), detail: z.string() })),
    why: z.string(),
  }).optional(),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
  }).optional(),
});

export const skillsSchema = z.object({
  categories: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })).default([]),
});

export const activitySchema = z.object({
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-]+$/),
  type: z.enum(['Volunteer', 'Publication', 'Leadership']),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  description: z.string().optional(),
  highlights: z.array(z.string().max(200)).default([]),
  order: z.number().int().default(0),
});

export const pageSchema = z.object({
  path: z.string().min(1).max(180).regex(/^\/[a-z0-9-]*$/),
  title: z.string().min(1).max(200),
  blocks: z.array(z.object({
    type: z.string(),
    content: z.record(z.string(), z.unknown()),
    order: z.number(),
  })).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    ogImage: z.string().url().optional(),
  }).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SkillsInput = z.infer<typeof skillsSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type PageInput = z.infer<typeof pageSchema>;
