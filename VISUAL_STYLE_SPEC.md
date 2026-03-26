# Novartis Brand — Visual Style Specification

> Living reference for the AIHub Assessment visual identity, aligned with the Novartis Corporate Brand Guidelines.

---

## 1. Design Philosophy

The visual system follows the **Novartis corporate brand language**: clean rectangular geometry, intentional use of Space Orange as the sole accent color, generous spacing on an 8px grid, and the proprietary Volta Modern Display typeface. The design is precise, confident, and accessibility-first. Light mode is the default experience; dark mode (Warm Black inverted sections) is available as a toggle.

---

## 2. Color System

Colors are defined as CSS custom properties in HSL format with alpha-value support via Tailwind's `hsl(var(--token) / <alpha-value>)` pattern. Only approved Novartis brand colors are used.

### 2.1 Brand Palette

| Name | Hex | Role |
|---|---|---|
| **Soft White** | `#fcfcfc` | Page background (light mode), text on dark |
| **Warm Black** | `#161616` | Primary text, dark sections, footer |
| **Space Orange** | `#ff4e00` | Primary accent — CTAs, links, highlights |
| **Orange hover** | `#e64500` | Button/link hover state |
| **Orange pressed** | `#cc3d00` | Button active state |
| **Grey 1** | `#dadada` | Borders, dividers |
| **Grey 2** | `#f5f5f5` | Alternate section backgrounds |
| **Science Lab Blue** | `#a5bff5` | Illustration/gradient accent only |
| **Human Body Pink** | `#eda8d1` | Illustration/gradient accent only |

### 2.2 Core Tokens (Light Mode — Default)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `0 0% 99%` | `#fcfcfc` | Page background |
| `--foreground` | `0 0% 9%` | `#161616` | Primary text |
| `--card` | `0 0% 100%` | `#ffffff` | Card surfaces |
| `--card-foreground` | `0 0% 9%` | `#161616` | Card text |
| `--primary` | `18 100% 50%` | `#ff4e00` | Space Orange accent |
| `--primary-foreground` | `0 0% 99%` | `#fcfcfc` | Text on primary |
| `--accent` | `0 0% 96%` | `#f5f5f5` | Grey 2 alt backgrounds |
| `--muted` | `0 0% 96%` | `#f5f5f5` | Muted backgrounds |
| `--muted-foreground` | `0 0% 45%` | `#737373` | Muted text |
| `--border` | `0 0% 85%` | `#dadada` | Borders (Grey 1) |
| `--ring` | `18 100% 50%` | `#ff4e00` | Focus rings |
| `--destructive` | `0 70% 50%` | `#d94444` | Error / destructive |

### 2.3 Core Tokens (Dark Mode)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `0 0% 9%` | `#161616` | Warm Black bg |
| `--foreground` | `0 0% 99%` | `#fcfcfc` | Soft White text |
| `--card` | `0 0% 12%` | `#1f1f1f` | Card surfaces |
| `--primary` | `18 100% 50%` | `#ff4e00` | Space Orange (unchanged) |
| `--border` | `0 0% 20%` | `#333333` | Borders |
| `--muted` | `0 0% 14%` | `#242424` | Muted backgrounds |
| `--muted-foreground` | `0 0% 60%` | `#999999` | Muted text |

### 2.4 Chart Palette

| Token | HSL | Purpose |
|---|---|---|
| `--chart-1` | `18 100% 50%` | Orange (primary data) |
| `--chart-2` | `140 45% 48%` | Green (secondary) |
| `--chart-3` | `220 60% 65%` | Blue (tertiary) |
| `--chart-4` | `320 50% 55%` | Pink |
| `--chart-5` | `45 80% 55%` | Gold |

### 2.5 Status & Feedback Colors

All status indicators use brand-aligned neutral styling rather than semantic color families:

