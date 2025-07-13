
#!/usr/bin/env node

/**
 * Legal Locales Consistency Checker - Updated for Separate Legal Files
 * Prüft ob alle legal-*.json Dateien identische Keys haben
 * Verhindert fehlende Übersetzungen und strukturelle Inkonsistenzen
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking separate legal-*.json consistency across locales...\n');

// Legal-Seiten Definitionen
const LEGAL_PAGES = [
  { de: 'legal-impressum', en: 'legal-imprint' },
  { de: 'legal-datenschutz', en: 'legal-privacy' },
  { de: 'legal-agb', en: 'legal-terms' },
  { de: 'legal-nutzung', en: 'legal-usage' },
  { de: 'legal-kontakt', en: 'legal-contact' }
];

// Legal JSON Datei laden
const loadLegalJson = (locale, filename) => {
  const filePath = path.join(__dirname, '../public/locales', locale, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing ${filename}.json for locale: ${locale}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Invalid JSON in ${locale}/${filename}.json:`, error.message);
    return null;
  }
};

// Objekt zu flacher Key-Liste
function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = value;
    }
  }
  return out;
}

console.log(`📂 Checking ${LEGAL_PAGES.length} legal page pairs...\n`);

let hasErrors = false;

// Prüfe jede Legal-Seite einzeln
for (const pageMap of LEGAL_PAGES) {
  console.log(`🔍 Checking: ${pageMap.de} ↔ ${pageMap.en}`);
  
  const deData = loadLegalJson('de', pageMap.de);
  const enData = loadLegalJson('en', pageMap.en);
  
  if (!deData || !enData) {
    hasErrors = true;
    continue;
  }
  
  const deKeys = Object.keys(flatten(deData)).sort();
  const enKeys = Object.keys(flatten(enData)).sort();
  
  const missingInEn = deKeys.filter(key => !enKeys.includes(key));
  const missingInDe = enKeys.filter(key => !deKeys.includes(key));
  
  if (missingInEn.length > 0) {
    console.error(`  ❌ Missing keys in ${pageMap.en}:`);
    missingInEn.forEach(key => console.error(`     - ${key}`));
    hasErrors = true;
  }
  
  if (missingInDe.length > 0) {
    console.error(`  ❌ Missing keys in ${pageMap.de}:`);
    missingInDe.forEach(key => console.error(`     - ${key}`));
    hasErrors = true;
  }
  
  // Array-Konsistenz prüfen
  for (const key of deKeys) {
    const deValue = flatten(deData)[key];
    const enValue = flatten(enData)[key];
    
    if (Array.isArray(deValue) && !Array.isArray(enValue)) {
      console.error(`  ❌ Key "${key}" is array in DE but not in EN`);
      hasErrors = true;
    } else if (!Array.isArray(deValue) && Array.isArray(enValue)) {
      console.error(`  ❌ Key "${key}" is array in EN but not in DE`);
      hasErrors = true;
    }
  }
  
  if (missingInEn.length === 0 && missingInDe.length === 0) {
    console.log(`  ✅ ${pageMap.de} ↔ ${pageMap.en} - All keys consistent (${deKeys.length} keys)`);
  }
  
  console.log('');
}

// Ergebnis
if (hasErrors) {
  console.error('❌ Legal locales consistency check FAILED!');
  console.error('⚠️ Fix all inconsistencies before merging!');
  process.exit(1);
} else {
  console.log('✅ All separate legal-*.json files are consistent across locales!');
  console.log('🎉 Legal governance check passed - ready for production');
  process.exit(0);
}
