// db/schema/portfolio.ts — Fase 1: flat + cover + gallery
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { PortfolioStatus, BlockType } from './enums';

export const statusEnum = pgEnum('portfolio_status', PortfolioStatus);
export const blockTypeEnum = pgEnum('block_type', BlockType);

// assets dulu agar portfolios.coverImageId bisa reference
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
