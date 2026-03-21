---
description: Generate architecture documentation from component map
---

Generate architecture documentation from the component map.

## Instructions

1. Read `.codetape/component-map.json` for all components and relationships
2. Read recent traces from `.codetape/traces/` for context and decisions
3. Generate `docs/ARCHITECTURE.md` following @templates/architecture_overview.md:
   - Write a system overview (3-5 sentences about the project's purpose and architecture)
   - Generate a Mermaid dependency graph from component relationships
   - Create the components table
   - Include key technical decisions from recent traces
   - List recent changes
4. If `--components` flag is passed, also generate individual component docs at `docs/components/{name}.md` following @templates/component_doc.md
5. Create `docs/` and `docs/components/` directories if they don't exist

$ARGUMENTS
