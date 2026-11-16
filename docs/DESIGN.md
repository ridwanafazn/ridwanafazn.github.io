# DESIGN — UI/UX Public + Admin

> **Terakhir diverifikasi: 2026-11-16.** Sumber kebenaran visual = `src/styles/global.css` + kelas Tailwind di komponen. Dokumen ini menjelaskan **apa yang benar-benar ada**, bukan rencana lama.
>
> Riwayat: dokumen versi Shadcn/glassmorphism (2024) sudah **tidak berlaku**. Revamp editorial (2026-11-11, lihat `.kilo/plans/`) menghasilkan tampilan yang sekarang.

---

## 0. Reality check — klaim lama vs kondisi aktual

| Klaim di dokumen lama | Aktual (2026-11-15) |
|---|---|
| "Public site **zero-JS**" | **Salah.** Public memuat three.js (globe, hanya ≥1024px), IntersectionObserver reveal, slider galeri, lightbox, dan menu mobile. |
| Palette blue-800 + orange accent + dark mode otomatis | **Salah.** Sekarang kertas hangat + satu aksen slate; **tidak ada dark mode** (tidak ada `prefers-color-scheme` maupun toggle). |
| Admin pakai **Shadcn/UI + Radix + TanStack Table** | **Salah.** Tidak ada file `.tsx` (0). Admin = Astro components + Tailwind. |
| **Cloudinary Media Library Widget** untuk upload/pick | **Salah.** Upload custom: `multiple` + drag&drop, paralel maks 3, signature sekali per batch, progress + error per file. |
| Icon public Material Symbols, **admin Lucide React** | **Salah.** Sejak Fase A: public memakai **inline SVG** (`Icon.astro`), admin memakai SVG path inline di nav. Tidak ada icon font. |
| 10 project, 1 asset | **Salah.** 13 project, 55 asset, 54 gambar galeri, **0 cover**. |

---

## 1. Design tokens (aktual)

```css
@theme {
  /* Warna — "Ledger": mineral cool, tinta, verdigris */
  --color-background:        #E4E6E1;  /* page */
  --color-on-background:     #111110;  /* ink */
  --color-on-surface-variant:#57554F;
  --color-surface:           #F5F6F2;
  --color-surface-hover:     #EFF1EB;
  --color-outline:           #CFD2C9;
  --color-outline-strong:    #B4B8AC;
  --color-accent:            #2C6558;  /* verdigris — satu-satunya aksen */
  --color-accent-hover:      #234F45;
  --color-success:           #1F6B43;
  --color-warning:           #8A5A14;
  --color-error:             #9B2C1F;

  /* Tipografi (self-hosted, latin subset) */
  --font-sans:    "Public Sans";
  --font-heading: "Bricolage Grotesque";  /* otomatis untuk h1–h3 */
  --font-mono:    "JetBrains Mono";
}
```

- **Radius:** kartu `rounded-lg` (8px), badge/tombol `rounded` (4px) / `rounded-md` (6px). Tidak ada `rounded-full` pada kartu.
- **Shadow:** tidak dipakai di kartu public. Pemisah = border 1px, bukan bayangan.
- **Surface:** solid. Tidak ada `backdrop-blur` di kartu. Blur hanya dipakai di **navbar public** dan **overlay lightbox** (intentional).
- **Layout:** container `max-w-7xl`, padding `px-6 md:px-12`, `main` punya `pt-24 md:pt-28`.
- **Admin:** permukaan tajam — tanpa `rounded-*`, tanpa blur, transisi 150ms (color/opacity), tanpa hover translate.

### 1.1 Tipografi — kondisi aktual (Fase A, 2026-11-15)

| Peran | Font | Ukuran di kode | Catatan |
|---|---|---|---|
| Display hero | Bricolage Grotesque 500 | `clamp(3rem,13.5vw,4.75rem)` | dipakai di `/` |
| Section heading | Bricolage Grotesque 500 | `text-3xl` | `text-wrap: balance` |
| Body | Public Sans 400/500 | 13–15px | `text-wrap: pretty`; `text-justify` sudah dihapus |
| Meta/label | JetBrains Mono 600/700 | **≥ 12px** | floor 11–12px; 8–10px sudah dihapus |

- Font di-self-host di `/public/fonts` (3 file varian, ~97 KB total), di-preload dari `Layout.astro`.
- Material Symbols **dihapus** dari public → ikon inline SVG (`src/components/Icon.astro`), dekoratif `aria-hidden`.

---

## 2. Public site — inventaris aktual

