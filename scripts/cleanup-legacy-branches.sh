#!/bin/bash

# Automated Branch Cleanup for Legacy Branches
# Removes branches that are not in the protected list and have been merged

set -e

echo "🧹 Starting Legacy Branch Cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROTECTED_BRANCHES=("main" "kiro-dev" "aws-deploy")
DRY_RUN=${1:-false}

# Function to check if branch is protected
is_protected_branch() {
    local branch=$1
    for protected in "${PROTECTED_BRANCHES[@]}"; do
        if [[ "$branch" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to check if branch has been merged
is_merged_branch() {
    local branch=$1
    local base_branch=${2:-main}
    
    # Check if branch is merged into base branch
    git merge-base --is-ancestor "$branch" "$base_branch" 2>/dev/null
}

# Function to get branch last commit date
get_branch_last_commit_date() {
    local branch=$1
    git log -1 --format="%ci" "$branch" 2>/dev/null
}

# Function to check if branch is stale (older than 30 days)
is_stale_branch() {
    local branch=$1
    local last_commit_date
    last_commit_date=$(get_branch_last_commit_date "$branch")
    
    if [[ -n "$last_commit_date" ]]; then
        local last_commit_timestamp
        last_commit_timestamp=$(date -d "$last_commit_date" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S %z" "$last_commit_date" +%s 2>/dev/null)
        local current_timestamp
        current_timestamp=$(date +%s)
        local days_old=$(( (current_timestamp - last_commit_timestamp) / 86400 ))
        
        [[ $days_old -gt 30 ]]
    else
        return 1
    fi
}

# Get current branch
current_branch=$(git branch --show-current)

# Ensure we're on a protected branch before cleanup
if ! is_protected_branch "$current_branch"; then
    echo -e "${YELLOW}⚠️  Switching to main branch for cleanup...${NC}"
    git checkout main
fi

# Fetch latest changes
echo -e "${BLUE}📡 Fetching latest changes...${NC}"
git fetch --prune origin

# Get all local branches
echo -e "${BLUE}🔍 Analyzing local branches...${NC}"
local_branches=$(git branch --format='%(refname:short)' | grep -v "^main$" | grep -v "^kiro-dev$" | grep -v "^aws-deploy$")

cleanup_count=0
protected_count=0
active_count=0

for branch in $local_branches; do
    echo -e "${BLUE}🔍 Analyzing branch: ${branch}${NC}"
    
    # Skip if protected
    if is_protected_branch "$branch"; then
        echo -e "${GREEN}  ✅ Protected branch - skipping${NC}"
        ((protected_count++))
        continue
    fi
    
    # Check if branch exists on remote
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        echo -e "${YELLOW}  📡 Branch exists on remote - checking merge status${NC}"
        
        # Check if merged into main
        if is_merged_branch "origin/$branch" "origin/main"; then
            echo -e "${YELLOW}  🔀 Branch is merged into main${NC}"
            
            if [[ "$DRY_RUN" == "true" ]]; then
                echo -e "${YELLOW}  🧪 DRY RUN: Would delete local branch ${branch}${NC}"
            else
                echo -e "${RED}  🗑️  Deleting merged local branch: ${branch}${NC}"
                git branch -d "$branch" 2>/dev/null || git branch -D "$branch"
            fi
            ((cleanup_count++))
        else
            # Check if stale
            if is_stale_branch "$branch"; then
                echo -e "${YELLOW}  ⏰ Branch is stale (>30 days old)${NC}"
                
                if [[ "$DRY_RUN" == "true" ]]; then
                    echo -e "${YELLOW}  🧪 DRY RUN: Would delete stale branch ${branch}${NC}"
                else
                    echo -e "${RED}  🗑️  Deleting stale branch: ${branch}${NC}"
                    git branch -D "$branch"
                fi
                ((cleanup_count++))
            else
                echo -e "${GREEN}  ✅ Active branch - keeping${NC}"
                ((active_count++))
            fi
        fi
    else
        echo -e "${YELLOW}  📍 Local-only branch${NC}"
        
        # Check if stale
        if is_stale_branch "$branch"; then
            echo -e "${YELLOW}  ⏰ Local branch is stale (>30 days old)${NC}"
            
            if [[ "$DRY_RUN" == "true" ]]; then
                echo -e "${YELLOW}  🧪 DRY RUN: Would delete stale local branch ${branch}${NC}"
            else
                echo -e "${RED}  🗑️  Deleting stale local branch: ${branch}${NC}"
                git branch -D "$branch"
            fi
            ((cleanup_count++))
        else
            echo -e "${GREEN}  ✅ Active local branch - keeping${NC}"
            ((active_count++))
        fi
    fi
done

# Summary
echo -e "\n${GREEN}📊 Branch Cleanup Summary:${NC}"
echo -e "${GREEN}  ✅ Protected branches: ${protected_count}${NC}"
echo -e "${GREEN}  ✅ Active branches kept: ${active_count}${NC}"
echo -e "${RED}  🗑️  Branches cleaned up: ${cleanup_count}${NC}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "\n${YELLOW}🧪 This was a DRY RUN. No branches were actually deleted.${NC}"
    echo -e "${YELLOW}Run without 'true' parameter to perform actual cleanup.${NC}"
fi

# Create cleanup report
cat > reports/branch-cleanup-$(date +%Y%m%d-%H%M%S).md << EOF
# Branch Cleanup Report

**Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Type:** $(if [[ "$DRY_RUN" == "true" ]]; then echo "DRY RUN"; else echo "ACTUAL CLEANUP"; fi)

## Summary

- **Protected branches:** ${protected_count}
- **Active branches kept:** ${active_count}
- **Branches cleaned up:** ${cleanup_count}

## Protected Branches

$(printf "- %s\n" "${PROTECTED_BRANCHES[@]}")

## Cleanup Criteria

- Merged branches (merged into main)
- Stale branches (>30 days without commits)
- Local-only stale branches

## Notes

This cleanup maintains only the protected branches (main, kiro-dev, aws-deploy) and active development branches.
All legacy and stale branches have been removed to maintain repository hygiene.
EOF

echo -e "${GREEN}✅ Cleanup report saved to reports/branch-cleanup-$(date +%Y%m%d-%H%M%S).md${NC}"
echo -e "${GREEN}🎉 Legacy Branch Cleanup completed!${NC}"