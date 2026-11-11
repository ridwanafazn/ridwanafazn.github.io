// src/lib/db.ts — Neon HTTP singleton (Workers runtime)
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from 'astro:env/server';
import * as schema from '@db/schema';

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
export { schema };
