// db/schema/content.ts — Fase 1 + Fase 4
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { ActivityType, BlockType } from './enums';

export const activityTypeEnum = pgEnum('activity_type', ActivityType);

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Singleton: hanya 1 row, enforce via application logic
  name: varchar('name', { length: 100 }).notNull(),
  nickname: varchar('nickname', { length: 50 }),
  role: varchar('role', { length: 100 }).notNull(),
  tagline: varchar('tagline', { length: 200 }),
  bio: text('bio'),
  cvUrl: varchar('cv_url', { length: 500 }),
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
  path: varchar('path', { length: 180 }).unique().notNull(),
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
