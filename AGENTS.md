# Codetape — Agent Instructions

> The flight recorder for AI coding — keeps your docs in sync with your code.

## For AI Coding Agents

You are working in a project that uses **Codetape** for automatic documentation maintenance. Codetape records semantic traces of code changes and keeps documentation synchronized.

## Available Commands

When `.codetape/` exists in the project root, these commands are available:

| Command | Description |
|---------|-------------|
| `/trace` | Record a semantic trace of recent code changes — captures what changed, why, and what it affects |
| `/trace-sync` | Sync documentation (README, CHANGELOG, CLAUDE.md) from recent traces |
| `/trace-review` | Detect documentation drift — find docs that no longer match code reality |
| `/trace-map` | Generate architecture documentation with dependency graphs |
| `/trace-log [component]` | Query change history for a specific component |
| `/trace-commit` | Generate a conventional commit message from the most recent trace |
| `/trace-init` | Initialize Codetape tracking in this project |

## Data Directory

All Codetape data is stored in `.codetape/`:

```
.codetape/
├── config.json           # Project settings, sync targets, component roots
├── component-map.json    # Component registry with relationships
├── drift.json            # Current drift issues (transient)
├── traces/               # Session trace logs (markdown)
│   └── YYYY-MM-DD_HH-MM_{slug}.md
└── archive/              # Compressed monthly summaries
```

## Behavior Guidelines

1. **After significant coding work** (5+ files changed, new feature, major refactor): suggest running `/trace`
2. **Before modifying a component**: check `.codetape/component-map.json` for dependencies and recent changes
3. **Never include** API keys, tokens, or credentials in traces
4. **Write scope**: only modify `.codetape/`, `.claude/`, and files listed in `config.json` sync_targets
5. **Quality standard**: trace summaries must be independently understandable by a developer with no prior context

## Installation

```bash
npx codetape init
```

More info: https://codetape.win | https://github.com/888wing/codetape
