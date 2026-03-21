/**
 * Dashboard HTML generator for codetape.
 * Returns a self-contained HTML string with inline CSS/JS.
 *
 * @module dashboard
 */

/**
 * Generate a complete HTML dashboard page.
 *
 * @param {Object} data - Output from loadCodetapeData()
 * @param {Object} data.config - Project configuration
 * @param {Object} data.componentMap - Component map with relationships
 * @param {Object|null} data.drift - Drift analysis results
 * @param {Array} data.traces - Trace entries
 * @param {Array} data.decisions - Decision log entries
 * @param {Array} data.todos - TODO items
 * @param {string} version - Semantic version string
 * @returns {string} Complete HTML document
 */
export function generateDashboard(data, version) {
  const { config, componentMap, drift, traces, decisions, todos } = data;

  const projectName = config?.project || 'Untitled Project';
  const lang = config?.language || '';
  const framework = config?.framework || '';
  const langFw = [lang, framework].filter(Boolean).join(' / ') || 'Unknown';
  const traceCount = traces?.length ?? 0;
  const componentCount = componentMap?.components?.length ?? 0;

  const mermaidGraph = buildMermaidGraph(componentMap);
  const componentTable = buildComponentTable(componentMap);
  const timelineCards = buildTimelineCards(traces);
  const driftPanel = buildDriftPanel(drift);
  const decisionsPanel = buildDecisionsPanel(decisions, traces);
  const todosPanel = buildTodosPanel(todos, traces);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>codetape dashboard - ${escapeHtml(projectName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
  <style>
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

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      font-size: 15px;
      line-height: 1.5;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--text-dim); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-mid); }

    /* Layout */
    .dashboard {
      display: grid;
      grid-template-rows: auto 1fr 1fr auto;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1px;
      min-height: 100vh;
      background: #1a1a20;
    }

    /* Header */
    .header {
      grid-column: 1 / -1;
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      border-bottom: 1px solid var(--amber-dim);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-brand {
      font-family: var(--mono);
      font-weight: 700;
      font-size: 14px;
      color: var(--amber);
      letter-spacing: 0.5px;
    }

    .header-project {
      font-family: var(--sans);
      font-weight: 500;
      font-size: 14px;
      color: var(--text);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text-mid);
    }

    .stat-pill {
      background: var(--surface2);
      padding: 4px 10px;
      border-radius: 4px;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text-mid);
    }

    .stat-pill .val {
      color: var(--text);
      font-weight: 700;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--green);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(48, 216, 128, 0.5); }
      50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(48, 216, 128, 0); }
    }

    /* Panels */
    .panel {
      background: var(--surface);
      padding: 20px;
      overflow-y: auto;
      transition: opacity 0.3s ease;
    }

    .panel-title {
      font-family: var(--mono);
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--amber-dim);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--surface2);
    }

    .panel-empty {
      font-family: var(--mono);
      font-size: 13px;
      color: var(--text-dim);
      line-height: 1.6;
      padding: 20px 0;
    }

    /* Panel: Trace Timeline */
    .panel-timeline {
      grid-column: 1;
      grid-row: 2;
      max-height: 50vh;
    }

    .trace-card {
      background: var(--surface2);
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .trace-card:hover {
      border-color: var(--amber-dim);
    }

    .trace-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .trace-date {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-dim);
    }

    .trace-slug {
      font-family: var(--mono);
      font-weight: 700;
      font-size: 13px;
      color: var(--text);
    }

    .badge {
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 3px;
    }

    .badge-low { background: rgba(48,216,128,0.15); color: var(--green); }
    .badge-medium { background: rgba(240,160,48,0.15); color: var(--amber); }
    .badge-high { background: rgba(232,64,64,0.15); color: var(--red); }

    .trace-scope {
      font-size: 12px;
      color: var(--text-mid);
      margin-bottom: 4px;
    }

    .trace-summary {
      font-size: 13px;
      color: var(--text);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.5;
    }

    .trace-expanded {
      display: none;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--surface);
    }

    .trace-card.open .trace-summary {
      -webkit-line-clamp: unset;
    }

    .trace-card.open .trace-expanded {
      display: block;
    }

    .trace-full {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text-mid);
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
    }

    /* Panel: Component Map */
    .panel-map {
      grid-column: 2 / -1;
      grid-row: 2;
    }

    .mermaid-container {
      background: var(--bg);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      overflow-x: auto;
    }

    .component-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .component-table th {
      font-family: var(--mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-dim);
      text-align: left;
      padding: 6px 10px;
      border-bottom: 1px solid var(--surface2);
    }

    .component-table td {
      padding: 6px 10px;
      color: var(--text-mid);
      border-bottom: 1px solid var(--surface2);
      font-family: var(--mono);
      font-size: 12px;
    }

    .component-table td:first-child {
      color: var(--text);
      font-weight: 500;
    }

    /* Panel: Drift Status */
    .panel-drift {
      grid-column: 1;
      grid-row: 3;
    }

    .drift-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--surface2);
    }

    .drift-row:last-child { border-bottom: none; }

    .drift-severity {
      font-size: 16px;
      flex-shrink: 0;
      line-height: 1;
      margin-top: 2px;
    }

    .drift-body {
      flex: 1;
    }

    .drift-type {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 2px;
    }

    .drift-desc {
      font-size: 13px;
      color: var(--text-mid);
      margin-bottom: 4px;
    }

    .drift-action {
      font-size: 12px;
      color: var(--amber-dim);
      font-style: italic;
    }

    /* Panel: Decisions Log */
    .panel-decisions {
      grid-column: 2;
      grid-row: 3;
    }

    .decision-item {
      padding: 10px 0;
      border-bottom: 1px solid var(--surface2);
    }

    .decision-item:last-child { border-bottom: none; }

    .decision-date {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-dim);
      margin-bottom: 2px;
    }

    .decision-text {
      font-size: 13px;
      color: var(--text);
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .decision-source {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-dim);
    }

    /* Panel: TODOs */
    .panel-todos {
      grid-column: 3;
      grid-row: 3;
    }

    .todo-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--surface2);
    }

    .todo-item:last-child { border-bottom: none; }

    .todo-checkbox {
      font-family: var(--mono);
      font-size: 14px;
      color: var(--text-dim);
      flex-shrink: 0;
      margin-top: 1px;
    }

    .todo-checkbox.checked {
      color: var(--green);
    }

    .todo-body {
      flex: 1;
    }

    .todo-text {
      font-size: 13px;
      color: var(--text);
      line-height: 1.5;
    }

    .todo-text.done {
      text-decoration: line-through;
      color: var(--text-dim);
    }

    .todo-source {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-dim);
    }

    /* Footer */
    .footer {
      grid-column: 1 / -1;
      background: var(--surface);
      padding: 10px 24px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text-dim);
      text-align: center;
      border-top: 1px solid var(--surface2);
    }

    .footer .amber { color: var(--amber); }

    /* Panel update animation */
    .panel-updating {
      opacity: 0.6;
    }

    /* Responsive: single column on mobile */
    @media (max-width: 768px) {
      .dashboard {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }

      .header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
      }

      .panel-timeline,
      .panel-map,
      .panel-drift,
      .panel-decisions,
      .panel-todos {
        grid-column: 1;
        grid-row: auto;
        max-height: none;
      }

      .panel-map {
        grid-column: 1;
      }

      .footer {
        grid-column: 1;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <span class="header-brand">&#9632; codetape dashboard</span>
        <span class="header-project">${escapeHtml(projectName)}</span>
      </div>
      <div class="header-right">
        <span class="stat-pill">${escapeHtml(langFw)}</span>
        <span class="stat-pill">traces <span class="val">${traceCount}</span></span>
        <span class="stat-pill">components <span class="val">${componentCount}</span></span>
        <span class="live-indicator"><span class="live-dot"></span> live</span>
      </div>
    </header>

    <!-- Panel: Trace Timeline -->
    <div class="panel panel-timeline" id="panel-timeline">
      <div class="panel-title">Trace Timeline</div>
      <div id="panel-timeline-content">${timelineCards}</div>
    </div>

    <!-- Panel: Component Map -->
    <div class="panel panel-map" id="panel-map">
      <div class="panel-title">Component Map</div>
      <div id="panel-map-content">
        ${mermaidGraph ? `<div class="mermaid-container"><pre class="mermaid" id="mermaid-graph">${mermaidGraph}</pre></div>` : ''}
        ${componentTable}
      </div>
    </div>

    <!-- Panel: Drift Status -->
    <div class="panel panel-drift" id="panel-drift">
      <div class="panel-title">Drift Status</div>
      <div id="panel-drift-content">${driftPanel}</div>
    </div>

    <!-- Panel: Decisions Log -->
    <div class="panel panel-decisions" id="panel-decisions">
      <div class="panel-title">Decisions Log</div>
      <div id="panel-decisions-content">${decisionsPanel}</div>
    </div>

    <!-- Panel: TODOs -->
    <div class="panel panel-todos" id="panel-todos">
      <div class="panel-title">TODOs</div>
      <div id="panel-todos-content">${todosPanel}</div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <span class="amber">&#9632;</span> codetape v${escapeHtml(version)} &middot; dashboard &middot; Ctrl+C to stop server
    </footer>
  </div>

  <script>
    const DATA = ${JSON.stringify(data)};

    // Mermaid init
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#f0a030',
        primaryTextColor: '#e8e4dc',
        primaryBorderColor: '#a07020',
        lineColor: '#605848',
        secondaryColor: '#0e0e12',
        tertiaryColor: '#141418'
      }
    });

    // Trace card expand/collapse
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.trace-card');
      if (card) card.classList.toggle('open');
    });

    // SSE auto-refresh
    const evtSource = new EventSource('/events');
    evtSource.onmessage = async (e) => {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        updatePanels(data);
      } catch (err) {
        console.error('[codetape] SSE update failed:', err);
      }
    };

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function impactClass(impact) {
      if (!impact) return 'badge-low';
      const l = impact.toLowerCase();
      if (l === 'high') return 'badge-high';
      if (l === 'medium') return 'badge-medium';
      return 'badge-low';
    }

    function severityIcon(sev) {
      if (!sev) return '\\u{1f7e2}';
      const l = sev.toLowerCase();
      if (l === 'high') return '\\u{1f534}';
      if (l === 'medium') return '\\u{1f7e1}';
      return '\\u{1f7e2}';
    }

    function buildTimelineHtml(traces) {
      if (!traces || traces.length === 0) {
        return '<div class="panel-empty">No traces yet. Run /trace in Claude Code to record your first.</div>';
      }
      const sorted = [...traces].sort((a, b) => {
        const da = a.date || a.timestamp || '';
        const db = b.date || b.timestamp || '';
        return db.localeCompare(da);
      });
      return sorted.map(t => {
        const date = t.date || t.timestamp || '';
        const slug = t.slug || t.id || '';
        const impact = t.impact || 'low';
        const scope = t.scope || '';
        const summary = t.summary || '';
        const full = t.content || t.fullText || JSON.stringify(t, null, 2);
        return '<div class="trace-card">' +
          '<div class="trace-card-header">' +
            '<div><span class="trace-date">' + escapeHtml(date) + '</span> <span class="trace-slug">' + escapeHtml(slug) + '</span></div>' +
            '<span class="badge ' + impactClass(impact) + '">' + escapeHtml(impact) + '</span>' +
          '</div>' +
          (scope ? '<div class="trace-scope">' + escapeHtml(scope) + '</div>' : '') +
          '<div class="trace-summary">' + escapeHtml(summary) + '</div>' +
          '<div class="trace-expanded"><pre class="trace-full">' + escapeHtml(full) + '</pre></div>' +
        '</div>';
      }).join('');
    }

    function buildComponentMapHtml(componentMap) {
      let html = '';
      const rels = componentMap?.relationships;
      if (rels && rels.length > 0) {
        let graph = 'graph TD\\n';
        const ids = new Map();
        let counter = 0;
        function getId(name) {
          if (!ids.has(name)) { ids.set(name, 'C' + counter++); }
          return ids.get(name);
        }
        rels.forEach(r => {
          const fromId = getId(r.from);
          const toId = getId(r.to);
          graph += '  ' + fromId + '[' + r.from + '] --> ' + toId + '[' + r.to + ']\\n';
        });
        html += '<div class="mermaid-container"><pre class="mermaid" id="mermaid-graph">' + graph + '</pre></div>';
      }
      const comps = componentMap?.components;
      if (comps && comps.length > 0) {
        html += '<table class="component-table"><thead><tr><th>Component</th><th>Type</th><th>Path</th></tr></thead><tbody>';
        comps.forEach(c => {
          html += '<tr><td>' + escapeHtml(c.name) + '</td><td>' + escapeHtml(c.type || '') + '</td><td>' + escapeHtml(c.path || '') + '</td></tr>';
        });
        html += '</tbody></table>';
      }
      if (!html) {
        html = '<div class="panel-empty">No components mapped yet.</div>';
      }
      return html;
    }

    function buildDriftHtml(drift) {
      if (!drift || !drift.issues || drift.issues.length === 0) {
        return '<div class="panel-empty">No drift check yet. Run /trace-review to detect drift.</div>';
      }
      return drift.issues.map(issue => {
        return '<div class="drift-row">' +
          '<span class="drift-severity">' + severityIcon(issue.severity) + '</span>' +
          '<div class="drift-body">' +
            '<div class="drift-type">' + escapeHtml(issue.type || '') + '</div>' +
            '<div class="drift-desc">' + escapeHtml(issue.description || '') + '</div>' +
            (issue.suggestedAction ? '<div class="drift-action">' + escapeHtml(issue.suggestedAction) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    }

    function buildDecisionsHtml(decisions, traces) {
      const allDecisions = [];
      if (decisions && decisions.length > 0) {
        decisions.forEach(d => allDecisions.push(d));
      }
      if (traces) {
        traces.forEach(t => {
          if (t.decisions) {
            t.decisions.forEach(d => {
              allDecisions.push({
                date: d.date || t.date || t.timestamp || '',
                text: d.text || d,
                source: t.slug || t.id || ''
              });
            });
          }
        });
      }
      if (allDecisions.length === 0) {
        return '<div class="panel-empty">No decisions recorded yet.</div>';
      }
      const sorted = [...allDecisions].sort((a, b) => {
        const da = a.date || '';
        const db = b.date || '';
        return db.localeCompare(da);
      });
      return sorted.map(d => {
        return '<div class="decision-item">' +
          '<div class="decision-date">' + escapeHtml(d.date || '') + '</div>' +
          '<div class="decision-text">' + escapeHtml(typeof d.text === 'string' ? d.text : JSON.stringify(d.text)) + '</div>' +
          (d.source ? '<div class="decision-source">from ' + escapeHtml(d.source) + '</div>' : '') +
        '</div>';
      }).join('');
    }

    function buildTodosHtml(todos, traces) {
      const allTodos = [];
      if (todos && todos.length > 0) {
        todos.forEach(t => allTodos.push(t));
      }
      if (traces) {
        traces.forEach(tr => {
          if (tr.todos) {
            tr.todos.forEach(t => {
              allTodos.push({
                text: t.text || t,
                done: t.done || t.checked || false,
                source: tr.slug || tr.id || ''
              });
            });
          }
        });
      }
      if (allTodos.length === 0) {
        return '<div class="panel-empty">No TODOs yet.</div>';
      }
      return allTodos.map(t => {
        const done = t.done || t.checked || false;
        const text = typeof t.text === 'string' ? t.text : (typeof t === 'string' ? t : JSON.stringify(t));
        return '<div class="todo-item">' +
          '<span class="todo-checkbox' + (done ? ' checked' : '') + '">' + (done ? '[x]' : '[ ]') + '</span>' +
          '<div class="todo-body">' +
            '<div class="todo-text' + (done ? ' done' : '') + '">' + escapeHtml(text) + '</div>' +
            (t.source ? '<div class="todo-source">from ' + escapeHtml(t.source) + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    }

    async function updatePanels(data) {
      const panels = ['panel-timeline', 'panel-map', 'panel-drift', 'panel-decisions', 'panel-todos'];
      panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('panel-updating');
      });

      await new Promise(r => setTimeout(r, 50));

      const timelineEl = document.getElementById('panel-timeline-content');
      if (timelineEl) timelineEl.innerHTML = buildTimelineHtml(data.traces);

      const driftEl = document.getElementById('panel-drift-content');
      if (driftEl) driftEl.innerHTML = buildDriftHtml(data.drift);

      const decisionsEl = document.getElementById('panel-decisions-content');
      if (decisionsEl) decisionsEl.innerHTML = buildDecisionsHtml(data.decisions, data.traces);

      const todosEl = document.getElementById('panel-todos-content');
      if (todosEl) todosEl.innerHTML = buildTodosHtml(data.todos, data.traces);

      // Re-render mermaid
      const mapEl = document.getElementById('panel-map-content');
      if (mapEl) {
        mapEl.innerHTML = buildComponentMapHtml(data.componentMap);
        const mermaidEl = mapEl.querySelector('.mermaid');
        if (mermaidEl) {
          const graphDef = mermaidEl.textContent;
          mermaidEl.removeAttribute('data-processed');
          try {
            const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), graphDef);
            mermaidEl.innerHTML = svg;
          } catch (e) {
            console.error('[codetape] mermaid render error:', e);
          }
        }
      }

      // Update header stats
      const traceCount = data.traces?.length ?? 0;
      const compCount = data.componentMap?.components?.length ?? 0;
      const statPills = document.querySelectorAll('.stat-pill .val');
      if (statPills.length >= 2) {
        statPills[0].textContent = traceCount;
        statPills[1].textContent = compCount;
      }

      panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('panel-updating');
      });
    }
  <\/script>
