# DESIGN — UI/UX Public + Admin

> **Terakhir diverifikasi: 2026-11-16.** Sumber kebenaran visual = `src/styles/global.css` + kelas Tailwind di komponen. Dokumen ini menjelaskan **apa yang benar-benar ada**, bukan rencana lama.
>
> Riwayat: dokumen versi Shadcn/glassmorphism (2024) sudah **tidak berlaku**. Revamp editorial (2026-11-11, lihat `.kilo/plans/`) menghasilkan tampilan yang sekarang.

---

## 0. Reality check — klaim lama vs kondisi aktual

| Klaim di dokumen lama | Aktual (2026-11-15) |
|---|---|
| "Public site **zero-JS**" | **Salah.** Public memuat IntersectionObserver reveal, slider galeri, lightbox, dan menu mobile. Three.js/globe tidak lagi dipakai di homepage (HeroAbstract). |
| Palette blue-800 + orange accent + dark mode otomatis | **Salah.** Sekarang kertas hangat + satu aksen slate; **tidak ada dark mode** (tidak ada `prefers-color-scheme` maupun toggle). |
| Admin pakai **Shadcn/UI + Radix + TanStack Table** | **Salah.** Tidak ada file `.tsx` (0). Admin = Astro components + Tailwind. |
| **Cloudinary Media Library Widget** untuk upload/pick | **Salah.** Upload custom: `multiple` + drag&drop, paralel maks 3, signature sekali per batch, progress + error per file. |
| Icon public Material Symbols, **admin Lucide React** | **Salah.** Sejak Fase A: public memakai **inline SVG** (`Icon.astro`), admin memakai SVG path inline di nav. Tidak ada icon font. |
| 10 project, 1 asset | **Salah.** 13 project, 55 asset, 54 gambar galeri, **0 cover**. |

---

## 0.2 Hero Abstract (homepage) — 2026-11-21

Homepage memakai **HeroAbstract** (`src/components/HeroAbstract.astro`), bukan hero Cold Steel biasa.

