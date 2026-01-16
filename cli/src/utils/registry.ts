import { fetchSkills, type Skill } from '../lib/supabase.js';

// Cache for skill lookups during a session
let skillsCache: Skill[] | null = null;

export async function getSkillsFromRegistry(): Promise<Skill[]> {
  if (!skillsCache) {
    skillsCache = await fetchSkills();
  }
  return skillsCache;
}

async function getSkillByName(name: string): Promise<Skill | undefined> {
  const skills = await getSkillsFromRegistry();
  return skills.find(skill => skill.name === name);
}

export async function isShortcut(skill: string): Promise<boolean> {
  return (await getSkillByName(skill)) !== undefined;
}

export async function getShortcutUrl(skill: string): Promise<string | undefined> {
  return (await getSkillByName(skill))?.degit_path;
}

export async function listShortcuts(): Promise<string[]> {
  const skills = await getSkillsFromRegistry();
  return skills.map(s => s.name);
}
