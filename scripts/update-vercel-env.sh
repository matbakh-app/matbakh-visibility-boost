#!/bin/bash

# Script to update Vercel environment variables with new RDS DATABASE_URL
# Task 12.3.1 - Switch Vercel from Supabase to AWS RDS

set -e

NEW_DATABASE_URL="postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh"

echo "🔄 Updating Vercel environment variables with new RDS DATABASE_URL..."
echo ""

# Function to add/update environment variable for each environment
update_vercel_env() {
    local ENV_TYPE=$1
    echo "📝 Updating DATABASE_URL for $ENV_TYPE environment..."
    
    # Remove existing DATABASE_URL if it exists (ignore errors)
    vercel env rm DATABASE_URL $ENV_TYPE --yes 2>/dev/null || echo "   No existing DATABASE_URL found for $ENV_TYPE"
    
    # Add new DATABASE_URL
    echo "$NEW_DATABASE_URL" | vercel env add DATABASE_URL $ENV_TYPE
    
    echo "✅ Updated DATABASE_URL for $ENV_TYPE"
    echo ""
}

# Update all environments
update_vercel_env "production"
update_vercel_env "preview"
update_vercel_env "development"

echo "🎉 All Vercel environments updated with new RDS DATABASE_URL!"
echo ""

# List current environment variables to verify
echo "🔍 Verifying Vercel environment variables..."
vercel env ls

echo ""
echo "📊 Summary:"
echo "   ✅ Production environment updated"
echo "   ✅ Preview environment updated"
echo "   ✅ Development environment updated"
echo "   🔗 DATABASE_URL: $NEW_DATABASE_URL"
echo ""
echo "🚀 Next: Trigger a new deployment to apply changes"
echo "   Run: vercel --prod"