- **Full-bleed gelap** `#080907`; `Software Engineer` sebagai **h1 besar dua baris**, `Keep it simple, make it scale.` sebagai **subtext kecil memakai Public Sans**; copy desktop `top: 35%` (setara bahu); **foto cutout di tengah**, app window GIS Sentry di kanan (`top: 30%`, sejajar mulut). Tanpa CTA, tanpa stiker, label app dihapus.
- **Tablet/mobile ≤980px:** hero `100svh` + `100dvh` (fallback), margin bawah diisi `box-shadow` ink agar browser bar tidak memperlihatkan celah cream; portrait mengisi row `1fr` (`object-fit: cover`); app satu grid cell dengan portrait, menempel **kanan-bawah**; copy + marquee di dasar; tidak ada section kedua di layar pertama. ≤640px app `150px`, margin 8px.
- Unsur poster: panel merah trapezoid, garis lime diagonal, kata `SCALE` outline, grid/crosshair, noise, marquee dengan pemisah **diamond persegi** + `AI APPLICATION ENGINEER`, entrance animation, app float.
- **Spotlight foto (2026-11-22):** foto asli tampil **penuh dan berwarna sejak awal**. Saat kursor menyorot area foto, **blob lembut** (bukan lingkaran keras) mengikuti pointer dan membuka easter egg **potret Rengoku** (`public/images/rengoku.webp`) di dalamnya.
  - Hanya aktif dengan JS + `(min-width: 981px)` + `(hover: hover) and (pointer: fine)`; class `is-spot-ready`/`is-spotting` dipasang di `#hero`.
  - Tanpa JS, touch/mobile, dan `prefers-reduced-motion` → lapisan Rengoku tetap tersembunyi; **foto asli tetap tampil**.
  - Reveal memakai `mask-image: url('/images/reveal-blob.png')` (soft blob 400×440, dipakai pada `mask-size: 320px 360px`) + `mask-position` yang dihitung dari `--hero-spot-x/y`. Tidak ada ring/lensa, jadi native cursor tetap terlihat.
  - Tracking pointer memakai satu `requestAnimationFrame`; jangan menambah listener `pointermove` kedua.
  - Area interaksi memakai bounding box **foto asli** yang diinset 12% horizontal / 5% vertikal supaya blob tidak aktif di ruang transparan cutout.
  - **Rengoku disejajarkan 1:1** ke kanvas 3:4 yang sama dengan foto: dari cutout **full-body** 900×1200, aset diskalakan **0.9×** lalu ditempatkan di `(23px, 127px)`. Paha/kaki di bawah tangan **tetap ikut** (hanya ~7px paling bawah yang terpotong) — jangan crop di tangan.
  - **Quote + SFX:** tiga quote (Inggris + Jepang) — `心を燃やせ / Set your heart ablaze.`, `胸を張って生きろ / Live with your head held high.`, `炎柱・煉獄杏寿郎 / I am the Flame Hashira, Kyojuro Rengoku.` Dipilih dengan **shuffle bag**: semua muncul sebelum ada yang diulang, dan tidak ada quote yang sama dua kali berturut-turut.
  - Quote muncul setelah **dwell 160ms** (cursor yang cuma lewat tidak memicu), di **kolom kiri bawah** (di bawah tagline, area hitam) — bukan menutupi badan foto — lalu fade out saat kursor keluar. Diamond lime menjadi penanda di **kiri baris Jepang** (bukan di atas). Audio `public/audio/fire-whoosh.mp3` (Mixkit “Fire woosh”, 2.14s, 48kHz stereo, ~67 KB, Mixkit Free License) diputar **maksimal sekali per 1.2s**, volume 0.32.
  - SFX **default OFF** setiap load. Tombol `SFX OFF/ON` di kanan-atas portrait (desktop) adalah gesture untuk membuka audio; saat ON ia memutar preview, lalu hover berikutnya memutar whoosh. Tanpa klik, reveal tetap visual-only. Mobile/no-JS/`prefers-reduced-motion` tidak menampilkan quote atau tombol SFX.
  - **Gutter mobile:** `Layout` memberi class `page-home` pada `<html>` saat `bareHero`; `global.css` memakai gradient `#080907` 0–`calc(100svh/100dvh + 1rem)` → `--color-background` setelahnya untuk menutup gutter scrollbar ±4px di kanan hero, termasuk kotak cream di sudut kanan-bawah. `.hero-grid` memakai `background-position: -1px 0` agar garis grid tidak jatuh di tepi kiri dan terlihat seperti celah putih. Margin bawah hero (`--hero-bottom-gap`) diisi `box-shadow` ink di ≤980px supaya browser bar tidak memperlihatkan celah cream. Jangan terapkan gradient ini ke halaman lain—halaman non-home harus tetap cream di gutter.
- Subtext memakai **Public Sans**; Instrument Serif tidak dipakai (preload/font-face dihapus).
- Foto: `public/images/ridwan-cutout.webp` (123 KB) + `ridwan-cutout.png` fallback. Easter egg: `public/images/rengoku.webp` (900×1200, ~67 KB, cutout **full-body** transparan yang sudah diskalakan/disejajarkan dengan foto) + `public/images/reveal-blob.png` (soft mask 400×440) + `public/audio/fire-whoosh.mp3` (~67 KB, Mixkit “Fire woosh”).
- **Tidak ada top navbar di hero.** Navbar lama (kotak rounded, bukan pill) muncul setelah **70% tinggi `#hero`** discroll. Gate: `data-nav-gate` di `Navbar`, CSS di `global.css`, `syncNav()`; `Layout` menerima `gateNav` + `bareHero`.
- Section di bawah hero **tidak berubah** dan tetap memakai container Cold Steel (`max-w-7xl`, `pt-0` hanya untuk homepage lewat `bareHero`).
- Ini **pengecualian yang disengaja** terhadap aturan “tanpa gradient/glow/band gelap” dan hero 7/5. Jangan menyalin gaya ini ke halaman lain.
- Globe lama **tidak dipakai lagi di homepage**; `HeroGlobe` masih ada di repo tetapi tidak di-render.

## 1. Design tokens (aktual)

