// scripts/add-open-house-project.js
// Jalankan: node scripts/add-open-house-project.js
// Butuh env: SANITY_API_TOKEN (token dengan permission write)
// Windows: $env:SANITY_API_TOKEN="your-token"; node scripts/add-open-house-project.js
// Linux/Mac: SANITY_API_TOKEN="your-token" node scripts/add-open-house-project.js

import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'exvebwem',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const openHouseProject = {
  _type: 'project',
  id: { current: 'open-house' },
  title: 'Open House SMKIT Assyiifa',
  role: 'Fullstack Developer',
  description:
    'Platform pendaftaran & check-in digital untuk Open House SMKIT Assyiifa. Menggantikan proses manual kertas dengan sistem real-time: formulir validasi server-side, QR code unik per pendaftar, dashboard admin dengan scanner QR, dan analitik pendaftar live — semua di-deploy ke Cloudflare Workers dengan biaya ~$0.',
  longDescription:
    'Open House SMKIT Assyiifa adalah sistem pendaftaran dan check-in digital yang dibangun untuk menggantikan proses manual berbasis kertas di acara Open House SMKIT Assyiifa.\n\n**Latar Belakang**\nSebelumnya, panitia mencatat pendaftar manual di buku tamu, kemudian mengetik ulang ke spreadsheet untuk rekap. Proses ini rawan kesalahan, lambat, dan sulit diverifikasi saat check-in.\n\n**Solusi**\nAplikasi fullstack dengan arsitektur:\n- **Frontend (Astro SSR + React islands)**: Halaman publik landing, formulir pendaftaran dengan validasi real-time, halaman e-ticket, dan pencarian tiket.\n- **Backend (Astro API Routes)**: Endpoint pendaftaran, lookup tiket, generate QR, dan export CSV.\n- **Database (Supabase/PostgreSQL)**: Menyimpan data pendaftar, tiket, status check-in, dan pengaturan event.\n- **Auth Admin**: Session berbasis HTTP-only cookie + argon2 hash, rate-limit login.\n- **QR Code**: Dibuat per tiket (UUID v4), di-render server-side via API, dicetak ke PDF/e-ticket.\n- **Scanner Admin**: html5-qrcode di browser, verifikasi real-time ke Supabase, optimistik UI.\n- **Deploy**: Cloudflare Workers via @astrojs/cloudflare (edge SSR), biaya minim, latency rendah global.\n\n**Fitur Utama**\n- Formulir pendaftaran multi-step dengan validasi Zod (client + server)\n- Generate QR code unik per pendaftar (UUID v4)\n- E-ticket PDF dengan desain brand SMKIT Assyiifa\n- Dashboard admin: statistik real-time, daftar pendaftar, filter, pagination\n- Scanner QR code di browser (tanpa app terpisah)\n- Export CSV untuk rekap akhir\n- UTM tracking otomatis untuk analitik sumber pendaftar\n- Rate limiting & proteksi CSRF\n- Responsive, accessible, PWA-ready\n\n**Hasil & Dampak**\n- 151+ pendaftar terverifikasi dalam 2 hari event\n- Waktu check-in < 3 detik per orang\n- Zero data loss, zero duplikat tiket\n- Panitia menghemat ~20 jam kerja manual\n- Biaya hosting ~$0/bulan (Cloudflare Workers free tier)',
  techStack: [
    'Astro 5 (SSR)',
    'React 19 (Islands)',
    'TypeScript',
    'Tailwind CSS 4',
    'Supabase (PostgreSQL)',
    'Cloudflare Workers',
    'Zod',
    'html5-qrcode',
    'QRCode.js',
    'Argon2',
    'Vitest',
    'Playwright',
  ],
  highlights: [
    '151+ pendaftar terverifikasi dalam 2 hari event',
    'Waktu check-in < 3 detik per orang',
    'Zero data loss & zero duplikat tiket',
    'Biaya hosting ~$0/bulan (Cloudflare Workers free tier)',
    'Fullstack type-safe: Astro API + Supabase + Zod',
    'Edge SSR global latency < 100ms',
  ],
  isTopProject: true,
  status: 'Live',
  order: 1,
  links: [
    { label: 'Live App', url: 'https://smkit-assyifa-ophs.ridwanafzn.workers.dev/', icon: 'open_in_new' },
    { label: 'Repository', url: 'https://github.com/ridwanafazn/form-open-house', icon: 'code' },
  ],
};

async function addOpenHouseProject() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ Error: SANITY_API_TOKEN tidak diset. Set di environment variable.');
    console.log('Contoh: $env:SANITY_API_TOKEN="your-token"; node scripts/add-open-house-project.js');
    process.exit(1);
  }

  try {
    // Cek apakah project sudah ada
    const existing = await client.fetch(
      `*[_type == "project" && id.current == "open-house"][0]{ _id, title }`
    );

    if (existing) {
      console.log(`⚠️ Project "open-house" sudah ada: ${existing.title} (${existing._id})`);
      console.log('Mengupdate project yang sudah ada...');

      const result = await client
        .patch(existing._id)
        .set(openHouseProject)
        .commit();

      console.log('✅ Berhasil update project Open House!');
      console.log(`📝 Document ID: ${result._id}`);
      return;
    }

    // Buat project baru
    const result = await client.create(openHouseProject);
    console.log('✅ Berhasil buat project Open House baru!');
    console.log(`📝 Document ID: ${result._id}`);
    console.log('🔗 Links:');
    openHouseProject.links.forEach((link, i) => {
      console.log(`  ${i + 1}. ${link.label}: ${link.url} (icon: ${link.icon})`);
    });

  } catch (err) {
    console.error('❌ Gagal:', err.message);
    if (err.response) {
      console.error('Detail:', JSON.stringify(err.response.body, null, 2));
    }
    process.exit(1);
  }
}

addOpenHouseProject();