import fuzzysort from 'fuzzysort';

const VALID_COMMANDS = ['add', 'remove', 'list', 'show', 'config'];

export interface FuzzyMatch {
  command: string;
  score: number;
}

/**
 * Find the closest matching command using fuzzy search.
 * fuzzysort scores: 0 = perfect match, negative = worse match
 */
export function findClosestCommand(input: string): FuzzyMatch | null {
  const results = fuzzysort.go(input, VALID_COMMANDS, {
    // Allow any match (we'll filter by score later)
    threshold: -Infinity
  });

  if (results.length === 0) {
    return null;
  }

  const best = results[0];
  return {
    command: best.target,
    score: best.score
  };
}

/**
 * Suggest a command if the input is close enough to a valid command.
 * Returns null if no good suggestion (avoids suggesting "add" for "xyz").
 */
export function suggestCommand(input: string): string | null {
  const match = findClosestCommand(input);

  // Only suggest if score is reasonable (0=perfect, -100 is still decent for typos)
  // Examples: "ad" -> "add" (good), "addd" -> "add" (good), "xyz" -> null (no suggestion)
  if (match && match.score > -100) {
    return match.command;
  }
  return null;
}

export function getValidCommands(): string[] {
  return [...VALID_COMMANDS];
}
