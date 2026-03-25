# AURA AI — Visual Style Specification

> Living reference for the AIHub Assessment visual identity, aligned with the AURA AI design system.

---

## 1. Design Philosophy

The AURA design language balances **precision** with **warmth**. It uses clean geometry, intentional color, and generous spacing to create an interface that feels intelligent without being cold. Dark mode is the default experience; light mode is available as an accessibility/preference toggle.

---

## 2. Color System

Colors are defined as CSS custom properties in HSL format with alpha-value support via Tailwind's `hsl(var(--token) / <alpha-value>)` pattern.

### 2.1 Core Tokens (Dark Mode — Default)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `200 25% 10%` | `#141c22` | Page background |
| `--foreground` | `60 10% 95%` | `#f3f2ed` | Primary text |
| `--card` | `200 20% 14%` | `#1b2730` | Card / panel surfaces |
| `--card-foreground` | `60 10% 95%` | `#f3f2ed` | Card text |
| `--primary` | `175 70% 45%` | `#22b8a0` | Primary accent (teal) |
| `--primary-foreground` | `200 25% 10%` | `#141c22` | Text on primary |
| `--accent` | `45 85% 55%` | `#e8b931` | Secondary accent (gold) |
| `--accent-foreground` | `200 25% 10%` | `#141c22` | Text on accent |
| `--secondary` | `200 15% 20%` | `#2b3640` | Secondary surfaces |
| `--muted` | `200 15% 20%` | `#2b3640` | Muted backgrounds |
| `--muted-foreground` | `200 10% 55%` | `#808d96` | Muted text |
| `--border` | `200 15% 22%` | `#2f3b45` | Borders |
| `--input` | `200 15% 22%` | `#2f3b45` | Input borders |
| `--ring` | `175 70% 45%` | `#22b8a0` | Focus rings |
| `--destructive` | `0 70% 55%` | `#d94444` | Error / destructive |

### 2.2 Core Tokens (Light Mode)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `60 20% 98%` | `#faf9f5` | Page background |
| `--foreground` | `200 25% 10%` | `#141c22` | Primary text |
| `--card` | `0 0% 100%` | `#ffffff` | Card surfaces |
| `--primary` | `175 70% 38%` | `#1d9e89` | Primary accent (teal) |
| `--accent` | `45 85% 50%` | `#e0a817` | Secondary accent (gold) |
| `--secondary` | `60 10% 93%` | `#edece6` | Secondary surfaces |
| `--muted` | `60 10% 93%` | `#edece6` | Muted backgrounds |
| `--muted-foreground` | `200 10% 40%` | `#5c6970` | Muted text |
| `--border` | `60 10% 87%` | `#dfddd3` | Borders |

### 2.3 Chart Palette

| Token | HSL | Purpose |
|---|---|---|
| `--chart-1` | `175 70% 45%` | Teal (primary data) |
| `--chart-2` | `45 85% 55%` | Gold (secondary data) |
| `--chart-3` | `260 45% 60%` | Violet (tertiary) |
| `--chart-4` | `142 50% 45%` | Green |
| `--chart-5` | `210 45% 60%` | Blue |

### 2.4 Dimension Colors (Assessment)

| Dimension | Hex | RGB |
|---|---|---|
| AI Mindset | `#22b8a0` | 34, 184, 160 |
| Applied Skills | `#6a9bcc` | 106, 155, 204 |
| Domain Integration | `#4a9e6e` | 74, 158, 110 |
| Technical Proficiency | `#e8b931` | 232, 185, 49 |

### 2.5 Status / Semantic Colors

| Purpose | Color approach |
|---|---|
| Success | `emerald-500/400` family |
| Warning | `amber-500/400` family |
| Error / Destructive | `rose-500/400` family |
| Info | `primary` (teal) |

---

## 3. Typography

### Font Stack

| Role | Font | Fallback | CSS Variable |
|---|---|---|---|
| **Sans (body/UI)** | Inter | system-ui, sans-serif | `--font-sans` |
| **Serif (display)** | Playfair Display | Georgia, serif | `--font-serif` |
| **Mono (code/IDs)** | JetBrains Mono | Consolas, monospace | `--font-mono` |

### Type Scale

| Element | Classes |
|---|---|
| Page title | `text-4xl md:text-5xl font-bold tracking-tight` |
| Section heading | `text-2xl md:text-3xl font-bold` |
| Card heading | `text-xl font-bold` |
| Body | `text-base` (16px default) |
| Small / labels | `text-sm` or `text-xs` |
| Gradient display | `.aura-text-gradient` (teal → gold → violet, animated) |

