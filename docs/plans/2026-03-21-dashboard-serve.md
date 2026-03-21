# Dashboard Serve Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `npx codetape serve` — a zero-dependency local HTTP server that renders a live-reloading dashboard from `.codetape/` data.

**Architecture:** A single `serve.js` CLI command starts a `node:http` server serving three routes: `/` (HTML dashboard), `/api/data` (JSON payload), and `/events` (SSE stream). `fs.watch` monitors `.codetape/` and pushes change events via SSE. The browser auto-refreshes data without full page reload. Dashboard HTML is generated as a template string by `dashboard.js` — no static files, no build step.

**Tech Stack:** `node:http`, `node:fs`, `node:path`, `node:child_process` (open browser). Mermaid.js from CDN for component graph. All inline CSS/JS.

---

## Task 1: Data Loader Utility

**Files:**
- Create: `src/utils/load-codetape-data.js`

**Step 1: Write the data loader**

This utility reads all `.codetape/` data and returns a single JSON-serializable object. It will be used by both the `/api/data` endpoint and the HTML generator.

```javascript
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function loadCodetapeData(projectDir) {
  const base = join(projectDir, '.codetape');

  // 1. Read config.json
  const config = safeReadJSON(join(base, 'config.json'), {});

  // 2. Read component-map.json
  const componentMap = safeReadJSON(join(base, 'component-map.json'), {
    components: {}, relationships: []
  });

  // 3. Read drift.json (may not exist)
  const drift = safeReadJSON(join(base, 'drift.json'), null);

  // 4. Read all trace files, parse metadata + sections from markdown
  const tracesDir = join(base, 'traces');
  const traces = [];
  if (existsSync(tracesDir)) {
    const files = readdirSync(tracesDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse(); // newest first

    for (const file of files) {
      const content = readFileSync(join(tracesDir, file), 'utf8');
      traces.push({
        filename: file,
        content,
        ...parseTrace(content) // extract: title, date, scope, impact, summary, components, decisions, todos
      });
    }
  }

  // 5. Aggregate decisions and todos across all traces
  const decisions = traces.flatMap(t =>
    (t.decisions || []).map(d => ({ ...d, traceRef: t.filename, date: t.date }))
  );
  const todos = traces.flatMap(t =>
    (t.todos || []).map(todo => ({ text: todo, traceRef: t.filename, date: t.date }))
  );

  return { config, componentMap, drift, traces, decisions, todos };
}

function safeReadJSON(path, fallback) {
  // try read + JSON.parse, return fallback on any error
}

function parseTrace(markdown) {
  // Parse trace markdown to extract structured data:
  // - title: first # heading
  // - date: from **Session**: line
  // - scope: from **Scope**: line
  // - impact: from **Impact**: line
  // - summary: content under ## Summary
  // - components: parse table under ## Affected components
  // - decisions: bullet points under ## Technical decisions
  // - todos: checkbox items under ## TODOs
  // Return: { title, date, scope, impact, summary, components, decisions, todos }
}
```

**Step 2: Verify it loads**

```bash
node -e "import('./src/utils/load-codetape-data.js')"
```
Expected: no syntax errors.

**Step 3: Commit**

```bash
git add src/utils/load-codetape-data.js
git commit -m "feat: add data loader utility for dashboard"
```

---

## Task 2: Dashboard HTML Generator

**Files:**
- Create: `src/dashboard.js`

**Step 1: Write the dashboard generator**

This exports a single function `generateDashboard(data)` that returns a complete HTML string. The HTML is self-contained (all CSS + JS inline). Data is embedded as a `<script>` tag with `JSON.stringify`.

The dashboard has 6 panels in a responsive grid:

```
┌─────────────────────────────────────────────────┐
│ ■ codetape dashboard    {project} │ {lang/fw}   │  ← Header bar
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Trace       │  Component Map                   │
│  Timeline    │  (mermaid graph)                 │
│              │                                  │
├──────────────┼─────────────┬────────────────────┤
│              │             │                    │
│  Drift       │  Decisions  │  TODOs             │
│  Status      │  Log        │                    │
│              │             │                    │
└──────────────┴─────────────┴────────────────────┘
```

**Design tokens (from codetape.win):**

```css
:root {
  --bg: #08080a;
  --surface: #0e0e12;
  --surface2: #141418;
  --amber: #f0a030;
  --amber-dim: #a07020;
  --red: #e84040;
  --green: #30d880;
  --text: #e8e4dc;
  --text-dim: #605848;
  --text-mid: #988870;
  --mono: 'Space Mono', monospace;
  --sans: 'Outfit', sans-serif;
}
```

