# Trace Schema

Format specification for Codetape trace logs.

## Template

```markdown
# Trace: {slug}

**Session**: {YYYY-MM-DD HH:MM}
**Duration**: {estimated duration}
**Scope**: {one-line scope description}
**Impact**: {Low | Medium | High} ({brief reason})

## Summary
{2-3 sentence semantic summary of what changed and why}

## Affected components
| Component | Action | File |
|-----------|--------|------|
| {Name} | {Added | Modified | Deleted | Refactored} | {path} |

## Technical decisions
- {Decision}: {chose X because Y; rejected Z because W}

## Dependency changes
- {Added/removed/updated package or env var}

## TODOs
- [ ] {Specific, actionable item}
```

## Field requirements

**slug**: Lowercase kebab-case derived from scope. Examples: `add-stripe-preauth`, `fix-auth-redirect-loop`, `refactor-image-pipeline`.

**Session**: Current date/time when the trace is created. Format: `YYYY-MM-DD HH:MM`. Use 24-hour clock.

**Duration**: Estimated from git timestamps (first commit to last commit in session). Default to `~30 min` if timestamps are unavailable or session has a single commit.

**Scope**: One line, starts with a verb. Valid verbs: Add, Fix, Refactor, Update, Remove, Migrate, Implement, Replace, Extract, Configure.

**Impact**:
- **Low**: Cosmetic changes, documentation updates, comment fixes, formatting
- **Medium**: New features, bug fixes, config changes, dependency updates
- **High**: Architecture changes, breaking changes, security fixes, data migrations

**Summary**: Exactly 2-3 sentences. Must explain WHAT changed and WHY it changed. The summary should be independently understandable -- a reader with no other context should grasp the change.

**Affected components**: Every row requires an action verb from the set: Added, Modified, Deleted, Refactored. File paths must be relative to project root.

**Technical decisions**: At least one entry required. Each must include the reasoning (why X was chosen) and a rejected alternative (why Z was not chosen). Omit this section only if the change is purely mechanical (e.g., dependency version bump with no choice involved).

**Dependency changes**: List any added, removed, or updated packages, environment variables, or external service integrations. Write `None` if no dependency changes occurred.

**TODOs**: Each item must be specific and actionable -- it must contain a verb and a target. Never use vague items like "fix later" or "clean up code".

## Quality checklist

A trace must pass ALL checks before saving:

1. Summary is independently understandable (reader needs no other context)
2. Every component row has an action verb from the allowed set
3. At least one technical decision includes reasoning and a rejected alternative
4. Every TODO contains a verb and a specific target
5. No API keys, tokens, credentials, or secrets appear anywhere
6. Total trace length is under 150 lines

## Examples

**Good summary**:
> Added Stripe pre-authorization to the payment module to support hold-then-capture for ride bookings. This replaces the direct charge flow which caused refund delays.

**Bad summary**:
> Updated payment files.

**Good TODO**:
> - [ ] Add unit tests for PaymentService.preAuthorize covering expired card edge case

**Bad TODO**:
> - [ ] Fix later
> - [ ] Clean up
