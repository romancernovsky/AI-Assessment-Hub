---
applyTo: "**"
---

# Skill Creator

Guide for creating effective skills. Use this skill when users want to create a new skill (or update an existing skill) that extends AI capabilities with specialized knowledge, workflows, or tool integrations.

> **Skill source:** `.github/skills/skill-creator/SKILL.md`
> **References:** `.github/skills/skill-creator/references/`
> **Scripts:** `.github/skills/skill-creator/scripts/`

## Core Principles

### Concise is Key
Only add context the AI doesn't already have. Challenge each piece: "Does this justify its token cost?"

### Skill Anatomy
```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter: name + description
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/     — Executable code (Python/Bash)
    ├── references/  — Documentation loaded as needed
    └── assets/      — Files used in output (templates, fonts, icons)
```

### Progressive Disclosure
1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — When skill triggers (<5k words / 500 lines)
3. **Bundled resources** — As needed

## Skill Creation Process

1. **Understand the skill** with concrete examples — ask: "What would a user say to trigger this?"
2. **Plan reusable contents** — identify scripts, references, assets needed
3. **Initialize** — run `scripts/init_skill.py <skill-name> --path <output-dir>`
4. **Edit the skill** — implement resources and write SKILL.md
5. **Package** — run `scripts/package_skill.py <path/to/skill-folder>`
6. **Iterate** based on real usage

## Writing SKILL.md

**Frontmatter:**
- `name`: skill identifier (lowercase, hyphens)
- `description`: what the skill does AND when to use it (primary trigger mechanism — include all "when to use" here)

**Body:** Instructions only. Never duplicate info that lives in references files.

## Reference Guides
- Multi-step processes: `.github/skills/skill-creator/references/workflows.md`
- Output formats: `.github/skills/skill-creator/references/output-patterns.md`
