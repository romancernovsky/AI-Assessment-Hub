---
applyTo: "**/*.{tsx,jsx,html,ts,js}"
---

# Web Artifacts Builder Skill

Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components — not for simple single-file HTML/JSX artifacts.

> **Skill source:** `.github/skills/web-artifacts-builder/SKILL.md`
> **Scripts:** `.github/skills/web-artifacts-builder/scripts/`

**Stack**: React 18 + TypeScript + Vite + Parcel (bundling) + Tailwind CSS + shadcn/ui

## Quick Start

### Step 1: Initialize Project
```bash
bash .github/skills/web-artifacts-builder/scripts/init-artifact.sh <project-name>
cd <project-name>
```

Creates: React + TypeScript (Vite), Tailwind CSS 3.4.1, shadcn/ui (40+ components pre-installed), path aliases (`@/`), Parcel config.

### Step 2: Develop Your Artifact
Edit generated files. See `.github/skills/web-artifacts-builder/SKILL.md` for Common Development Tasks.

### Step 3: Bundle to Single HTML File
```bash
bash .github/skills/web-artifacts-builder/scripts/bundle-artifact.sh
```

Creates `bundle.html` — self-contained with all JS, CSS, and dependencies inlined.

### Step 4: Share Artifact
Share the bundled HTML file — it works in any browser with no setup.

### Step 5: Testing (Optional)
Only test if necessary or requested. Avoid upfront testing as it adds latency.

## Design & Style Guidelines

**VERY IMPORTANT**: Avoid "AI slop" — no excessive centered layouts, purple gradients, uniform rounded corners, or Inter font.

## Reference
- shadcn/ui components: https://ui.shadcn.com/docs/components
