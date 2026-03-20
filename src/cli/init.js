import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { existsSync, appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectProject } from '../utils/detect-project.js';
import { scaffold } from '../utils/scaffold.js';
import { copySkill } from '../utils/copy-skill.js';
import { injectClaudeMd } from '../utils/inject-claude-md.js';

export async function init(args) {
  const projectDir = process.cwd();
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    // 1. Check if .promptrace/ already exists
    if (existsSync(join(projectDir, '.promptrace'))) {
      const answer = await rl.question('.promptrace/ already exists. Reconfigure? (y/N) ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted.');
        return;
      }
    }

    // 2. Detect project
    console.log('\n🔍 Detecting project...\n');
    const projectInfo = detectProject(projectDir);
    console.log(`  Name:       ${projectInfo.name}`);
    console.log(`  Language:   ${projectInfo.language}`);
    console.log(`  Framework:  ${projectInfo.framework || 'none'}`);
    console.log(`  Components: ${projectInfo.componentRoots.join(', ') || 'src/'}`);

    const confirm = await rl.question('\nProceed with these settings? (Y/n) ');
    if (confirm.toLowerCase() === 'n') {
      console.log('Aborted.');
      return;
    }

    // 3. Scaffold .promptrace/
    console.log('\n📁 Creating .promptrace/ ...');
    const created = scaffold(projectDir, projectInfo);
    created.forEach(f => console.log(`  ✓ ${f}`));

    // 4. Install skill
    console.log('\n📦 Installing skill...');
    const { skillFiles, commandFiles } = copySkill(projectDir);
    console.log(`  ✓ ${skillFiles.length} skill files → .claude/skills/promptrace/`);
    console.log(`  ✓ ${commandFiles.length} commands → .claude/commands/`);

    // 5. CLAUDE.md injection
    const claudeAnswer = await rl.question('\nAdd Promptrace section to CLAUDE.md? (Y/n) ');
    if (claudeAnswer.toLowerCase() !== 'n') {
      const result = injectClaudeMd(projectDir, projectInfo);
      console.log(`  ✓ CLAUDE.md ${result.action}`);
    }

    // 6. .gitignore update
    const gitAnswer = await rl.question('Add .promptrace/traces/ to .gitignore? (Y/n) ');
    if (gitAnswer.toLowerCase() !== 'n') {
      const gitignorePath = join(projectDir, '.gitignore');
      const entries = '\n# Promptrace\n.promptrace/traces/\n.promptrace/drift.json\n';
      if (existsSync(gitignorePath)) {
        const content = readFileSync(gitignorePath, 'utf8');
        if (!content.includes('.promptrace/traces/')) {
          appendFileSync(gitignorePath, entries);
          console.log('  ✓ Updated .gitignore');
        } else {
          console.log('  ✓ .gitignore already configured');
        }
      } else {
        appendFileSync(gitignorePath, entries);
        console.log('  ✓ Created .gitignore');
      }
    }

    // 7. Success
    console.log('\n✅ Promptrace initialized!\n');
    console.log('Next steps:');
    console.log('  1. Make some code changes');
    console.log('  2. Run /trace in Claude Code to record your first trace');
    console.log('  3. Run /trace-sync to update your docs\n');

  } finally {
    rl.close();
  }
}
