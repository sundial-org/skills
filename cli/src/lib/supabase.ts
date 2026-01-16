const API_URL = 'https://vfbndmrgggrhnlrileqv.supabase.co/functions/v1/skills';

export interface Skill {
  name: string;
  display_name: string;
  description: string;
  category: string;
  author: string;
  github_url: string | null;
  degit_path: string;
  zip_path: string | null;
  download_count: number;
}

export async function fetchSkills(): Promise<Skill[]> {
  const res = await fetch(`${API_URL}/list`);
  if (!res.ok) throw new Error(`Failed to fetch skills: ${res.statusText}`);
  return res.json() as Promise<Skill[]>;
}

export async function fetchSkillByName(name: string): Promise<Skill | null> {
  const res = await fetch(`${API_URL}/get?name=${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch skill: ${res.statusText}`);
  return res.json() as Promise<Skill>;
}

export async function trackDownload(skillName: string): Promise<void> {
  try {
    await fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_name: skillName }),
    });
  } catch {
    // Silently fail - don't block installation if tracking fails
  }
}
