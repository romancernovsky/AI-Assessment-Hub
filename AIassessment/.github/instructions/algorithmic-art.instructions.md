---
applyTo: "**/*.{js,ts,html}"
---

# Algorithmic Art Skill

Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work.

> **Skill source:** `.github/skills/algorithmic-art/SKILL.md`
> **Templates:** `.github/skills/algorithmic-art/templates/`

## Process

This happens in two steps:
1. **Algorithmic Philosophy Creation** (`.md` file)
2. **Express** by creating p5.js generative art (`.html` + `.js` files)

## Step 1: Algorithmic Philosophy Creation

Create a computational aesthetic movement — NOT static images or templates. The philosophy must emphasize: Algorithmic expression. Emergent behavior. Computational beauty. Seeded variation.

**Name the movement** (1-2 words): e.g., "Organic Turbulence" / "Quantum Harmonics" / "Emergent Stillness"

**Articulate the philosophy** (4-6 paragraphs):
- Computational processes and mathematical relationships
- Noise functions and randomness patterns
- Particle behaviors and field dynamics
- Temporal evolution and system states
- Parametric variation and emergent complexity

**CRITICAL GUIDELINES:**
- Each algorithmic aspect mentioned once — no redundancy
- Emphasize craftsmanship REPEATEDLY: "meticulously crafted algorithm," "master-level implementation," "painstaking optimization"
- Leave creative space for interpretive implementation choices

## Step 2: P5.js Implementation

### Template
Read `.github/skills/algorithmic-art/templates/viewer.html` as the LITERAL STARTING POINT. Keep all FIXED sections exactly (header, sidebar, Anthropic branding, seed controls, action buttons). Replace only VARIABLE sections (algorithm, parameters, UI controls).

### Seeded Randomness (Art Blocks Pattern)
```javascript
let seed = 12345;
randomSeed(seed);
noiseSeed(seed);
```

### Parameter Structure
```javascript
let params = {
  seed: 12345,  // Always include
  // quantities, scales, probabilities, ratios, angles, thresholds
  // that emerge naturally from the algorithmic philosophy
};
```

### Canvas Setup
```javascript
function setup() {
  createCanvas(1200, 1200);
}
function draw() {
  // Generative algorithm — same seed = identical output
}
```

### Required Features
1. **Parameter Controls** — sliders for numeric params, color pickers, real-time updates
2. **Seed Navigation** — prev/next/random buttons, jump to seed input
3. **Single HTML Artifact** — self-contained, p5.js from CDN, everything inline

### Craftsmanship Requirements
- Balance complexity without visual noise
- Thoughtful color palettes (not random RGB)
- Visual hierarchy even in randomness
- Same seed ALWAYS produces identical output
