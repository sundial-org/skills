import chalk from 'chalk';
import { SUPPORTED_AGENTS } from '../core/agents';
import { checkboxExtended } from './checkbox-extended';
import type { AgentType } from '../types/index';

/**
 * Show an interactive checkbox UI for selecting default agents.
 *
 * @param currentDefaults - Previously saved defaults (empty on first run)
 * @returns Array of selected agent flags (e.g., ['claude', 'codex'])
 *
 * Behavior:
 * - Shows all supported agent TYPES from SUPPORTED_AGENTS
 * - First run (currentDefaults empty): ALL agents are pre-selected
 * - Subsequent runs: Only previously saved defaults are pre-selected
 * - Must select at least one agent
 */
export async function promptAgentSelection(
  currentDefaults: AgentType[] = []
): Promise<AgentType[]> {
  const isFirstRun = currentDefaults.length === 0;

  // Build choices from SUPPORTED_AGENTS constants
  // Show paths so users understand what each agent refers to
  const choices = SUPPORTED_AGENTS.map(agent => ({
    name: `${agent.name} (~/${agent.folderName}/ and ./${agent.folderName}/)`,
    value: agent.flag as AgentType,
    // First run: select ALL agents
    // Otherwise: only select if it was in previous defaults
    checked: isFirstRun ? true : currentDefaults.includes(agent.flag as AgentType)
  }));

  const selectedAgents = await checkboxExtended({
    message: 'Select default agents:',
    choices,
    required: true,
    theme: {
      icon: {
        // Make the selection marker stand out a bit more.
        checked: chalk.green('◉'),
        unchecked: chalk.white('◎'),
        cursor: chalk.white('❯')
      },
      style: {
        // Keep active line readable (esp. on dark terminals) and avoid “cyan highlight”.
        highlight: (text: string) => chalk.bold.white(text)
      }
    }
  });

  return selectedAgents;
}