```css
@theme {
  /* Warna — "Cold Steel": putih netral, tinta, satu aksen orange. Tanpa olive. */
  --color-background:        #F8F7F4;  /* page */
  --color-on-background:     #14160F;  /* ink — 17.0:1 */
  --color-on-surface-variant:#5A5E4E;  /* 6.2:1 */
  --color-surface:           #F1F2EC;
  --color-surface-hover:     #EAECE4;
  --color-outline:           #D5D8CD;
  --color-outline-strong:    #BFC4B4;
  --color-accent:            #14160F;  /* struktur netral (nama lama) */
  --color-accent-hover:      #2A2C24;
  --color-accent-soft:       #C9CBC2;  /* abu terang di atas field gelap */
  --color-signal:            #D9480F;  /* orange vivid — border/ikon/teks besar, 4.0:1 */
  --color-signal-hover:      #9A3309;  /* hover fill; putih 7.36:1 */
  --color-signal-strong:     #C2410C;  /* teks kecil & fill CTA; 4.83:1, putih 5.18:1 */
  --color-success:           #1F6B43;
  --color-warning:           #8A5A14;
  --color-error:             #9B2C1F;

  /* Tipografi (self-hosted, latin subset) */
  --font-sans:    "Public Sans";
  --font-heading: "Bricolage Grotesque";  /* otomatis untuk h1–h3 */
  --font-mono:    "JetBrains Mono";
}
```

**Satu aksen.** Putih netral, tinta, dan orange. Olive dihapus karena sulit ditempatkan: ia tidak cukup netral untuk struktur dan tidak cukup kuat untuk menjadi aksen. `accent` sekarang hanyalah nama lama untuk struktur netral (ink); satu-satunya warna kromatik adalah `signal`.

- Orange punya dua nilai: `signal` `#D9480F` (vivid) untuk border 6px, progress, ikon, dan teks display ≥24px; `signal-strong` `#C2410C` untuk teks kecil dan fill CTA.
- **Kontras:** ink 17.0:1, muted 6.2:1, `signal-strong` 4.83:1, putih di atas `signal-strong` 5.18:1. `signal` vivid hanya 4.01:1 → jangan untuk teks kecil atau tombol; putih di atasnya 4.30:1 (gagal 4.5).
- **Bidang gelap:** homepage tidak punya band besar; globe adalah satu-satunya massa gelap. Untuk section baru, maksimal satu bidang gelap per halaman.
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
| `/` | **HeroAbstract**, spec strip (Sejak/Stack/Kontak), ProjectLedger (3), Tech Stack, **GitHubActivity** | hero entrance/marquee/app float + nav gate 70%; spec strip/GitHub tetap | hero full-bleed; cutout portrait + app GIS Sentry; globe tidak lagi dimuat di homepage. `FloatingNav`, Current Focus, dan HowIBuild dihapus. Tech Stack memakai ikon brand + label 12px (5 kategori; **Language** baris penuh `md:col-span-2` dengan item 5 kolom, 4 kategori lain 2×2). Heatmap kontribusi 12 bulan: 5 langkah abu + orange hanya level tertinggi; mobile scroll horizontal mulai dari minggu terbaru |
| `/about` | Timeline, pendidikan, sertifikasi, volunteering | reveal | tanpa kartu bersarang |
| `/projects` | **ProjectLedger** 13 baris (indeks + thumbnail + role + stack: 2 item + `+N`) | reveal + hover preview | tanpa carousel; 13 proyek dalam satu layar; detail stack lengkap ada di halaman project |
| `/projects/[id]` | Case study: meta plate (Peran/Stack/Tautan), **lead image** (cover → gambar galeri pertama), narasi `##`, Hasil, **galeri slider** (snap per kartu, tinggi kartu seragam + lebar mengikuti rasio asli tanpa crop, berhenti di ujung), lightbox (hanya jika ada gambar), next-project | reveal + slider + lightbox | project tanpa gambar tidak merender lightbox/dialog kosong; OG jatuh ke `/og.png` |
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

Efek yang ada sekarang: hero `fadeSlideUp`, spotlight reveal foto hero, `.reveal` (kiri/kanan/belakang + stagger), `spec-cell` stagger, hover preview ledger, rotasi globe (desktop), slider galeri snap, lightbox, dan nav progress scroll-driven.

**Aturan baru:** maksimal **dua gesture signature per halaman**. Sisanya statis. Semua animasi harus:
- dihormati `prefers-reduced-motion` — globe **berhenti total** (bukan diperlambat) saat reduce aktif; render juga dijeda saat tab tidak terlihat,
- tidak menyembunyikan konten default,
- berjalan di compositor (transform/opacity), bukan layout.

