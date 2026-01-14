#!/bin/bash
# ============================================================================
# run-all.sh
# ============================================================================
# Master test runner for the Sundial CLI integration tests.
#
# This script runs all test scripts in sequence and reports results.
# Each test script logs output to the logs/ directory.
#
# Usage:
#   ./run-all.sh
#
# Prerequisites:
#   - CLI must be built first: npm run build
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_DIR="$SCRIPT_DIR/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "Sundial CLI Integration Tests"
echo "============================================"
echo ""

# Ensure logs directory exists
mkdir -p "$SCRIPT_DIR/logs"

# Check if CLI is built
if [ ! -f "$CLI_DIR/dist/index.js" ]; then
    echo -e "${YELLOW}CLI not built. Running npm run build...${NC}"
    cd "$CLI_DIR"
    npm run build
    cd "$SCRIPT_DIR"
    echo ""
fi

# Track failures
FAILED=0
PASSED=0
TESTS=("test-add-remove.sh" "test-config.sh" "test-show.sh" "test-fuzzy-match.sh")

for TEST in "${TESTS[@]}"; do
    echo "Running $TEST..."

    if "$SCRIPT_DIR/$TEST"; then
        echo -e "${GREEN}✓ $TEST passed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $TEST failed${NC}"
        ((FAILED++))
    fi
    echo ""
done

# Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""
echo "Logs are in: $SCRIPT_DIR/logs/"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
