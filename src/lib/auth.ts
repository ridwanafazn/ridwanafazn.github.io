// src/lib/auth.ts — Better Auth + Drizzle adapter + scrypt (@noble/hashes)
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, AUTH_TRUSTED_ORIGINS } from 'astro:env/server';
import { db } from './db';
import * as schema from '@db/schema';

const authUrl = BETTER_AUTH_URL || 'http://localhost:4321';

const trustedOrigins = (AUTH_TRUSTED_ORIGINS || authUrl)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: authUrl,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