</body>
</html>`;
}

// ─── Helper functions (server-side, used during initial render) ───

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMermaidGraph(componentMap) {
  const rels = componentMap?.relationships;
  if (!rels || rels.length === 0) return '';

  const ids = new Map();
  let counter = 0;
  function getId(name) {
    if (!ids.has(name)) ids.set(name, 'C' + counter++);
    return ids.get(name);
  }

  let graph = 'graph TD\n';
  for (const r of rels) {
    const fromId = getId(r.from);
    const toId = getId(r.to);
    graph += `  ${fromId}[${r.from}] --> ${toId}[${r.to}]\n`;
  }
  return graph;
}

function buildComponentTable(componentMap) {
  const comps = componentMap?.components;
  if (!comps || comps.length === 0) {
    if (!componentMap?.relationships || componentMap.relationships.length === 0) {
      return '<div class="panel-empty">No components mapped yet.</div>';
    }
    return '';
  }

  let html = '<table class="component-table"><thead><tr><th>Component</th><th>Type</th><th>Path</th></tr></thead><tbody>';
  for (const c of comps) {
    html += `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.type || '')}</td><td>${escapeHtml(c.path || '')}</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

function buildTimelineCards(traces) {
  if (!traces || traces.length === 0) {
    return '<div class="panel-empty">No traces yet. Run /trace in Claude Code to record your first.</div>';
  }

  const sorted = [...traces].sort((a, b) => {
    const da = a.date || a.timestamp || '';
    const db = b.date || b.timestamp || '';
    return db.localeCompare(da);
  });

  return sorted.map(t => {
    const date = t.date || t.timestamp || '';
    const slug = t.slug || t.id || '';
    const impact = t.impact || 'low';
    const impactCls = impact.toLowerCase() === 'high' ? 'badge-high'
      : impact.toLowerCase() === 'medium' ? 'badge-medium'
      : 'badge-low';
    const scope = t.scope || '';
    const summary = t.summary || '';
    const full = t.content || t.fullText || JSON.stringify(t, null, 2);

    return `<div class="trace-card">
      <div class="trace-card-header">
        <div><span class="trace-date">${escapeHtml(date)}</span> <span class="trace-slug">${escapeHtml(slug)}</span></div>
        <span class="badge ${impactCls}">${escapeHtml(impact)}</span>
      </div>
      ${scope ? `<div class="trace-scope">${escapeHtml(scope)}</div>` : ''}
      <div class="trace-summary">${escapeHtml(summary)}</div>
      <div class="trace-expanded"><pre class="trace-full">${escapeHtml(full)}</pre></div>
    </div>`;
  }).join('');
}

