import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SUPPORTED_AGENTS } from './agents.js';
import { computeContentHash } from './skill-hash.js';
import type { SkillMetadata, SkillInstallation, AgentType } from '../types/index.js';

/**
 * Parse YAML-like frontmatter from SKILL.md content.
 * Frontmatter is delimited by --- at start and end.
 * Handles nested metadata field as key-value pairs.
 */
function parseFrontmatter(content: string): SkillMetadata | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const lines = frontmatterMatch[1].split('\n');
  let name = '';
  let description = '';
  let license: string | undefined;
  let compatibility: string | undefined;
  let allowedTools: string | undefined;
  const metadata: Record<string, string> = {};

  let inMetadata = false;

  for (const line of lines) {
    // Check if we're entering metadata block (indented or explicit)
    if (line.match(/^metadata:\s*$/)) {
      inMetadata = true;
      continue;
    }

    // If line starts with non-whitespace, we're out of metadata block
    if (inMetadata && line.match(/^\S/)) {
      inMetadata = false;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (inMetadata) {
        // Nested under metadata
        metadata[key] = value;
      } else {
        // Top-level fields
        switch (key) {
          case 'name':
            name = value;
            break;
          case 'description':
            description = value;
            break;
          case 'license':
            license = value;
            break;
          case 'compatibility':
            compatibility = value;
            break;
          case 'allowed-tools':
            allowedTools = value;
            break;
        }
      }
    }
  }

  // name and description are required
  if (!name || !description) {
    return null;
  }

  return {
    name,
    description,
    license,
    compatibility,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    allowedTools
  };
}

/**
 * Check if a directory is a valid skill.
 * A valid skill must contain a SKILL.md with required frontmatter (name, description).
 */
export async function isValidSkillDirectory(dirPath: string): Promise<boolean> {
  const skillMdPath = path.join(dirPath, 'SKILL.md');

  if (!await fs.pathExists(skillMdPath)) {
    return false;
  }

  try {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    const metadata = parseFrontmatter(content);
    return metadata !== null;
  } catch {
    return false;
  }
}

/**
 * Find skill directories within a given path by searching recursively for SKILL.md files.
 * A skill is any directory containing a valid SKILL.md file (with name + description).
 */
export async function findSkillDirectories(searchPath: string): Promise<string[]> {
  const skills: string[] = [];

  // Recursively find all SKILL.md files
  async function searchRecursively(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && entry.name === 'SKILL.md') {
          // Found a SKILL.md - check if it's valid
          if (await isValidSkillDirectory(dir)) {
            skills.push(dir);
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.git')) {
          // Skip .git directories but recurse into others
          await searchRecursively(fullPath);
        }
      }
    } catch {
      // Permission denied or other error, skip this directory
    }
  }

  await searchRecursively(searchPath);
  return skills;
}

/**
 * Read skill metadata from SKILL.md frontmatter.
 * The canonical skill name comes from the frontmatter, not the folder name.
 */
export async function readSkillMetadata(skillPath: string): Promise<SkillMetadata | null> {
  const skillMdPath = path.join(skillPath, 'SKILL.md');

  try {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    return parseFrontmatter(content);
  } catch {
    return null;
  }
}

/**
 * Get the canonical skill name from SKILL.md frontmatter.
 * Returns null if not a valid skill.
 */
export async function getSkillName(skillPath: string): Promise<string | null> {
  const metadata = await readSkillMetadata(skillPath);
  return metadata?.name || null;
}

/**
 * Find all installations of a skill by name across all agents.
 */
export async function findSkillInstallations(skillName: string): Promise<SkillInstallation[]> {
  const installations: SkillInstallation[] = [];

  // Check both local and global for each agent
  const locations = [
    { base: process.cwd(), isGlobal: false },
    { base: os.homedir(), isGlobal: true }
  ];

  for (const { base, isGlobal } of locations) {
    for (const agent of SUPPORTED_AGENTS) {
      const skillPath = path.join(base, agent.folderName, 'skills', skillName);

      if (await fs.pathExists(skillPath)) {
        const metadata = await readSkillMetadata(skillPath);
        if (metadata) {
          const contentHash = await computeContentHash(skillPath);

          installations.push({
            agent: agent.flag as AgentType,
            path: skillPath,
            isGlobal,
            metadata,
            contentHash
          });
        }
      }
    }
  }

  return installations;
}

/**
 * List all installed skills for a specific agent.
 */
export async function listSkillsForAgent(
  agentFolderName: string,
  isGlobal: boolean
): Promise<string[]> {
  const base = isGlobal ? os.homedir() : process.cwd();
  const skillsDir = path.join(base, agentFolderName, 'skills');

  if (!await fs.pathExists(skillsDir)) {
    return [];
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(skillsDir, entry.name);
      const skillName = await getSkillName(skillPath);
      if (skillName) {
        skills.push(skillName);
      }
    }
  }

  return skills;
}

/**
 * Check if a skill exists in an agent's folder.
 */
export async function skillExists(
  skillName: string,
  agentFolderName: string,
  isGlobal: boolean
): Promise<boolean> {
  const base = isGlobal ? os.homedir() : process.cwd();
  const skillPath = path.join(base, agentFolderName, 'skills', skillName);
  return (await fs.pathExists(skillPath)) && (await isValidSkillDirectory(skillPath));
}
