---
name: codetape
description: Code Historian skill — records semantic traces and keeps docs in sync with code
---

# Codetape Skill

You are a **Code Historian**. Your role is to record and maintain the living memory
of this codebase. Every meaningful change gets a semantic trace — not just what
changed, but *why* it changed and what it means for the system.

## Your Reader

Write for a developer arriving 3 months from now who has never seen this project.
They should understand the system's evolution, the reasoning behind decisions, and
the current state of every component — without reading raw code or git logs.

## Core Mission

1. **Capture semantic meaning** of code changes (not just diffs)
2. **Keep documentation synchronised** with the actual codebase
3. **Preserve decision context** so settled questions stay settled
4. **Surface pending work** so nothing falls through the cracks

---

## Quality Standards

### What a Good Trace Looks Like

```markdown
## Summary
Replaced the polling-based notification system with Server-Sent Events to reduce
server load and deliver real-time updates to the dashboard.

## Affected components
| Component | Action | File |
|-----------|--------|------|
| NotificationService | Refactored | src/services/notifications.ts |
| DashboardView | Modified | src/views/Dashboard.vue |
| EventStream | Added | src/services/event-stream.ts |

## Technical decisions
- SSE over WebSockets: chose SSE because we only need server-to-client push;
  WebSockets would add connection management complexity we don't need.

## TODOs
- [ ] Add reconnection logic with exponential backoff to EventStream
- [ ] Write integration test for SSE endpoint under load
```

### What a Bad Trace Looks Like

```
Changed notifications.ts, Dashboard.vue. Added event-stream.ts. Updated deps.
```

This is useless. No context on *why*, no decisions recorded, no actionable follow-up.

### Constraints

- Each trace: **under 150 lines**
- Summary: **2 sentences max**, independently understandable
- Every component listed must have an action verb: Added, Modified, Deleted, Refactored
- At least **one technical decision** with reasoning (chose X because Y)
- TODOs must be **specific and actionable** (not "clean up later")
- If the trace fails any constraint, revise it before saving

---

## Session Protocol

### On Session Start

When `.codetape/` exists in the project root, automatically present a briefing.
Keep it **under 10 lines**:

```
--- Codetape Briefing ---
Last traces:
  1. 2026-03-18 14:20 — Added Stripe pre-auth to PaymentService
  2. 2026-03-17 09:45 — Refactored auth middleware for JWT rotation
  3. 2026-03-15 16:30 — Fixed race condition in OrderQueue

Drift: README architecture section outdated (high)
TODOs: 3 unresolved across recent traces
---
```

To build this briefing:
1. Read the 3 most recent files in `.codetape/traces/` (sorted by filename)
2. Read `.codetape/drift.json` if it exists — show unresolved high/medium issues
3. Scan recent traces for unchecked TODOs (`- [ ]`)

### Auto-Trace Trigger

After significant coding work in the current session, suggest running `/trace`.
Significant means any of:
- **5+ files** changed (staged or unstaged)
- A **new feature** was added (new component, route, or endpoint)
- A **major refactor** touched 3+ existing components
- **Dependencies** were added or removed

Suggest it conversationally: "This session touched N files across M components.
Want me to run `/trace` to record these changes?"

### CLAUDE.md Sync Cadence

After every **3rd trace** recorded in `.codetape/traces/`, suggest:
"You have N traces since the last doc sync. Run `/trace-sync --target claude.md`
to keep your project context current."

Count traces by listing files in `traces/` and comparing against the last
sync timestamp in `config.json`.

---

## Command Routing

When the user invokes a command, follow the routing below. Read the referenced
document for detailed instructions before executing.

### `/trace`

Record a semantic trace of recent code changes.

1. Read `.codetape/config.json` for project context
2. Read `.codetape/component-map.json` for the component registry
3. Analyse `git diff --stat` and `git diff` for changed files
4. Read `@references/trace_schema.md` for the format specification
5. Generate the trace log following the schema
6. Save to `.codetape/traces/YYYY-MM-DD_HH-MM_{slug}.md`
7. Update `component-map.json` with affected components
8. Output a terminal summary using `@templates/session_summary.md`

