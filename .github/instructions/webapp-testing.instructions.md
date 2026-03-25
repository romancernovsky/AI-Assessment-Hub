---
applyTo: "**/*.{py,spec.ts,test.ts,spec.js,test.js,e2e.ts,e2e.js}"
---

# Web Application Testing Skill

Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

> **Skill source:** `.github/skills/webapp-testing/SKILL.md`
> **Scripts:** `.github/skills/webapp-testing/scripts/`
> **Examples:** `.github/skills/webapp-testing/examples/`

## Decision Tree

```
Task → Is it static HTML?
  ├─ Yes → Read HTML file → identify selectors → write Playwright script
  └─ No (dynamic webapp) → Is server running?
      ├─ No → python .github/skills/webapp-testing/scripts/with_server.py --help
      │        Then use helper + write Playwright script
      └─ Yes → Reconnaissance-then-action:
          1. Navigate + wait for networkidle
          2. Take screenshot or inspect DOM
          3. Identify selectors from rendered state
          4. Execute actions with discovered selectors
```

## Helper Scripts

**Always run with `--help` first.** DO NOT read source — use as black-box scripts.

```bash
# Single server
python .github/skills/webapp-testing/scripts/with_server.py \
  --server "npm run dev" --port 5173 -- python your_automation.py

# Multiple servers
python .github/skills/webapp-testing/scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

## Playwright Script Template

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)  # Always headless
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # CRITICAL: wait for JS
    # ... automation logic
    browser.close()
```

## Best Practices

- ✅ Always wait `networkidle` before inspection on dynamic apps
- ✅ Use descriptive selectors: `text=`, `role=`, CSS, or IDs
- ✅ Add waits: `page.wait_for_selector()` or `page.wait_for_timeout()`
- ✅ Always close the browser when done
- ❌ Don't inspect DOM before `networkidle` on dynamic apps

## Example Files

- `examples/element_discovery.py` — Discovering buttons, links, inputs
- `examples/static_html_automation.py` — Using `file://` URLs
- `examples/console_logging.py` — Capturing console logs
