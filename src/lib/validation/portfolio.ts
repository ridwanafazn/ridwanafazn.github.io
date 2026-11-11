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
  longDescription: z.string().max(5000).nullable().optional(),
  coverImageId: z.string().uuid().nullable().optional(),
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

export const portfolioUpdateSchema = portfolioCreateSchema.partial();

export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>;
export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
