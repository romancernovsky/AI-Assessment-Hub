---
applyTo: "**/*.{ts,js,py,mjs,cjs}"
---

# MCP Builder Skill

Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, in Python (FastMCP) or Node/TypeScript (MCP SDK).

> **Skill source:** `.github/skills/mcp-builder/SKILL.md`
> **Reference:** `.github/skills/mcp-builder/reference/`
> **Scripts:** `.github/skills/mcp-builder/scripts/`

## Process Overview

### Phase 1: Deep Research and Planning

**API Coverage vs. Workflow Tools:** Balance comprehensive API endpoint coverage with specialized workflow tools.

**Tool Naming:** Use consistent prefixes (e.g., `github_create_issue`, `github_list_repos`) and action-oriented naming.

**Recommended Stack:**
- **Language**: TypeScript (preferred — better SDK support and model familiarity)
- **Transport**: Streamable HTTP for remote servers (stateless JSON); stdio for local servers

**Reference documentation:**
- MCP Best Practices: `.github/skills/mcp-builder/reference/mcp_best_practices.md`
- TypeScript Guide: `.github/skills/mcp-builder/reference/node_mcp_server.md`
- Python Guide: `.github/skills/mcp-builder/reference/python_mcp_server.md`
- Evaluation Guide: `.github/skills/mcp-builder/reference/evaluation.md`

### Phase 2: Implementation

For each tool implement:
- **Input Schema**: Zod (TypeScript) or Pydantic (Python), with constraints and descriptions
- **Output Schema**: Define `outputSchema` for structured data; use `structuredContent`
- **Annotations**: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- **Error Messages**: Actionable, with specific suggestions and next steps

### Phase 3: Review and Test

- TypeScript: `npm run build`, test with `npx @modelcontextprotocol/inspector`
- Python: `python -m py_compile your_server.py`, then MCP Inspector

### Phase 4: Create Evaluations

Create 10 evaluation QA pairs (complex, read-only, verifiable, stable questions) in XML format:
```xml
<evaluation>
  <qa_pair>
    <question>...</question>
    <answer>...</answer>
  </qa_pair>
</evaluation>
```
