import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SUPPORTED_AGENTS } from './agents';
import type { DetectedAgent, AgentConfig } from '../types/index';

const execAsync = promisify(exec);

// Agent folder names to search for
const AGENT_FOLDER_NAMES = new Set(SUPPORTED_AGENTS.map(a => a.folderName));

export async function detectAgentsInDirectory(directory: string, isGlobal: boolean): Promise<DetectedAgent[]> {
  const detected: DetectedAgent[] = [];

  for (const agent of SUPPORTED_AGENTS) {
    const agentPath = path.join(directory, agent.folderName);
    if (await fs.pathExists(agentPath)) {
      detected.push({
        agent,
        path: agentPath,
        isGlobal
      });
    }
  }

  return detected;
}

export async function detectLocalAgents(): Promise<DetectedAgent[]> {
  return detectAgentsInDirectory(process.cwd(), false);
}

export async function detectGlobalAgents(): Promise<DetectedAgent[]> {
  return detectAgentsInDirectory(os.homedir(), true);
}

/**
 * Search the entire file system for all agent folders.
 * Uses `find -type d -name` for efficiency.
 */
export async function detectAllAgentFolders(): Promise<DetectedAgent[]> {
  const results: DetectedAgent[] = [];
  const homeDir = os.homedir();

  // Build find command: find ~ -type d \( -name ".claude" -o -name ".codex" -o -name ".gemini" \)
  const namePatterns = SUPPORTED_AGENTS.map(a => `-name "${a.folderName}"`).join(' -o ');
  const findCmd = `find "${homeDir}" -type d \\( ${namePatterns} \\) 2>/dev/null`;

  try {
    const { stdout } = await execAsync(findCmd, { maxBuffer: 10 * 1024 * 1024 });
    const agentPaths = stdout.trim().split('\n').filter(Boolean);

    for (const agentPath of agentPaths) {
      const folderName = path.basename(agentPath);
      const agent = SUPPORTED_AGENTS.find(a => a.folderName === folderName);
      if (!agent) continue;

      const isGlobal = path.dirname(agentPath) === homeDir;
      results.push({
        agent,
        path: agentPath,
        isGlobal
      });
    }
  } catch {
    // find command failed - fall back to simple detection
    const [local, global] = await Promise.all([
      detectLocalAgents(),
      detectGlobalAgents()
    ]);
    return [...local, ...global];
  }

  return results;
}

/**
 * Search the entire file system for agent folders that contain skills.
 * Uses `find` to locate skills directories with content.
 */
export async function detectAllSkillsFolders(): Promise<DetectedAgent[]> {
  const allAgents = await detectAllAgentFolders();

  // Filter to only those with skills installed
  const withSkills: DetectedAgent[] = [];
  for (const detected of allAgents) {
    const skillsDir = path.join(detected.path, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const entries = await fs.readdir(skillsDir);
      if (entries.length > 0) {
        withSkills.push(detected);
      }
    }
  }

  return withSkills;
}

/**
 * Detect agents in local and global directories only (fast).
 */
export async function detectAllAgents(): Promise<DetectedAgent[]> {
  const [local, global] = await Promise.all([
    detectLocalAgents(),
    detectGlobalAgents()
  ]);
  return [...local, ...global];
}

export function getAgentPath(agent: AgentConfig, isGlobal: boolean): string {
  const baseDir = isGlobal ? os.homedir() : process.cwd();
  return path.join(baseDir, agent.folderName);
}

export function getSkillsPath(agent: AgentConfig, isGlobal: boolean): string {
  return path.join(getAgentPath(agent, isGlobal), 'skills');
}

export async function ensureSkillsDirectory(agent: AgentConfig, isGlobal: boolean): Promise<string> {
  const skillsPath = getSkillsPath(agent, isGlobal);
  await fs.ensureDir(skillsPath);
  return skillsPath;
}
