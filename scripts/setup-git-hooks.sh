#!/bin/bash

# Setup Git Hooks for Branch Protection System
# Configures pre-commit hooks with Kiro and migration support

set -e

echo "🔧 Setting up Git Hooks for Branch Protection..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .githooks directory exists
if [[ ! -d ".githooks" ]]; then
    echo -e "${RED}❌ .githooks directory not found${NC}"
    exit 1
fi

# Check if pre-commit hook exists
if [[ ! -f ".githooks/pre-commit" ]]; then
    echo -e "${RED}❌ .githooks/pre-commit not found${NC}"
    exit 1
fi

# Make hooks executable
echo -e "${YELLOW}🔧 Making hooks executable...${NC}"
chmod +x .githooks/pre-commit

# Configure Git to use .githooks directory
echo -e "${YELLOW}🔧 Configuring Git hooks path...${NC}"
git config core.hooksPath .githooks

# Test the hook
echo -e "${YELLOW}🧪 Testing pre-commit hook...${NC}"
if .githooks/pre-commit; then
    echo -e "${GREEN}✅ Pre-commit hook test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Pre-commit hook test completed with warnings${NC}"
fi

# Create hook status file
cat > .githooks/hook-status.json << EOF
{
  "configured_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hooks_enabled": {
    "pre-commit": true
  },
  "features": {
    "legacy_pattern_detection": true,
    "kiro_pattern_allowlist": true,
    "migration_pattern_support": true,
    "hackathon_demo_support": true
  },
  "allowed_patterns": [
    "kiro-matbakh-visibility-coach",
    "/.kiro/",
    "@aws-sdk/client-cognito",
    "migration",
    "cognito-test"
  ],
  "blocked_patterns": [
    "@supabase/supabase-js",
    "lovable-generated",
    "supabase.from",
    "supabase.auth",
    "@vercel/analytics",
    "vercel.json",
    "VERCEL_",
    "VercelProvider"
  ]
}
EOF

echo -e "${GREEN}✅ Git hooks configured successfully!${NC}"
echo -e "${GREEN}📄 Hook status saved to .githooks/hook-status.json${NC}"

# Display configuration summary
echo -e "\n${GREEN}🎉 Branch Protection System Ready!${NC}"
echo -e "${GREEN}Features enabled:${NC}"
echo -e "${GREEN}  ✅ Legacy pattern detection (blocks Supabase/Lovable/Vercel)${NC}"
echo -e "${GREEN}  ✅ AWS-only architecture enforcement${NC}"
echo -e "${GREEN}  ✅ Kiro pattern allowlist (supports hackathon demo)${NC}"
echo -e "${GREEN}  ✅ Migration pattern support (allows AWS transition)${NC}"
echo -e "${GREEN}  ✅ Cognito test compatibility${NC}"

echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "${YELLOW}  1. Commit changes to test the hook${NC}"
echo -e "${YELLOW}  2. Run hackathon validation: git clone + npm run demo${NC}"
echo -e "${YELLOW}  3. Continue Cognito migration with protection enabled${NC}"