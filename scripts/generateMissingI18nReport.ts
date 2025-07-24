
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MissingKeys {
  [namespace: string]: string[];
}

interface TranslationFiles {
  [namespace: string]: {
    de: any;
    en: any;
  };
}

async function scanForTKeys(filePath: string): Promise<{ namespace: string; key: string }[]> {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Regex für t('namespace.key') oder t('key', 'fallback')
  const tKeyRegex = /t\(['"]([\w\.-]+)['"]/g;
  const useTranslationRegex = /useTranslation\(['"]([\w-]+)['"]\)/g;
  
  const keys: { namespace: string; key: string }[] = [];
  let match;
  
  // Finde useTranslation() calls für Standard-Namespace
  const namespaceMatches = [...content.matchAll(useTranslationRegex)];
  const defaultNamespace = namespaceMatches[0]?.[1] || 'common';
  
  // Finde alle t() calls
  while ((match = tKeyRegex.exec(content)) !== null) {
    const fullKey = match[1];
    
    if (fullKey.includes('.')) {
      // Namespace.key Format
      const [namespace, ...keyParts] = fullKey.split('.');
      keys.push({
        namespace,
        key: keyParts.join('.')
      });
    } else {
      // Nur key, verwende Standard-Namespace
      keys.push({
        namespace: defaultNamespace,
        key: fullKey
      });
    }
  }
  
  return keys;
}

async function loadTranslationFiles(): Promise<TranslationFiles> {
  const localesDir = path.join(__dirname, '..', 'public', 'locales');
  const files: TranslationFiles = {};
  
  const languages = ['de', 'en'];
  
  for (const lang of languages) {
    const langDir = path.join(localesDir, lang);
    const langFiles = await fs.readdir(langDir);
    
    for (const file of langFiles) {
      if (file.endsWith('.json')) {
        const namespace = file.replace('.json', '');
        const content = await fs.readFile(path.join(langDir, file), 'utf8');
        
        if (!files[namespace]) {
          files[namespace] = { de: {}, en: {} };
        }
        
        try {
          files[namespace][lang as 'de' | 'en'] = JSON.parse(content);
        } catch (error) {
          console.error(`Error parsing ${lang}/${file}:`, error);
          files[namespace][lang as 'de' | 'en'] = {};
        }
      }
    }
  }
  
  return files;
}

function checkKeyExists(obj: any, key: string): boolean {
  const keys = key.split('.');
  let current = obj;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return false;
    }
  }
  
  return current !== undefined;
}

async function scanSourceFiles(): Promise<{ namespace: string; key: string; file: string }[]> {
  const srcDir = path.join(__dirname, '..', 'src');
  const allKeys: { namespace: string; key: string; file: string }[] = [];
  
  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        const keys = await scanForTKeys(fullPath);
        const relativePath = path.relative(srcDir, fullPath);
        
        for (const key of keys) {
          allKeys.push({
            ...key,
            file: relativePath
          });
        }
      }
    }
  }
  
  await scanDirectory(srcDir);
  return allKeys;
}

async function generateMissingKeysReport(): Promise<void> {
  console.log('🔍 Scanning for missing translation keys...');
  
  try {
    const [sourceKeys, translationFiles] = await Promise.all([
      scanSourceFiles(),
      loadTranslationFiles()
    ]);
    
    const missingKeys: MissingKeys = {};
    const reportDetails: { [namespace: string]: { [key: string]: string[] } } = {};
    
    for (const { namespace, key, file } of sourceKeys) {
      // Skip legal namespace - protected content
      if (namespace.startsWith('legal')) {
        continue;
      }
      
      const translations = translationFiles[namespace];
      
      if (!translations) {
        // Namespace doesn't exist
        if (!missingKeys[namespace]) {
          missingKeys[namespace] = [];
          reportDetails[namespace] = {};
        }
        
        if (!missingKeys[namespace].includes(key)) {
          missingKeys[namespace].push(key);
          reportDetails[namespace][key] = [file];
        }
      } else {
        // Check if key exists in DE and EN
        const missingInDe = !checkKeyExists(translations.de, key);
        const missingInEn = !checkKeyExists(translations.en, key);
        
        if (missingInDe || missingInEn) {
          if (!missingKeys[namespace]) {
            missingKeys[namespace] = [];
            reportDetails[namespace] = {};
          }
          
          if (!missingKeys[namespace].includes(key)) {
            missingKeys[namespace].push(key);
            reportDetails[namespace][key] = reportDetails[namespace][key] || [];
          }
          
          if (!reportDetails[namespace][key].includes(file)) {
            reportDetails[namespace][key].push(file);
          }
        }
      }
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMissingKeys: Object.values(missingKeys).reduce((sum, keys) => sum + keys.length, 0),
        affectedNamespaces: Object.keys(missingKeys).length,
        protectedNamespaces: ['legal-*']
      },
      missingKeys,
      details: reportDetails
    };
    
    const reportPath = path.join(__dirname, 'missing-i18n-keys-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('✅ Missing keys report generated:', reportPath);
    console.log(`📊 Found ${report.summary.totalMissingKeys} missing keys in ${report.summary.affectedNamespaces} namespaces`);
    
    // Print summary
    for (const [namespace, keys] of Object.entries(missingKeys)) {
      console.log(`🔸 ${namespace}: ${keys.length} missing keys`);
    }
    
  } catch (error) {
    console.error('❌ Error generating missing keys report:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMissingKeysReport();
}

export { generateMissingKeysReport };
