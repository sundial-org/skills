import type { AgentConfig } from './types/index';

/** Available CLI commands */
export const COMMANDS = ['add', 'remove', 'list', 'show', 'config'] as const;

/** Supported AI agents */
export const AGENTS: AgentConfig[] = [
  { name: 'Claude Code', flag: 'claude', folderName: '.claude' },
  { name: 'Codex', flag: 'codex', folderName: '.codex' },
  { name: 'Gemini', flag: 'gemini', folderName: '.gemini' }
];

export const STORAGE_URL = 'https://vfbndmrgggrhnlrileqv.supabase.co/storage/v1/object/public/skill-zips';
