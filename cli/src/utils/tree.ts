import fs from 'fs-extra';
import path from 'path';

const DEFAULT_IGNORES = new Set(['.git', '.DS_Store']);

function sortEntries(entries: fs.Dirent[]): fs.Dirent[] {
  return entries.slice().sort((a, b) => {
    const aIsDir = a.isDirectory();
    const bIsDir = b.isDirectory();
    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

async function walkTree(
  dir: string,
  prefix: string,
  depth: number,
  maxDepth?: number
): Promise<string[]> {
  if (maxDepth !== undefined && depth > maxDepth) {
    return [];
  }

  let entries: fs.Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const visibleEntries = sortEntries(entries).filter(entry => !DEFAULT_IGNORES.has(entry.name));
  const lines: string[] = [];

  for (let i = 0; i < visibleEntries.length; i++) {
    const entry = visibleEntries[i];
    const isLast = i === visibleEntries.length - 1;
    const connector = isLast ? '\\-- ' : '|-- ';
    const line = `${prefix}${connector}${entry.name}`;
    lines.push(line);

    if (entry.isDirectory()) {
      const nextPrefix = `${prefix}${isLast ? '    ' : '|   '}`;
      const childLines = await walkTree(path.join(dir, entry.name), nextPrefix, depth + 1, maxDepth);
      lines.push(...childLines);
    }
  }

  return lines;
}

export async function formatDirectoryTree(rootPath: string, maxDepth?: number): Promise<string> {
  const rootName = path.basename(rootPath);
  const lines = [rootName];
  const childLines = await walkTree(rootPath, '', 1, maxDepth);
  lines.push(...childLines);
  return lines.join('\n');
}

export function indentLines(text: string, indent: string): string {
  return text
    .split('\n')
    .map(line => `${indent}${line}`)
    .join('\n');
}
