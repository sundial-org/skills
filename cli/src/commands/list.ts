import chalk from 'chalk';
import { SUPPORTED_AGENTS, getSupportedAgentsMessage } from '../core/agents';
import { listSkillsForAgent } from '../core/skill-info';

interface AgentSkills {
  agentName: string;
  folderName: string;
  isGlobal: boolean;
  skills: string[];
}

/**
 * List all installed skills for each agent.
 */
export async function listCommand(): Promise<void> {
  const allAgentSkills: AgentSkills[] = [];

  // Check both local and global for each agent
  for (const agent of SUPPORTED_AGENTS) {
    // Local
    const localSkills = await listSkillsForAgent(agent.folderName, false);
    if (localSkills.length > 0) {
      allAgentSkills.push({
        agentName: agent.name,
        folderName: agent.folderName,
        isGlobal: false,
        skills: localSkills
      });
    }

    // Global
    const globalSkills = await listSkillsForAgent(agent.folderName, true);
    if (globalSkills.length > 0) {
      allAgentSkills.push({
        agentName: agent.name,
        folderName: agent.folderName,
        isGlobal: true,
        skills: globalSkills
      });
    }
  }

  if (allAgentSkills.length === 0) {
    console.log(chalk.yellow('No skills installed.'));
    console.log();
    console.log(chalk.gray(getSupportedAgentsMessage()));
    console.log(chalk.gray('Browse curated skills with "sun list"'));
    console.log(chalk.gray('You can add from the library, GitHub URLs, or local paths with "sun add <skill>"'));
    return;
  }

  // Print skills grouped by agent
  for (const agentSkills of allAgentSkills) {
    const location = agentSkills.isGlobal
      ? `global ~/${agentSkills.folderName}/`
      : `${agentSkills.folderName}/`;

    console.log(chalk.cyan(`${agentSkills.agentName} (${location}):`));

    for (const skill of agentSkills.skills) {
      console.log(`  - ${skill}`);
    }

    console.log();
  }

  console.log(chalk.gray(getSupportedAgentsMessage()));
  console.log(chalk.gray('Browse curated skills with "sun list"'));
  console.log(chalk.gray('Add from the library, GitHub URLs, or local paths with "sun add <skill>"'));
  console.log(chalk.gray('Remove with "sun remove <skill>"'));
}
