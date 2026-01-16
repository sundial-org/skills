import chalk from 'chalk';
import path from 'path';
import { findSkillInstallations, readSkillMetadata } from '../core/skill-info';
import { getAgentByFlag } from '../core/agents';
import { detectAllAgents, detectLocalAgents } from '../core/agent-detect';
import { getDefaultAgents } from '../core/config-manager';
import { showAllAgentFolders, showAllAgentSkillsFolders, showAllSkillFolders } from './show-dev';
import fs from 'fs-extra';

/**
 * List all skills in a given skills directory path.
 */
async function listSkillsInPath(skillsDir: string): Promise<Array<{ name: string; description: string }>> {
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
 * Show all agent folders and their installed skills.
 */
async function showAllAgents(): Promise<void> {
  const allAgents = await detectAllAgents();
  const defaultAgents = await getDefaultAgents();
  const defaultSet = new Set(defaultAgents);
  const localAgents = await detectLocalAgents();
  const localAgentFlags = new Set(localAgents.map(a => a.agent.flag));

  if (allAgents.length === 0) {
    console.log(chalk.yellow('No agent folders found.'));
    console.log(chalk.gray('Agent folders are directories like .claude/, .codex/, .gemini/'));
    return;
  }

  console.log(chalk.cyan('Agent Folders & Installed Skills'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  for (const detected of allAgents) {
    const { agent, path: agentPath, isGlobal } = detected;
    const locationLabel = isGlobal ? chalk.gray('(global)') : chalk.gray('(local)');
    const isDefault = defaultSet.has(agent.flag as any);
    const hasLocalFolder = localAgentFlags.has(agent.flag);

    // Show checkmark if this folder would be affected by sun add/remove:
    // - Local folder: affected if agent is selected
    // - Global folder: affected if agent is selected AND no local folder exists
    const wouldBeAffected = isDefault && (isGlobal ? !hasLocalFolder : true);
    const marker = wouldBeAffected ? chalk.green('✓') : chalk.gray('○');

    console.log(`${marker} ${chalk.white.bold(agent.name)} ${locationLabel}`);
    console.log(chalk.gray(`  ${agentPath}`));

    // List skills in this agent folder
    const skillsDir = path.join(agentPath, 'skills');
    const skills = await listSkillsInPath(skillsDir);

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

  console.log(`${chalk.green('✓')} = affected by sun add/remove in this directory`);
  console.log('Run "sun config" to change selected agents.');
}

/**
 * Show skill details and installation locations.
 * If no skill specified, shows all agent folders and their packages.
 *
 * Secret commands (not in README, documented in DEV.md):
 * - all-agent-folders: Find all agent folders on the system
 * - all-agent-skills-folders: Find all <agent>/skills folders
 * - all-skill-folders: Find all folders with valid SKILL.md
 */
export async function showCommand(skillName?: string): Promise<void> {
  // Handle secret dev commands
  if (skillName === 'all-agent-folders') {
    await showAllAgentFolders();
    return;
  }

  if (skillName === 'all-agent-skills-folders') {
    await showAllAgentSkillsFolders();
    return;
  }

  if (skillName === 'all-skill-folders') {
    await showAllSkillFolders();
    return;
  }

  // If no skill specified, show all agents and their packages
  if (!skillName) {
    await showAllAgents();
    return;
  }

  const installations = await findSkillInstallations(skillName);

  if (installations.length === 0) {
    console.error(chalk.yellow(`Skill "${skillName}" is not installed.`));
    process.exit(1);
  }

  // Check if there are multiple versions (different content hashes)
  const uniqueHashes = new Set(installations.map(i => i.contentHash));
  const hasMultipleVersions = uniqueHashes.size > 1;

  if (hasMultipleVersions) {
    // Multiple versions detected
    console.log(chalk.cyan(`Skill: ${skillName}`));
    console.log(chalk.yellow('Warning: Multiple versions detected'));
    console.log();

    // Group by content hash
    const byHash = new Map<string, typeof installations>();
    for (const inst of installations) {
      const existing = byHash.get(inst.contentHash) || [];
      existing.push(inst);
      byHash.set(inst.contentHash, existing);
    }

    let versionNum = 1;
    for (const [hash, insts] of byHash) {
      const firstInst = insts[0];
      const locations = insts.map(i => {
        const agent = getAgentByFlag(i.agent)!;
        return i.isGlobal ? `~/${agent.folderName}/` : `${agent.folderName}/`;
      });

      console.log(chalk.white(`Version ${versionNum} (${locations.join(', ')}):`));
      console.log(`  Description: ${firstInst.metadata.description}`);

      if (firstInst.metadata.metadata?.author) {
        console.log(`  Author: ${firstInst.metadata.metadata.author}`);
      }
      if (firstInst.metadata.metadata?.version) {
        console.log(`  Version: ${firstInst.metadata.metadata.version}`);
      }
      if (firstInst.metadata.license) {
        console.log(`  License: ${firstInst.metadata.license}`);
      }

      console.log(`  Content hash: ${hash}`);
      console.log();

      versionNum++;
    }
  } else {
    // Single version across all installations
    const firstInst = installations[0];

    console.log(chalk.cyan(`Skill: ${skillName}`));
    console.log(`Description: ${firstInst.metadata.description}`);

    if (firstInst.metadata.metadata?.author) {
      console.log(`Author: ${firstInst.metadata.metadata.author}`);
    }
    if (firstInst.metadata.metadata?.version) {
      console.log(`Version: ${firstInst.metadata.metadata.version}`);
    }
    if (firstInst.metadata.license) {
      console.log(`License: ${firstInst.metadata.license}`);
    }
    if (firstInst.metadata.compatibility) {
      console.log(`Compatibility: ${firstInst.metadata.compatibility}`);
    }

    console.log();
    console.log('Installed in:');
    for (const inst of installations) {
      const agent = getAgentByFlag(inst.agent)!;
      const location = inst.isGlobal ? '(global)' : '(local)';
      console.log(`  - ${agent.folderName}/ ${chalk.gray(location)}`);
    }
  }
}
