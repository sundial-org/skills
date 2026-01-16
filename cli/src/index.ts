#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');
import { SUPPORTED_AGENTS } from './core/agents';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { listCommand } from './commands/list';
import { showCommand } from './commands/show';
import { configCommand } from './commands/config';
import { suggestCommand, getValidCommands } from './utils/fuzzy-match';
import type { CommandFlags } from './types/index';

const program = new Command();

program
  .name('sun')
  .description('Sundial CLI - Manage skills for your AI agents')
  .version(version);

// Add command
const add = program
  .command('add <skills...>')
  .description('Add skill(s) to agent configuration(s)')
  .option('--global', 'Install to global agent config (~/.claude/, ~/.codex/, etc.)');

// Add agent flags dynamically
for (const agent of SUPPORTED_AGENTS) {
  add.option(`--${agent.flag}`, `Install to ${agent.name}`);
}

add.action(async (skills: string[], options: CommandFlags) => {
  try {
    await addCommand(skills, options);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
});

// Remove command
const remove = program
  .command('remove <skills...>')
  .description('Remove skill(s) from agent configuration(s)')
  .option('--global', 'Remove from global config');

for (const agent of SUPPORTED_AGENTS) {
  remove.option(`--${agent.flag}`, `Remove from ${agent.name}`);
}

remove.action(async (skills: string[], options: CommandFlags) => {
  try {
    await removeCommand(skills, options);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
});

// List command
program
  .command('list')
  .description('List all installed skills for each agent')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Show command
program
  .command('show [skill]')
  .description('Show all agent folders and packages, or details for a specific skill')
  .action(async (skill?: string) => {
    try {
      await showCommand(skill);
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Configure default agents')
  .action(async () => {
    try {
      await configCommand();
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

// Handle unknown commands with fuzzy matching
program.on('command:*', (operands) => {
  const unknownCommand = operands[0];
  const suggestion = suggestCommand(unknownCommand);

  console.error(chalk.red(`Error: Unknown command '${unknownCommand}'`));

  if (suggestion) {
    console.error(chalk.yellow(`Did you mean '${suggestion}'?`));
  }

  console.error();
  console.error(`Valid commands: ${getValidCommands().join(', ')}`);
  process.exit(1);
});

// Parse and execute
program.parse();
