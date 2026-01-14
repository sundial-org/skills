/** Skill shortcuts registry - maps short names to GitHub URLs */
export const SKILL_SHORTCUTS: Record<string, string> = {
  tinker: 'https://github.com/sundial-org/skills/tree/main/skills/tinker'
};

export function isShortcut(skill: string): boolean {
  return skill in SKILL_SHORTCUTS;
}

export function getShortcutUrl(skill: string): string | undefined {
  return SKILL_SHORTCUTS[skill];
}

export function listShortcuts(): string[] {
  return Object.keys(SKILL_SHORTCUTS);
}
