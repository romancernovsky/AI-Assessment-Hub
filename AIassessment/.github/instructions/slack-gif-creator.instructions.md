---
applyTo: "**/*.py"
---

# Slack GIF Creator Skill

Knowledge and utilities for creating animated GIFs optimized for Slack. Use when users request animated GIFs for Slack like "make me a GIF of X doing Y for Slack."

> **Skill source:** `.github/skills/slack-gif-creator/SKILL.md`
> **Core utilities:** `.github/skills/slack-gif-creator/core/`
> **Templates:** `.github/skills/slack-gif-creator/templates/`

## Slack Requirements

- **Emoji GIFs**: 128×128px, under 3s duration
- **Message GIFs**: 480×480px
- **FPS**: 10–30 (lower = smaller file)
- **Colors**: 48–128 (fewer = smaller file)

## Core Workflow

```python
from .github.skills.slack_gif_creator.core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)
for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # Draw animation using PIL primitives
    builder.add_frame(frame)
builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

## Available Utilities

- **`core.gif_builder`** — Assembles frames, optimizes for Slack
- **`core.validators`** — `validate_gif()`, `is_slack_ready()` — check Slack requirements
- **`core.easing`** — `interpolate()` with ease_in/out/bounce/elastic/back
- **`core.frame_composer`** — `create_blank_frame`, `create_gradient_background`, `draw_circle`, `draw_text`, `draw_star`

## Animation Concepts

- **Shake**: `math.sin()` offset on position
- **Pulse**: `math.sin(t * freq * 2 * math.pi)` for scale between 0.8–1.2
- **Bounce**: `interpolate()` with `easing='bounce_out'` on landing
- **Spin**: `image.rotate(angle, resample=Image.BICUBIC)`
- **Fade**: RGBA alpha channel from 0→1 or 1→0
- **Slide**: off-screen start + `easing='ease_out'`
- **Particles**: random angles/velocities + gravity per frame

## Making Graphics Look Good

- Use `width=2` or higher for outlines (thin lines look amateurish)
- Add visual depth: gradients, layered shapes
- Use vibrant, complementary colors with contrast
- Be creative — combine concepts (bouncing + rotating, pulsing + sliding)

## Dependencies

```bash
pip install pillow imageio numpy
```
