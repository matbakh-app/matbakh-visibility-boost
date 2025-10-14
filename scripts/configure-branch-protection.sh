#!/bin/bash

# Branch Protection System Configuration
# Configures Git branch protection for main, kiro-dev, aws-deploy only

set -e

echo "🔒 Configuring Branch Protection System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROTECTED_BRANCHES=("main" "kiro-dev" "aws-deploy")
REPO_OWNER="matbakh-app"
REPO_NAME="matbakh-visibility-boost"

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed. Please install it first.${NC}"
    echo "Visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is available and authenticated${NC}"

# Function to configure branch protection
configure_branch_protection() {
    local branch=$1
    echo -e "${YELLOW}🔧 Configuring protection for branch: ${branch}${NC}"
    
    # Configure branch protection rules
    gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${branch}/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["ci/build","ci/test","ci/lint"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
        --field restrictions='{"users":[],"teams":[],"apps":[]}' \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        2>/dev/null || echo -e "${YELLOW}⚠️  Branch ${branch} may not exist yet or protection already configured${NC}"
}

# Configure protection for each protected branch
for branch in "${PROTECTED_BRANCHES[@]}"; do
    configure_branch_protection "$branch"
done

echo -e "${GREEN}✅ Branch protection configuration completed${NC}"

# Create branch protection status file
cat > .github/branch-protection-status.json << EOF
{
  "configured_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "protected_branches": [
    $(printf '"%s",' "${PROTECTED_BRANCHES[@]}" | sed 's/,$//')
  ],
  "protection_rules": {
    "required_status_checks": true,
    "enforce_admins": true,
    "required_pull_request_reviews": true,
    "allow_force_pushes": false,
    "allow_deletions": false
  }
}
EOF

echo -e "${GREEN}✅ Branch protection status saved to .github/branch-protection-status.json${NC}"
echo -e "${GREEN}🎉 Branch Protection System configured successfully!${NC}"