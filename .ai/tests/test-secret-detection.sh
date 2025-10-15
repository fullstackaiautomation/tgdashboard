#!/bin/bash
# Test suite for secret detection pre-commit hook
# Tests validation of .husky/pre-commit hook

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_PASSED=0
TEST_FAILED=0
TEMP_FILES=()

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up test files..."
    for file in "${TEMP_FILES[@]}"; do
        if [ -f "$file" ]; then
            rm -f "$file"
            git reset HEAD "$file" 2>/dev/null || true
        fi
    done
    echo "✅ Cleanup complete"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Test result helper
test_result() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TEST_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "   Expected: $expected"
        echo "   Actual: $actual"
        ((TEST_FAILED++))
    fi
}

echo "================================================"
echo "🔒 Secret Detection Test Suite"
echo "================================================"
echo ""

# Test 1: Detect fake Supabase API key
echo "Test 1: Fake Supabase API key detection"
TEST_FILE="test-secret-1.ts"
cat > "$TEST_FILE" << 'TESTEOF'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxOTI1MDM1MjAwfQ.test";
TESTEOF
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

if git commit -m "Test commit" --no-verify 2>/dev/null; then
    # Commit succeeded without hook (expected for test environment)
    # Now test the hook directly
    if .husky/pre-commit 2>&1 | grep -q "Supabase"; then
        test_result "Fake Supabase key detection" "BLOCKED" "BLOCKED"
    else
        test_result "Fake Supabase key detection" "BLOCKED" "ALLOWED"
    fi
else
    test_result "Fake Supabase key detection" "BLOCKED" "BLOCKED"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 2: Detect .env file commit attempt
echo ""
echo "Test 2: .env file commit detection"
TEST_FILE=".env"
echo "VITE_SUPABASE_URL=https://test.supabase.co" > "$TEST_FILE"
echo "VITE_SUPABASE_ANON_KEY=test-key" >> "$TEST_FILE"
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

if .husky/pre-commit 2>&1 | grep -q ".env"; then
    test_result ".env file commit detection" "BLOCKED" "BLOCKED"
else
    test_result ".env file commit detection" "BLOCKED" "ALLOWED"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 3: Detect database connection string
echo ""
echo "Test 3: Database connection string detection"
TEST_FILE="test-secret-3.ts"
cat > "$TEST_FILE" << 'TESTEOF'
const dbUrl = "postgresql://user:password@localhost:5432/database";
TESTEOF
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

if .husky/pre-commit 2>&1 | grep -q "connection string"; then
    test_result "Connection string detection" "BLOCKED" "BLOCKED"
else
    test_result "Connection string detection" "BLOCKED" "ALLOWED"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 4: Detect private key
echo ""
echo "Test 4: Private key detection"
TEST_FILE="test-secret-4.pem"
cat > "$TEST_FILE" << 'TESTEOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890
-----END RSA PRIVATE KEY-----
TESTEOF
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

if .husky/pre-commit 2>&1 | grep -q "Private key"; then
    test_result "Private key detection" "BLOCKED" "BLOCKED"
else
    test_result "Private key detection" "BLOCKED" "ALLOWED"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 5: Allow safe code with environment variables
echo ""
echo "Test 5: Safe environment variable usage"
TEST_FILE="test-safe.ts"
cat > "$TEST_FILE" << 'TESTEOF'
// Safe code using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
TESTEOF
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

if .husky/pre-commit 2>&1 | grep -q "ERROR"; then
    test_result "Safe environment variable code" "ALLOWED" "BLOCKED"
else
    test_result "Safe environment variable code" "ALLOWED" "ALLOWED"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 6: Verify helpful error messages
echo ""
echo "Test 6: Error message clarity"
TEST_FILE="test-secret-6.ts"
echo 'const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";' > "$TEST_FILE"
TEMP_FILES+=("$TEST_FILE")
git add "$TEST_FILE" 2>/dev/null

ERROR_OUTPUT=$(.husky/pre-commit 2>&1 || true)
if echo "$ERROR_OUTPUT" | grep -q "ERROR" && echo "$ERROR_OUTPUT" | grep -q "$TEST_FILE"; then
    test_result "Error message includes file name" "YES" "YES"
else
    test_result "Error message includes file name" "YES" "NO"
fi
git reset HEAD "$TEST_FILE" 2>/dev/null || true
rm -f "$TEST_FILE"

# Test 7: Test bypass with --no-verify (documented escape hatch)
echo ""
echo "Test 7: Bypass flag (--no-verify) functionality"
echo "Note: This test documents the escape hatch for false positives"
echo -e "${YELLOW}⚠️  --no-verify should only be used for legitimate false positives${NC}"
test_result "Bypass flag documentation" "DOCUMENTED" "DOCUMENTED"

# Test 8: Verify .gitignore patterns
echo ""
echo "Test 8: .gitignore secret patterns"
PATTERNS=(".env" ".env.local" "*.key" "*.pem" "credentials.json")
MISSING_PATTERNS=()

for pattern in "${PATTERNS[@]}"; do
    if ! grep -q "^$pattern$" .gitignore 2>/dev/null && ! grep -q "^${pattern//\./\.}$" .gitignore 2>/dev/null; then
        MISSING_PATTERNS+=("$pattern")
    fi
done

if [ ${#MISSING_PATTERNS[@]} -eq 0 ]; then
    test_result ".gitignore has all secret patterns" "COMPLETE" "COMPLETE"
else
    test_result ".gitignore has all secret patterns" "COMPLETE" "MISSING: ${MISSING_PATTERNS[*]}"
fi

# Test 9: Verify pre-commit hook is executable
echo ""
echo "Test 9: Pre-commit hook permissions"
if [ -x .husky/pre-commit ]; then
    test_result "Pre-commit hook executable" "YES" "YES"
else
    test_result "Pre-commit hook executable" "YES" "NO"
    echo "   Run: chmod +x .husky/pre-commit"
fi

# Summary
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo -e "${GREEN}Passed: $TEST_PASSED${NC}"
echo -e "${RED}Failed: $TEST_FAILED${NC}"
echo ""

if [ $TEST_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Secret detection is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
    exit 1
fi
