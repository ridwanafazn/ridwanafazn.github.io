---
name: Portofx Design System
description: Aturan visual, motion, dan copy untuk halaman publik portofx-v2. Gunakan setiap kali mengubah src/pages publik, src/components publik, src/styles/global.css, atau menambah section/halaman baru, supaya hasilnya tidak kembali ke default template/AI-slop.
---

# Portofx Design System

Sumber kebenaran: `src/styles/global.css` + `docs/DESIGN.md`. Dokumen ini adalah **aturan kerja**, bukan deskripsi.

## Arah

"Ledger": arsip teknis dengan tipografi editorial. Kertas mineral olive, tinta, satu sinyal orange. Tenang, padat, tanpa dekorasi yang tidak membawa informasi.

## Token (dua peran, bukan dua hiasan)

```
bg        #E2E5D6   ink        #17180F   muted   #565847
surface   #F2F3E8   hover      #ECEEE1   rule    #CDD0BF / #B0B4A1
olive     #4F5638   hover      #3E4429   soft    #C3C8A9  (di atas permukaan gelap)
signal    #C2410C   hover      #9A3309   text    #A8360E
display   Bricolage Grotesque 500   body  Public Sans  data  JetBrains Mono
```

- **Olive = struktur**: rule, label, diagram, hover judul, badge, state pasif-aktif yang tenang.
- **Orange = sinyal**: maksimal ~5% permukaan. Hanya untuk state aktif, progress scroll, satu CTA per halaman, dan satu penanda kecil. Jangan dipakai sebagai latar section.
- Teks orange kecil wajib `#A8360E` (5.2:1). `#C2410C` di atas kertas hanya 4.1:1 — aman untuk garis/fill, bukan body text.
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
13. Orange sebagai latar section besar atau lebih dari satu blok orange per layar.

## Struktur halaman

- **Hero**: asimetris 7/5. Kiri teks + CTA, kanan ruang globe (desktop saja). Jangan center.
- **Strip data**: hairline grid `gap-px bg-outline`, sel `bg-background`.
- **Daftar proyek**: `ProjectLedger` (baris berindeks). Jangan kembali ke carousel/card grid.
- **Case study**: h1 + meta plate (Peran/Stack/Tautan) → narasi → Hasil → Galeri → Proyek berikutnya.
- **Narasi**: `longDescription` dipecah oleh `## Heading`; prosa `max-w-[60ch]` (Public Sans sempit — 68ch menghasilkan ~89 karakter per baris).

## Motion

- Native saja: CSS transition/transform, IntersectionObserver, `requestAnimationFrame`. Tanpa GSAP/Framer.
- Hormati `prefers-reduced-motion`; konten tetap terlihat tanpa JS.
- Globe: `>=1024px`, `requestIdleCallback`, dynamic import. Jangan dimuat di mobile.

## Gambar

- Cloudinary, `c_limit` + `q_auto,f_auto`. Galeri: `srcset` `w_480/800/1600` + `sizes`.
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
