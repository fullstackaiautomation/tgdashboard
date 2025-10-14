#!/bin/bash
# Git History Cleaning Script
# Removes .env file from entire Git history

set -e

echo "🧹 Git History Cleaning Script"
echo "================================"
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  All commit SHAs will change!"
echo "⚠️  Anyone who has cloned the repo will need to re-clone!"
echo ""

# Backup check
echo "Step 1: Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    echo "❌ ERROR: You have uncommitted changes!"
    echo "   Please commit or stash your changes first."
    exit 1
fi

echo "✅ Working directory is clean"
echo ""

# Remove .env from history
echo "Step 2: Removing .env from Git history..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env .env.local" \
  --prune-empty --tag-name-filter cat -- --all

echo "✅ .env removed from history"
echo ""

# Cleanup refs
echo "Step 3: Cleaning up refs and garbage collection..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Cleanup complete"
echo ""

# Verify
echo "Step 4: Verifying .env is gone from history..."
if git log --all --full-history -- .env | grep -q "commit"; then
    echo "⚠️  WARNING: .env still found in history!"
    echo "   Manual review needed."
else
    echo "✅ Verified: .env not found in history"
fi

echo ""
echo "================================"
echo "✅ Git history cleaned successfully!"
echo ""
echo "Next steps:"
echo "1. Review changes: git log --oneline | head -20"
echo "2. Force push to GitHub: git push --force --all"
echo "3. Force push tags: git push --force --tags"
echo ""
echo "⚠️  IMPORTANT: Notify any team members to re-clone the repository!"
