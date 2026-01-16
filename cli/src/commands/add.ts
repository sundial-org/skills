import chalk from 'chalk';
import ora from 'ora';
import { getAgentByFlag, SUPPORTED_AGENTS } from '../core/agents';
import { isFirstRun, getDefaultAgents, setDefaultAgents } from '../core/config-manager';
import { detectLocalAgents } from '../core/agent-detect';
import { installSkill } from '../core/skill-install';
import { promptAgentSelection } from '../utils/prompts';
import type { AgentType, CommandFlags } from '../types/index';

/**
 * Determine which agents to install to and whether to install globally.
 *
 * Logic:
 * 1. If --global flag is set, always install globally
 * 2. If agent flags (--claude, --codex, etc.) are set, use those agents
 * 3. If first run, detect agents and prompt for selection
 * 4. Otherwise use saved default agents
 *
 * For local vs global:
 * - If --global: always global
 * - Otherwise: check if any configured agents have local folders
 *   - If yes: install locally to those
 *   - If no local folders exist for configured agents: install globally
 */
async function resolveTargetAgents(flags: CommandFlags): Promise<{ agents: AgentType[]; isGlobal: boolean }> {
  const forceGlobal = flags.global ?? false;

  // Check if any agent flags were explicitly set
  const explicitAgents: AgentType[] = [];
  for (const agent of SUPPORTED_AGENTS) {
    if (flags[agent.flag as keyof CommandFlags]) {
      explicitAgents.push(agent.flag as AgentType);
    }
  }

  let targetAgents: AgentType[];

  // Determine which agents to target
  if (explicitAgents.length > 0) {
    targetAgents = explicitAgents;
  } else if (await isFirstRun()) {
    // First run: show agent type selection dialog
    const selectedAgents = await promptAgentSelection();
    await setDefaultAgents(selectedAgents);
    targetAgents = selectedAgents;
  } else {
    // Use saved defaults
    const defaultAgents = await getDefaultAgents();
    if (defaultAgents.length === 0) {
      throw new Error('No default agents configured. Run "sun config" to set up your agents.');
    }
    targetAgents = defaultAgents;
  }

  // Determine if we should install globally or locally
  if (forceGlobal) {
    return { agents: targetAgents, isGlobal: true };
  }

  // Check if any of the target agents have local folders in current directory
  const localAgents = await detectLocalAgents();
  const localAgentFlags = new Set(localAgents.map(a => a.agent.flag));

  const hasLocalFolders = targetAgents.some(agentFlag => localAgentFlags.has(agentFlag));

  // If no local folders exist for any configured agent, install globally
  const isGlobal = !hasLocalFolders;

  return { agents: targetAgents, isGlobal };
}

export interface AddResult {
  skill: string;
  installedNames: string[];
  agents: string[];
  isGlobal: boolean;
  error?: string;
}

/**
 * Add skill(s) to agent configuration(s).
 */
export async function addCommand(skills: string[], flags: CommandFlags): Promise<void> {
  // Resolve target agents
  const { agents, isGlobal } = await resolveTargetAgents(flags);

  const results: AddResult[] = [];

  for (const skill of skills) {
    const spinner = ora(`Adding ${skill}...`).start();

    const result: AddResult = {
      skill,
      installedNames: [],
      agents: [],
      isGlobal
    };

    try {
      // Install to each target agent
      for (const agentFlag of agents) {
        const { skillNames } = await installSkill(skill, agentFlag, isGlobal);
        result.installedNames = skillNames;
        result.agents.push(getAgentByFlag(agentFlag)!.name);
      }

      spinner.succeed(`Added ${result.installedNames.join(', ')}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.error = message;
      spinner.fail(`Failed to add ${skill}: ${message}`);
    }

    results.push(result);
  }

  // Print summary
  const successful = results.filter(r => !r.error);
  if (successful.length > 0) {
    const allSkills = [...new Set(successful.flatMap(r => r.installedNames))];
    const agentFolders = [...new Set(successful.flatMap(r => r.agents))];

    console.log();
    const location = isGlobal ? '(global)' : '(local)';
    console.log(chalk.green(`Added ${allSkills.join(', ')} to ${agentFolders.join(' and ')} ${chalk.gray(location)}`));

    if (!isGlobal) {
      console.log(chalk.gray('(use --global to install globally)'));
    }
  }
}
