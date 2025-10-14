#!/bin/bash

# Emergency Commit Bypass Script
# 
# Allows bypassing legacy validation in emergency situations
# Requirements: 3.2
#
# Usage: ./scripts/cleanup-2/emergency-commit.sh "Emergency fix message"

if [ -z "$1" ]; then
    echo "❌ Error: Commit message required"
    echo "Usage: $0 \"Emergency commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"
EMERGENCY_FLAG="[EMERGENCY-BYPASS]"

echo "🚨 EMERGENCY COMMIT MODE"
echo "======================="
echo "This bypasses all pre-commit legacy validation checks."
echo "Use only in genuine emergencies!"
echo ""
echo "Commit message: $COMMIT_MESSAGE"
echo ""

# Confirm emergency bypass
read -p "Are you sure you want to bypass legacy validation? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Emergency commit cancelled"
    exit 1
fi

# Temporarily disable pre-commit hooks and commit
echo "🔄 Bypassing pre-commit hooks..."
git commit --no-verify -m "$EMERGENCY_FLAG $COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ Emergency commit successful"
    echo ""
    echo "⚠️  IMPORTANT: Please create a follow-up commit to fix any legacy issues!"
    echo "Run: npx tsx scripts/cleanup-2/legacy-scanner.ts"
else
    echo "❌ Emergency commit failed"
    exit 1
fi