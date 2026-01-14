import type { AgentConfig, AgentType } from '../types/index.js';

export const SUPPORTED_AGENTS: AgentConfig[] = [
  {
    name: 'Claude Code',
    flag: 'claude',
    folderName: '.claude'
  },
  {
    name: 'Codex',
    flag: 'codex',
    folderName: '.codex'
  },
  {
    name: 'Gemini',
    flag: 'gemini',
    folderName: '.gemini'
  }
];

export function getAgentByFlag(flag: string): AgentConfig | undefined {
  return SUPPORTED_AGENTS.find(agent => agent.flag === flag);
}

export function getAgentByFolder(folderName: string): AgentConfig | undefined {
  return SUPPORTED_AGENTS.find(agent => agent.folderName === folderName);
}

export function getSupportedAgentsMessage(): string {
  const agentNames = SUPPORTED_AGENTS.map(a => a.name).join(', ');
  return `Currently supported agents: ${agentNames}`;
}

export function isValidAgentType(flag: string): flag is AgentType {
  return SUPPORTED_AGENTS.some(agent => agent.flag === flag);
}

export function getAgentFlags(): string[] {
  return SUPPORTED_AGENTS.map(a => a.flag);
}
