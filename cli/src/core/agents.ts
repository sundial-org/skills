import type { AgentConfig } from '../types/index';
import { AGENTS } from '../constants';

// Re-export for backwards compatibility
export const SUPPORTED_AGENTS = AGENTS;

export function getAgentByFlag(flag: string): AgentConfig | undefined {
  return AGENTS.find(agent => agent.flag === flag);
}

export function getSupportedAgentsMessage(): string {
  return `Currently supported agents: ${AGENTS.map(a => a.name).join(', ')}`;
}
