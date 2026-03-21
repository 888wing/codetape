---
description: Detect documentation drift and report outdated docs
---

Review project documentation for drift — places where docs no longer match code reality.

## Instructions

1. Read `.codetape/component-map.json` for component modification dates
2. Read `.codetape/config.json` for sync target paths
3. Follow @references/drift_detection.md for severity classification rules
4. For each sync target document:
   a. Compare component `last_modified` dates against document file modification time
   b. Semantically compare document content against recent trace summaries
   c. Check for references to deleted or renamed components
   d. Classify drift severity (high/medium/low)
5. Write results to `.codetape/drift.json`
6. Display drift report grouped by severity
7. If high-severity issues found, offer to run `/trace-sync` to fix them

$ARGUMENTS
