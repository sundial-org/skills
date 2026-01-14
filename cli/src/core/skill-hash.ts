import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

/**
 * Get all files in a directory recursively, sorted for consistency.
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  // Sort for consistent ordering across platforms
  return files.sort();
}

/**
 * Compute a SHA-256 hash of all files in a skill folder.
 * This allows detecting if two skills with the same name have different content.
 *
 * The hash is computed by:
 * 1. Getting all files recursively
 * 2. Sorting them by path for consistency
 * 3. Hashing each file's relative path + content
 * 4. Combining into a final hash
 */
export async function computeContentHash(skillPath: string): Promise<string> {
  const files = await getAllFiles(skillPath);

  if (files.length === 0) {
    // Empty folder - return hash of empty string
    return crypto.createHash('sha256').update('').digest('hex').slice(0, 12);
  }

  const hash = crypto.createHash('sha256');

  for (const file of files) {
    // Include relative path in hash (so moving files changes the hash)
    const relativePath = path.relative(skillPath, file);
    hash.update(relativePath);

    // Include file content
    const content = await fs.readFile(file);
    hash.update(content);
  }

  // Return first 12 chars for readability
  return hash.digest('hex').slice(0, 12);
}
