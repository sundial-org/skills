import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { getAgentByFlag } from './agents.js';
import { resolveSkillSource } from './skill-source.js';
import { findSkillDirectories, readSkillMetadata } from './skill-info.js';
import type { AgentType, SkillSource } from '../types/index.js';
import { trackDownload } from '../lib/supabase.js';

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
 * Parse GitHub location into components.
 * Format: user/repo/subpath#branch or user/repo#branch or user/repo/subpath
 */
function parseGithubLocation(location: string): { 
  repoUrl: string; 
  subpath: string | null; 
  branch: string | null;
} {
  let loc = location;
  let branch: string | null = null;
  
  const hashIndex = loc.indexOf('#');
  if (hashIndex !== -1) {
    branch = loc.slice(hashIndex + 1);
    loc = loc.slice(0, hashIndex);
  }
  
  const parts = loc.split('/');
  if (parts.length < 2) {
    throw new Error(`Invalid GitHub location: ${location}`);
  }
  
  const user = parts[0];
  const repo = parts[1];
  const subpath = parts.length > 2 ? parts.slice(2).join('/') : null;
  
  return {
    repoUrl: `https://github.com/${user}/${repo}.git`,
    subpath,
    branch
  };
}

/**
 * Install skill(s) from GitHub using sparse checkout.
 * Only downloads the specific subdirectory instead of the full repo.
 */
export async function installFromGithub(
  source: SkillSource,
  agentFlag: AgentType,
  isGlobal: boolean
): Promise<string[]> {
  const tempDir = path.join(os.tmpdir(), `skill-install-${Date.now()}`);
  const { repoUrl, subpath, branch } = parseGithubLocation(source.location);

  try {
    execFileSync('git', [
      'clone', '--filter=blob:none', '--no-checkout', '--depth=1',
      ...(branch ? ['--branch', branch] : []),
      repoUrl, tempDir
    ], { stdio: 'pipe' });

    if (subpath) {
      execFileSync('git', ['sparse-checkout', 'init', '--cone'], { cwd: tempDir, stdio: 'pipe' });
      execFileSync('git', ['sparse-checkout', 'set', subpath], { cwd: tempDir, stdio: 'pipe' });
    }
    execFileSync('git', ['checkout'], { cwd: tempDir, stdio: 'pipe' });

    const skillRoot = subpath ? path.join(tempDir, subpath) : tempDir;
    const skillDirs = await findSkillDirectories(skillRoot);

    if (skillDirs.length === 0) {
      throw new Error(`No skills found in "${source.originalInput}". A skill must contain a SKILL.md file.`);
    }

    const installedSkills: string[] = [];
    for (const skillDir of skillDirs) {
      const skillName = await installSkillDirectory(skillDir, agentFlag, isGlobal);
      installedSkills.push(skillName);
    }

    return installedSkills;
  } catch (error) {
    const err = error as Error & { stderr?: Buffer };
    const stderr = err.stderr?.toString() || err.message;
    throw new Error(`Failed to download from GitHub: ${stderr}`);
  } finally {
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

  if (source.type === 'shortcut') {
    await trackDownload(source.originalInput);
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
