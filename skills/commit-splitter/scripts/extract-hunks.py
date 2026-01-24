#!/usr/bin/env python3
"""
Extract specific hunks from a git patch file.

Usage:
    extract-hunks.py <patch_file> <hunk_numbers>
    extract-hunks.py <patch_file> --list

Examples:
    extract-hunks.py full.patch 1,3,5      # Extract hunks 1, 3, and 5
    extract-hunks.py full.patch 2-4        # Extract hunks 2, 3, and 4
    extract-hunks.py full.patch 1,3-5,7    # Mixed: 1, 3, 4, 5, and 7
    extract-hunks.py full.patch --list     # List all hunks with summaries
"""

import sys


def parse_patch(patch_content):
    """Parse a patch file into header and hunks."""
    lines = patch_content.split('\n')

    header_lines = []
    hunks = []
    current_hunk = []
    in_header = True

    for line in lines:
        if line.startswith('@@'):
            in_header = False
            if current_hunk:
                hunks.append('\n'.join(current_hunk))
            current_hunk = [line]
        elif in_header:
            header_lines.append(line)
        else:
            current_hunk.append(line)

    if current_hunk:
        hunks.append('\n'.join(current_hunk))

    header = '\n'.join(header_lines)
    return header, hunks


def parse_hunk_spec(spec, max_hunk):
    """Parse hunk specification like '1,3-5,7' into a set of integers."""
    result = set()
    parts = spec.split(',')

    for part in parts:
        part = part.strip()
        if '-' in part:
            start, end = part.split('-', 1)
            start = int(start)
            end = int(end)
            result.update(range(start, end + 1))
        else:
            result.add(int(part))

    # Validate
    for n in result:
        if n < 1 or n > max_hunk:
            print(f"Error: Hunk {n} out of range (1-{max_hunk})", file=sys.stderr)
            sys.exit(1)

    return sorted(result)


def summarize_hunk(hunk):
    """Get a one-line summary of a hunk."""
    lines = hunk.split('\n')
    header = lines[0] if lines else ''

    # Count additions and deletions
    additions = sum(1 for ln in lines[1:] if ln.startswith('+'))
    deletions = sum(1 for ln in lines[1:] if ln.startswith('-'))

    # Get first meaningful change
    first_change = ''
    for line in lines[1:]:
        if line.startswith('+') or line.startswith('-'):
            first_change = line[1:].strip()[:50]
            break

    return f"{header}  (+{additions}/-{deletions}) {first_change}..."


def list_hunks(header, hunks):
    """Print a numbered list of hunks."""
    print("File:", file=sys.stderr)
    for line in header.split('\n'):
        if line.startswith('---') or line.startswith('+++'):
            print(f"  {line}", file=sys.stderr)
    print(file=sys.stderr)

    print(f"Hunks ({len(hunks)} total):", file=sys.stderr)
    for i, hunk in enumerate(hunks, 1):
        summary = summarize_hunk(hunk)
        print(f"  {i}: {summary}", file=sys.stderr)


def main():
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    patch_file = sys.argv[1]
    spec = sys.argv[2]

    try:
        with open(patch_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {patch_file}", file=sys.stderr)
        sys.exit(1)

    header, hunks = parse_patch(content)

    if not hunks:
        print("Error: No hunks found in patch", file=sys.stderr)
        sys.exit(1)

    if spec == '--list':
        list_hunks(header, hunks)
        return

    selected = parse_hunk_spec(spec, len(hunks))

    # Output the filtered patch
    print(header)
    for n in selected:
        print(hunks[n - 1])


if __name__ == '__main__':
    main()
