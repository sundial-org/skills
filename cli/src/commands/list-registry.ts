import chalk from 'chalk';
import { getSkillsFromRegistry } from '../utils/registry';

/**
 * List all available skills from the registry.
 */
export async function listRegistryCommand(): Promise<void> {
  const skills = await getSkillsFromRegistry();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills available in the Sundial library.'));
    console.log(chalk.gray('You can still add from GitHub URLs or local paths.'));
    console.log(chalk.gray('Example: sun add github.com/user/skill or sun add ./my-skill'));
    return;
  }

  const sorted = [...skills].sort((a, b) => a.name.localeCompare(b.name));

  console.log(chalk.cyan(`Available skills from the Sundial library (${sorted.length}):`));
  for (const skill of sorted) {
    const description = skill.description?.trim();
    const author = skill.author?.trim();
    const descriptionText = description ? ` - ${description}` : '';
    const authorText = author ? ` (by ${author})` : '';
    console.log(`  - ${skill.name}${chalk.gray(descriptionText + authorText)}`);
  }

  console.log();
  console.log(chalk.white('Install from the library with "sun add <skill>".'));
  console.log(chalk.white('You can also add from GitHub URLs or local paths.'));
}
