# Visual Design System Revamp Plan

## Goal
Replace the current "AI slop" glassmorphism/bento design system with a matte, editorial, technical-minimal aesthetic. Pure restyling — no data, copy, routing, or logic changes.

## Constraints
- DO NOT modify: `profile.json`, `projects.json`, `skills.json`, `activities.json`
- DO NOT modify: any text/copy content already in `.astro` files
- DO NOT modify: routing logic, `getStaticPaths`, data filtering, navigation structure
- DO NOT add: new components, sections, or pages
- Font Plus Jakarta Sans added for headings only
- Single accent color: **Muted Slate Blue `#64748B`**

## Design Tokens (New)

| Token | Old | New |
|---|---|---|
| Background | `#F9F8F6` | `#F5F4F1` |
| On-background (text) | `#0F172A` | `#16151A` |
| On-surface-variant | `#475569` | `#6B6B76` |
| Surface (card bg) | `rgba(255,255,255,0.65)` | `#FFFFFF` (solid) |
| Surface-hover | `rgba(255,255,255,0.9)` | `#FAFAF8` |
| Outline (border) | `rgba(148,163,184,0.25)` | `#DEDCD5` |
| Outline-strong | `rgba(148,163,184,0.5)` | `#C8C6BF` |
| Accent (single) | 5 colors | `#64748B` (Muted Slate Blue) |
| Font heading | Inter | Plus Jakarta Sans |
| Font body | Inter | Inter (unchanged) |
| Font mono | JetBrains Mono | JetBrains Mono (demoted to accents) |
| Card radius | `2.5rem` | `0.5rem` (8px) |
| Badge radius | `rounded-full` | `rounded` (4px) |
| Button radius | `rounded-full` | `rounded-md` (6px) |

## Execution Order (File by File, Sequential with User Confirmation)

### Step 1: `src/styles/global.css`
**Changes:**
1. Replace all 5 accent color variables (`--color-accent-indigo/cyan/emerald/amber/rose`) with single `--color-accent: #64748B`
2. Update `--color-background` to `#F5F4F1`
3. Update `--color-on-background` to `#16151A`
4. Update `--color-on-surface-variant` to `#6B6B76`
5. Change `--color-surface` to `#FFFFFF` (solid, no transparency)
6. Change `--color-surface-hover` to `#FAFAF8` (solid)
7. Change `--color-outline` to `#DEDCD5` (solid)
8. Change `--color-outline-strong` to `#C8C6BF` (solid)
9. Add `--font-heading: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif`
10. In `@layer base`, add rule: `h1, h2, h3 { font-family: var(--font-heading); }` — this auto-applies Plus Jakarta Sans to all headings globally, no manual class needed on individual elements
11. Delete `.blueprint-grid` utility entirely
11. Delete `.dot-pattern` utility entirely
12. Delete `.diagonal-pattern` utility entirely
13. Delete `.ornament-dashed-circle` utility entirely
14. Rewrite `.bento-card`: remove `backdrop-blur-xl`, change to `bg-surface border border-outline rounded-lg` (8px), remove shadow on hover, keep subtle translate-y hover
15. Rewrite `.bento-card:hover`: `bg-surface-hover border-outline-strong`, remove `shadow-[...]` and `-translate-y-1`
16. Replace all 5 `.tech-chip-*` classes with single `.tech-chip`: `bg-accent/8 text-accent border border-accent/15` with small radius

### Step 2: `src/layouts/Layout.astro`
**Changes:**
1. Add Google Fonts link for Plus Jakarta Sans (weights 500, 600, 700, **800**)
2. Remove `blueprint-grid` class from `<body>`
3. Delete entire decorative `<div class="fixed inset-0 ...">` block (lines 33-48) — all blurred blobs, dashed circles, diagonal patterns
4. Optionally add subtle noise texture `<div>` with very low opacity (0.03-0.05) as background — using CSS only, no image asset needed