**Key implementation details:**

- Google Fonts loaded via `<link>` for Space Mono + Outfit
- Mermaid loaded via `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js">`
- Mermaid initialized with dark theme: `mermaid.initialize({ theme: 'dark', themeVariables: { primaryColor: '#f0a030' } })`
- Component map generates mermaid `graph TD` syntax from `componentMap.relationships`
- Trace timeline: list of trace cards, clicking one expands to show full markdown content (rendered as preformatted text)
- Drift status: colored indicators (green=synced, amber=medium, red=high drift)
- SSE listener in JS: `new EventSource('/events')` — on message, fetch `/api/data` and re-render panels
- If no traces exist, show a friendly empty state: "No traces yet. Run /trace in Claude Code."
- Footer: "Codetape v{version} · Dashboard · Ctrl+C to stop server"

The function signature:

```javascript
export function generateDashboard(data, version) {
  // data = { config, componentMap, drift, traces, decisions, todos }
  // version = package version string
  // Returns: complete HTML string
}
```

**Step 2: Verify it loads**

```bash
node -e "import('./src/dashboard.js')"
```

**Step 3: Commit**

```bash
git add src/dashboard.js
git commit -m "feat: add dashboard HTML generator — 6-panel layout with codetape.win design"
```

---

## Task 3: Serve CLI Command

**Files:**
- Create: `src/cli/serve.js`

**Step 1: Write the serve command**

```javascript
import { createServer } from 'node:http';
import { watch, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCodetapeData } from '../utils/load-codetape-data.js';
import { generateDashboard } from '../dashboard.js';

export async function serve(args) {
  const projectDir = process.cwd();
  const codetapeDir = join(projectDir, '.codetape');

  // 1. Check .codetape/ exists
  if (!existsSync(codetapeDir)) {
    console.error('Codetape is not initialized. Run: npx codetape init');
    process.exit(1);
  }

  // 2. Parse --port flag (default 3210)
  let port = 3210;
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    port = parseInt(args[portIdx + 1], 10);
  }

  // 3. Read package version
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));

  // 4. Track SSE clients
  const sseClients = new Set();

  // 5. Create HTTP server with 3 routes
  const server = createServer((req, res) => {
    // GET / → HTML dashboard
    if (req.url === '/' || req.url === '/index.html') {
      const data = loadCodetapeData(projectDir);
      const html = generateDashboard(data, pkg.version);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // GET /api/data → JSON
    if (req.url === '/api/data') {
      const data = loadCodetapeData(projectDir);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(data));
      return;
    }

    // GET /events → SSE
    if (req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('data: connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not found');
  });

  // 6. Watch .codetape/ for changes
  let debounceTimer = null;
  watch(codetapeDir, { recursive: true }, (eventType, filename) => {
    // Debounce: wait 300ms after last change before notifying
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      for (const client of sseClients) {
        client.write(`data: ${JSON.stringify({ type: 'change', file: filename })}\n\n`);
      }
    }, 300);
  });

  // 7. Start server
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n✓ Codetape Dashboard: ${url}`);
    console.log(`✓ Watching .codetape/ for changes`);
    console.log(`\nPress Ctrl+C to stop\n`);

    // 8. Auto-open browser
    const openCmd = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start'
      : 'xdg-open';
    import('node:child_process').then(({ exec }) => {
      exec(`${openCmd} ${url}`);
    });
  });

  // 9. Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n■ Dashboard stopped.');
    server.close();
    process.exit(0);
  });

  // Keep process alive (server.listen already does this)
}
```

**Step 2: Verify it loads**

```bash
node -e "import('./src/cli/serve.js')"
```

**Step 3: Commit**

```bash
git add src/cli/serve.js
git commit -m "feat: add serve command — HTTP server + SSE + file watcher"
```

---

## Task 4: Wire Up CLI Entry Point

**Files:**
- Modify: `bin/codetape.js:14-34` (add serve to usage text)
- Modify: `bin/codetape.js:48-53` (add serve to commands map)

**Step 1: Update usage text**

Add `serve` to the Commands section in `printUsage()`:

```
Commands:
  init          Set up Codetape in the current project
  install       Install skill only (use -g for global)
  uninstall     Remove skill and clean up
  status        Show Codetape status
  doctor        Verify installation integrity
  serve         Start live dashboard (default: port 3210)
