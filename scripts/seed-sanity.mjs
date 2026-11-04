#!/usr/bin/env node
// scripts/seed-sanity.mjs
// Seed / update project "Open House" di Sanity.
// Jalankan: pnpm seed:sanity

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || 'exvebwem';
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('❌ SANITY_API_TOKEN tidak ditemukan di .env');
  console.error('   Buat token di Sanity: Settings → API → Add API token (Editor/Admin)');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const DOC_ID = 'project-open-house';
const SLUG = 'open-house';

const openHouseProject = {
  _id: DOC_ID,
  _type: 'project',
  // Field `id` di schema Sanity bertipe slug (dibaca sebagai id.current di GROQ)
  id: { _type: 'slug', current: SLUG },
  title: 'Open House',
  role: 'Fullstack Engineer',
  description:
    'Platform pendaftaran & tiket digital Open House berbasis Astro SSR + Cloudflare Workers. Real-time attendance, QR check-in, notifikasi WhatsApp via Fonnte, dan admin dashboard terpusat.',
  longDescription:
    'Sistem lengkap untuk mengelola acara Open House sekolah: form pendaftaran multi-step dengan validasi ketat (phone, email, NIK), e-ticket PDF + QR code unik per peserta, check-in real-time via scanner QR (html5-qrcode), notifikasi WhatsApp otomatis melalui Fonnte API, dan admin dashboard dengan pencarian, filter, export CSV, serta pengaturan event. Dibangun dengan Astro 7 (SSR), React 19, Supabase (PostgreSQL + Realtime), Tailwind CSS 4, dan dideploy ke Cloudflare Workers untuk performa edge global.',
  techStack: [
    'Astro 7 SSR',
    'React 19',
    'TypeScript',
    'Supabase',
    'Cloudflare Workers',
    'Tailwind CSS 4',
    'Motion',
    'html5-qrcode',
    'Fonnte API',
    'Leaflet',
  ],
  highlights: [
    'SSR + Island Architecture untuk SEO & performa optimal',
    'Real-time attendance dengan Supabase Realtime',
    'QR check-in cepat via html5-qrcode',
    'Notifikasi WhatsApp otomatis (Fonnte)',
    'Admin dashboard: scan, search, export CSV, settings',
    'Deploy ke Cloudflare Workers (edge, zero cold-start)',
    'Validasi ketat: phone (E.164), email, NIK, duplikasi',
    'E-ticket PDF + QR code unik per peserta',
  ],
  isTopProject: false,
  status: 'Production',
  links: [
    {
      label: 'Live App',
      url: 'https://smkit-assyifa-ophs.ridwanafzn.workers.dev/',
      icon: 'open_in_new',
    },
    {
      label: 'GitHub Repo',
      url: 'https://github.com/ridwanafazn/form-open-house',
      icon: 'code',
    },
  ],
};

async function seed() {
  console.log(`🌱 Seeding ke Sanity: ${projectId}/${dataset}...`);

  try {
    // Bersihkan dokumen lama hasil seed pertama (id masih berupa string, sehingga id.current null)
    const legacy = await client.fetch(
      `*[_type == "project" && (title == "Open House SMKIT Assyifa" || (id.current == $slug && _id != $docId))]{ _id }`,
      { slug: SLUG, docId: DOC_ID }
    );
    for (const doc of legacy) {
      await client.delete(doc._id);
      console.log(`🧹 Hapus dokumen lama: ${doc._id}`);
    }

    const result = await client.createOrReplace(openHouseProject);
    console.log('✅ Tersimpan:', result._id, `(slug: ${SLUG})`);
    console.log('\n🎉 Selesai! Refresh /projects untuk melihat kartu "Open House".');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
