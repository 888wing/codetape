#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const command = process.argv[2];
const args = process.argv.slice(3);

function printUsage() {
  console.log(`promptrace v${pkg.version}
The flight recorder for AI coding

Usage: promptrace <command> [options]

Commands:
  init          Set up Promptrace in the current project
  install       Install skill only (use -g for global)
  uninstall     Remove skill and clean up
  status        Show Promptrace status
  doctor        Verify installation integrity

Options:
  --version     Show version
  --help        Show this help

Examples:
  npx promptrace init
  npx promptrace install -g
  npx promptrace doctor`);
}

async function main() {
  if (!command || command === '--help') {
    printUsage();
    process.exit(0);
  }

  if (command === '--version') {
    console.log(pkg.version);
    process.exit(0);
  }

  const commands = {
    init: () => import('../src/cli/init.js').then((m) => m.init(args)),
    install: () => import('../src/cli/install.js').then((m) => m.install(args)),
    uninstall: () => import('../src/cli/uninstall.js').then((m) => m.uninstall(args)),
    status: () => import('../src/cli/status.js').then((m) => m.status(args)),
    doctor: () => import('../src/cli/doctor.js').then((m) => m.doctor(args)),
  };

  if (!commands[command]) {
    console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(1);
  }

  await commands[command]();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
