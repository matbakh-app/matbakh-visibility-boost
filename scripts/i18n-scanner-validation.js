
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Erweiterte i18n Validierung nach Scanner-Ausführung
 */
async function validateI18nAfterScan() {
  console.log('🔍 Starte i18n-Validierung nach Scanner-Ausführung...\n');

  // 1. Scanner ausführen
  console.log('📡 Führe i18next-scanner aus...');
  exec('npx i18next-scanner', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Scanner-Fehler:', error);
      return;
    }
    
    console.log('✅ Scanner erfolgreich ausgeführt');
    if (stdout) console.log('📋 Scanner Output:', stdout);
    if (stderr) console.log('⚠️  Scanner Warnings:', stderr);

    // 2. Validierung starten
    validateTranslationFiles();
  });
}

function validateTranslationFiles() {
  console.log('\n📊 Validiere Übersetzungsdateien...\n');
  
  const localesDir = path.join(__dirname, '..', 'public', 'locales');
  const languages = ['de', 'en'];
  
  let missingKeys = [];
  let inconsistentKeys = [];
  let emptyKeys = [];

  languages.forEach(lang => {
    const langDir = path.join(localesDir, lang);
    if (!fs.existsSync(langDir)) {
      console.log(`❌ Sprach-Ordner fehlt: ${lang}`);
      return;
    }

    // Alle JSON-Dateien in diesem Sprachordner lesen
    const files = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(langDir, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const namespace = file.replace('.json', '');
        
        // Prüfe auf leere Keys
        checkForEmptyKeys(content, namespace, lang, emptyKeys);
        
        // Prüfe Konsistenz zwischen Sprachen
        if (lang === 'en') {
          checkConsistency(content, namespace, inconsistentKeys);
        }
        
        console.log(`✅ ${lang}/${file} - ${countKeys(content)} Keys gefunden`);
      } catch (error) {
        console.log(`❌ Fehler beim Lesen von ${lang}/${file}:`, error.message);
      }
    });
  });

  // Bericht ausgeben
  generateReport(missingKeys, inconsistentKeys, emptyKeys);
}

function checkForEmptyKeys(obj, namespace, lang, emptyKeys, keyPath = '') {
  Object.keys(obj).forEach(key => {
    const fullKey = keyPath ? `${keyPath}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      checkForEmptyKeys(value, namespace, lang, emptyKeys, fullKey);
    } else if (!value || value.trim() === '') {
      emptyKeys.push({
        namespace,
        language: lang,
        key: fullKey,
        value: value
      });
    }
  });
}

function checkConsistency(enContent, namespace, inconsistentKeys) {
  const dePath = path.join(__dirname, '..', 'public', 'locales', 'de', `${namespace}.json`);
  
  if (!fs.existsSync(dePath)) {
    inconsistentKeys.push({
      namespace,
      issue: 'DE-Datei fehlt'
    });
    return;
  }

  try {
    const deContent = JSON.parse(fs.readFileSync(dePath, 'utf8'));
    const enKeys = getAllKeys(enContent);
    const deKeys = getAllKeys(deContent);
    
    // Fehlende Keys in DE finden
    const missingInDE = enKeys.filter(key => !deKeys.includes(key));
    const missingInEN = deKeys.filter(key => !enKeys.includes(key));
    
    if (missingInDE.length > 0 || missingInEN.length > 0) {
      inconsistentKeys.push({
        namespace,
        missingInDE,
        missingInEN
      });
    }
  } catch (error) {
    inconsistentKeys.push({
      namespace,
      issue: `Fehler beim Lesen der DE-Datei: ${error.message}`
    });
  }
}

function getAllKeys(obj, keyPath = '') {
  let keys = [];
  
  Object.keys(obj).forEach(key => {
    const fullKey = keyPath ? `${keyPath}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  });
  
  return keys;
}

function countKeys(obj) {
  return getAllKeys(obj).length;
}

function generateReport(missingKeys, inconsistentKeys, emptyKeys) {
  console.log('\n📋 VALIDIERUNGSBERICHT\n');
  console.log('='.repeat(50));
  
  console.log(`\n📊 Statistiken:`);
  console.log(`   - Leere Keys: ${emptyKeys.length}`);
  console.log(`   - Inkonsistente Namespaces: ${inconsistentKeys.length}`);
  
  if (emptyKeys.length > 0) {
    console.log(`\n🔍 Leere Keys:`);
    emptyKeys.forEach(item => {
      console.log(`   - ${item.language}/${item.namespace}: ${item.key}`);
    });
  }
  
  if (inconsistentKeys.length > 0) {
    console.log(`\n⚠️  Inkonsistenzen:`);
    inconsistentKeys.forEach(item => {
      console.log(`   - ${item.namespace}:`);
      if (item.missingInDE && item.missingInDE.length > 0) {
        console.log(`     * Fehlt in DE: ${item.missingInDE.join(', ')}`);
      }
      if (item.missingInEN && item.missingInEN.length > 0) {
        console.log(`     * Fehlt in EN: ${item.missingInEN.join(', ')}`);
      }
      if (item.issue) {
        console.log(`     * Problem: ${item.issue}`);
      }
    });
  }
  
  console.log('\n✅ Validierung abgeschlossen!');
  
  // Empfehlungen
  console.log('\n💡 Empfehlungen:');
  console.log('   - Führe regelmäßig "npm run i18n:scan" aus');
  console.log('   - Prüfe leere Keys und fülle sie mit Inhalten');
  console.log('   - Halte DE und EN Dateien synchron');
  console.log('\n');
}

// Script ausführen
if (require.main === module) {
  validateI18nAfterScan();
}

module.exports = {
  validateI18nAfterScan,
  validateTranslationFiles
};
