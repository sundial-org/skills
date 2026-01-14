/**
 * Dev-only show commands for debugging and exploration.
 * These search the entire file system starting from home directory.
 */

import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SUPPORTED_AGENTS } from '../core/agents.js';
import { readSkillMetadata } from '../core/skill-info.js';

const execAsync = promisify(exec);

// Timeout for find commands (60 seconds)
const FIND_TIMEOUT = 60000;

/**
 * List skills in a directory, returning name and description.
 */
async function listSkillsInDir(skillsDir: string): Promise<Array<{ name: string; description: string }>> {
  const skills: Array<{ name: string; description: string }> = [];

  if (!await fs.pathExists(skillsDir)) {
    return skills;
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(skillsDir, entry.name);
      const metadata = await readSkillMetadata(skillPath);
      if (metadata) {
        skills.push({
          name: metadata.name,
          description: metadata.description
        });
      }
    }
  }

  return skills;
}

/**
 * sun show all-agent-folders
 * Find ALL agent folders (.claude, .codex, .gemini) starting from ~ and show skills in each.
 */
export async function showAllAgentFolders(): Promise<void> {
  const homeDir = os.homedir();

  // Build find command: find ~ -type d \( -name ".claude" -o -name ".codex" -o -name ".gemini" \)
  const namePatterns = SUPPORTED_AGENTS.map(a => `-name "${a.folderName}"`).join(' -o ');
  const findCmd = `find "${homeDir}" -type d \\( ${namePatterns} \\)`;

  console.log(chalk.cyan('All Agent Folders'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  let stdout = '';
  try {
    const result = await execAsync(findCmd, { maxBuffer: 10 * 1024 * 1024, timeout: FIND_TIMEOUT });
    stdout = result.stdout;
  } catch (err: any) {
    // find exits non-zero on permission errors but still produces output
    if (err.stdout) {
      stdout = err.stdout;
    } else {
      console.log(chalk.red('Failed to search for agent folders.'));
      console.log(chalk.gray(String(err)));
      return;
    }
  }

  const agentPaths = stdout.trim().split('\n').filter(Boolean);

  if (agentPaths.length === 0) {
    console.log(chalk.yellow('No agent folders found.'));
    return;
  }

  for (const agentPath of agentPaths) {
    const folderName = path.basename(agentPath);
    const agent = SUPPORTED_AGENTS.find(a => a.folderName === folderName);
    if (!agent) continue;

    console.log(chalk.white.bold(agent.name));
    console.log(chalk.gray(`  ${agentPath}`));

    // List skills
    const skillsDir = path.join(agentPath, 'skills');
    const skills = await listSkillsInDir(skillsDir);

    if (skills.length === 0) {
      console.log(chalk.gray('  No skills installed'));
    } else {
      console.log(`  Skills (${skills.length}):`);
      for (const skill of skills) {
        console.log(`    - ${skill.name} ${chalk.gray(`- ${skill.description}`)}`);
      }
    }
    console.log();
  }
}

/**
 * sun show all-agent-skills-folders
 * Find ALL <agent>/skills folders starting from ~ and show skills in each.
 */
export async function showAllAgentSkillsFolders(): Promise<void> {
  const homeDir = os.homedir();

  // Build find command for skills directories inside agent folders
  // e.g., find ~ -type d \( -path "*/.claude/skills" -o -path "*/.codex/skills" -o -path "*/.gemini/skills" \)
  const pathPatterns = SUPPORTED_AGENTS.map(a => `-path "*/${a.folderName}/skills"`).join(' -o ');
  const findCmd = `find "${homeDir}" -type d \\( ${pathPatterns} \\)`;

  console.log(chalk.cyan('All Agent Skills Folders'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  let stdout = '';
  try {
    const result = await execAsync(findCmd, { maxBuffer: 10 * 1024 * 1024, timeout: FIND_TIMEOUT });
    stdout = result.stdout;
  } catch (err: any) {
    if (err.stdout) {
      stdout = err.stdout;
    } else {
      console.log(chalk.red('Failed to search for skills folders.'));
      console.log(chalk.gray(String(err)));
      return;
    }
  }

  const skillsDirs = stdout.trim().split('\n').filter(Boolean);

  if (skillsDirs.length === 0) {
    console.log(chalk.yellow('No agent skills folders found.'));
    return;
  }

  for (const skillsDir of skillsDirs) {
    // Get agent name from parent folder
    const agentFolder = path.basename(path.dirname(skillsDir));
    const agent = SUPPORTED_AGENTS.find(a => a.folderName === agentFolder);

    console.log(chalk.white.bold(agent?.name ?? agentFolder));
    console.log(chalk.gray(`  ${skillsDir}`));

    // List skills
    const skills = await listSkillsInDir(skillsDir);

    if (skills.length === 0) {
      console.log(chalk.gray('  No skills installed'));
    } else {
      console.log(`  Skills (${skills.length}):`);
      for (const skill of skills) {
        console.log(`    - ${skill.name} ${chalk.gray(`- ${skill.description}`)}`);
      }
    }
    console.log();
  }
}

/**
 * sun show all-skill-folders
 * Find ALL folders containing a valid SKILL.md (with name/description frontmatter).
 */
export async function showAllSkillFolders(): Promise<void> {
  const homeDir = os.homedir();

  // Find all SKILL.md files
  const findCmd = `find "${homeDir}" -name "SKILL.md" -type f`;

  console.log(chalk.cyan('All Skill Folders'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  let stdout = '';
  try {
    const result = await execAsync(findCmd, { maxBuffer: 10 * 1024 * 1024, timeout: FIND_TIMEOUT });
    stdout = result.stdout;
  } catch (err: any) {
    if (err.stdout) {
      stdout = err.stdout;
    } else {
      console.log(chalk.red('Failed to search for SKILL.md files.'));
      console.log(chalk.gray(String(err)));
      return;
    }
  }

  const skillMdPaths = stdout.trim().split('\n').filter(Boolean);

  if (skillMdPaths.length === 0) {
    console.log(chalk.yellow('No SKILL.md files found.'));
    return;
  }

  let validCount = 0;

  for (const skillMdPath of skillMdPaths) {
    const skillDir = path.dirname(skillMdPath);
    const metadata = await readSkillMetadata(skillDir);

    // Only show if it has valid name and description
    if (metadata && metadata.name && metadata.description) {
      validCount++;
      console.log(chalk.white.bold(metadata.name));
      console.log(chalk.gray(`  ${skillDir}`));
      console.log(`  ${metadata.description}`);
      console.log();
    }
  }

  if (validCount === 0) {
    console.log(chalk.yellow('No valid SKILL.md files found (missing name/description frontmatter).'));
  }
}
