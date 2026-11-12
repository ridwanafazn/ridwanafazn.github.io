# DESIGN — UI/UX & Technical Design Decisions
## Portofx v2: Admin Panel & Public Website

> **Catatan implementasi (2026-11-12):** Admin memakai **Astro components + Tailwind** (bukan Shadcn/React islands) demi performa; navigasi responsive (sidebar desktop, drawer mobile) + toast. Galeri project publik memakai **slider Play Store style** (scroll-snap per kartu, tombol prev/next dengan state disabled, progress bar tipis, caption nama file tanpa background) plus lightbox prev/next + counter; klik area luar gambar menutup lightbox. State terbaru: **`docs/HANDOFF.md`**.

> **Philosophy**: "Backend-first, FE remeh tapi rapi" — Admin panel powerful & accessible, Public site zero-JS, performant, accessible.

---

## 1. Design System & Tokens

### 1.1 Color Palette (Tailwind CSS 4 + CSS Variables)

```css
/* src/styles/global.css — CSS Custom Properties */
:root {
  /* === Base (Light Mode Default) === */
  --color-bg: 255 255 255;           /* white */
  --color-bg-elevated: 250 250 252;  /* gray-50 */
  --color-surface: 255 255 255;      /* white */
  --color-surface-hover: 248 250 252; /* gray-50 */
  --color-border: 226 232 240;       /* gray-200 */
  --color-border-strong: 203 213 225; /* gray-300 */
  --color-text: 15 23 42;            /* slate-900 */
  --color-text-muted: 100 116 139;   /* slate-500 */
  --color-text-subtle: 148 163 184;  /* slate-400 */
  
  /* === Brand (Primary) === */
  --color-primary: 30 64 175;        /* blue-800 */
  --color-primary-hover: 30 58 138;  /* blue-900 */
  --color-primary-light: 219 234 254; /* blue-50 */
  --color-primary-text: 255 255 255; /* white */
  
  /* === Accent (Secondary) === */
  --color-accent: 234 88 12;         /* orange-600 */
  --color-accent-hover: 194 65 12;   /* orange-700 */
  --color-accent-light: 255 237 213; /* orange-50 */
  
  /* === Semantic === */
  --color-success: 22 163 74;        /* green-600 */
  --color-success-light: 220 252 231; /* green-50 */
  --color-warning: 234 179 8;        /* yellow-600 */
  --color-warning-light: 254 252 220; /* yellow-50 */
  --color-error: 220 38 38;          /* red-600 */
  --color-error-light: 254 226 226;  /* red-50 */
  
  /* === Focus & Selection === */
  --color-focus: 30 64 175;          /* blue-800 */
  --color-selection: 219 234 254;    /* blue-50 */
  
  /* === Shadow & Radius === */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* === Typography === */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-ui: 'Inter', system-ui, sans-serif;
  
  /* === Spacing Scale (4px base) === */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-20: 80px; --space-24: 96px;
  
  /* === Transitions === */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: 15 23 42;              /* slate-900 */
    --color-bg-elevated: 30 41 59;     /* slate-800 */
    --color-surface: 30 41 59;         /* slate-800 */
    --color-surface-hover: 51 65 85;   /* slate-700 */
    --color-border: 51 65 85;          /* slate-700 */
    --color-border-strong: 71 85 105;  /* slate-600 */
    --color-text: 248 250 252;         /* slate-50 */
    --color-text-muted: 148 163 184;   /* slate-400 */
    --color-text-subtle: 100 116 139;  /* slate-500 */
    
    --color-primary: 147 197 253;      /* blue-300 */
    --color-primary-hover: 191 219 254; /* blue-200 */
    --color-primary-light: 30 64 175;  /* blue-800 */
    --color-primary-text: 15 23 42;    /* slate-900 */
    
    --color-accent: 251 146 60;        /* orange-400 */
    --color-accent-hover: 254 178 100; /* orange-300 */
    --color-accent-light: 154 52 18;   /* orange-900 */
  }
}

/* Utility classes menggunakan tokens */
.bg-bg { background-color: rgb(var(--color-bg)); }
.bg-surface { background-color: rgb(var(--color-surface)); }
.text-text { color: rgb(var(--color-text)); }
.text-muted { color: rgb(var(--color-text-muted)); }
.border-border { border-color: rgb(var(--color-border)); }
.shadow-md { box-shadow: var(--shadow-md); }
.rounded-md { border-radius: var(--radius-md); }
.transition-base { transition: all var(--transition-base); }
```

### 1.2 Typography Scale

