import chalk from 'chalk';
import { getSupportedAgentsMessage, SUPPORTED_AGENTS } from '../core/agents.js';
import { loadConfig, setDefaultAgents, getConfigPath } from '../core/config-manager.js';
import { promptAgentSelection } from '../utils/prompts.js';

/**
 * Re-open agent selection dialog and update config.
 */
export async function configCommand(): Promise<void> {
  const config = await loadConfig();

  console.log(chalk.cyan('Sundial CLI Configuration'));
  console.log(chalk.gray(`Config file: ${getConfigPath()}`));
  console.log();

  // Show current defaults
  if (config.defaultAgents.length > 0) {
    console.log('Current default agents:');
    for (const agentFlag of config.defaultAgents) {
      const agent = SUPPORTED_AGENTS.find(a => a.flag === agentFlag);
      if (agent) {
        console.log(`  - ${agent.name} ${chalk.gray(`(~/${agent.folderName}/ and ./${agent.folderName}/)`)}`);
      }
    }
    console.log();
  }

  console.log(chalk.gray(getSupportedAgentsMessage()));
  console.log();

  // Show agent type selection dialog
  const selectedAgents = await promptAgentSelection(config.defaultAgents);

  await setDefaultAgents(selectedAgents);

  console.log();
  console.log(chalk.green('Configuration saved!'));

  // Show new defaults
  console.log('New default agents:');
  for (const agentFlag of selectedAgents) {
    const agent = SUPPORTED_AGENTS.find(a => a.flag === agentFlag);
    if (agent) {
      console.log(`  - ${agent.name} ${chalk.gray(`(~/${agent.folderName}/ and ./${agent.folderName}/)`)}`);
    }
  }
}
