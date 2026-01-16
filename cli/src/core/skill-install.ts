import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { getAgentByFlag } from './agents.js';
import { resolveSkillSource } from './skill-source.js';
import { findSkillDirectories, readSkillMetadata } from './skill-info.js';
import type { AgentType, SkillSource } from '../types/index.js';

/**
 * Get the destination path for installing a skill.
 * Skill name comes from SKILL.md frontmatter.
 */
function getSkillDestination(skillName: string, agentFlag: AgentType, isGlobal: boolean): string {
  const agent = getAgentByFlag(agentFlag);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentFlag}`);
  }

  const base = isGlobal ? os.homedir() : process.cwd();
  return path.join(base, agent.folderName, 'skills', skillName);
}

/**
 * Install a single skill directory to an agent.
 * The skill name is taken from SKILL.md frontmatter (not the folder name).
 * The destination folder will be named after the frontmatter name.
 */
async function installSkillDirectory(
  skillDir: string,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<string> {
  // Get metadata from SKILL.md frontmatter (name and description are required)
  const metadata = await readSkillMetadata(skillDir);
  if (!metadata) {
    throw new Error(`Invalid skill at "${skillDir}": SKILL.md must have name and description in frontmatter`);
  }

  const dest = getSkillDestination(metadata.name, agentFlag, isGlobal);

  // Ensure parent directory exists
  await fs.ensureDir(path.dirname(dest));

  // Copy the skill folder (folder will be renamed to match frontmatter name)
  await fs.copy(skillDir, dest, { overwrite: true });

  return metadata.name;
}

/**
 * Install skill(s) from a local path.
 * Checks if path is a skill, otherwise checks direct children for SKILL.md.
 */
export async function installFromLocal(
  source: SkillSource,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<string[]> {
  const skillDirs = await findSkillDirectories(source.location);

  if (skillDirs.length === 0) {
    throw new Error(`No skills found in "${source.location}". A skill must contain a SKILL.md file.`);
  }

  const installedSkills: string[] = [];
  for (const skillDir of skillDirs) {
    const skillName = await installSkillDirectory(skillDir, agentFlag, isGlobal);
    installedSkills.push(skillName);
  }

  return installedSkills;
}

/**
 * Install skill(s) from GitHub using degit.
 * After downloading, checks if it's a skill or searches direct children for SKILL.md.
 */
export async function installFromGithub(
  source: SkillSource,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<string[]> {
  // Create a temp directory to download to
  const tempDir = path.join(os.tmpdir(), `sun-install-${Date.now()}`);

  try {
    // Download using degit
    await fs.ensureDir(tempDir);
    try {
      execFileSync('npx', ['degit', source.location, tempDir], {
        stdio: 'pipe'
      });
    } catch (error) {
      const err = error as Error & { stderr?: Buffer };
      const stderr = err.stderr?.toString() || err.message;
      throw new Error(`Failed to download from GitHub: ${stderr}`);
    }

    // Find skills in downloaded content (checks itself and direct children)
    const skillDirs = await findSkillDirectories(tempDir);

    if (skillDirs.length === 0) {
      throw new Error(`No skills found in "${source.originalInput}". A skill must contain a SKILL.md file.`);
    }

    // Install each skill found (name comes from SKILL.md frontmatter)
    const installedSkills: string[] = [];
    for (const skillDir of skillDirs) {
      const skillName = await installSkillDirectory(skillDir, agentFlag, isGlobal);
      installedSkills.push(skillName);
    }

    return installedSkills;
  } finally {
    // Clean up temp directory
    await fs.remove(tempDir).catch(() => {});
  }
}

/**
 * Install skill(s) from any source to an agent.
 * Returns list of installed skill names.
 */
export async function installSkill(
  skillInput: string,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<{ skillNames: string[]; source: SkillSource }> {
  const source = await resolveSkillSource(skillInput);

  let skillNames: string[];

  switch (source.type) {
    case 'local':
      skillNames = await installFromLocal(source, agentFlag, isGlobal);
      break;
    case 'github':
    case 'shortcut':
      skillNames = await installFromGithub(source, agentFlag, isGlobal);
      break;
    default:
      throw new Error(`Unknown source type: ${(source as SkillSource).type}`);
  }

  return { skillNames, source };
}

/**
 * Remove a skill from an agent.
 */
export async function removeSkill(
  skillName: string,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<boolean> {
  const dest = getSkillDestination(skillName, agentFlag, isGlobal);

  if (await fs.pathExists(dest)) {
    await fs.remove(dest);
    return true;
  }

  return false;
}
