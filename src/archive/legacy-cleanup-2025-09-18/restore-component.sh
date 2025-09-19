#!/bin/bash
# Component Restoration Script
# Restore individual components from the safe archival
# Usage: ./restore-component.sh <component-path>

set -e

ARCHIVE_DIR="$(dirname "$0")"
COMPONENT_PATH="$1"

if [ -z "$COMPONENT_PATH" ]; then
    echo "Usage: $0 <component-path>"
    echo "Example: $0 src/components/MyComponent.tsx"
    exit 1
fi

# Load manifest
MANIFEST_FILE="$ARCHIVE_DIR/archive-manifest.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Archive manifest not found: $MANIFEST_FILE"
    exit 1
fi

echo "🔄 Restoring component: $COMPONENT_PATH"
echo "📦 Archive: $ARCHIVE_DIR"

# Find component in manifest and restore
npx tsx -e "
const fs = require('fs');
const path = require('path');

const manifestPath = '$MANIFEST_FILE';
const componentPath = '$COMPONENT_PATH';
const archiveDir = '$ARCHIVE_DIR';

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Find component in archived components
  const component = manifest.components.find(c => 
    c.originalPath === componentPath || 
    c.originalPath.endsWith(componentPath)
  );
  
  if (!component) {
    console.error('❌ Component not found in archive:', componentPath);
    process.exit(1);
  }
  
  const archivePath = path.join(process.cwd(), component.archivePath);
  const originalPath = path.join(process.cwd(), component.originalPath);
  
  if (!fs.existsSync(archivePath)) {
    console.error('❌ Archived file not found:', archivePath);
    process.exit(1);
  }
  
  // Create directory if needed
  const dir = path.dirname(originalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Copy file back
  fs.copyFileSync(archivePath, originalPath);
  
  console.log('✅ Component restored successfully');
  console.log('📁 From:', component.archivePath);
  console.log('📁 To:', component.originalPath);
  console.log('🔍 Origin:', component.origin);
  console.log('⚠️ Risk Level:', component.riskLevel);
  
  if (component.dependencies.length > 0) {
    console.log('📦 Dependencies:', component.dependencies.slice(0, 5).join(', '));
    if (component.dependencies.length > 5) {
      console.log('    ... and', component.dependencies.length - 5, 'more');
    }
  }
  
  if (component.backendDependencies.length > 0) {
    console.log('🔗 Backend Dependencies:', component.backendDependencies.map(d => d.name).join(', '));
  }
  
} catch (error) {
  console.error('❌ Restoration failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "🎯 Next Steps:"
echo "1. Test the restored component thoroughly"
echo "2. Check for any missing dependencies"
echo "3. Run TypeScript compilation: npx tsc --noEmit"
echo "4. Run tests if available"
echo ""
echo "💡 To archive again: npx tsx scripts/run-safe-archival.ts --include \"$COMPONENT_PATH\""