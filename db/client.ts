// db/client.ts — Neon HTTP singleton (scripts/CI)
import dotenv from 'dotenv';
// ESM: body executes after imports, jadi config ini jalan sebelum baca process.env.
dotenv.config({ path: ['.env.local', '.env'] });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL belum di-set. Isi di .env.local (lihat .env.example) lalu jalankan lagi.',
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
