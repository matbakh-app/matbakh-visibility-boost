#!/usr/bin/env node

/**
 * Legal Locales Consistency Checker
 * Prüft ob alle legal.json Dateien identische Keys haben
 * Verhindert fehlende Übersetzungen und strukturelle Inkonsistenzen
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking legal.json consistency across locales...\n');

// Legal JSON Dateien laden
const loadLegalJson = (locale) => {
  const filePath = path.join(__dirname, '../public/locales', locale, 'legal.json');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing legal.json for locale: ${locale}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Entferne Kommentare für JSON.parse
    const cleanContent = content.replace(/\/\/.*$/gm, '');
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`❌ Invalid JSON in ${locale}/legal.json:`, error.message);
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

// Alle verfügbaren Locales finden
const localesDir = path.join(__dirname, '../public/locales');
const availableLocales = fs.readdirSync(localesDir)
  .filter(dir => fs.statSync(path.join(localesDir, dir)).isDirectory())
  .filter(dir => fs.existsSync(path.join(localesDir, dir, 'legal.json')));

console.log(`📂 Found locales with legal.json: ${availableLocales.join(', ')}\n`);

if (availableLocales.length < 2) {
  console.log('ℹ️ Less than 2 locales found, skipping consistency check');
  process.exit(0);
}

// Legal JSONs laden
const legalData = {};
const flattenedData = {};

for (const locale of availableLocales) {
  const data = loadLegalJson(locale);
  if (!data) {
    process.exit(1);
  }
  legalData[locale] = data;
  flattenedData[locale] = flatten(data);
}

// Konsistenz-Check
let hasErrors = false;
const baseLocale = availableLocales[0]; // Erste Sprache als Referenz
const baseKeys = Object.keys(flattenedData[baseLocale]).sort();

console.log(`🔑 Using ${baseLocale} as reference (${baseKeys.length} keys)\n`);

for (const locale of availableLocales.slice(1)) {
  const currentKeys = Object.keys(flattenedData[locale]).sort();
  
  const missingKeys = baseKeys.filter(key => !currentKeys.includes(key));
  const extraKeys = currentKeys.filter(key => !baseKeys.includes(key));
  
  if (missingKeys.length > 0) {
    console.error(`❌ Missing keys in ${locale}/legal.json:`);
    missingKeys.forEach(key => console.error(`   - ${key}`));
    console.error('');
    hasErrors = true;
  }
  
  if (extraKeys.length > 0) {
    console.error(`❌ Extra keys in ${locale}/legal.json:`);
    extraKeys.forEach(key => console.error(`   + ${key}`));
    console.error('');
    hasErrors = true;
  }
  
  if (missingKeys.length === 0 && extraKeys.length === 0) {
    console.log(`✅ ${locale}/legal.json - All keys consistent (${currentKeys.length} keys)`);
  }
}

// Array-Konsistenz prüfen
console.log('\n🔍 Checking array consistency...');

for (const key of baseKeys) {
  const baseValue = flattenedData[baseLocale][key];
  
  if (Array.isArray(baseValue)) {
    for (const locale of availableLocales.slice(1)) {
      const currentValue = flattenedData[locale][key];
      
      if (!Array.isArray(currentValue)) {
        console.error(`❌ Key "${key}" is array in ${baseLocale} but not in ${locale}`);
        hasErrors = true;
      }
    }
  }
}

// Ergebnis
if (hasErrors) {
  console.error('\n❌ Legal locales consistency check FAILED!');
  console.error('⚠️ Fix all inconsistencies before merging!');
  process.exit(1);
} else {
  console.log('\n✅ All legal.json files are consistent across locales!');
  console.log('🎉 Legal governance check passed - ready for production');
  process.exit(0);
}