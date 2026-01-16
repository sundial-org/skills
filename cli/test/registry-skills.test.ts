/**
 * Registry Skills Integration Test
 * Tests that all skills in the registry can be installed and have valid SKILL.md files
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'src', 'index.ts');
const TEST_DIR = path.join(os.tmpdir(), `sun-test-${Date.now()}`);
const CLAUDE_SKILLS_DIR = path.join(TEST_DIR, '.claude', 'skills');

interface TestResult {
  skill: string;
  passed: boolean;
  error?: string;
}

async function fetchSkills(): Promise<{ name: string; display_name: string }[]> {
  const res = await fetch('https://vfbndmrgggrhnlrileqv.supabase.co/functions/v1/skills/list');
  return res.json();
}

function runCli(args: string): string {
  try {
    return execSync(`npx tsx ${CLI_PATH} ${args}`, {
      cwd: TEST_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    const err = error as Error & { stdout?: string; stderr?: string };
    throw new Error(err.stderr || err.stdout || err.message);
  }
}

function validateSkillMd(skillDir: string): { valid: boolean; error?: string } {
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    return { valid: false, error: 'SKILL.md not found' };
  }

  const content = fs.readFileSync(skillMdPath, 'utf-8');

  // Check for frontmatter
  if (!content.startsWith('---')) {
    return { valid: false, error: 'SKILL.md missing frontmatter (should start with ---)' };
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { valid: false, error: 'SKILL.md has invalid frontmatter format' };
  }

  const frontmatter = frontmatterMatch[1];

  // Check for required fields
  if (!frontmatter.includes('name:')) {
    return { valid: false, error: 'SKILL.md missing "name" in frontmatter' };
  }
  if (!frontmatter.includes('description:')) {
    return { valid: false, error: 'SKILL.md missing "description" in frontmatter' };
  }

  return { valid: true };
}

async function testSkill(skillName: string): Promise<TestResult> {
  const skillDir = path.join(CLAUDE_SKILLS_DIR, skillName);

  try {
    // Clean up if exists from previous run
    if (fs.existsSync(skillDir)) {
      fs.removeSync(skillDir);
    }

    // Install the skill
    console.log(`  Installing ${skillName}...`);
    runCli(`add ${skillName} --claude`);

    // Check skill directory exists
    if (!fs.existsSync(skillDir)) {
      // Some skills have different names in frontmatter vs registry
      // Check if any skill was installed
      const installedSkills = fs.existsSync(CLAUDE_SKILLS_DIR)
        ? fs.readdirSync(CLAUDE_SKILLS_DIR)
        : [];

      if (installedSkills.length === 0) {
        return { skill: skillName, passed: false, error: 'No skill directory created' };
      }

      // Use the first installed skill (handles name mismatches)
      const actualSkillDir = path.join(CLAUDE_SKILLS_DIR, installedSkills[0]);
      const validation = validateSkillMd(actualSkillDir);

      if (!validation.valid) {
        return { skill: skillName, passed: false, error: validation.error };
      }

      // Clean up
      fs.removeSync(actualSkillDir);
      return { skill: skillName, passed: true };
    }

    // Validate SKILL.md
    const validation = validateSkillMd(skillDir);
    if (!validation.valid) {
      return { skill: skillName, passed: false, error: validation.error };
    }

    // Clean up
    fs.removeSync(skillDir);

    return { skill: skillName, passed: true };
  } catch (error) {
    return {
      skill: skillName,
      passed: false,
      error: (error as Error).message.slice(0, 200)
    };
  }
}

async function main() {
  console.log('🧪 Registry Skills Integration Test\n');

  // Setup test directory
  fs.ensureDirSync(TEST_DIR);
  fs.ensureDirSync(path.join(TEST_DIR, '.claude'));
  console.log(`Test directory: ${TEST_DIR}\n`);

  // Fetch all skills from registry
  console.log('Fetching skills from registry...');
  const skills = await fetchSkills();
  console.log(`Found ${skills.length} skills\n`);

  const results: TestResult[] = [];

  for (const skill of skills) {
    console.log(`\n[${results.length + 1}/${skills.length}] Testing: ${skill.display_name}`);
    const result = await testSkill(skill.name);
    results.push(result);

    if (result.passed) {
      console.log(`  ✅ Passed`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY\n');

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  console.log(`✅ Passed: ${passed.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log('\nFailed skills:');
    for (const f of failed) {
      console.log(`  - ${f.skill}: ${f.error}`);
    }
  }

  // Cleanup
  fs.removeSync(TEST_DIR);
  console.log(`\nCleaned up test directory`);

  // Exit with error code if any failed
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(console.error);
