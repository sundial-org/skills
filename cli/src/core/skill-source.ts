import fs from 'fs-extra';
import path from 'path';
import { isShortcut, getShortcutUrl } from '../utils/registry';
import type { SkillSource } from '../types/index';

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
  let location = url.trim();

  // Remove git+ prefix (e.g. git+https://...)
  location = location.replace(/^git\+/, '');

  // Ensure URL parsing works even if scheme is missing
  const urlString = /^[a-z]+:\/\//i.test(location) ? location : `https://${location}`;

  let pathname = '';
  try {
    const parsed = new URL(urlString);
    pathname = parsed.pathname;
  } catch {
    pathname = urlString.replace(/^https?:\/\//, '');
  }

  // Normalize path segments and strip github.com if present
  pathname = pathname.replace(/^\/+/, '');
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'github.com') {
    parts.shift();
  }

  if (parts.length < 2) {
    return pathname;
  }

  const user = parts[0];
  const repo = parts[1].replace(/\.git$/, '');

  const kind = parts[2];
  if (kind === 'tree' || kind === 'blob' || kind === 'raw') {
    const branch = parts[3] || '';
    let subpath = parts.slice(4).join('/');

    // blob/raw URLs point to a file; drop the filename so we pull its directory
    if (kind !== 'tree' && subpath) {
      const subparts = subpath.split('/');
      subparts.pop();
      subpath = subparts.join('/');
    }

    if (branch) {
      return subpath ? `${user}/${repo}/${subpath}#${branch}` : `${user}/${repo}#${branch}`;
    }
  }

  const extraPath = parts.slice(2).join('/');
  return extraPath ? `${user}/${repo}/${extraPath}` : `${user}/${repo}`;
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
