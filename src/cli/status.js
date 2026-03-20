import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export async function status(args) {
  const projectDir = process.cwd();
  const promptraceDir = join(projectDir, '.promptrace');

  // 1. Check if .promptrace/ exists
  if (!existsSync(promptraceDir)) {
    console.log('\nPrompTrace is not initialized. Run: npx promptrace init\n');
    return;
  }

  // 2. Read config.json
  const configPath = join(promptraceDir, 'config.json');
  let config = null;
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      config = null;
    }
  }

  const name = config?.project_name || 'unknown';
  const language = config?.language || 'unknown';
  const framework = config?.framework || 'none';

  // 3. Count .md files in traces/
  const tracesDir = join(promptraceDir, 'traces');
  let traceCount = 0;
  let lastTraceDate = 'never';

  if (existsSync(tracesDir)) {
    const traceFiles = readdirSync(tracesDir)
      .filter(f => f.endsWith('.md'))
      .sort();

    traceCount = traceFiles.length;

    // 4. Last trace date from most recent filename
    if (traceFiles.length > 0) {
      const lastFile = traceFiles[traceFiles.length - 1];
      // Filenames follow pattern like 2025-03-20-feature-name.md
      const dateMatch = lastFile.match(/^(\d{4}-\d{2}-\d{2})/);
      lastTraceDate = dateMatch ? dateMatch[1] : lastFile;
    }
  }

  // 5. Check if skill installed
  const skillInstalled = existsSync(
    join(projectDir, '.claude', 'skills', 'promptrace', 'SKILL.md')
  );

  // 6. Read component-map.json
  const mapPath = join(promptraceDir, 'component-map.json');
  let componentCount = 0;
  if (existsSync(mapPath)) {
    try {
      const map = JSON.parse(readFileSync(mapPath, 'utf8'));
      componentCount = Object.keys(map.components || {}).length;
    } catch {
      componentCount = 0;
    }
  }

  // 7. Format output
  console.log('\nPrompTrace Status');
  console.log(`  Project:    ${name} (${language}/${framework})`);
  console.log(`  Traces:     ${traceCount} (last: ${lastTraceDate})`);
  console.log(`  Components: ${componentCount}`);
  console.log(`  Skill:      ${skillInstalled ? 'installed ✓' : 'not installed ✗'}`);
  console.log('');
}
