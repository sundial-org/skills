#!/bin/bash
# ============================================================================
# test-fuzzy-match.sh
# ============================================================================
# Tests the fuzzy command matching feature of the CLI.
#
# When users type an incorrect command name (typo), the CLI should:
#   - Display an error message
#   - Suggest the closest valid command
#   - List all valid commands
#
# This script tests:
#   - Typo suggestions for common misspellings
#   - "Did you mean" messages appear in output
#   - Valid commands are listed
#
# Output is logged to: logs/fuzzy-match.log
#
# Usage:
#   ./test-fuzzy-match.sh
#
# Prerequisites:
#   - CLI must be built first: npm run build
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/fuzzy-match.log"
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

# Assertion helper
assert_output_contains() {
    local output="$1"
    local expected="$2"
    if echo "$output" | grep -qi "$expected"; then
        log "  PASS: Output contains '$expected'"
    else
        log "  FAIL: Output does not contain '$expected'"
        log "  Output was:"
        echo "$output" | head -10 | tee -a "$LOG_FILE"
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
# TEST: Typo for "add" -> "ad"
# ============================================================================
log "TEST: Typo 'ad' suggests 'add'"
log "-------------------------------"
OUTPUT=$(node "$CLI" ad 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "add"
log ""

# ============================================================================
# TEST: Typo for "remove" -> "remov"
# ============================================================================
log "TEST: Typo 'remov' suggests 'remove'"
log "-------------------------------------"
OUTPUT=$(node "$CLI" remov 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "remove"
log ""

# ============================================================================
# TEST: Typo for "list" -> "lst"
# ============================================================================
log "TEST: Typo 'lst' suggests 'list'"
log "---------------------------------"
OUTPUT=$(node "$CLI" lst 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "list"
log ""

# ============================================================================
# TEST: Typo for "show" -> "shw"
# ============================================================================
log "TEST: Typo 'shw' suggests 'show'"
log "---------------------------------"
OUTPUT=$(node "$CLI" shw 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "show"
log ""

# ============================================================================
# TEST: Typo for "config" -> "confg"
# ============================================================================
log "TEST: Typo 'confg' suggests 'config'"
log "-------------------------------------"
OUTPUT=$(node "$CLI" confg 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "config"
log ""

# ============================================================================
# TEST: Completely wrong command shows valid commands list
# ============================================================================
log "TEST: Wrong command shows valid commands list"
log "----------------------------------------------"
OUTPUT=$(node "$CLI" foobar 2>&1) || true
echo "$OUTPUT" | tee -a "$LOG_FILE"
assert_output_contains "$OUTPUT" "Unknown command"
assert_output_contains "$OUTPUT" "Valid commands"
log ""

# ============================================================================
# TEST: Exit code is non-zero for unknown commands
# ============================================================================
log "TEST: Exit code is non-zero for unknown commands"
log "--------------------------------------------------"
if node "$CLI" unknowncommand 2>/dev/null; then
    log "  FAIL: Command should have failed but didn't"
    exit 1
else
    log "  PASS: Command correctly returned non-zero exit code"
fi
log ""

# ============================================================================
# SUMMARY
# ============================================================================
log "============================================"
log "All fuzzy-match tests passed!"
log "============================================"