function buildDriftPanel(drift) {
  if (!drift || !drift.issues || drift.issues.length === 0) {
    return '<div class="panel-empty">No drift check yet. Run /trace-review to detect drift.</div>';
  }

  return drift.issues.map(issue => {
    const icon = issue.severity?.toLowerCase() === 'high' ? '\u{1F534}'
      : issue.severity?.toLowerCase() === 'medium' ? '\u{1F7E1}'
      : '\u{1F7E2}';

    return `<div class="drift-row">
      <span class="drift-severity">${icon}</span>
      <div class="drift-body">
        <div class="drift-type">${escapeHtml(issue.type || '')}</div>
        <div class="drift-desc">${escapeHtml(issue.description || '')}</div>
        ${issue.suggestedAction ? `<div class="drift-action">${escapeHtml(issue.suggestedAction)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function buildDecisionsPanel(decisions, traces) {
  const all = [];

  if (decisions && decisions.length > 0) {
    for (const d of decisions) all.push(d);
  }

  if (traces) {
    for (const t of traces) {
      if (t.decisions) {
        for (const d of t.decisions) {
          all.push({
            date: d.date || t.date || t.timestamp || '',
            text: d.text || d,
            source: t.slug || t.id || ''
          });
        }
      }
    }
  }

  if (all.length === 0) {
    return '<div class="panel-empty">No decisions recorded yet.</div>';
  }

  const sorted = [...all].sort((a, b) => {
    const da = a.date || '';
    const db = b.date || '';
    return db.localeCompare(da);
  });

  return sorted.map(d => {
    const text = typeof d.text === 'string' ? d.text : JSON.stringify(d.text);
    return `<div class="decision-item">
      <div class="decision-date">${escapeHtml(d.date || '')}</div>
      <div class="decision-text">${escapeHtml(text)}</div>
      ${d.source ? `<div class="decision-source">from ${escapeHtml(d.source)}</div>` : ''}
    </div>`;
  }).join('');
}

function buildTodosPanel(todos, traces) {
  const all = [];

  if (todos && todos.length > 0) {
    for (const t of todos) all.push(t);
  }

  if (traces) {
    for (const tr of traces) {
      if (tr.todos) {
        for (const t of tr.todos) {
          all.push({
            text: t.text || t,
            done: t.done || t.checked || false,
            source: tr.slug || tr.id || ''
          });
        }
      }
    }
  }

  if (all.length === 0) {
    return '<div class="panel-empty">No TODOs yet.</div>';
  }

  return all.map(t => {
    const done = t.done || t.checked || false;
    const text = typeof t.text === 'string' ? t.text : (typeof t === 'string' ? t : JSON.stringify(t));
    return `<div class="todo-item">
      <span class="todo-checkbox${done ? ' checked' : ''}">${done ? '[x]' : '[ ]'}</span>
      <div class="todo-body">
        <div class="todo-text${done ? ' done' : ''}">${escapeHtml(text)}</div>
        ${t.source ? `<div class="todo-source">from ${escapeHtml(t.source)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}
