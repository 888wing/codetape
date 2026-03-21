---
description: Query change history for a component or time period
---

Search trace history for changes related to a specific component, date range, or tag.

## Instructions

1. Parse the query from arguments:
   - Component name: search for traces mentioning this component
   - Date range: `--since YYYY-MM-DD` and/or `--until YYYY-MM-DD`
   - Tag: `--tag {tag}` to filter by component tags
2. Read all trace files in `.codetape/traces/`
3. Filter traces matching the query criteria
4. Present results chronologically:
   - Date and trace slug
   - Summary from the trace
   - Action taken on the queried component (if component query)
   - Impact level
5. If no results found, suggest broadening the search

$ARGUMENTS
