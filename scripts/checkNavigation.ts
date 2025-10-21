
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { NAVIGATION_ITEMS } from '../src/components/navigation/NavigationConfig';
import { validateNavigationIntegrity, validateTranslationKeys } from '../src/lib/navigationValidator';

console.log('🔍 Validating navigation integrity...');

try {
  // Validate navigation structure
  validateNavigationIntegrity(NAVIGATION_ITEMS);
  
  // Load translation files
  const deTranslations = JSON.parse(
    fs.readFileSync(path.join('public', 'locales', 'de', 'nav.json'), 'utf-8')
  );
  const enTranslations = JSON.parse(
    fs.readFileSync(path.join('public', 'locales', 'en', 'nav.json'), 'utf-8')
  );
  
  // Validate translation completeness
  validateTranslationKeys(NAVIGATION_ITEMS, deTranslations, enTranslations);
  
  console.log('✅ Navigation validation passed');
  process.exit(0);
} catch (error) {
  console.error('❌ Navigation validation failed:', error.message);
  process.exit(1);
}