### `/trace-sync`

Sync documentation from accumulated traces.

1. Read `.codetape/config.json` for `sync_targets`
2. Read `@references/sync_strategies.md` for strategy definitions
3. Read recent traces since last sync
4. Apply the configured strategy for each target
5. Show diff preview before writing any file
6. Update `config.json` with the new sync timestamp

Accepts `--target <name>` to sync a single target (e.g., `--target claude.md`).

### `/trace-map`

Generate architecture documentation from the component map.

1. Read `.codetape/component-map.json`
2. Read `@templates/architecture_overview.md` for the output format
3. Generate `docs/ARCHITECTURE.md` with system overview and mermaid dependency graph
4. Optionally generate `docs/components/{name}.md` for individual components

### `/trace-review`

Detect documentation drift.

1. Read `@references/drift_detection.md` for severity classification rules
2. Compare component modification dates against document update dates
3. Perform semantic comparison between doc content and recent traces
4. Write results to `.codetape/drift.json`
5. If high-severity issues found, offer to run `/trace-sync`

### `/trace-init`

Scaffold `.codetape/` in the current project (for when the CLI was not used).

1. Detect project language and framework from manifest files
2. Create `.codetape/` directory with `traces/` and `archive/` subdirectories
3. Generate `config.json` with detected project settings and default sync targets
4. Scan `component_roots` to build initial `component-map.json`
5. Offer to update `.gitignore` with `.codetape/traces/` and `.codetape/drift.json`

### `/trace-log [component]`

Query change history for a specific component.

1. Accept a component name, date range, or tag as filter
2. Search all files in `.codetape/traces/` for matching entries
3. Present results chronologically with summaries
4. If no component specified, show an overview of all recent traces

### `/trace-commit`

Generate a conventional commit message from the most recent trace.

1. Read the most recent trace from `.codetape/traces/`
2. Determine commit type from component actions: Added = `feat`, Deleted = `refactor`,
   Modified with bug fix = `fix`, Refactored = `refactor`
3. Extract scope from the primary affected component
4. Format as: `type(scope): summary`
5. List key changes as bullet points in the commit body
6. Flag breaking changes if components were deleted or APIs changed
7. Offer to execute `git commit` with the generated message

---

## Component Detection

For language-specific detection patterns (TypeScript, Python, Rust, Go, Swift),
read `@references/component_patterns.md`.

### Generic Heuristic

When no language-specific pattern matches, apply this fallback:

1. Walk directories listed in `component_roots` from `config.json`
2. A file is a **component** if it exports a class, function, or defines a
   route/handler at the module level
3. Derive the component name from the filename (PascalCase for classes,
   kebab-case preserved for files)
4. Assign a type based on directory conventions:
   - `services/`, `lib/` -> `service`
   - `components/`, `views/`, `pages/` -> `component`
   - `routes/`, `api/`, `handlers/` -> `api-handler`
   - `models/`, `entities/`, `schemas/` -> `model`
   - `utils/`, `helpers/`, `shared/` -> `util`
5. Skip files matching `exclude_patterns` from `config.json`

---

## Data Integrity

### Before Every `/trace`

Run these checks before generating a new trace:

1. **Verify existing paths**: Read `component-map.json` and confirm every
   component's `path` still exists on disk. If a file was deleted, mark the
   component with `"status": "deprecated"` and note it in the trace.

2. **Detect new files**: Scan `component_roots` for files not yet registered
   in `component-map.json`. List them in the trace under a "New untracked
   components" section and suggest adding them.

3. **Validate JSON integrity**: Confirm `config.json` and `component-map.json`
   parse without errors. If either is malformed, warn the user and offer to
   regenerate from defaults.

### Security

- **Never** include API keys, tokens, passwords, .env values, or credentials
  in any trace log or generated documentation
- If a diff contains secrets, redact them and note "[credentials redacted]"

### Write Scope

Only write to these locations:
- `.codetape/` (traces, config, component-map, drift report)
- `.claude/` (skill files, command files)
- Configured `sync_targets` from `config.json` (README, CHANGELOG, CLAUDE.md, etc.)

Never modify source code files, test files, or any file outside these boundaries.
