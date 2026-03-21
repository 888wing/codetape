---
description: Initialize Codetape in the current project
---

Set up Codetape tracking in this project. Use this when the CLI (`npx codetape init`) was not used.

## Instructions

1. Check if `.codetape/` already exists — if so, ask whether to reconfigure or abort
2. Detect the project:
   - Read package.json, Cargo.toml, pyproject.toml, go.mod, etc.
   - Identify language, framework, and likely component roots
   - Follow @references/component_patterns.md for detection patterns
3. Create `.codetape/` directory structure:
   - `.codetape/config.json` with detected values
   - `.codetape/component-map.json` with initial empty state
   - `.codetape/traces/` directory
   - `.codetape/archive/` directory
4. Perform initial component scan:
   - Walk each directory in `component_roots`
   - Identify components using patterns from @references/component_patterns.md
   - Write discovered components to `component-map.json`
5. Offer to add `.codetape/traces/` and `.codetape/drift.json` to `.gitignore`
6. Print setup summary with detected values and next steps

$ARGUMENTS
