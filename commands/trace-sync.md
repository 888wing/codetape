---
description: Sync documentation from recent traces
---

Synchronise project documentation with recent trace logs.

## Instructions

1. Read `.codetape/config.json` to get `sync_targets`
2. Read @references/sync_strategies.md for strategy definitions
3. Collect recent traces from `.codetape/traces/` (since last sync or last 5 traces)
4. For each sync target:
   a. Determine the strategy (append-managed, prepend, overwrite, merge)
   b. Read the target document
   c. Generate updated content using the appropriate template:
      - README → @templates/readme_section.md
      - CHANGELOG → @templates/changelog_entry.md
      - ARCHITECTURE → @templates/architecture_overview.md
   d. Show a diff preview of proposed changes
   e. Ask for confirmation before writing
5. After syncing, update the `last_synced` field if present

If called with `--target {name}`, only sync that specific target.
If called with `--yes`, skip confirmation prompts.

$ARGUMENTS