| Element | Font | Size | Weight | Line Height | Use Case |
|---|---|---|---|---|---|
| **Display XL** | Plus Jakarta Sans | clamp(3rem, 13.5vw, 4.75rem) | 800 | 1.03 | Hero headline |
| **Display LG** | Plus Jakarta Sans | clamp(2.5rem, 8vw, 3.5rem) | 700 | 1.1 | Section headers |
| **Display MD** | Plus Jakarta Sans | clamp(1.75rem, 5vw, 2.5rem) | 700 | 1.2 | Card titles |
| **Heading 1** | Plus Jakarta Sans | 2.25rem / 36px | 700 | 1.3 | Page titles (admin) |
| **Heading 2** | Plus Jakarta Sans | 1.875rem / 30px | 600 | 1.35 | Section headers |
| **Heading 3** | Plus Jakarta Sans | 1.5rem / 24px | 600 | 1.4 | Sub-sections |
| **Body LG** | Inter | 1.125rem / 18px | 400 | 1.7 | Lead paragraphs |
| **Body** | Inter | 1rem / 16px | 400 | 1.6 | Default text |
| **Body SM** | Inter | 0.875rem / 14px | 400 | 1.5 | Secondary text |
| **Caption** | JetBrains Mono | 0.75rem / 12px | 500 | 1.4 | Labels, meta, code |
| **Micro** | JetBrains Mono | 0.625rem / 10px | 600 | 1.3 | Badges, tags, timestamps |

### 1.3 Spacing & Layout

- **Container max-width**: `80rem` (1280px) — `max-w-7xl`
- **Content max-width**: `42rem` (672px) — `max-w-2xl` untuk reading
- **Grid**: 12-column, gap `1.5rem` (24px) desktop, `1rem` (16px) mobile
- **Section vertical rhythm**: `6rem` (96px) between major sections

---

## 2. Public Website Design (Current → Preserve)

### 2.1 Existing Components (Keep & Refine)

| Component | Current State | Refinement |
|---|---|---|
| **HeroGlobe** | Three.js globe, performant | Keep, ensure SSR-safe (client:load) |
| **StatBar** | Animated counters | Keep, reduce motion respect |
| **ProjectCard** | Bento-style, hover reveal | Keep, add focus-visible states |
| **Badge** | Tech stack pills | Keep, consistent sizing |
| **FloatingNav** | Scroll progress + section links | Keep, keyboard accessible |
| **Timeline** | Experience/education | Keep, improve mobile layout |
| **HowIBuild** | Stepper visual | Keep, better responsive |

### 2.2 Visual Language (Bento/Glassmorphism)

```css
/* Bento Card — digunakan di public & admin */
.bento-card {
  @apply relative overflow-hidden rounded-xl border border-border/40 bg-surface/80 backdrop-blur-sm transition-all duration-300;
  box-shadow: var(--shadow-md);
}
.bento-card:hover {
  @apply border-accent/40;
  box-shadow: var(--shadow-lg);
}

/* Reveal Animation — IntersectionObserver */
.reveal { @apply opacity-0 translate-y-6; }
.reveal.visible { @apply opacity-100 translate-y-0 transition-all duration-700 ease-out; }
.reveal.from-left { @apply -translate-x-6; }
.reveal.from-right { @apply translate-x-6; }
.reveal.from-behind { @apply scale-95; }
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
.reveal-delay-3 { transition-delay: 300ms; }
```

### 2.3 Responsive Breakpoints

| Breakpoint | Width | Usage |
|---|---|---|
| `sm` | 640px | Mobile landscape, small tablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Desktop, side-by-side layouts |
| `xl` | 1280px | Wide desktop, max container |
| `2xl` | 1536px | Ultra-wide, generous whitespace |

---

