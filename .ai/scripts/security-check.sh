#!/bin/bash
# Pre-Deployment Security Check Script
# Version: 1.0.0
# Purpose: Automated security verification before production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "🔒 Pre-Deployment Security Checks"
echo "=================================="
echo ""

# Function to print pass message
pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASS_COUNT++))
}

# Function to print fail message and exit
fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAIL_COUNT++))
}

# Function to print warning message
warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARN_COUNT++))
}

# Check 1: Scan for hardcoded Supabase API keys (JWT pattern)
echo "Check 1: Scanning for hardcoded Supabase API keys..."
if grep -r "eyJhbGciOiJI" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    fail "Hardcoded Supabase key detected in source code (JWT token pattern found)"
else
    pass "No hardcoded Supabase keys found"
fi

# Check 2: Scan for hardcoded Supabase URLs
echo ""
echo "Check 2: Scanning for hardcoded Supabase URLs..."
if grep -r "https://[a-z0-9]*\.supabase\.co" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "import.meta.env"; then
    fail "Hardcoded Supabase URL detected (should use import.meta.env.VITE_SUPABASE_URL)"
else
    pass "No hardcoded Supabase URLs found"
fi

# Check 3: Verify .env in .gitignore
echo ""
echo "Check 3: Verifying .env in .gitignore..."
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    fail ".env not found in .gitignore (risk of committing secrets)"
else
    pass ".env present in .gitignore"
fi

# Check 4: Verify .env.local in .gitignore
echo ""
echo "Check 4: Verifying .env.local in .gitignore..."
if ! grep -q "^\.env\.local$" .gitignore 2>/dev/null; then
    warn ".env.local not found in .gitignore (recommended to add)"
else
    pass ".env.local present in .gitignore"
fi

# Check 5: Verify .env.example exists
echo ""
echo "Check 5: Verifying .env.example exists..."
if [ ! -f .env.example ]; then
    fail ".env.example file missing (required for documenting env vars)"
else
    pass ".env.example file exists"
fi

# Check 6: Verify .env.example has no real secrets
echo ""
echo "Check 6: Verifying .env.example has placeholder values only..."
if [ -f .env.example ]; then
    if grep -q "eyJhbGciOiJI" .env.example 2>/dev/null; then
        fail "Real Supabase key found in .env.example (should use placeholders only)"
    else
        pass ".env.example contains placeholders only"
    fi
fi

# Check 7: Scan for common secret patterns
echo ""
echo "Check 7: Scanning for common secret patterns..."
SECRET_PATTERNS=("password\s*=\s*['\"][^'\"]+['\"]" "api_key\s*=\s*['\"][^'\"]+['\"]" "private_key" "secret\s*=\s*['\"][^'\"]+['\"]")
PATTERN_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -rE "$pattern" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// Example" | grep -v "placeholder"; then
        fail "Potential secret found matching pattern: $pattern"
        PATTERN_FOUND=true
    fi
done
if [ "$PATTERN_FOUND" = false ]; then
    pass "No common secret patterns found"
fi

# Check 8: Verify no service role key in client code
echo ""
echo "Check 8: Verifying no service role key in client code..."
if grep -r "SERVICE_ROLE" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    fail "Service role key reference found in client code (bypasses RLS, critical security risk)"
else
    pass "No service role key references in client code"
fi

# Check 9: Verify no OpenAI API keys in code
echo ""
echo "Check 9: Scanning for OpenAI API keys..."
if grep -r "sk-proj-" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    fail "OpenAI API key detected in source code"
else
    pass "No OpenAI API keys found"
fi

# Check 10: Verify no console.log with sensitive data patterns
echo ""
echo "Check 10: Checking for console.log with potential sensitive data..."
if grep -rE "console\.log.*\b(password|secret|key|token|account)\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "keyCode" | grep -v "keypress"; then
    warn "console.log statements found that may expose sensitive data (review manually)"
else
    pass "No suspicious console.log statements found"
fi

# Check 11: Verify git history clean of .env files
echo ""
echo "Check 11: Verifying .env never committed to git..."
if git log --all --full-history --oneline -- .env .env.local 2>/dev/null | head -n 1; then
    fail ".env or .env.local found in git history (must clean with git-filter-repo and rotate keys)"
else
    pass ".env files never committed to git history"
fi

# Check 12: Verify *.key pattern in .gitignore
echo ""
echo "Check 12: Verifying *.key in .gitignore..."
if ! grep -q "^\*\.key$" .gitignore 2>/dev/null; then
    warn "*.key pattern not in .gitignore (recommended to add for private key files)"
else
    pass "*.key pattern present in .gitignore"
fi

# Summary
echo ""
echo "=================================="
echo "Security Check Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "${RED}Failed:${NC} $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ SECURITY CHECK FAILED${NC}"
    echo "Deployment blocked. Fix the issues above before deploying."
    exit 1
else
    if [ $WARN_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠️  SECURITY CHECK PASSED WITH WARNINGS${NC}"
        echo "Review warnings above before deploying."
    else
        echo -e "${GREEN}✅ ALL SECURITY CHECKS PASSED${NC}"
        echo "Safe to proceed with deployment."
    fi
    exit 0
fi
