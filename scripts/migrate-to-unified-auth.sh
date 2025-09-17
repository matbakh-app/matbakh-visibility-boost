#!/bin/bash

# Migration Script: useAuth -> useUnifiedAuth
# Migrates all components to use the unified auth system

echo "🔄 Starting migration to useUnifiedAuth..."

# List of files to migrate
FILES=(
  "src/pages/BusinessLanding.tsx"
  "src/pages/CognitoTest.tsx"
  "src/pages/BusinessLogin.tsx"
  "src/pages/dashboard/RestaurantDashboard.tsx"
  "src/pages/StandardOnboarding.tsx"
  "<REDACTED_AWS_SECRET_ACCESS_KEY>.tsx"
  "src/pages/Login.tsx"
  "src/pages/LoginPage.tsx"
  "src/hooks/useCompanyProfile.ts"
  "src/hooks/useProfile.ts"
  "src/hooks/useRestaurantDashboard.ts"
  "src/components/dashboard/QuickActions.tsx"
  "src/components/navigation/MobileMenu.tsx"
  "src/components/auth/AuthModeSelector.tsx"
  "src/components/auth/AuthModal.tsx"
  "<REDACTED_AWS_SECRET_ACCESS_KEY>.tsx"
  "src/components/auth/EmailLoginForm.tsx"
  "src/components/auth/AuthTabsContainer.tsx"
  "src/components/auth/EmailRegisterForm.tsx"
  "src/components/auth/ProtectedRoute.tsx"
)

# Backup directory
BACKUP_DIR="scripts/auth-migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backups in $BACKUP_DIR..."

# Create backups
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    echo "  ✅ Backed up: $file"
  fi
done

echo "🔄 Performing migration..."

# Replace imports
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Replace the import statement
    sed -i '' "s/import { useAuth } from '@\/contexts\/AuthContext';/import { useUnifiedAuth as useAuth } from '@\/hooks\/useUnifiedAuth';/g" "$file"
    echo "  ✅ Migrated: $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ Migration complete!"
echo "📁 Backups stored in: $BACKUP_DIR"
echo "🧪 Test the application with: npm run dev"