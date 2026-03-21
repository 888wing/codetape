---
description: Generate a conventional commit message from the most recent trace
---

Generate a well-structured commit message based on the most recent trace log.

## Instructions

1. Find the most recent trace in `.codetape/traces/` (by filename date)
2. Read the trace log
3. Generate a conventional commit message:
   - Type: `feat` (new feature), `fix` (bug fix), `refactor`, `docs`, `chore`, `perf`, `test`
   - Scope: primary component name from affected components
   - Description: concise summary derived from trace summary
   - Body: list key changes as bullet points
   - Footer: note breaking changes if impact is High
4. Format:
   ```
   {type}({scope}): {description}

   - {change 1}
   - {change 2}

   BREAKING CHANGE: {if applicable}
   ```
5. Display the generated message
6. Ask: "Commit with this message? (y/n)"
7. If yes, run `git add -A && git commit -m "{message}"`

$ARGUMENTS