| Route | Komponen | JS yang dimuat | Catatan |
|---|---|---|---|
| `/` | HeroGlobe, spec strip (Fokus/Sejak/Stack/Kontak), ProjectLedger (3), Tech Stack, Current Focus, HowIBuild, FloatingNav (mobile) | reveal + spec stagger (globe hanya ≥1024px & idle) | globe 559 KB **tidak** dimuat di mobile/<1024 |
| `/about` | Timeline, pendidikan, sertifikasi, volunteering | reveal | tanpa kartu bersarang |
| `/projects` | **ProjectLedger** 13 baris (indeks + thumbnail + role + stack: 2 item + `+N`) | reveal + hover preview | tanpa carousel; 13 proyek dalam satu layar; detail stack lengkap ada di halaman project |
| `/projects/[id]` | Case study: meta plate (Peran/Stack/Tautan), **lead image** (cover → gambar galeri pertama), narasi `##`, Hasil, **galeri slider** (snap per kartu, berhenti di ujung), lightbox (hanya jika ada gambar), next-project | reveal + slider + lightbox | project tanpa gambar tidak merender lightbox/dialog kosong; OG jatuh ke `/og.png` |
| `/preview/*` | sama dengan detail + banner draft | login wajib | guard middleware |
| `/sitemap.xml` | route SSR | — | cache 60s |
| 404 | halaman khusus (`src/pages/404.astro`) | — | `noindex`, tautan ke beranda + arsip |
| 500 | halaman khusus (`src/pages/500.astro`) | — | `noindex`, dipakai saat SSR/DB gagal |

### 2.1 Status gap (diperbarui setelah Fase A)

Sudah diperbaiki:
- ✅ `meta description`, OG/Twitter card, `canonical`, `theme-color` (`Layout.astro`).
- ✅ Canonical hanya dirender untuk halaman indexable; 404/500/preview tidak punya canonical.
- ✅ Halaman 500 khusus (SSR/DB gagal) dengan `noindex`.
- ✅ OG image: `/og.png` (statis, 1200×630) sebagai **default semua halaman**; per-project `c_fill,w_1200,h_630,g_auto` dari cover → gambar galeri pertama. Project tanpa gambar tetap punya `og:image` + `og:image:alt`.
- ✅ JSON-LD `Person` di homepage.
- ✅ Halaman 404 khusus.
- ✅ `lang="id"`.
- ✅ `prefers-reduced-motion` untuk reveal, hero, spec-cell; rotasi globe berhenti total saat reduce.
- ✅ Reveal default terlihat tanpa JS (`html.js` gate + fallback `!important`).
- ✅ Ikon dekoratif `aria-hidden`, skip-link, `:focus-visible` global.
- ✅ Kontras teks (Lighthouse a11y 100 di 4 halaman publik).
- ✅ Hover preview di ledger (desktop, `hover: hover`, `previewImage` w_480).
- ✅ Navigasi tanpa JS (`<noscript>`), focus trap menu & lightbox, `inert` background, bfcache reset.
- ✅ URL trailing slash → 301; `?v=` bypass hanya di dev.

Belum:
- Cover image project (0/13) — OG per-project memakai gambar galeri pertama sampai cover diisi.
- `/preview/portfolio/[slug]` masih memakai layout case study **lama** (belum ekstrak komponen bersama).

### 2.2 Menulis case study (tanpa block editor)

Isi `longDescription` di `/admin/portfolio/[id]`. Parser di `src/pages/projects/[id].astro` memecah teks pada baris yang diawali `## `:

```
Konteks singkat tanpa heading (opsional).

## Masalah
Satu paragraf.

## Keputusan
Trade-off yang diambil, bukan daftar fitur.

## Hasil
Angka atau perubahan yang bisa diverifikasi.
```

- Tanpa `##` → tetap tampil sebagai satu bagian "Ringkasan" (fallback aman).
- `## Hasil` terpisah dari blok **Hasil** yang diambil dari `highlights`; jangan menduplikasi.
- Paragraf dipisah baris kosong; tidak ada Markdown lain (bold/list) yang dirender.

---

## 3. Admin panel — konvensi aktual

- **Layout:** sidebar desktop (collapsible, state `localStorage['admin-sidebar']`), drawer di mobile, header + toast.
- **Form:** Astro + fetch JSON ke `/admin/api/*`. Login memakai `fetch` ke `/api/auth/sign-in/email` (bukan native form POST).
- **Portfolio list:** tabel server-rendered, filter status/search, drag & drop reorder (aktif hanya saat filter "Semua").
- **Asset manager:** multi-upload, drag&drop, progress per file; hapus = soft delete DB (objek Cloudinary belum dihapus).
- **Preview:** `/preview/portfolio/[slug]` + banner, wajib login.
- **Bukan** Shadcn/Radix/TanStack/Lucide. Jangan menambahkannya tanpa alasan kuat.

---

## 4. Aksesibilitas — kontrak

