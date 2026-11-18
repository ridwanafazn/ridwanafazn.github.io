// db/seed.ts — Dev-only seed data (admin + password + konten contoh)
import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { db } from './client';
import { users, accounts, portfolios, profile, skills, activities } from './schema';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@portofx.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin12345';

async function seed() {
  console.log('Seeding...');

  // ─── Admin user ───────────────────────────────────────────────────────────
  let admin = (await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1))[0];

  if (!admin) {
    admin = (
      await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          name: 'Ridwan Afazn',
          emailVerified: true,
          role: 'admin',
        })
        .returning()
    )[0];
    console.log('✓ Admin user dibuat:', admin.email);
  } else {
    console.log('• Admin user sudah ada:', admin.email);
  }

  // ─── Credential account (password) ────────────────────────────────────────
  const existingAccount = (
    await db.select().from(accounts).where(eq(accounts.userId, admin.id)).limit(1)
  )[0];

  if (!existingAccount) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: admin.id,
      accountId: admin.id,
      providerId: 'credential',
      password: passwordHash,
    });
    console.log(`✓ Credential account dibuat — login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log('• Credential account sudah ada — password tidak diubah.');
  }

  // ─── Content contoh ───────────────────────────────────────────────────────
  const profileExists = (await db.select().from(profile).limit(1))[0];
  if (!profileExists) {
    await db.insert(profile).values({
      name: 'Ridwan Afazn',
      role: 'Fullstack Developer',
      tagline: 'Building things for the web',
      bio: 'Fullstack developer focused on backend, databases, and edge computing.',
      stats: [
        { label: 'Years', value: '3+' },
        { label: 'Projects', value: '20+' },
      ],
    });
  }

  const skillsExists = (await db.select().from(skills).limit(1))[0];
  if (!skillsExists) {
    await db.insert(skills).values({
      categories: [
        {
          category: 'Language',
          items: ['JavaScript', 'TypeScript', 'Golang', 'PHP', 'Python', 'Java', 'Rust', 'SQL', 'Dart', 'Kotlin'],
        },
        {
          category: 'Backend',
          items: ['Express.js', 'NestJS', 'Go Gin', 'FastAPI', 'Spring Boot', 'Actix Web', 'Laravel', 'ASP.NET Core'],
        },
        {
          category: 'Frontend',
          items: ['React', 'Next.js', 'Astro', 'Vue', 'Laravel', 'Alpine.js', 'Flutter'],
        },
        {
          category: 'Cloud and Infrastructure',
          items: ['AWS', 'GCP', 'Cloudflare', 'Supabase', 'Neon', 'Cloudinary', 'Docker'],
        },
        {
          category: 'Architecture and Integrations',
          items: ['REST', 'gRPC', 'WebSocket', 'RAG', 'CAG', 'KAG', 'Recommendation System', 'CNN Computer Vision'],
        },
      ],
    });
  }

  await db
    .insert(portfolios)
    .values({
      slug: 'sample-project',
      title: 'Sample Project',
      role: 'Fullstack Developer',
      description: 'A sample project for seed data.',
      techStack: ['React', 'Astro', 'Neon'],
      highlights: ['Feature 1', 'Feature 2'],
      status: 'published',
      isTopProject: true,
    })
    .onConflictDoNothing();

  await db
    .insert(activities)
    .values({
      slug: 'sample-activity',
      type: 'Volunteer',
      title: 'Sample Activity',
      organization: 'Sample Org',
      description: 'Sample activity for seed data.',
    })
    .onConflictDoNothing();

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
