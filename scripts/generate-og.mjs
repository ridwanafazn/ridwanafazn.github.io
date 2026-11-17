// Generate kartu share statis 1200x630 (OG/Twitter).
// Jalankan: node scripts/generate-og.mjs
// Menghasilkan public/og.svg (sumber) + public/og.png (dipakai meta og:image).
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const W = 1200;
const H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#E2E5D6"/>
  <rect x="72" y="66" width="10" height="10" fill="#C2410C"/>
  <text x="96" y="76" font-family="Consolas, 'Courier New', monospace" font-size="19" letter-spacing="4" fill="#565847">RIDWAN AFAZN</text>

  <text x="72" y="300" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="116" letter-spacing="-4" fill="#17180F">Software</text>
  <text x="72" y="408" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="116" letter-spacing="-4" fill="#17180F">Engineer<tspan fill="#C2410C">.</tspan></text>

  <line x1="72" y1="472" x2="1128" y2="472" stroke="#B3B2A0" stroke-width="1"/>
  <text x="72" y="545" font-family="'Segoe UI', Arial, sans-serif" font-size="27" fill="#565847">Keep it simple, make it scale.</text>
  <text x="1128" y="545" text-anchor="end" font-family="Consolas, 'Courier New', monospace" font-size="21" fill="#565847">ridwanafazn.my.id</text>
</svg>`;

await mkdir('public', { recursive: true });
await writeFile('public/og.svg', svg, 'utf8');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');

console.log('Wrote public/og.svg and public/og.png');
