#!/usr/bin/env bash
# init-promptrace.sh — Creates .promptrace/ folder structure with default config
set -euo pipefail

PROMPTRACE_DIR=".promptrace"

if [ -d "$PROMPTRACE_DIR" ]; then
  echo "Warning: $PROMPTRACE_DIR already exists. Aborting."
  exit 1
fi

PROJECT_NAME=$(basename "$(pwd)")
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$PROMPTRACE_DIR/traces"
mkdir -p "$PROMPTRACE_DIR/archive"

cat > "$PROMPTRACE_DIR/config.json" <<EOF
{
  "version": "0.1.0",
  "project_name": "$PROJECT_NAME",
  "language": "unknown",
  "framework": null,
  "tracking_mode": "manual",
  "exclude_patterns": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__",
    ".next",
    "vendor"
  ],
  "component_roots": [
    "src"
  ]
}
EOF

cat > "$PROMPTRACE_DIR/component-map.json" <<EOF
{
  "updated_at": "$NOW",
  "components": {},
  "relationships": []
}
EOF

echo "Promptrace initialized in $PROMPTRACE_DIR/"
echo "  Created: config.json, component-map.json"
echo "  Directories: traces/, archive/"
