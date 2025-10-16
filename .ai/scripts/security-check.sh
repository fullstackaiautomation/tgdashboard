#!/bin/bash
# Automated Security Check Script
# Runs comprehensive security checks before deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

echo "========================================"
echo "Security Check - tg-dashboard"
echo "========================================"
echo ""

# Check 1: .env in .gitignore
echo "Check 1: Verify .env in .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✓ PASS${NC}: .env is in .gitignore"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: .env NOT in .gitignore"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 2: .env.example exists
echo ""
echo "Check 2: Verify .env.example exists..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ PASS${NC}: .env.example exists"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: .env.example NOT found"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 3: No hardcoded Supabase URLs
echo ""
echo "Check 3: Scan for hardcoded Supabase URLs..."
HARDCODED_URLS=$(grep -r "https://[a-z0-9]\{20\}\.supabase\.co" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$HARDCODED_URLS" ]; then
    echo -e "${GREEN}✓ PASS${NC}: No hardcoded Supabase URLs found"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: Hardcoded Supabase URLs detected:"
    echo "$HARDCODED_URLS"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 4: No hardcoded JWT tokens
echo ""
echo "Check 4: Scan for hardcoded JWT tokens..."
HARDCODED_JWTS=$(grep -r "eyJhbGciOiJI" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -z "$HARDCODED_JWTS" ]; then
    echo -e "${GREEN}✓ PASS${NC}: No hardcoded JWT tokens found"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: Hardcoded JWT tokens detected:"
    echo "$HARDCODED_JWTS"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 5: No service role key in client code
echo ""
echo "Check 5: Scan for service role key references..."
SERVICE_ROLE=$(grep -r "SERVICE_ROLE" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "NEVER use" | grep -v "//" || true)
if [ -z "$SERVICE_ROLE" ]; then
    echo -e "${GREEN}✓ PASS${NC}: No service role key references in client code"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: Service role key found in client code:"
    echo "$SERVICE_ROLE"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 6: .env never committed to git
echo ""
echo "Check 6: Verify .env never committed to git history..."
ENV_HISTORY=$(git log --all --full-history -- .env 2>/dev/null || true)
if [ -z "$ENV_HISTORY" ]; then
    echo -e "${GREEN}✓ PASS${NC}: .env never committed to git"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: .env found in git history - MUST clean history"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 7: Pre-commit hook exists and executable
echo ""
echo "Check 7: Verify pre-commit hook..."
if [ -x ".husky/pre-commit" ]; then
    echo -e "${GREEN}✓ PASS${NC}: Pre-commit hook exists and is executable"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Pre-commit hook missing or not executable"
    echo "  Run: chmod +x .husky/pre-commit"
fi

# Check 8: Verify Supabase client config
echo ""
echo "Check 8: Verify Supabase client uses environment variables..."
if grep -q "import.meta.env.VITE_SUPABASE" src/lib/supabase.ts; then
    echo -e "${GREEN}✓ PASS${NC}: Supabase client uses environment variables"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}: Supabase client may have hardcoded values"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Summary
echo ""
echo "========================================"
echo "Security Check Summary"
echo "========================================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    echo "Ready for deployment."
    exit 0
else
    echo -e "${RED}✗ Security checks failed!${NC}"
    echo "Fix the issues above before deployment."
    exit 1
fi