| Purpose | Approach |
|---|---|
| Success / positive | `border-l-2 border-l-[#ff4e00]` accent + `bg-muted/50` |
| Warning / locked | `border-l-2 border-l-[#ff4e00]` accent + `bg-muted/50` |
| Error / destructive | `border-l-2 border-l-destructive` accent + `bg-muted/50` |
| Info / neutral | `border border-border` + `bg-muted/50` |
| Active status dot | `bg-[#ff4e00]` (Space Orange) |
| Inactive status dot | `bg-muted-foreground` |

### 2.6 Critical Color Rules

1. **No semantic color backgrounds** — no emerald, amber, rose, yellow, green, or blue colored boxes/backgrounds anywhere in the UI
2. **Orange text minimum 24px** — Space Orange text must be ≥ 24px for WCAG AA compliance (4.0:1 contrast on Soft White)
3. **Gradient ≤ 30%** — Space Gradient must not cover more than ~30% of any content unit
4. **No colors outside the approved palette** — only Warm Black, Soft White, Space Orange, Grey 1, Grey 2

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | Loading |
|---|---|---|---|
| **Sans (all UI)** | Volta Modern Display | Arial, Helvetica, sans-serif | Self-hosted `.woff` via `@font-face` |
| **Mono (code/IDs)** | JetBrains Mono | Consolas, monospace | Google Fonts (`--font-mono`) |

### Weights

| Weight | Value | Usage |
|---|---|---|
| Roman | 400 | Body text, subheads, labels |
| Medium | 500 | Headlines, buttons, emphasis |

### Type Scale

| Element | Size | Weight | Line-Height |
|---|---|---|---|
| Display / Hero H1 | 64px (4rem) | Medium 500 | 1.0× |
| H1 | 48px (3rem) | Medium 500 | 1.0× |
| H2 | 32px (2rem) | Medium 500 | 1.0× |
| H3 | 24px (1.5rem) | Medium 500 | 1.3× |
| Subheadline | 20px (1.25rem) | Roman 400 | 1.3× |
| Body | 16px (1rem) | Roman 400 | 1.5× |
| Caption | 14px (0.875rem) | Roman 400 | 1.5× |
| Small / Legal | 12px (0.75rem) | Roman 400 | 1.5× |

### Text Rules

- **Always left-aligned.** Never justified or right-aligned.
- **No all-caps.** Reduces readability per brand guidelines.
- Centered text only for single-word headlines.

---

## 4. Spacing & Layout

- **Base unit**: 8px — all spacing derives from this scale
- **Border radius**: `0px` on all elements — sharp rectangular edges, no rounding
- **Card padding**: `p-6` to `p-8` depending on content density
- **Section gaps**: `space-y-8` between major sections
- **Max content width**: `max-w-[1400px] mx-auto px-6`
- **Page padding**: Handled by `<main>` container in layout.tsx
- **Gradient stripe**: 4px Space Gradient bar above the navbar

### Spacing Scale (CSS Custom Properties)

| Token | Value |
|---|---|
| `--nvs-space-xxs` | 2px |
| `--nvs-space-xs` | 4px |
| `--nvs-space-s` | 8px |
| `--nvs-space-m` | 16px |
| `--nvs-space-l` | 24px |
| `--nvs-space-xl` | 32px |
| `--nvs-space-xxl` | 48px |
| `--nvs-space-xxxl` | 64px |

---

## 5. Component Patterns

### 5.1 Cards & Panels

Solid surfaces with sharp edges and 1px borders:

| Component | CSS Class | Visual |
|---|---|---|
| Card | `.glass-card` or `border border-border bg-card` | Solid surface, 1px border, `shadow-sm`, 0px radius |
| Panel | `.glass-panel` | Solid surface, bottom border, no shadow |

### 5.2 Buttons

