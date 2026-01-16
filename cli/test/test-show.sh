#!/bin/bash
# ============================================================================
# test-show.sh
# ============================================================================
# Tests the `sun show` command.
#
# This script tests:
#   - `sun show` (no args) - shows all agent folders and installed skills
#   - `sun show <skill-name>` - shows details about a specific skill
#   - Output contains expected skill names and descriptions
#   - Detecting skills in multiple locations (local vs global)
#
# Output is logged to: logs/show.log
#
# Usage:
#   ./test-show.sh
#
# Prerequisites:
#   - CLI must be built first: npm run build
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/show.log"
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
assert_output_contains() {
    local output="$1"
    local expected="$2"
    if echo "$output" | grep -q "$expected"; then
        log "  PASS: Output contains '$expected'"
    else
        log "  FAIL: Output does not contain '$expected'"
        log "  Output was:"
        echo "$output" | head -20 | tee -a "$LOG_FILE"
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

# Start fresh log
mkdir -p "$SCRIPT_DIR/logs"
echo "=== Test run: $(date) ===" > "$LOG_FILE"
log "TEMP_DIR: $TEMP_DIR"
log "TEMP_HOME: $TEMP_HOME"
log ""

# Setup: Create config so we don't trigger first-run prompts
mkdir -p "$TEMP_HOME/.sun"
cat > "$TEMP_HOME/.sun/config.json" << 'EOF'
{
  "defaultAgents": ["claude"],
  "firstRunComplete": true
}
EOF

# ============================================================================
# TEST: Show with no agent folders
# ============================================================================
log "TEST: Show with no agent folders"
log "---------------------------------"
OUTPUT=$(node "$CLI" show 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "No agent folders found"
log ""

# ============================================================================
# TEST: Show with empty agent folder
# ============================================================================
log "TEST: Show with empty agent folder"
log "-----------------------------------"
mkdir -p .claude
OUTPUT=$(node "$CLI" show 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Claude"
assert_output_contains "$OUTPUT" "No skills installed"
log ""

# ============================================================================
# TEST: Show with installed skill
# ============================================================================
log "TEST: Show with installed skill"
log "--------------------------------"
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude 2>&1 | tee -a "$LOG_FILE" || true
OUTPUT=$(node "$CLI" show 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "sample-skill"
assert_output_contains "$OUTPUT" "A sample skill for testing"
log ""

# ============================================================================
# TEST: Show specific skill details
# ============================================================================
log "TEST: Show specific skill details"
log "----------------------------------"
OUTPUT=$(node "$CLI" show sample-skill 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "sample-skill"
assert_output_contains "$OUTPUT" "Description"
assert_output_contains "$OUTPUT" "Installed in"
log ""

# ============================================================================
# TEST: Show skill in multiple locations
# ============================================================================
log "TEST: Show skill in multiple locations"
log "---------------------------------------"
# Add to global as well
mkdir -p "$TEMP_HOME/.claude"
node "$CLI" add "$SCRIPT_DIR/fixtures/sample-skill" --claude --global 2>&1 | tee -a "$LOG_FILE" || true

OUTPUT=$(node "$CLI" show sample-skill 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "local"
assert_output_contains "$OUTPUT" "global"
log ""

# ============================================================================
# TEST: Show multiple agents with skills
# ============================================================================
log "TEST: Show multiple agents with skills"
log "---------------------------------------"
mkdir -p .codex
node "$CLI" add "$SCRIPT_DIR/fixtures/multi-skills/skill-one" --codex 2>&1 | tee -a "$LOG_FILE" || true

OUTPUT=$(node "$CLI" show 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Claude"
assert_output_contains "$OUTPUT" "Codex"
assert_output_contains "$OUTPUT" "sample-skill"
assert_output_contains "$OUTPUT" "skill-one"
log ""

# ============================================================================
# TEST: Show non-existent skill
# ============================================================================
log "TEST: Show non-existent skill"
log "------------------------------"
OUTPUT=$(node "$CLI" show non-existent-skill 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "not installed"
log ""

# ============================================================================
# SUMMARY
# ============================================================================
log "============================================"
log "All show tests passed!"
log "============================================"
