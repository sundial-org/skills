import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { SunConfig, AgentType } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.sun');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: SunConfig = {
  defaultAgents: [],
  firstRunComplete: false
};

export async function ensureConfigDir(): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
}

export async function loadConfig(): Promise<SunConfig> {
  try {
    await ensureConfigDir();
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    }
  } catch {
    // Config doesn't exist or is invalid, return default
  }
  return { ...DEFAULT_CONFIG };
}

export async function saveConfig(config: SunConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function isFirstRun(): Promise<boolean> {
  const config = await loadConfig();
  return !config.firstRunComplete;
}

export async function getDefaultAgents(): Promise<AgentType[]> {
  const config = await loadConfig();
  return config.defaultAgents;
}

export async function setDefaultAgents(agents: AgentType[]): Promise<void> {
  const config = await loadConfig();
  config.defaultAgents = agents;
  config.firstRunComplete = true;
  await saveConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