| Variant | CSS Class | Visual |
|---|---|---|
| Filled (default) | `.btn-filled` | Solid `bg-[#161616]`, white text, orange on hover |
| Primary (text) | `.btn-primary` | Transparent, bottom border, arrow `→`, orange on hover |
| Secondary / Ghost | `.btn-secondary` | Transparent with 1px border, orange border/text on hover |
| Text Button (dark) | `.btn-started` | Transparent, arrow `→` after text, orange on hover |
| Text Button (light) | On dark/gradient bg | Soft White text, subtle bottom border |

Sizes: `sm` (px-4 py-2), `md` (px-6 py-2.5), `lg` (px-8 py-3.5 text-lg)

All buttons have **0px border-radius**. Arrow `→` shifts right 4px on hover.

### 5.3 Badges

Uses neutral brand styling: `bg-muted/50 border border-border text-foreground` for default, `bg-[#ff4e00]/10 border-[#ff4e00]/25 text-[#ff4e00]` for highlighted/achievement states.

### 5.4 Inputs

`.glass-input` — `bg-input`, 1px border, 0px radius. Focus state: `border-color: #ff4e00` with 1px orange box-shadow.

### 5.5 Navigation

- Sticky top bar, 72px height, `bg-white dark:bg-[#161616]`
- Official Novartis logo SVG (Warm Black, left-aligned, `dark:invert`)
- Nav links: Roman 400, 16px, Warm Black — 2px Space Orange bottom border on hover
- Mobile: Brand `Burger-menu.svg` icon, drawer slides from left
- `ThemeToggle` (sun/moon icon) in nav actions area

### 5.6 Status Indicators

All feedback/status boxes use the same brand-aligned pattern:
- **Left border accent**: 2px `border-l-[#ff4e00]` (success/info) or `border-l-destructive` (error)
- **Background**: `bg-muted/50`
- **Border**: `border border-border`
- **Text**: `text-foreground` for labels, `text-muted-foreground` for descriptions

### 5.7 Icons

24 approved Novartis brand icons (SVG, 48×48 grid, 2px stroke) in `public/icons/`:
- Used with `<Image>` component, `dark:invert` for theme support
- Common sizes: 20px, 24px, 40px, 48px
- Key icons: Brain, Data-analytics, Data-chart, Document, Feedback, Gears, Globe, Integration, Security, Target-group, Trophy-award, etc.

---

## 6. Effects & Decorations

### Space Gradient Stripe
4px horizontal bar at the top of the page:
```css
background: linear-gradient(90deg, #ff4e00 0%, #a5bff5 50%, #eda8d1 100%);
```

### Cosmos Gradient Overlay (Hero)
Dark left-to-right overlay for the home page hero banner:
```css
background: linear-gradient(90deg,
  rgba(22,22,22,0.92) 0%,
  rgba(22,22,22,0.85) 25%,
  rgba(22,22,22,0.50) 50%,
  rgba(22,22,22,0.10) 70%,
  transparent 85%
);
```

### Content Entrance Animation
Left-to-right slide-in per Novartis motion guidelines:
```css
animation: nvsSlideIn 300ms cubic-bezier(0, 0.5, 0.3, 1) forwards;
/* translateX(-20px) → translateX(0), opacity 0 → 1 */
```

### Section Divider
```css
.nvs-divider { border-top: 1px solid #dadada; margin: 48px 0; }
```

### Motion Tokens
| Token | Value | Usage |
|---|---|---|
| `--nvs-duration-impact` | 50ms | Snap interactions |
| `--nvs-duration-normal` | 300ms | Standard transitions |
| `--nvs-duration-slow` | 500ms | Entrance animations |
| `--nvs-ease-decel` | `cubic-bezier(0, 0.5, 0.3, 1)` | Deceleration curve |

---

## 7. Dark / Light Mode

- **Default**: Light (Soft White `#fcfcfc`)
- **Toggle**: `ThemeToggle` component in navbar
- **Persistence**: `localStorage` key `nvs-theme`
- **Implementation**: `ThemeProvider` context toggles `.dark` class on `<html>`, Tailwind `darkMode: ["class"]`