## 3. Admin Panel Design (New — Shadcn/UI + Custom)

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (h-16) — Logo, Search (Cmd+K), Notifications, User Menu │
├──────────────┬──────────────────────────────────────────────────┤
│  Sidebar     │  Main Content (flex-1, overflow-auto)            │
│  (w-64)      │  ┌────────────────────────────────────────────┐  │
│  - Navigation│  │  Page Header (Title, Breadcrumbs, Actions)  │  │
│  - Collapse  │  ├────────────────────────────────────────────┤  │
│  - Mobile    │  │  Content Area (Table, Form, Detail)        │  │
│    Drawer    │  └────────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────────┘
```

### 3.2 Sidebar Navigation

```tsx
// src/components/admin/Sidebar.tsx
const navigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/admin/portfolio', icon: FolderKanban, badge: 12 },
  { label: 'Profile', href: '/admin/profile', icon: User },
  { label: 'Skills', href: '/admin/skills', icon: Code },
  { label: 'Activities', href: '/admin/activities', icon: Award },
  { label: 'Assets', href: '/admin/assets', icon: Images, badge: 47 },
  { label: 'Settings', href: '/admin/settings', icon: Settings, divider: true },
];
```

- **Collapsible**: Hover/click expand, mobile: Sheet drawer
- **Active state**: Highlighted background, accent left border
- **Badges**: Count draft, assets, etc.

### 3.3 Portfolio Table (List View)

| Feature | Implementation |
|---|---|
| **Columns** | Title (link to edit), Role, Status (badge), Order, Updated, Actions |
| **Sorting** | Click header → toggle asc/desc (TanStack Table) |
| **Filtering** | Status dropdown (All, Draft, Published, Archived), Search (title, role, tech) |
| **Pagination** | 10/25/50 per page, server-side (Astro API + query params) |
| **Row Actions** | Edit, Duplicate, Publish/Archive, Delete (dropdown menu) |
| **Bulk Actions** | Checkbox select → Publish, Archive, Delete (future) |
| **Empty State** | Illustration + "Create your first project" CTA |

### 3.4 Portfolio Form (Create/Edit)

#### 3.4.1 Form Sections (Accordion/Tabs)

```
┌────────────────────────────────────────────────────────────┐
│  [Basic Info]  [Detail Editor]  [SEO]  [Settings]          │
├────────────────────────────────────────────────────────────┤
│  Title*          [____________________________________]    │
│  Slug*           [____________________________________]    │
│  Role*           [____________________________________]    │
│  Description*    [____________________________________]    │
│  Long Description [____________________________________]   │
│  Cover Image     [AssetPicker]  [Upload New]               │
│  Tech Stack*     [TagInput: React, TypeScript, ...]        │
│  Highlights      [TagInput: 151 Tickets Sold, ...]         │
│  Status          [Draft ▼] [Published] [Archived]          │
└────────────────────────────────────────────────────────────┘
```

#### 3.4.2 Detail Editor (Fase 1 flat fields; Fase 3 blocks)

```
┌────────────────────────────────────────────────────────────┐
│  Detail Editor (Fase 1) / Blocks (Fase 3)         [+ Add]  │
├────────────────────────────────────────────────────────────┤
│  ☰  ┌─ Hero ──────────────────────────────────────────┐   │
│  ☰  │ Headline: "Open House Platform"                  │   │
│  ☰  │ Subheadline: "Real-time QR check-in..."          │   │
│  ☰  └──────────────────────────────────────────────────┘   │
│  ☰  ┌─ Gallery ────────────────────────────────────────┐   │
│  ☰  │ Layout: Grid [▼]  Columns: 3                     │   │
│  ☰  │ [🖼] [🖼] [🖼]  [+ Add Image]                     │   │
│  ☰  └──────────────────────────────────────────────────┘   │
│  ☰  ┌─ Tech Stack ─────────────────────────────────────┐   │
│  ☰  │ Backend: [Node, PostgreSQL, Redis]               │   │
│  ☰  │ Frontend: [Astro, React, Tailwind]               │   │
│  ☰  └──────────────────────────────────────────────────┘   │
│  ☰  ┌─ Links ───────────────────────────────────────────┐   │
│  ☰  │ [Live Demo →] [GitHub →] [Figma →]                │   │
│  ☰  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

> **Fase 1 (v1):** detail editor memakai **flat fields** — `longDescription`, `techStack`, `highlights`, `links`, `gallery`, `coverImage`. Tidak ada block builder.
>
> **Fase 3:** baru tambah `portfolio_blocks` + drag-drop. Halaman publik detail tetap bisa render flat fields; blocks hanya ditampilkan kalau ada.

**Interactions:**
- **Drag-drop reorder** (dnd-kit) — handle `☰` drag
- **Collapse/expand** per block
- **Duplicate block** (icon)
- **Delete block** (confirm toast)
- **Add block** → dropdown pilih type → prepend/append/insert

#### 3.4.3 Block Type Forms

| Block | Fields |
|---|---|
| **Hero** | Headline, Subheadline, CTA Text/Link, Background Asset, Alignment |
| **Gallery** | Layout (Grid/Masonry/Carousel), Columns, Images[] (AssetPicker + caption/alt) |
| **Text** | Markdown content, Size (sm/base/lg/xl), Alignment |
| **Video** | Provider (YouTube/Vimeo/Cloudinary/Direct), Video ID/URL, Title, Caption, Autoplay, Loop |
| **Embed** | URL, Title, Description, Width, Height |
| **Tech Stack** | Title, Categories[] { name, items[] } |
| **Links** | Items[] { label, URL, icon (Material Symbols), variant } |
| **Divider** | Label (optional), Style (solid/dashed/dotted/gradient) |