---

## 6. Roadmap visual

Arah: **neo-minimalism / "clarity + one bold move"** — bukan neo-brutalism, bukan bento, bukan glass.
Palet menghindari klaster "cream + serif + terracotta": kertasnya putih netral `#F8F7F4` (bukan krem), hurufnya grotesque + mono (bukan serif), dan orange-nya vermilion `#D9480F`/`#C2410C` (bukan terracotta pudar). Hanya ada satu warna; orange tetap aksen, bukan latar halaman.

Sudah dikerjakan di Fase A:
1. ✅ Tipografi self-host + display Bricolage Grotesque; mono ≥ 12px.
2. ✅ Putih netral + tinta + satu aksen orange `#D9480F`/`#C2410C`. Verdigris dan olive dipensiunkan.
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
| 2026-11-17 | **Pilot palette v1**: kertas olive tint, olive `#4F5638`, orange `#C2410C`. Ditolak — terbaca pucet karena kertas berwarna menyerap kedua aksen | ❌ |
| 2026-11-17 | **Cold Steel**: latar `#F8F7F4`, tinta `#14160F`, orange `#D9480F` (non-teks) + `#C2410C` (teks/CTA). **Olive dihapus** — sulit ditempatkan; band HowIBuild kembali ink + border 6px | ✅ |
| 2026-11-17 | **Landing cleanup**: atmosphere + mask globe dihapus (globe solid), Tech Stack jadi ikon brand + label kecil, Current Focus & HowIBuild dihapus, spec strip jadi 3 sel, footer memakai ikon sosial | ✅ |
| 2026-11-17 | **GitHub activity**: heatmap kontribusi 12 bulan di homepage setelah Tech Stack. Sumber endpoint publik GitHub (tanpa token), cache 6 jam, fail-open. Skala 5 langkah; orange hanya level tertinggi | ✅ |
| 2026-11-18 | **Tech Stack 5 kategori**: Language/Backend/Frontend/Cloud and Infrastructure/Architecture and Integrations. Language memakai baris penuh di grid 2 kolom (`md:col-span-2`); ikon brand diperluas 19 brand, konsep non-brand tetap SVG garis | ✅ |
| 2026-11-21 | **Hero Abstract final**: poster gelap full-bleed, h1 `Software Engineer` besar, tagline subtext kecil Public Sans, cutout portrait, app GIS Sentry, panel merah trapezoid, marquee diamond + `AI APPLICATION ENGINEER`; tanpa CTA/stiker/label app; mobile `100svh` full-bleed tanpa section kedua; navbar lama digate 70% hero. Section bawah tidak diubah | ✅ deploy `a46f210e` |
| 2026-11-22 | **Galeri rasio asli**: kartu slider memakai tinggi seragam + lebar mengikuti rasio gambar (`--gallery-card-h`), menggantikan tile `16/10 object-cover` yang memotong screenshot portrait. Navigasi prev/next dihitung per offset kartu | ✅ |
| 2026-11-22 | **Hero spotlight**: foto asli tampil penuh; blob mask lembut (bukan lingkaran, `reveal-blob.png`) mengikuti kursor dan membuka easter egg Rengoku **full-body** (paha/kaki ikut) yang sudah disejajarkan 1:1 dengan foto. Quote Inggris+Jepang (A/B/C) di **kolom kiri bawah** lewat shuffle bag + dwell 160ms; marker lime di kiri baris Jepang; hint dihapus. SFX Mixkit (`fire-whoosh.mp3`) default OFF, toggle di portrait, cooldown 1.2s. Tanpa JS/touch = hanya foto asli | ✅ deploy `ca3e50c4` |
| 2026-11-22 | **Mobile gutter**: `html.page-home` gradient ink `#080907` 0–`calc(100svh/100dvh + 1rem)` lalu cream menutup gutter scrollbar ±4px di kanan hero dan kotak cream di sudut kanan-bawah; `.hero-grid` digeser `-1px` agar garis grid tidak tampak seperti celah putih di tepi kiri; margin bawah hero diisi `box-shadow` ink di ≤980px agar browser bar tidak memperlihatkan celah cream; class hanya dipasang saat `bareHero` | ✅ deploy `8e4e7dcc` |