### Step 3: `src/components/Badge.astro`
**Changes:**
1. Remove entire `getColorClass()` function — no longer needed
2. Remove `colorClass` variable
3. Replace `<span>` classes: remove `rounded-full`, `shadow-sm`, `backdrop-blur-sm`, `hover:scale-105`, dynamic `${colorClass}`
4. New classes: `tech-chip rounded font-mono text-[10px] uppercase tracking-widest font-bold px-2.5 py-1`
5. Remove inner dot `<span class="w-1 h-1 rounded-full ...">` — unnecessary decoration

### Step 4: `src/components/ProjectCard.astro`
**Changes:**
1. Remove `glowColors` array and `glowColor` variable (lines 13-14)
2. Remove blurred glow div (line 19)
3. Remove dot-pattern overlay div (line 21)
4. Simplify arrow indicator (line 23): remove `backdrop-blur-md`, `bg-surface/80`, `rounded-full`, `shadow-sm` → flat `bg-surface border border-outline rounded-md`
5. `isTopProject` indicator dot (line 37): remove `animate-pulse` and `shadow-[0_0_8px_...]`, change `bg-accent-emerald` → `bg-accent` — keep element as a static dot
6. Change hover color on title from `text-accent-indigo` → `text-accent`
7. Replace `bento-card` usage on root `<a>` — class already updated via global.css, but verify classes

### Step 5: `src/components/Navbar.astro`
**Changes:**
1. Desktop nav bar (line 22): remove `bg-surface/80 backdrop-blur-xl`, `md:rounded-full`, `shadow-sm` → `bg-background border-b border-outline` (flat, solid)
2. Logo hover (line 25): `text-accent-indigo` → `text-accent`
3. Pulsing cursor (line 28): remove `animate-pulse`, change `bg-accent-indigo` → `bg-accent`
4. Resume button (line 44): `rounded-full` → `rounded-md`
5. Hire Me button (line 47): `rounded-full` → `rounded-md`, remove `shadow-sm`, `hover:bg-accent-indigo` → `hover:bg-accent`, `hover:border-accent-indigo` → `hover:border-accent`
6. Mobile button (line 51): `rounded-full` → `rounded-md`, `bg-surface-variant/50` → `bg-surface`
7. Mobile menu (line 57): remove `backdrop-blur-2xl`, remove `blueprint-grid`, `bg-background/95` → `bg-background`
8. Mobile menu blurred blobs (lines 59-60): delete entirely
9. Active nav states (lines 64,71,78): `text-accent-indigo` → `text-accent`
10. Mobile resume card (line 87): `rounded-2xl` → `rounded-md`, remove `shadow-sm`, `bg-surface/50` → `bg-surface`, hover `accent-indigo` → `accent`

### Step 6: `src/components/FloatingNav.astro`
**Changes:**
1. Line 15: `group-hover:border-accent-emerald` → `group-hover:border-accent`
2. JS (lines 32,35): change `bg-accent-emerald`, `border-accent-emerald` → `bg-accent`, `border-accent`

### Step 7: `src/components/Footer.astro`
**Changes:**
1. Line 5: remove `bg-surface/50 backdrop-blur-sm` → `bg-background border-t border-outline`
2. Line 8: remove `rounded-full shadow-sm border border-outline-variant/30` → flat layout, no pill shape
3. Line 25: change `bg-green-500 animate-pulse` → `bg-accent` — keep element as a static dot, remove animation

### Step 8: `src/pages/index.astro`
**Changes:**
1. Lines 17-22: remove `arsenalColors` array — replace with single accent reference
2. Line 29-30: status badge → `bg-accent/8 border-accent/15 text-accent`, change pulsing dot from `bg-accent-emerald animate-pulse` → `bg-accent` static dot (remove animation, keep element)
3. Lines 47-48: primary CTA → remove `bg-accent-cyan`, replace with `bg-on-background text-background` (dark button), remove `shadow-[...]`, `rounded-full` → `rounded-md`
4. Line 50: secondary CTA → `rounded-full` → `rounded-md`, remove accent-indigo hover → accent hover
5. Line 84: remove blurred glow div in skill cards
6. Line 86: remove `dot-pattern` overlay in skill cards
7. Lines 79-91: simplify skill card accent → use single accent color