---

## 4. Spacing & Layout

- **Border radius**: `--radius: 0.5625rem` (≈9px) — slightly softer than default
- **Card padding**: `p-6` to `p-8` depending on content density
- **Section gaps**: `space-y-8` between major sections
- **Max content width**: `max-w-4xl mx-auto` for reading views
- **Page padding**: handled by the `<main>` container in layout

---

## 5. Component Patterns

### 5.1 Cards & Panels

Two surface components, both solid (not glassmorphic):

| Component | CSS class | Visual |
|---|---|---|
| `GlassCard` | `.glass-card` | `bg-card`, 1px border, `shadow-sm` |
| `GlassPanel` | `.glass-panel` | `bg-card`, 1px border, no shadow |

### 5.2 Buttons

| Variant | CSS class | Visual |
|---|---|---|
| Primary | `.btn-primary` | Solid `bg-primary`, dark text |
| Secondary / Ghost | `.btn-secondary` | Transparent with border, `text-foreground` |

Sizes: `sm` (px-4 py-2), `md` (px-6 py-2.5), `lg` (px-8 py-3.5 text-lg)

### 5.3 Badges

Variants: `success` (emerald), `warning` (amber), `info` (teal primary). Each uses subtle bg + border + colored text.

### 5.4 Inputs

`.glass-input` — `bg-input`, 1px border, focus ring uses `--primary`.

### 5.5 Navigation

- Sticky top bar (`bg-background`) with blur when solid
- `ThemeToggle` button (sun/moon icon) in the nav actions area
- Nav links use `text-muted-foreground` → `text-foreground` on hover/active

---

## 6. Effects & Decorations

### AURA Orbs
Background glow circles (`.aura-orb-primary`, `.aura-orb-accent`, `.aura-orb-violet`, `.aura-orb-emerald`) — large, blurred, low-opacity.

### AURA Ring
`.aura-ring` — rotating conic-gradient ring (primary → accent → violet → emerald).

### Neural Background
`.neural-bg` — radial dot-grid pattern using `--primary` at 3% opacity.

### Shimmer
`.aura-shimmer` — horizontal sweep using primary/accent/violet highlights.

### Tier Glows
`.tier-glow-bronze`, `.tier-glow-silver`, `.tier-glow-gold`, `.tier-glow-platinum`, `.tier-glow-master` — border glow effects for gamification tiers.

---

## 7. Dark / Light Mode

- **Default**: Dark (`.dark` class on `<html>`)
- **Toggle**: `ThemeToggle` component in navbar
- **Persistence**: `localStorage` key `aura-theme`
- **Implementation**: `ThemeProvider` context toggles `.dark` class on `<html>`, Tailwind `darkMode: ["class"]`

---

## 8. Accessibility

- **Focus visible**: 2px `--primary` outline with 2px offset on all interactive elements
- **Reduced motion**: `prefers-reduced-motion` disables animations, transitions set to 0
- **High contrast**: `prefers-contrast: more` increases border opacity and text contrast
- **Color contrast**: All text/background combinations meet WCAG AA standards

---

## 9. Elevation System

| Level | Shadow variable | Use case |
|---|---|---|
| Level 1 | `--elevate-1` | Cards, dropdowns |
| Level 2 | `--elevate-2` | Modals, panels |

`.hover-elevate` and `.active-elevate` classes for interactive lift.

---

## 10. Tailwind Configuration Summary

```
darkMode: ["class"]
plugins: tailwindcss-animate, @tailwindcss/typography
fonts: Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
colors: all mapped from CSS custom properties via hsl(var(--token) / <alpha-value>)
```

---

## 11. Migration Notes

Migrated from the original AIHub purple/pink glassmorphism theme to the AURA teal/gold solid-surface design system. Key changes:

- **Color shift**: `violet-500`/`indigo-500`/`purple-500` → `primary` (teal) / `accent` (gold)
- **Gradient text**: `from-violet-400 to-pink-400` → `.aura-text-gradient` or `from-primary to-accent`
- **Surfaces**: Removed `backdrop-blur` glassmorphism in favor of solid `bg-card` surfaces
- **Backgrounds**: Removed purple gradient on body; now uses flat `hsl(var(--background))`
- **Charts (Recharts)**: Radar stroke/fill `#8b5cf6` → `#22b8a0`, PolarGrid uses `hsl(var(--border))`
- **All semantic tokens**: Defined in `globals.css` `:root` (light) and `.dark` (dark) blocks