```

And add an example:

```
  npx codetape serve
```

**Step 2: Add serve to commands map**

Add this line to the `commands` object:

```javascript
serve: () => import('../src/cli/serve.js').then((m) => m.serve(args)),
```

**Step 3: Verify**

```bash
node bin/codetape.js --help
```
Expected: `serve` appears in commands list.

**Step 4: Commit**

```bash
git add bin/codetape.js
git commit -m "feat: wire serve command into CLI entry point"
```

---

## Task 5: Integration Test

**Step 1: Test on the Codetape project itself**

```bash
# Initialize codetape in its own project (for testing)
cd /Users/chuisiufai/Projects/Codetape
node bin/codetape.js init  # if not already initialized

# Start the dashboard
node bin/codetape.js serve
```

Expected:
- Terminal shows `✓ Codetape Dashboard: http://localhost:3210`
- Browser opens automatically
- Dashboard renders with dark theme + amber accents
- 6 panels visible (may show empty states)
- Ctrl+C stops cleanly

**Step 2: Test live reload**

In a separate terminal, create a fake trace:

```bash
mkdir -p .codetape/traces
echo "# Trace: test-trace\n\n**Session**: 2026-03-21 12:00\n**Scope**: Test trace\n**Impact**: Low (testing)\n\n## Summary\nThis is a test trace.\n\n## Affected components\n| Component | Action | File |\n|-----------|--------|------|\n| Dashboard | Added | src/dashboard.js |\n\n## Technical decisions\n- Used SSE: chose SSE over websockets because zero-dep constraint\n\n## TODOs\n- [ ] Add dark/light theme toggle" > .codetape/traces/2026-03-21_12-00_test-trace.md
```

Expected: Dashboard auto-refreshes within 1 second, showing the new trace.

**Step 3: Test custom port**

```bash
node bin/codetape.js serve --port 8080
```
Expected: Server starts on port 8080.

**Step 4: Test without .codetape/**

```bash
cd /tmp && node /Users/chuisiufai/Projects/Codetape/bin/codetape.js serve
```
Expected: Error message "Codetape is not initialized."

**Step 5: Clean up test trace**

```bash
rm -f /Users/chuisiufai/Projects/Codetape/.codetape/traces/2026-03-21_12-00_test-trace.md
```

**Step 6: Commit all**

```bash
git add -A
git commit -m "feat: complete codetape serve dashboard — live-reloading 6-panel view"
```

---

## Task 6: Update README + CHANGELOG

**Files:**
- Modify: `README.md` (add serve to commands table + quick start)
- Modify: `CHANGELOG.md` (add serve entry)

**Step 1: Add serve to README commands table**

Add row to the commands table:

```markdown
| `serve`               | Start live dashboard with auto-refresh                    |
```

**Step 2: Add serve to quick start or installation section**

```markdown
npx codetape serve   # Open live dashboard in browser
```

**Step 3: Update CHANGELOG**

Add under `## [0.2.0]` or current unreleased:

```markdown
### Added
- `serve` command: live-reloading dashboard at localhost:3210
- 6-panel dashboard: project overview, trace timeline, component map, drift status, decisions, TODOs
- SSE-based auto-refresh when .codetape/ data changes
- Mermaid.js component dependency visualization
```

**Step 4: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add serve command to README and CHANGELOG"
```

---

## Task 7: Publish + Deploy

**Step 1: Bump version**

```bash
npm version patch  # 0.1.0 → 0.1.1 (or minor: 0.2.0)
```

**Step 2: Publish**

```bash
npm publish --access public
```

**Step 3: Push**

```bash
git push && git push --tags
```

**Step 4: Update landing page (optional)**

Add `serve` to the commands list on codetape.win if desired.

---

## Execution Order Summary

| Task | Description | Depends On | Estimated |
|------|-------------|------------|-----------|
| 1 | Data loader utility | — | 15 min |
| 2 | Dashboard HTML generator | Task 1 | 40 min |
| 3 | Serve CLI command | Tasks 1, 2 | 15 min |
| 4 | Wire up CLI entry point | Task 3 | 5 min |
| 5 | Integration test | Task 4 | 10 min |
| 6 | Update README + CHANGELOG | Task 5 | 5 min |
| 7 | Publish + deploy | Task 6 | 5 min |

**Sequential chain:** 1 → 2 → 3 → 4 → 5 → 6 → 7

**Total estimated: ~1.5 hours**
