export type AgentType = 'claude' | 'codex' | 'gemini';

export interface AgentConfig {
  name: string;
  flag: string;
  folderName: string;
}

export interface SunConfig {
  defaultAgents: AgentType[];
  firstRunComplete: boolean;
  skillRegistryUrl?: string;
}

/**
 * Skill metadata parsed from SKILL.md frontmatter.
 * Per spec: https://agentskills.io/specification#skill-md-format
 */
export interface SkillMetadata {
  /** Required: Max 64 chars, lowercase letters, numbers, hyphens only */
  name: string;
  /** Required: Max 1024 chars, describes what the skill does */
  description: string;
  /** Optional: License name or reference to bundled license file */
  license?: string;
  /** Optional: Max 500 chars, environment requirements */
  compatibility?: string;
  /** Optional: Arbitrary key-value mapping (includes author, version, etc.) */
  metadata?: Record<string, string>;
  /** Optional: Space-delimited list of pre-approved tools (experimental) */
  allowedTools?: string;
}

export type SkillSourceType = 'shortcut' | 'github' | 'local';

/** Used at install time to determine how to fetch a skill */
export interface SkillSource {
  type: SkillSourceType;
  /** The resolved location (URL for github/shortcut, path for local) */
  location: string;
  /** Original input string from user (e.g., "tinker" or "github.com/user/skill") */
  originalInput: string;
}

export interface SkillInstallation {
  agent: AgentType;
  path: string;
  isGlobal: boolean;
  metadata: SkillMetadata;
  contentHash: string;
}

export interface CommandFlags {
  global?: boolean;
  claude?: boolean;
  codex?: boolean;
  gemini?: boolean;
}

export interface DetectedAgent {
  agent: AgentConfig;
  path: string;
  isGlobal: boolean;
}
