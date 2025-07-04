// Navigation Integrity Validator
// Prüft kritische Navigation-Keys zur Build-Zeit

export interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  showInNav: boolean;
  showInFooter?: boolean;
  protected?: boolean;
  roles?: string[];
  hrefs?: { de: string; en: string };
}

export function validateNavigationIntegrity(items: NavItem[]): void {
  const mustHave = ['home', 'offers', 'services', 'contact'];
  const missing = mustHave.filter(key => !items.find(item => item.key === key));
  
  if (missing.length > 0) {
    console.error(
      `❌ Navigation fehlt kritische Keys: ${missing.join(', ')}`
    );
    console.error(
      `   Verfügbare Keys: ${items.map(i => i.key).join(', ')}`
    );
    
    if (process.env.CI || process.env.NODE_ENV === 'production') {
      console.error('🚨 Build gestoppt wegen fehlender Navigation-Keys!');
      process.exit(1);
    }
  }

  // Prüfe kritische URLs
  const offersItem = items.find(item => item.key === 'offers');
  if (offersItem) {
    const expectedHrefs = { de: '/angebote', en: '/packages' };
    
    if (!offersItem.hrefs || 
        offersItem.hrefs.de !== expectedHrefs.de || 
        offersItem.hrefs.en !== expectedHrefs.en) {
      console.error('❌ Offers-URLs sind nicht korrekt konfiguriert!');
      console.error(`   Erwartet: ${JSON.stringify(expectedHrefs)}`);
      console.error(`   Gefunden: ${JSON.stringify(offersItem.hrefs)}`);
      
      if (process.env.CI || process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  console.log('✅ Navigation-Integrität bestätigt');
}

export function validateTranslationKeys(
  items: NavItem[], 
  deTranslations: Record<string, string>, 
  enTranslations: Record<string, string>
): void {
  const missingDE: string[] = [];
  const missingEN: string[] = [];

  items
    .filter(item => item.showInNav || item.showInFooter)
    .forEach(item => {
      const key = item.labelKey.replace('nav.', '');
      
      if (!deTranslations[key]) {
        missingDE.push(key);
      }
      if (!enTranslations[key]) {
        missingEN.push(key);
      }
    });

  if (missingDE.length > 0) {
    console.error(`❌ Fehlende deutsche Übersetzungen: ${missingDE.join(', ')}`);
  }
  if (missingEN.length > 0) {
    console.error(`❌ Fehlende englische Übersetzungen: ${missingEN.join(', ')}`);
  }

  if ((missingDE.length > 0 || missingEN.length > 0) && 
      (process.env.CI || process.env.NODE_ENV === 'production')) {
    process.exit(1);
  }

  console.log('✅ Übersetzungs-Vollständigkeit bestätigt');
}