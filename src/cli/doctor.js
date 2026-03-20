import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function doctor(args) {
  const projectDir = process.cwd();
  let passed = 0;
  let total = 0;

  console.log('\nPrompTrace Doctor\n');

  // Helper: run a single check
  function check(label, condition) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ ${label}`);
    } else {
      console.log(`  ✗ ${label}`);
    }
  }

  // Helper: check if file is valid JSON
  function isValidJson(filePath) {
    if (!existsSync(filePath)) return false;
    try {
      JSON.parse(readFileSync(filePath, 'utf8'));
      return true;
    } catch {
      return false;
    }
  }

  const promptraceDir = join(projectDir, '.promptrace');
  const claudeDir = join(projectDir, '.claude');
  const skillDir = join(claudeDir, 'skills', 'promptrace');

  // 1. .promptrace/ directory exists
  check('.promptrace/ directory exists', existsSync(promptraceDir));

  // 2. config.json exists and is valid JSON
  check('.promptrace/config.json is valid', isValidJson(join(promptraceDir, 'config.json')));

  // 3. component-map.json exists and is valid JSON
  check('.promptrace/component-map.json is valid', isValidJson(join(promptraceDir, 'component-map.json')));

  // 4. traces/ directory exists
  check('.promptrace/traces/ directory exists', existsSync(join(promptraceDir, 'traces')));

  // 5. SKILL.md exists
  check('.claude/skills/promptrace/SKILL.md exists', existsSync(join(skillDir, 'SKILL.md')));

  // 6. All 4 reference files
  const referenceFiles = [
    'trace_schema.md',
    'sync_strategies.md',
    'component_patterns.md',
    'drift_detection.md',
  ];
  const refsDir = join(skillDir, 'references');
  for (const file of referenceFiles) {
    check(`references/${file}`, existsSync(join(refsDir, file)));
  }

  // 7. All 5 template files
  const templateFiles = [
    'readme_section.md',
    'component_doc.md',
    'architecture_overview.md',
    'changelog_entry.md',
    'session_summary.md',
  ];
  const templatesDir = join(skillDir, 'templates');
  for (const file of templateFiles) {
    check(`templates/${file}`, existsSync(join(templatesDir, file)));
  }

  // 8. All 7 command files
  const commandFiles = [
    'trace.md',
    'trace-sync.md',
    'trace-map.md',
    'trace-review.md',
    'trace-init.md',
    'trace-log.md',
    'trace-commit.md',
  ];
  const commandsDir = join(claudeDir, 'commands');
  for (const file of commandFiles) {
    check(`commands/${file}`, existsSync(join(commandsDir, file)));
  }

  // Summary
  console.log(`\n${passed}/${total} checks passed`);

  if (passed < total) {
    console.log('\nSome checks failed. Run: npx promptrace init');
  } else {
    console.log('\nAll checks passed. Promptrace is healthy.');
  }
  console.log('');
}
