# Drift Detection

Rules for detecting when project documentation has drifted out of sync with the actual codebase.

## Severity levels

### High

- README mentions features or components that no longer exist in the codebase
- CLAUDE.md architecture section contradicts the current component-map.json
- AGENTS.md references files or modules that have been deleted
- A component has been majorly refactored (>3 modified files in a single trace) but docs still describe the old version
- Breaking API changes not reflected in any documentation

### Medium

- Component descriptions are outdated: >5 traces recorded since the doc section was last updated
- Components added in the last 3 traces have no corresponding documentation
- A sync target file has not been updated in >10 traces
- New dependencies added but not mentioned in setup/installation docs

### Low

- Minor wording inconsistencies between docs and current behavior
- Timestamps are stale but the content is still factually accurate
- Completed TODOs still listed in documentation
- File paths in docs use old directory names but still resolve correctly

## Detection process

1. **Read component-map.json**: Load all components with their `last_modified` timestamps and associated file paths
2. **Read sync target files**: For each file in `sync_targets`, check the file modification time or the timestamp in the last `<!-- codetape:end -->` marker
3. **Compare timestamps**: If a component's `last_modified` is newer than the doc's last update timestamp, flag it as a drift candidate
4. **Semantic check**: Read the doc section about the flagged component, then read the recent trace summaries that modified it. Compare the doc description against what the traces describe. If they conflict, confirm drift.
5. **Classify severity**: Apply the severity rules above to each confirmed drift issue

## Output format

Write results to `.codetape/drift.json`:

```json
{
  "last_check": "2026-03-20T14:30:00Z",
  "issues": [
    {
      "severity": "high",
      "type": "outdated_readme",
      "description": "README references PaymentService.directCharge which was replaced by preAuthorize in trace add-stripe-preauth",
      "file": "README.md",
      "component": "PaymentService",
      "related_traces": ["add-stripe-preauth.md"],
      "suggested_action": "/trace-sync --target readme"
    }
  ]
}
```

**Issue types**: `outdated_readme`, `outdated_doc`, `missing_doc`, `stale_agents_md`, `stale_claude_md`

## After detection

- **High-severity issues found**: Offer to run `/trace-sync` immediately targeting the affected files
- **Only medium/low issues**: Display the report and suggest next steps without auto-running sync
- **Always save**: Write results to `.codetape/drift.json` regardless of severity level, even if zero issues are found (write an empty `issues` array)
- **Exit cleanly**: Report the count of issues by severity (e.g., "Found 1 high, 3 medium, 2 low drift issues")