### 3.5 Asset Manager

```
┌────────────────────────────────────────────────────────────┐
│  [Search...]  [Folder ▼]  [Sort: Date ▼]  [Upload]        │
├────────────────────────────────────────────────────────────┤
│  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼             │
│  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼  🖼             │
└────────────────────────────────────────────────────────────┘
```

- **Grid view** (default), **List view** (toggle)
- **Cloudinary Media Library Widget** untuk upload & pick
- **Hover actions**: Copy URL, Copy Transform URL, Delete
- **Multi-select** → bulk delete
- **Folder structure**: `portfolio/{projects,profile,activities,blog}`

### 3.6 Profile Editor (Singleton)

```
┌────────────────────────────────────────────────────────────┐
│  [Identity]  [Experience]  [Education]  [Certs]  [Process] │
├────────────────────────────────────────────────────────────┤
│  Name*         [____________________________________]       │
│  Nickname      [____________________________________]       │
│  Role*         [____________________________________]       │
│  Tagline       [____________________________________]       │
│  Bio           [____________________________________]       │
│  Stats         [+ Add Stat: Label | Value]                 │
│  Current Focus [Title] [Description]                       │
│  Experience    [Repeater: Role, Org, Period, Desc]         │
│  Education     [Repeater: Institution, Degree, GPA, Highlights[]] │
│  Certifications [Repeater: Name, Issuer]                   │
│  How I Build   [Summary, Steps[] {Step, Detail}, Why]      │
└────────────────────────────────────────────────────────────┘
```

### 3.7 Responsive Admin

| Breakpoint | Behavior |
|---|---|
| `< 768px` | Sidebar → Sheet drawer (hamburger), Table → horizontal scroll / card stack |
| `768-1024px` | Sidebar collapsed (icons only), hover expand |
| `> 1024px` | Full sidebar, comfortable spacing |

---

## 4. Preview Mode Design