> **Note:** Headings (`h1`, `h2`, `h3`) auto-inherit Plus Jakarta Sans via the global `@layer base` rule — no manual class changes needed on this page.

### Step 9: `src/pages/about.astro`
**Changes:**
1. Lines 9-10: status badge → single accent color, change pulsing dot from `bg-accent-indigo animate-pulse` → `bg-accent` static dot (remove animation, keep element)
2. Lines 22-23: remove blurred blob + dashed circle
3. Lines 36-37: timeline node → remove glassmorphism, simplify border
4. Line 40: timeline card → `rounded-3xl` → `rounded-lg`, remove `backdrop-blur-sm`
5. Lines 44-46: GPA badge → single accent color (was cyan)
6. Line 52: checkmark icon → `text-accent` (was emerald)
7. Lines 69-76: cert card → `rounded-2xl` → `rounded-lg`, hover accent (was cyan)
8. Lines 83-85: remove blurred blob + dashed circle + dot-pattern
9. Line 96: activity card → `rounded-3xl` → `rounded-lg`, hover accent (was amber)
10. Lines 103-104: activity type badge → single accent

> **Note:** Headings auto-inherit Plus Jakarta Sans via the global rule — no manual class changes needed.

### Step 10: `src/pages/projects/[id].astro`
**Changes:**
1. Line 25: back link hover → `text-accent` (was accent-indigo)
2. Line 54: link buttons → `rounded-full` → `rounded-md`, remove `bg-surface/50 backdrop-blur-sm shadow-sm`
3. Line 64: `bento-card` (already updated globally), remove `focus-visible:ring-accent-indigo` → `focus-visible:ring-accent`
4. Line 66: remove blurred cyan blob
5. Line 82: checkmark icon → `text-accent` (was emerald)
6. Line 93: diagram placeholder → `rounded-[2rem]` → `rounded-lg`, remove `backdrop-blur-sm`, hover accent (was indigo)

> **Note:** Headings auto-inherit Plus Jakarta Sans via the global rule — no manual class changes needed.

### Step 11: `src/pages/projects/index.astro`
**Changes:**
- No glassmorphism/accent issues in this file
- Headings auto-inherit Plus Jakarta Sans via the global rule — no manual changes needed

### Step 12: Build Verification
Run `npx astro build` to confirm zero errors.

## Validation
- `astro build` must pass without errors
- No remaining references to: `accent-indigo`, `accent-cyan`, `accent-emerald`, `accent-amber`, `accent-rose`, `backdrop-blur`, `blueprint-grid`, `dot-pattern`, `diagonal-pattern`, `ornament-dashed-circle`, `rounded-full` on cards/containers, `shadow-[` custom shadows on cards, `blur-[` decorative blurs
- All `rounded-full` remaining should only be on: actual circular indicators (tiny dots), avatar images (if any)
- grep verification after completion for stale references

## Files Touched (12 total)
1. `src/styles/global.css`
2. `src/layouts/Layout.astro`
3. `src/components/Badge.astro`
4. `src/components/ProjectCard.astro`
5. `src/components/Navbar.astro`
6. `src/components/FloatingNav.astro`
7. `src/components/Footer.astro`
8. `src/pages/index.astro`
9. `src/pages/about.astro`
10. `src/pages/projects/[id].astro`
11. `src/pages/projects/index.astro`
12. (build verification — no file edit)

## Risk Notes
- The single accent color `#64748B` replaces 5 colors. All badges will now look uniform — this is intentional per the editorial aesthetic.
- Plus Jakarta Sans is loaded from Google Fonts (weights 500, 600, 700, 800). No self-hosted font files needed.
- Plus Jakarta Sans is applied to `h1, h2, h3` globally via `@layer base` in `global.css` — no manual `font-heading` class additions on individual elements.
- Pages (`index.astro`, `about.astro`, `[id].astro`) have inline Tailwind classes that reference old accent colors — these must be manually updated per-file (cannot be solved by CSS variable rename alone since they use `accent-indigo`, `accent-cyan` etc. as Tailwind class prefixes).
