---
description: Record a semantic trace of recent code changes
---

Record a semantic trace of the coding work in this session.

## Instructions

1. Read `.codetape/config.json` for project context and component roots
2. Read `.codetape/component-map.json` for the current component registry
3. Analyse changes using `git diff --stat` and `git diff` (or list recently modified files if no git)
4. Read @references/trace_schema.md for the exact trace format
5. Generate the trace log following the schema precisely
6. Save to `.codetape/traces/{YYYY-MM-DD}_{HH-MM}_{slug}.md`
7. Update `.codetape/component-map.json`:
   - Add new components discovered in the diff
   - Update `last_modified` and `trace_refs` for affected components
   - Update `relationships` if new dependencies detected
8. Display the terminal summary following @templates/session_summary.md

## Quality gate
Before saving, verify:
- Summary is 2-3 sentences and independently understandable
- Every component row has an action verb (Added/Modified/Deleted/Refactored)
- At least one technical decision includes reasoning
- TODOs are specific and actionable
- No API keys, tokens, or credentials appear anywhere
- Trace is under 150 lines

$ARGUMENTS