### 4.1 Preview Banner (Top Fixed)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 MODE PREVIEW — Ini tampilan draft, belum dipublikasikan      │
│  [Kembali ke Edit]                              [Buka Admin]    │
└─────────────────────────────────────────────────────────────────┘
```

- **Position**: Fixed top, `z-index: 9999`, semi-transparent dark background
- **Actions**: "Kembali ke Edit" → `/admin/portfolio/[id]`, "Buka Admin" → `/admin`
- **Mobile**: Stack buttons, full width

### 4.2 Visual Differentiation

- **Watermark**: Subtle diagonal "DRAFT" text pada hero/cover (CSS pseudo-element)
- **Border**: `border-accent/20` pada container utama
- **Noindex**: `<meta name="robots" content="noindex, nofollow">`

---

## 5. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| **Color Contrast** | All text ≥ 4.5:1, UI elements ≥ 3:1 (verify via Tailwind config) |
| **Focus Visible** | `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }` |
| **Keyboard Navigation** | All interactive elements reachable, logical tab order |
| **ARIA Labels** | Icon buttons, status badges, form errors, live regions |
| **Reduced Motion** | `@media (prefers-reduced-motion: reduce) { .reveal { animation: none; opacity: 1; } }` |
| **Screen Readers** | Semantic HTML, `alt` text for images, `aria-live` for toasts |
| **Forms** | `label` for every input, `aria-describedby` for errors, `aria-invalid` |

---

## 6. Dark Mode Strategy

- **Default**: System preference (`prefers-color-scheme`)
- **Toggle**: Admin header → persists in `localStorage` (client-side)
- **Implementation**: CSS custom properties + Tailwind `dark:` variant
- **Public Site**: Follow system, no toggle (keep clean)
- **Admin**: Toggle + system sync

---

## 7. Icon System

- **Public**: Material Symbols Outlined (Google Fonts) — already used
- **Admin**: Lucide React (tree-shakable, consistent stroke) — Shadcn default
- **Fallback**: Inline SVG untuk custom icons

---

## 8. Component Library (Shadcn/UI Customization)

### 8.1 Theme Override

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-text hover:bg-primary-hover shadow-sm',
        destructive: 'bg-error text-white hover:bg-error-hover shadow-sm',
        outline: 'border border-border bg-transparent hover:bg-surface-hover',
        secondary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
        ghost: 'hover:bg-surface-hover',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-8 text-base',
        xl: 'h-12 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

### 8.2 Custom Components

| Component | Base | Customization |
|---|---|---|
| **DataTable** | TanStack Table + Shadcn Table | Server-side sort/filter, row actions, loading skeleton |
| **TagInput** | Custom | Autocomplete dari existing tech stack, create new, keyboard friendly |
| **MarkdownEditor** | `@uiw/react-md-editor` | Toolbar, preview tab, image paste → Cloudinary upload |
| **AssetPicker** | Cloudinary Media Library Widget | Wrapper React component, returns selected asset IDs |
| **BlockEditor** (Fase 3) | Custom + dnd-kit | Sortable, collapsible, type-specific forms |
| **PreviewToolbar** | Custom | Fixed banner, actions, responsive |

---

## 9. Animation & Micro-interactions

| Element | Animation | Duration | Easing |
|---|---|---|---|
| **Page transition** | None (MPA) | - | - |
| **Reveal (public)** | Fade + slide up | 600ms | cubic-bezier(0.22, 1, 0.36, 1) |
| **Hover card** | Lift + shadow | 200ms | ease-out |
| **Button press** | Scale 0.97 | 100ms | ease-out |
| **Sidebar collapse** | Width + opacity | 200ms | ease-in-out |
| **Modal/Dialog** | Fade + scale | 150ms | ease-out |
| **Toast** | Slide from right | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| **Drag-drop** | Opacity + rotate | 100ms | ease-out |
| **Table row hover** | Background color | 150ms | ease-out |

---

## 10. Error & Empty States

| State | Visual | Action |
|---|---|---|
| **404** | Illustration + "Halaman tidak ditemukan" + [Kembali ke Beranda] | Link to `/` |
| **500** | Illustration + "Terjadi kesalahan server" + [Coba Lagi] + [Lapor] | Reload + Sentry link |
| **No Projects** | Illustration + "Belum ada project" + [Buat Project Pertama] | Link to `/admin/portfolio/new` |
| **No Assets** | Illustration + "Belum ada aset" + [Upload Pertama] | Open Cloudinary widget |
| **Form Validation** | Inline error text + `aria-invalid` + focus first error | Inline |
| **Network Error** | Toast "Gagal menyimpan, cek koneksi" + retry button | Toast |

---

## 11. Design Tokens Export (Figma/Code Sync)

```json
// design-tokens.json (untuk Figma Tokens plugin)
{
  "color": {
    "bg": { "value": "{color.bg}" },
    "surface": { "value": "{color.surface}" },
    "primary": { "value": "{color.primary}" },
    "accent": { "value": "{color.accent}" },
    "success": { "value": "{color.success}" },
    "warning": { "value": "{color.warning}" },
    "error": { "value": "{color.error}" }
  },
  "spacing": { "base": "4px", "scale": [1,2,3,4,5,6,8,10,12,16,20,24] },
  "radius": { "sm": "4px", "md": "8px", "lg": "12px", "xl": "16px", "full": "9999px" },
  "shadow": { "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)", "md": "...", "lg": "..." },
  "typography": {
    "fontFamilies": { "sans": "Plus Jakarta Sans", "mono": "JetBrains Mono", "ui": "Inter" },
    "fontSizes": { "displayXL": "clamp(3rem, 13.5vw, 4.75rem)", ... },
    "fontWeights": { "normal": 400, "medium": 500, "semibold": 600, "bold": 700, "extrabold": 800 }
  }
}
```

---

## 12. Design Decision Log

| Date | Decision | Rationale | Alternative Considered |
|---|---|---|---|
| 2024-11-11 | Shadcn/UI + Radix untuk Admin | Accessible, unstyled, tree-shakable, TypeScript-first | Mantine, Chakra, Headless UI, Custom |
| 2026-11-11 | dnd-kit untuk Block Editor (Fase 3) | Lightweight, accessible, headless, TypeScript | react-beautiful-dnd (unmaintained), @dnd-kit |
| 2024-11-11 | Cloudinary Media Library Widget | Built-in UI, search, folder, transform, no custom build | Custom gallery + upload |
| 2026-11-11 | Markdown untuk Text Block (Fase 3) | Portable, versionable, familiar | TipTap, Lexical, Slate (overkill) |
| 2024-11-11 | Material Symbols (Public) + Lucide (Admin) | Public already uses Material, Admin needs consistency | All Lucide, All Material |
| 2024-11-11 | CSS Variables untuk Design Tokens | Native, no build step, works in Astro/React/CSS | Tailwind config only, Theme UI |

---

> **Next**: Lihat `/docs/MIGRATION_LOG.md` untuk tracking eksekusi, `/docs/TASKS.md` untuk checklist actionable.