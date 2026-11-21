---
name: Portofx Design System
description: Aturan visual, motion, dan copy untuk halaman publik portofx-v2. Gunakan setiap kali mengubah src/pages publik, src/components publik, src/styles/global.css, atau menambah section/halaman baru, supaya hasilnya tidak kembali ke default template/AI-slop.
---

# Portofx Design System

Sumber kebenaran: `src/styles/global.css` + `docs/DESIGN.md`. Dokumen ini adalah **aturan kerja**, bukan deskripsi.

## Arah

"Cold Steel": arsip teknis dengan tipografi editorial. Putih netral, tinta, satu aksen orange. Tanpa olive. Tenang, padat, tanpa dekorasi yang tidak membawa informasi.

**Pengecualian:** hero homepage = **HeroAbstract** (poster gelap full-bleed). Di sana gradient/noise/marquee/shadow berwarna/Instrument Serif memang dipakai. Jangan menyalin gaya poster ini ke halaman/section lain, dan jangan “merapikannya” menjadi Cold Steel biasa.

## Token (satu aksen)

```
bg        #F8F7F4   ink        #14160F   muted   #5A5E4E
surface   #F1F2EC   hover      #EAECE4   rule    #D5D8CD / #BFC4B4
accent    #14160F   hover      #2A2C24   soft    #C9CBC2  (struktur netral)
signal    #D9480F   hover      #9A3309   text    #C2410C
display   Bricolage Grotesque 500   body  Public Sans  data  JetBrains Mono
```

- **Tidak ada olive.** `accent` adalah nama lama untuk struktur netral (ink); jangan menambahkan hijau/olive ke token.
- **Orange = satu-satunya warna**: `#D9480F` hanya untuk non-teks/teks besar; `#C2410C` untuk teks kecil dan fill CTA. Jangan pakai vivid orange untuk teks 12px (4.30:1 dengan putih). Jangan jadikan orange latar halaman.
- `#D9480F` di atas putih 4.01:1; `#C2410C` 4.83:1; putih di atas `#C2410C` 5.18:1. Jangan turunkan latar ke krem — itu yang membuat palet terbaca pucet.
- Radius maksimum `rounded-lg` untuk kartu; tombol dan badge `rounded-none`/`rounded`.
- Tanpa gradient, tanpa glow, tanpa `backdrop-blur` (kecuali overlay lightbox), tanpa shadow berwarna.

## Dilarang

1. Kicker/eyebrow di atas heading (label kecil uppercase sebelum `h1`/`h2`). Heading harus bicara sendiri.
2. Kartu bersarang (card di dalam card).
3. Bento grid sebagai struktur halaman.
4. `text-justify`.
5. Teks fungsional < 12px.
6. Lebar prosa > 75ch.
7. Angka besar + label kecil sebagai hero metric.
8. Numbering section (01/02/03) kecuali urutannya memang informasi.
9. Animasi masuk yang identik di setiap section; maksimal dua gesture per halaman.
10. `opacity: 0` sebagai default konten (harus lewat `html.js`).
11. Material Symbols / icon font. Ikon = inline SVG dari `src/components/Icon.astro`.
12. Warna di luar token; jangan pakai kelas `slate-*`, `gray-*`, `blue-*` langsung.
13. Orange sebagai latar halaman; satu bidang gelap (band ink) sudah cukup.
14. Orange vivid `#D9480F` untuk teks kecil atau tombol berteks putih.

## Struktur halaman

- **Hero homepage**: HeroAbstract — `Software Engineer` h1 besar dua baris, `Keep it simple, make it scale.` subtext kecil, cutout portrait di tengah, app GIS Sentry di kanan. Tanpa CTA/stiker dan tanpa label app. Navbar lama (kotak rounded) digate muncul setelah 70% tinggi hero. Hero 7/5 + globe lama tidak dipakai di homepage. Di ≤980px app mengambang di kanan setinggi mulut, bukan baris penuh di bawah copy.
- **Strip data**: hairline grid `gap-px bg-outline`, sel `bg-background`.
- **Daftar proyek**: `ProjectLedger` (baris berindeks). Jangan kembali ke carousel/card grid.
- **Case study**: h1 + meta plate (Peran/Stack/Tautan) → narasi → Hasil → Galeri → Proyek berikutnya.
- **Narasi**: `longDescription` dipecah oleh `## Heading`; prosa `max-w-[60ch]` (Public Sans sempit — 68ch menghasilkan ~89 karakter per baris).
- **GitHub**: heatmap 12 bulan setelah Tech Stack. Skala 5 langkah (`outline` → `on-background`), orange `signal` hanya level tertinggi. Mobile scroll horizontal mulai minggu terbaru. Jangan tampilkan angka besar atau feed `PushEvent`.

## Motion

- Native saja: CSS transition/transform, IntersectionObserver, `requestAnimationFrame`. Tanpa GSAP/Framer.
- Hormati `prefers-reduced-motion`; konten tetap terlihat tanpa JS.
- Globe/three.js tidak dipakai di homepage (HeroGlobe tidak di-render). HeroAbstract memakai entrance, marquee, app float, dan nav gate; semuanya berhenti di `prefers-reduced-motion`.

## Gambar

- Cloudinary, `c_limit` + `q_auto,f_auto`. Galeri: `srcset` `w_480/800/1600` + `sizes`.
- Foto hero: `public/images/ridwan-cutout.webp` (123 KB) + PNG fallback; jangan ganti ke Cloudinary tanpa update CSP/path. App window memakai screenshot GIS Sentry Cloudinary.
- OG: 1200×630, `c_fill,g_auto` (lihat `ogImage` di `src/lib/content.ts`).
- Selalu `width`/`height` atau aspect-ratio; `loading="lazy"` kecuali di atas fold.

## Copy

- Bahasa Indonesia untuk UI; istilah teknis boleh Inggris (stack, deploy).
- CTA menyebut aksinya ("Lihat semua 20 gambar", bukan "Klik di sini").
- Tanpa tanda seru, tanpa superlatif.

## Sebelum selesai

1. `pnpm typecheck` dan `pnpm build` hijau.
2. `npx impeccable detect http://localhost:4321/<halaman>?v=$(date +%s)` → 0 anti-pattern (advisory boleh).
3. Lighthouse: a11y 100, SEO 100 di `/`, `/projects`, `/projects/[slug]`.
4. Cek 390px dan 1280px: tidak ada overflow horizontal, tidak ada teks terpotong.
5. Konten terlihat dengan JavaScript dimatikan (reveal tidak boleh menyembunyikan).
6. **Update `.md` terkait di commit yang sama** — peta dokumen ada di `docs/AGENTS.md` §3 “Dokumentasi”. Minimal: `docs/HANDOFF.md` untuk state/versi, `docs/DESIGN.md` untuk UI/token.