Sudah ada:
- `main` landmark, heading hierarkis, `alt` pada gambar galeri.
- `aria-label` pada tombol ikon (galeri, menu, lightbox).
- `lang="id"`, skip-link, `:focus-visible` global, semua ikon dekoratif `aria-hidden`.
- **Focus trap + `inert`** untuk menu mobile dan lightbox (F2): fokus masuk saat buka, Tab terkunci, Esc mengembalikan fokus, konten belakang tidak bisa difokus/klik.
- Kontras lolos (Lighthouse a11y 100 di seluruh halaman publik).
- Tanpa JavaScript: konten tetap terlihat dan nav mobile diganti `<noscript>`.
- **Globe aman tanpa WebGL**: semua jalur gagal (konteks tidak ada, renderer gagal, tekstur gagal, `webglcontextlost`) menyembunyikan globe (`data-failed`) tanpa error; konten hero tetap utuh.
- **Lightbox tidak dirender** saat project tanpa gambar, jadi tidak ada dialog kosong di DOM.

Sisa: tidak ada dari daftar ini; item baru harus mengikuti aturan yang sama.

---

## 5. Motion — aturan

Efek yang ada sekarang: hero `fadeSlideUp`, `.reveal` (kiri/kanan/belakang + stagger), `spec-cell` stagger, hover preview ledger, rotasi globe (desktop), slider galeri snap, lightbox, dan nav progress scroll-driven.

**Aturan baru:** maksimal **dua gesture signature per halaman**. Sisanya statis. Semua animasi harus:
- dihormati `prefers-reduced-motion` — globe **berhenti total** (bukan diperlambat) saat reduce aktif; render juga dijeda saat tab tidak terlihat,
- tidak menyembunyikan konten default,
- berjalan di compositor (transform/opacity), bukan layout.

---

## 6. Roadmap visual

Arah: **neo-minimalism / "clarity + one bold move"** — bukan neo-brutalism, bukan bento, bukan glass.
Palet menghindari klaster "cream + serif + terracotta" (krem hangat diganti mineral cool, serif diganti grotesque, terracotta diganti verdigris).

Sudah dikerjakan di Fase A:
1. ✅ Tipografi self-host + display Bricolage Grotesque; mono ≥ 12px.
2. ✅ Aksen verdigris `#2C6558`; satu aksen.
3. ✅ Ikon inline SVG, tanpa icon font.
4. ✅ Motion hygiene + reveal progressive.

Berikutnya (Fase B–D):
5. Halaman proyek → ledger berindeks (01–13) + hover preview, menggantikan carousel.
6. Hero asimetris 8/4 + "spec sheet"; globe hanya ≥1024px.
7. Template case study: cover full-bleed, Konteks → Masalah → Trade-off → Hasil, next-project.
8. View Transitions + scroll-driven CSS native.
9. Grain/tactility via SVG `feTurbulence`.
10. Perf budget: JS < 60 KB di luar globe, galeri `srcset` (`w_480` tile / `w_1600` lightbox), OG image dinamis.

Sudah dikerjakan di Fase B:
5. ✅ Ledger 13 baris di `/projects` + 3 baris di homepage (ProjectLedger).
6. ✅ Hero asimetris (7/5) + spec strip; globe hanya ≥1024px, di-load saat idle.
8. ⚠️ `ClientRouter` + `view-transition-name` sempat dipasang, lalu **dilepas** karena `InvalidStateError` saat viewport mobile berubah; navigasi sekarang MPA biasa.
   - Browser surfaces: scrollbar, caret, selection, tabular numerals.

---

## 7. Decision log (dikoreksi)

| Tanggal | Keputusan | Status |
|---|---|---|
| 2024-11-11 | Shadcn/UI + Radix untuk admin | ❌ **dibatalkan** — admin dibangun dengan Astro components |
| 2024-11-11 | Cloudinary Media Library Widget | ❌ **dibatalkan** — upload custom + signed params |
| 2024-11-11 | Material Symbols public + Lucide admin | ⚠️ sebagian — Material Symbols dipakai di **keduanya** |
| 2026-11-11 | Editorial minimal: kertas hangat, satu aksen slate, radius 8px, tanpa blur di kartu | ✅ diterapkan |
| 2026-11-11 | Galeri slider Play Store + lightbox | ✅ diterapkan |
| 2026-11-11 | Public SSR + edge cache 60s (bukan prerender) | ✅ diterapkan |
| 2026-11-15 | Koreksi dokumen ini ke kondisi aktual + adopsi skill `impeccable` | ✅ |
| 2026-11-15 | **Fase A**: font self-host (Bricolage/Public Sans/JetBrains), palet mineral + verdigris, ikon inline SVG, reveal progressive, meta/OG/canonical, a11y 100 | ✅ |