---

## 8. Accessibility

- **Focus visible**: 2px `--primary` (Space Orange) outline with 2px offset on all interactive elements
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all animations and transitions
- **High contrast**: `prefers-contrast: more` increases border opacity and text contrast
- **Color contrast**: Warm Black on Soft White = 19.3:1 (passes all). Space Orange on Soft White = 4.0:1 (passes large text only, ≥ 24px)
- **Orange text rule**: Never use `text-[#ff4e00]` below 24px font size

---

## 9. Elevation System

| Level | Shadow Variable | Use Case |
|---|---|---|
| Level 1 | `--elevate-1` | Cards, dropdowns |
| Level 2 | `--elevate-2` | Modals, panels |

`.hover-elevate` and `.active-elevate` classes for interactive lift.

---

## 10. Brand Assets

All brand assets are stored in the project:

| Location | Contents |
|---|---|
| `public/novartis-logo.svg` | Primary Novartis logo (Warm Black) |
| `public/brand-symbol.svg` | Brand Symbol (Warm Black) |
| `public/brand-symbol-white.svg` | Brand Symbol (Soft White, for dark sections) |
| `public/gradient-banner.png` | Space Gradient banner image (hero background) |
| `public/gradient-01.svg` | SVG gradient variant |
| `public/icons/` | 24 approved brand icons (SVG format) |
| `src/app/fonts/VoltaModernDisplay-Roman.woff` | Body font (400 weight) |
| `src/app/fonts/VoltaModernDisplay-Medium.woff` | Heading font (500 weight) |

---

## 11. Tailwind Configuration Summary

```
darkMode: ["class"]
borderRadius: 0px (all levels)
plugins: tailwindcss-animate, @tailwindcss/typography
fonts: Volta Modern Display (sans), JetBrains Mono (mono)
colors: all mapped from CSS custom properties via hsl(var(--token) / <alpha-value>)
direct brand utilities: nvs-orange, nvs-black, nvs-white, nvs-grey1, nvs-grey2
```

---

## 12. Home Page Structure

The home page uses a distinct full-bleed layout (negative margins to escape the container):

1. **Hero Banner** — Full-width, gradient-banner.png background with cosmos gradient overlay, Soft White text, text buttons (light variant)
2. **Feature Cards** — 3-column grid with brand icons (Data-analytics, Globe, Data-chart)
3. **Media Content Stripe** — Grey 2 alternate background, 50/50 grid with methodology content + stat cards
4. **Gradient Accent Stripe** — 4px Space Gradient divider
5. **Dark CTA Banner** — Warm Black background, Soft White text, text button (light variant)
6. **Footer** — Warm Black background, Brand Symbol + copyright text

---

## 13. Migration Notes

Migrated from the AURA AI teal/gold design system to the Novartis Corporate Brand Guidelines. Key changes:

- **Color shift**: Teal `#22b8a0` / Gold `#e8b931` → Space Orange `#ff4e00` / Warm Black `#161616`
- **Font**: Inter (Google Font) → Volta Modern Display (self-hosted .woff)
- **Border radius**: 0.5625rem (9px) → 0px everywhere (sharp rectangular edges)
- **Semantic colors removed**: All emerald, amber, rose, yellow, green, blue colored boxes/backgrounds replaced with brand-neutral `bg-muted/50` + `border-l-2` accent pattern
- **Icons**: Lucide/inline SVGs → Approved Novartis brand icon library (24 SVGs)
- **Gradient effects**: AURA orbs/ring/shimmer removed → Novartis Space Gradient (orange → blue → pink) and cosmos gradient overlay
- **Status indicators**: Colored semantic backgrounds → neutral muted backgrounds with orange or border left-accent
- **Dark mode default**: Changed from dark-first to light-first (Soft White default)
- **Theme key**: `aura-theme` → `nvs-theme`
