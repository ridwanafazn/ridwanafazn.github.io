// scripts/update-smile-fest-links.js
// Jalankan: node scripts/update-smile-fest-links.js
// Butuh env: SANITY_API_TOKEN (token dengan permission write)
// Windows: $env:SANITY_API_TOKEN="your-token"; node scripts/update-smile-fest-links.js
// Linux/Mac: SANITY_API_TOKEN="your-token" node scripts/update-smile-fest-links.js

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'exvebwem',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // Harus di-set di environment
  useCdn: false,
});

const newLinks = [
  { label: 'FE App', url: 'https://smile-festival.pages.dev/', icon: 'open_in_new' },
  { label: 'FE Repo', url: 'https://github.com/ridwanafazn/smile-fest', icon: 'code' },
  { label: 'BE Repo', url: 'https://github.com/ridwanafazn/smile-fest-api', icon: 'code' },
  { label: 'API Server', url: 'https://smile-fest-api.up.railway.app', icon: 'cloud' },
  { label: 'API Docs (Swagger)', url: 'https://smile-fest-api.up.railway.app/swagger/index.html', icon: 'description' },
  { label: 'Instagram', url: 'https://www.instagram.com/ringkaibinar.project/', icon: 'link' },
];

async function updateSmileFestLinks() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ Error: SANITY_API_TOKEN tidak diset. Set di environment variable.');
    console.log('Contoh: $env:SANITY_API_TOKEN="your-token"; node scripts/update-smile-fest-links.js');
    process.exit(1);
  }

  try {
    // 1. Cari document ID project smile-fest
    const project = await client.fetch(
      `*[_type == "project" && id.current == "smile-fest"][0]{ _id, title, links }`
    );

    if (!project) {
      console.error('❌ Project "smile-fest" tidak ditemukan di Sanity.');
      process.exit(1);
    }

    console.log(`📋 Project ditemukan: ${project.title} (${project._id})`);
    console.log('🔗 Links saat ini:', project.links || 'kosong');

    // 2. Update links (replace semua)
    const result = await client
      .patch(project._id)
      .set({ links: newLinks })
      .commit();

    console.log('✅ Berhasil update links!');
    console.log('📝 Links baru:');
    newLinks.forEach((link, i) => console.log(`  ${i + 1}. ${link.label}: ${link.url} (icon: ${link.icon})`));

  } catch (err) {
    console.error('❌ Gagal update:', err.message);
    process.exit(1);
  }
}

updateSmileFestLinks();