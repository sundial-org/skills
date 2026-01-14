#!/bin/bash
# ============================================================================
# test-add-remove.sh
# ============================================================================
# Tests the `sun add` and `sun remove` commands.
#
# This script tests:
#   - Adding skills from local folders (single skill)
#   - Adding skills from parent directories (finds all SKILL.md files)
#   - Adding skills from git repositories
#   - Adding skills via registry shortcuts
#   - Local vs global installation (--global flag)
#   - Multi-agent installation (--claude --codex --gemini flags)
#   - Removing skills from single and multiple agents
#
# Output is logged to: logs/add-remove.log
#
# Usage:
#   ./test-add-remove.sh
#
# Prerequisites:
#   - CLI must be built first: npm run build
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/add-remove.log"
CLI="$SCRIPT_DIR/../dist/index.js"

# Setup temp environment
TEMP_DIR=$(mktemp -d)
TEMP_HOME=$(mktemp -d)
ORIGINAL_HOME="$HOME"
export HOME="$TEMP_HOME"
cd "$TEMP_DIR"

# Cleanup function
cleanup() {
    cd /
    rm -rf "$TEMP_DIR" "$TEMP_HOME"
    export HOME="$ORIGINAL_HOME"
}
trap cleanup EXIT

# Logging function
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# Assertion helpers
assert_dir_exists() {
    if [ -d "$1" ]; then
        log "  PASS: Directory exists: $1"
    else
        log "  FAIL: Directory not found: $1"
        exit 1
    fi
}

assert_dir_not_exists() {
    if [ ! -d "$1" ]; then
        log "  PASS: Directory does not exist: $1"
    else
        log "  FAIL: Directory should not exist: $1"
        exit 1
    fi
}

assert_file_exists() {
    if [ -f "$1" ]; then
        log "  PASS: File exists: $1"
    else
        log "  FAIL: File not found: $1"
        exit 1
    fi
}

# Start fresh log
mkdir -p "$SCRIPT_DIR/logs"
echo "=== Test run: $(date) ===" > "$LOG_FILE"
log "TEMP_DIR: $TEMP_DIR"
log "TEMP_HOME: $TEMP_HOME"
log ""

# ============================================================================
# TEST: Add single skill from local folder
# ============================================================================
log "TEST: Add single skill from local folder"
log "----------------------------------------"
mkdir -p .claude
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/sample-skill"
assert_file_exists ".claude/skills/sample-skill/SKILL.md"
log ""

# Clean up for next test
rm -rf .claude/skills/*

# ============================================================================
# TEST: Add multiple skills from parent directory
# ============================================================================
log "TEST: Add multiple skills from parent directory"
log "------------------------------------------------"
node "$CLI" add "$SCRIPT_DIR/fixtures/multi-skills" --claude 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/skill-one"
assert_dir_exists ".claude/skills/skill-two"
assert_file_exists ".claude/skills/skill-one/SKILL.md"
assert_file_exists ".claude/skills/skill-two/SKILL.md"
log ""

# Clean up for next test
rm -rf .claude/skills/*

# ============================================================================
# TEST: Add skill from git repository
# ============================================================================
log "TEST: Add skill from git repository"
log "------------------------------------"
# Use a known public repo with skills (sundial-org/skills)
node "$CLI" add "github:sundial-org/skills" --claude 2>&1 | tee -a "$LOG_FILE" || {
    log "  (Git test may fail if network unavailable - continuing)"
}
# Check if any skills were installed
if ls .claude/skills/*/ > /dev/null 2>&1; then
    log "  PASS: Skills installed from git repo"
else
    log "  SKIP: No skills installed (may need network)"
fi
log ""

# Clean up for next test
rm -rf .claude/skills/*

# ============================================================================
# TEST: Add skill via shortcut (registry)
# ============================================================================
log "TEST: Add skill via shortcut (registry)"
log "----------------------------------------"
# Try to add a skill by shortcut name
node "$CLI" add "tinker-from-docs" --claude 2>&1 | tee -a "$LOG_FILE" || {
    log "  (Shortcut test may fail if registry not configured - continuing)"
}
if [ -d ".claude/skills/tinker-from-docs" ]; then
    log "  PASS: Skill installed via shortcut"
else
    log "  SKIP: Shortcut not available in registry"
fi
log ""

# Clean up for next test
rm -rf .claude/skills/*

# ============================================================================
# TEST: Local vs Global installation
# ============================================================================
log "TEST: Local vs Global installation"
log "-----------------------------------"

# Add skill locally (to .claude in current directory)
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/sample-skill"
log "  Local installation verified"

# Add skill globally (to ~/.claude)
mkdir -p "$TEMP_HOME/.claude"
node "$CLI" add "$SCRIPT_DIR/fixtures/multi-skills/skill-one" --claude --global 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists "$TEMP_HOME/.claude/skills/skill-one"
log "  Global installation verified"

# Verify local and global are separate
assert_dir_exists ".claude/skills/sample-skill"
assert_dir_not_exists ".claude/skills/skill-one"
assert_dir_exists "$TEMP_HOME/.claude/skills/skill-one"
assert_dir_not_exists "$TEMP_HOME/.claude/skills/sample-skill"
log ""

# Clean up for next test
rm -rf .claude/skills/* "$TEMP_HOME/.claude/skills"/*

# ============================================================================
# TEST: Multi-agent installation (--claude --codex)
# ============================================================================
log "TEST: Multi-agent installation (--claude --codex)"
log "--------------------------------------------------"
mkdir -p .codex
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude --codex 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/sample-skill"
assert_dir_exists ".codex/skills/sample-skill"
log ""

# Clean up for next test
rm -rf .claude/skills/* .codex/skills/*

# ============================================================================
# TEST: Single agent flag (--gemini only)
# ============================================================================
log "TEST: Single agent flag (--gemini only)"
log "----------------------------------------"
mkdir -p .gemini
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --gemini 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".gemini/skills/sample-skill"
assert_dir_not_exists ".claude/skills/sample-skill"
assert_dir_not_exists ".codex/skills/sample-skill"
log ""

# Clean up for next test
rm -rf .gemini/skills/*

# ============================================================================
# TEST: Remove skill from single agent
# ============================================================================
log "TEST: Remove skill from single agent"
log "-------------------------------------"
# First add it
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/sample-skill"

# Now remove it
node "$CLI" remove sample-skill --claude 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_not_exists ".claude/skills/sample-skill"
log ""

# ============================================================================
# TEST: Remove skill from multiple agents
# ============================================================================
log "TEST: Remove skill from multiple agents"
log "----------------------------------------"
# Add to multiple agents
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude --codex 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_exists ".claude/skills/sample-skill"
assert_dir_exists ".codex/skills/sample-skill"

# Remove from both
node "$CLI" remove sample-skill --claude --codex 2>&1 | tee -a "$LOG_FILE" || true
assert_dir_not_exists ".claude/skills/sample-skill"
assert_dir_not_exists ".codex/skills/sample-skill"
log ""

# ============================================================================
# SUMMARY
# ============================================================================
log "============================================"
log "All add-remove tests passed!"
log "============================================"
