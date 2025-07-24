
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface MissingKeyReport {
  [namespace: string]: string[];
}

// Sammle alle t()-Aufrufe aus dem Code
function extractTranslationKeys(content: string): string[] {
  const patterns = [
    /t\(['"`]([^'"`]+)['"`]/g,
    /useTranslation\(['"`]([^'"`]+)['"`]\)/g,
    /\{t\(['"`]([^'"`]+)['"`]/g
  ];
  
  const keys: string[] = [];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
  });
  
  return keys;
}

// Lade vorhandene Übersetzungen
function loadTranslations(lang: string): Record<string, any> {
  const translations: Record<string, any> = {};
  const localesDir = path.join('public', 'locales', lang);
  
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const namespace = file.replace('.json', '');
        const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
        try {
          translations[namespace] = JSON.parse(content);
        } catch (error) {
          console.warn(`Failed to parse ${file}:`, error);
        }
      }
    });
  }
  
  return translations;
}

// Prüfe ob Key existiert
function keyExists(key: string, translations: Record<string, any>): boolean {
  const [namespace, ...keyParts] = key.split('.');
  const keyPath = keyParts.join('.');
  
  if (!translations[namespace]) return false;
  
  const value = keyPath.split('.').reduce((obj: any, part: string) => {
    return obj && obj[part];
  }, translations[namespace]);
  
  return value !== undefined;
}

async function generateMissingI18nReport(): Promise<void> {
  console.log('🔍 Analyzing i18n usage...');
  
  // Sammle alle .tsx/.ts Dateien
  const files = await glob('src/**/*.{tsx,ts}', { ignore: ['src/**/*.d.ts'] });
  
  const allKeys = new Set<string>();
  
  // Extrahiere alle Keys aus den Dateien
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractTranslationKeys(content);
    keys.forEach(key => allKeys.add(key));
  });
  
  // Lade Übersetzungen
  const deTranslations = loadTranslations('de');
  const enTranslations = loadTranslations('en');
  
  // Identifiziere fehlende Keys
  const missingDE: MissingKeyReport = {};
  const missingEN: MissingKeyReport = {};
  
  allKeys.forEach(key => {
    if (!keyExists(key, deTranslations)) {
      const namespace = key.split('.')[0];
      if (!missingDE[namespace]) missingDE[namespace] = [];
      missingDE[namespace].push(key);
    }
    
    if (!keyExists(key, enTranslations)) {
      const namespace = key.split('.')[0];
      if (!missingEN[namespace]) missingEN[namespace] = [];
      missingEN[namespace].push(key);
    }
  });
  
  // Erstelle Report
  const report = {
    timestamp: new Date().toISOString(),
    totalKeysFound: allKeys.size,
    missingDE: missingDE,
    missingEN: missingEN,
    allKeysUsed: Array.from(allKeys).sort()
  };
  
  // Speichere Report
  fs.writeFileSync('scripts/missing-i18n-keys-report.json', JSON.stringify(report, null, 2));
  
  console.log('📊 Report erstellt: scripts/missing-i18n-keys-report.json');
  console.log(`📈 Gefundene Keys: ${allKeys.size}`);
  console.log(`❌ Fehlende DE Keys: ${Object.values(missingDE).flat().length}`);
  console.log(`❌ Fehlende EN Keys: ${Object.values(missingEN).flat().length}`);
  
  // Zeige kritische fehlende Keys
  if (Object.keys(missingDE).length > 0) {
    console.log('\n🚨 Kritische fehlende DE Keys:');
    Object.entries(missingDE).forEach(([namespace, keys]) => {
      console.log(`  ${namespace}: ${keys.length} Keys`);
    });
  }
}

// Hauptfunktion
if (require.main === module) {
  generateMissingI18nReport().catch(console.error);
}

export { generateMissingI18nReport };
