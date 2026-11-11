// db/schema/enums.ts
export const PortfolioStatus = ['draft', 'published', 'archived'] as const;
export type PortfolioStatus = typeof PortfolioStatus[number];

export const BlockType = [
  'hero', 'gallery', 'text', 'video', 'embed', 'tech_stack', 'links', 'divider',
] as const;
export type BlockType = typeof BlockType[number];

export const ActivityType = ['Volunteer', 'Publication', 'Leadership'] as const;
export type ActivityType = typeof ActivityType[number];

export const UserRole = ['admin', 'editor'] as const;
export type UserRole = typeof UserRole[number];
