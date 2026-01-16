import { fetchSkillByName, fetchSkills, type Skill } from '../lib/supabase.js';

// Cache for skill lookups during a session
let skillsCache: Skill[] | null = null;

export async function getSkillsFromRegistry(): Promise<Skill[]> {
  if (!skillsCache) {
    skillsCache = await fetchSkills();
  }
  return skillsCache;
}

export async function isShortcut(skill: string): Promise<boolean> {
  const skills = await getSkillsFromRegistry();
  return skills.some(s => s.name === skill);
}

export async function getShortcutUrl(skill: string): Promise<string | undefined> {
  const skillData = await fetchSkillByName(skill);
  return skillData?.degit_path;
}

export async function listShortcuts(): Promise<string[]> {
  const skills = await getSkillsFromRegistry();
  return skills.map(s => s.name);
}
