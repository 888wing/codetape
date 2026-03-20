import { copySkill } from '../utils/copy-skill.js';

export async function install(args) {
  const isGlobal = args.includes('-g') || args.includes('--global');
  const projectDir = process.cwd();

  console.log(`\n📦 Installing Promptrace skill${isGlobal ? ' globally' : ''}...\n`);

  const { skillFiles, commandFiles } = copySkill(projectDir, { global: isGlobal });

  console.log('  Skill files:');
  skillFiles.forEach(f => console.log(`    ✓ ${f}`));

  console.log('  Command files:');
  commandFiles.forEach(f => console.log(`    ✓ ${f}`));

  console.log('');
  if (isGlobal) {
    console.log('✅ Skill installed globally to ~/.claude/skills/promptrace/');
    console.log('   Commands available in all projects via Claude Code.\n');
  } else {
    console.log('✅ Skill installed to .claude/skills/promptrace/');
    console.log('   Commands available in this project via Claude Code.\n');
  }
}
