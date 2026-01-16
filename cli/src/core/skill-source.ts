import fs from 'fs-extra';
import path from 'path';
import { isShortcut, getShortcutUrl } from '../utils/registry.js';
import type { SkillSource } from '../types/index.js';
import { trackDownload } from '../lib/supabase.js';

/**
 * Check if input looks like a GitHub URL or reference.
 * Matches: github.com/user/repo, https://github.com/..., etc.
 */
export function isGithubUrl(input: string): boolean {
  return input.includes('github.com');
}

/**
 * Normalize a GitHub URL to degit format.
 * Converts: https://github.com/user/repo/tree/branch/path -> user/repo/path#branch
 */
function normalizeGithubUrl(url: string): string {
  let location = url;

  // Remove https:// or http:// prefix if present
  location = location.replace(/^https?:\/\//, '');

  // Handle github.com/user/repo/tree/branch/path format
  // Convert to degit format: user/repo/path#branch
  const treeMatch = location.match(/^github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/);
  if (treeMatch) {
    const [, user, repo, branch, subpath] = treeMatch;
    location = `${user}/${repo}/${subpath}#${branch}`;
  } else {
    // Simple format: github.com/user/repo -> user/repo
    location = location.replace(/^github\.com\//, '');
  }

  return location;
}

/**
 * Check if input looks like a local file path.
 * Matches: ./path, ../path, ~/path, /absolute/path
 */
export function isLocalPath(input: string): boolean {
  // Check if it starts with path indicators
  if (input.startsWith('./') ||
      input.startsWith('../') ||
      input.startsWith('~/') ||
      input.startsWith('/')) {
    return true;
  }

  // Check if it's an existing path on disk
  const resolved = path.resolve(input);
  return fs.pathExistsSync(resolved);
}

/**
 * Resolve a skill input to its source type and location.
 *
 * Resolution order:
 * 1. Check if it's a registered shortcut (e.g., "tinker")
 * 2. Check if it contains "github.com" (treat as GitHub URL)
 * 3. Check if it's a valid local path
 * 4. Otherwise, throw error
 */
export async function resolveSkillSource(input: string): Promise<SkillSource> {
  // 1. Check shortcuts first
  if (await isShortcut(input)) {
    const degitPath = await getShortcutUrl(input);
    if (!degitPath) {
      throw new Error(`Skill "${input}" found in registry but has no degit_path`);
    }
    // Track download for registry skills
    await trackDownload(input);
    return {
      type: 'shortcut',
      location: degitPath,
      originalInput: input
    };
  }

  // 2. Check if it's a GitHub URL
  if (isGithubUrl(input)) {
    return {
      type: 'github',
      location: normalizeGithubUrl(input),
      originalInput: input
    };
  }

  // 3. Check if it's a local path
  if (isLocalPath(input)) {
    // Resolve to absolute path, handling ~
    let location = input;
    if (location.startsWith('~/')) {
      location = path.join(process.env.HOME || '', location.slice(2));
    }
    location = path.resolve(location);

    return {
      type: 'local',
      location,
      originalInput: input
    };
  }

  // 4. Not found
  throw new Error(`Skill not found: "${input}". Expected a shortcut name, GitHub URL, or local path.`);
}

/**
 * Extract skill name from a source.
 * For GitHub: last path segment
 * For local: folder name
 * For shortcut: the shortcut name itself
 */
export function getSkillNameFromSource(source: SkillSource): string {
  if (source.type === 'shortcut') {
    return source.originalInput;
  }

  if (source.type === 'local') {
    return path.basename(source.location);
  }

  // GitHub: extract from path (e.g., "user/repo/skills/tinker#main" -> "tinker")
  const parts = source.location.split('/');
  const lastPart = parts[parts.length - 1];
  // Remove branch suffix if present (e.g., "tinker#main" -> "tinker")
  return lastPart.split('#')[0];
}
