import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

/**
 * Try to read and parse a JSON file. Returns fallback on any error.
 */
function safeReadJSON(filePath, fallback) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Parse a trace markdown file into a structured object.
 */
function parseTrace(markdown) {
  const lines = markdown.split('\n');

  let title = '';
  let date = '';
  let scope = '';
  let impact = '';
  let summary = '';
  const components = [];
  const decisions = [];
  const todos = [];

  // Extract title from first `# ` line
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
      break;
    }
  }

  // Extract metadata fields
  for (const line of lines) {
    if (line.startsWith('**Session**:')) {
      date = line.replace('**Session**:', '').trim();
    } else if (line.startsWith('**Scope**:')) {
      scope = line.replace('**Scope**:', '').trim();
    } else if (line.startsWith('**Impact**:')) {
      const raw = line.replace('**Impact**:', '').trim();
      impact = raw.split(/[\s(]/)[0];
    }
  }

  // Identify section boundaries
  const sectionStarts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      sectionStarts.push({ index: i, heading: lines[i].slice(3).trim() });
    }
  }

  /**
   * Get the lines belonging to a section by heading name.
   */
  function getSectionLines(headingName) {
    const entry = sectionStarts.find(
      (s) => s.heading.toLowerCase() === headingName.toLowerCase()
    );
    if (!entry) return [];
    const startIdx = entry.index + 1;
    const nextSection = sectionStarts.find((s) => s.index > entry.index);
    const endIdx = nextSection ? nextSection.index : lines.length;
    return lines.slice(startIdx, endIdx);
  }

  // Parse summary
  const summaryLines = getSectionLines('Summary');
  summary = summaryLines.join('\n').trim();

  // Parse affected components table
  const componentLines = getSectionLines('Affected components');
  for (const line of componentLines) {
    // Skip header row, separator row, and empty lines
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 3) continue;
    // Skip the header and separator rows
    if (cells[0] === 'Component' || cells[0].startsWith('-')) continue;
    components.push({
      name: cells[0],
      action: cells[1],
      file: cells[2],
    });
  }

  // Parse technical decisions
  const decisionLines = getSectionLines('Technical decisions');
  for (const line of decisionLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      decisions.push(trimmed.slice(2).trim());
    }
  }

  // Parse TODOs
  const todoLines = getSectionLines('TODOs');
  for (const line of todoLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      todos.push(trimmed.slice(2).trim());
    }
  }

  return { title, date, scope, impact, summary, components, decisions, todos };
}

/**
 * Load all codetape data from a project's .codetape/ directory.
 * @param {string} projectDir - Absolute path to the project root.
 * @returns {object} JSON-serializable codetape data.
 */
export function loadCodetapeData(projectDir) {
  const codetapeDir = join(projectDir, '.codetape');

  const config = safeReadJSON(join(codetapeDir, 'config.json'), {});
  const componentMap = safeReadJSON(join(codetapeDir, 'component-map.json'), {
    components: {},
    relationships: [],
  });
  const drift = safeReadJSON(join(codetapeDir, 'drift.json'), null);

  // Load traces
  const tracesDir = join(codetapeDir, 'traces');
  let traceFiles = [];
  try {
    traceFiles = readdirSync(tracesDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse(); // newest first (filenames start with date)
  } catch {
    // traces directory may not exist
  }

  const traces = traceFiles.map((filename) => {
    const filePath = join(tracesDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parseTrace(content);
    return {
      filename,
      content,
      ...parsed,
    };
  });

  // Aggregate decisions and todos from all traces
  const decisions = [];
  const todos = [];

  for (const trace of traces) {
    for (const text of trace.decisions) {
      decisions.push({ text, traceRef: trace.filename, date: trace.date });
    }
    for (const text of trace.todos) {
      todos.push({ text, traceRef: trace.filename, date: trace.date });
    }
  }

  return {
    config,
    componentMap,
    drift,
    traces,
    decisions,
    todos,
  };
}
