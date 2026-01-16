import chalk from 'chalk';
import ora from 'ora';
import { getAgentByFlag, SUPPORTED_AGENTS } from '../core/agents';
import { getDefaultAgents } from '../core/config-manager';
import { detectLocalAgents } from '../core/agent-detect';
import { removeSkill } from '../core/skill-install';
import type { AgentType, CommandFlags } from '../types/index';

/**
 * Determine which agents to remove from and whether to target global installs.
 * Uses same logic as add command (except no first-run prompt).
 *
 * Logic:
 * 1. If --global flag is set, always target global
 * 2. If agent flags (--claude, --codex, etc.) are set, use those agents
 * 3. Otherwise use saved default agents (error if none configured)
 *
 * For local vs global:
 * - If --global: always global
 * - Otherwise: check if any configured agents have local folders
 *   - If yes: target local
 *   - If no local folders exist for configured agents: target global
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
  } else {
    // Use saved defaults (no first-run prompt for remove)
    const defaultAgents = await getDefaultAgents();
    if (defaultAgents.length === 0) {
      throw new Error('No default agents configured. Run "sun add" first or use --claude/--codex/--gemini flags.');
    }
    targetAgents = defaultAgents;
  }

  // Determine if we should target global or local
  if (forceGlobal) {
    return { agents: targetAgents, isGlobal: true };
  }

  // Check if any of the target agents have local folders in current directory
  const localAgents = await detectLocalAgents();
  const localAgentFlags = new Set(localAgents.map(a => a.agent.flag));

  const hasLocalFolders = targetAgents.some(agentFlag => localAgentFlags.has(agentFlag));

  // If no local folders exist for any configured agent, target global
  const isGlobal = !hasLocalFolders;

  return { agents: targetAgents, isGlobal };
}

export interface RemoveResult {
  skill: string;
  removedFrom: string[];
  notFoundIn: string[];
  isGlobal: boolean;
  error?: string;
}

/**
 * Remove skill(s) from agent configuration(s).
 */
export async function removeCommand(skills: string[], flags: CommandFlags): Promise<void> {
  // Resolve target agents
  let agents: AgentType[];
  let isGlobal: boolean;

  try {
    const resolved = await resolveTargetAgents(flags);
    agents = resolved.agents;
    isGlobal = resolved.isGlobal;
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  const results: RemoveResult[] = [];

  for (const skill of skills) {
    const spinner = ora(`Removing ${skill}...`).start();

    const result: RemoveResult = {
      skill,
      removedFrom: [],
      notFoundIn: [],
      isGlobal
    };

    try {
      // Remove from each target agent
      for (const agentFlag of agents) {
        const removed = await removeSkill(skill, agentFlag, isGlobal);
        const agentName = getAgentByFlag(agentFlag)!.name;

        if (removed) {
          result.removedFrom.push(agentName);
        } else {
          result.notFoundIn.push(agentName);
        }
      }

      if (result.removedFrom.length > 0) {
        spinner.succeed(`Removed ${skill} from ${result.removedFrom.join(' and ')}`);
      } else {
        const pathPrefix = isGlobal ? '~/' : './';
        const checkedPaths = agents.map(a => `${pathPrefix}${getAgentByFlag(a)!.folderName}/`);
        spinner.warn(`${skill} not found in configured agents (${checkedPaths.join(', ')})`);
      }

      if (result.notFoundIn.length > 0 && result.removedFrom.length > 0) {
        console.log(chalk.gray(`  (not found in: ${result.notFoundIn.join(', ')})`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.error = message;
      spinner.fail(`Failed to remove ${skill}: ${message}`);
    }

    results.push(result);
  }

  // Print summary if multiple skills
  if (skills.length > 1) {
    const totalRemoved = results.filter(r => r.removedFrom.length > 0).length;
    const totalFailed = results.filter(r => r.error || r.removedFrom.length === 0).length;

    console.log();
    if (totalRemoved > 0) {
      console.log(chalk.green(`Removed ${totalRemoved} skill(s)`));
    }
    if (totalFailed > 0) {
      console.log(chalk.yellow(`${totalFailed} skill(s) not found or failed`));
    }
  }

}
