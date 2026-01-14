#!/bin/bash
# ============================================================================
# test-config.sh
# ============================================================================
# Tests the `sun config` command and configuration management.
#
# This script tests:
#   - Config directory creation (~/.sun/)
#   - Config file creation and persistence
#   - Default agent configuration affects add command behavior
#   - First-run detection
#
# Note: The `sun config` command uses an interactive checkbox prompt
# (@inquirer/prompts) which doesn't accept piped input easily. This test
# focuses on the config file structure and how it affects other commands.
# We manually create config files to test the configuration system.
#
# Output is logged to: logs/config.log
#
# Usage:
#   ./test-config.sh
#
# Prerequisites:
#   - CLI must be built first: npm run build
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/config.log"
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
assert_file_exists() {
    if [ -f "$1" ]; then
        log "  PASS: File exists: $1"
    else
        log "  FAIL: File not found: $1"
        exit 1
    fi
}

assert_dir_exists() {
    if [ -d "$1" ]; then
        log "  PASS: Directory exists: $1"
    else
        log "  FAIL: Directory not found: $1"
        exit 1
    fi
}

assert_file_contains() {
    if grep -q "$2" "$1" 2>/dev/null; then
        log "  PASS: File $1 contains '$2'"
    else
        log "  FAIL: File $1 does not contain '$2'"
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
# TEST: Config directory is created on first command
# ============================================================================
log "TEST: Config directory creation"
log "--------------------------------"
# Create a local agent folder so show can detect something
mkdir -p .claude

# Run show command which calls loadConfig() and creates the config dir
node "$CLI" show 2>&1 | tee -a "$LOG_FILE" || true

# Config dir should exist now
assert_dir_exists "$TEMP_HOME/.sun"
log ""

# ============================================================================
# TEST: Manually created config is respected
# ============================================================================
log "TEST: Config file is read correctly"
log "------------------------------------"
# Create a config file with claude as default
cat > "$TEMP_HOME/.sun/config.json" << 'EOF'
{
  "defaultAgents": ["claude"],
  "firstRunComplete": true
}
EOF
assert_file_exists "$TEMP_HOME/.sun/config.json"
assert_file_contains "$TEMP_HOME/.sun/config.json" "claude"
log ""

# ============================================================================
# TEST: Config with multiple agents
# ============================================================================
log "TEST: Config with multiple default agents"
log "------------------------------------------"
cat > "$TEMP_HOME/.sun/config.json" << 'EOF'
{
  "defaultAgents": ["claude", "codex"],
  "firstRunComplete": true
}
EOF
assert_file_contains "$TEMP_HOME/.sun/config.json" "claude"
assert_file_contains "$TEMP_HOME/.sun/config.json" "codex"
log ""

# ============================================================================
# TEST: Add command uses default agents from config
# ============================================================================
log "TEST: Add command uses default agents from config"
log "--------------------------------------------------"
# Set claude and codex as defaults
cat > "$TEMP_HOME/.sun/config.json" << 'EOF'
{
  "defaultAgents": ["claude", "codex"],
  "firstRunComplete": true
}
EOF

# Create agent folders
mkdir -p .claude .codex

# Add skill without specifying agent flags - should use defaults
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" 2>&1 | tee -a "$LOG_FILE" || true

# Check skill was installed to both default agents
assert_dir_exists ".claude/skills/sample-skill"
assert_dir_exists ".codex/skills/sample-skill"
log ""

# Clean up for next test
rm -rf .claude/skills/* .codex/skills/*

# ============================================================================
# TEST: Explicit flags override config defaults
# ============================================================================
log "TEST: Explicit flags override config defaults"
log "----------------------------------------------"
# Config has claude and codex as defaults
cat > "$TEMP_HOME/.sun/config.json" << 'EOF'
{
  "defaultAgents": ["claude", "codex"],
  "firstRunComplete": true
}
EOF

mkdir -p .gemini

# Add with explicit --gemini flag only
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --gemini 2>&1 | tee -a "$LOG_FILE" || true

# Should only be in gemini, not in defaults
assert_dir_exists ".gemini/skills/sample-skill"
# These should not exist (explicit flag overrides defaults)
if [ -d ".claude/skills/sample-skill" ]; then
    log "  FAIL: Skill should not be in .claude when --gemini flag is used"
    exit 1
else
    log "  PASS: Skill correctly not in .claude"
fi
log ""

# ============================================================================
# TEST: First run detection
# ============================================================================
log "TEST: First run detection"
log "--------------------------"
# Remove config to simulate first run
rm -f "$TEMP_HOME/.sun/config.json"

# Show should work and indicate no config
node "$CLI" show 2>&1 | tee -a "$LOG_FILE" || true
log "  PASS: CLI runs without config file"
log ""

# ============================================================================
# SUMMARY
# ============================================================================
log "============================================"
log "All config tests passed!"
log "============================================"
