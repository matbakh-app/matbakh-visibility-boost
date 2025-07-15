
/**
 * Utility für sprachspezifisches Legal-Namespace-Mapping
 * Verhindert 404-Fehler durch korrekte Zuordnung der Namespace-Namen
 */

export type LegalPageType = 'privacy' | 'imprint' | 'terms' | 'usage' | 'contact';

/**
 * Gibt den korrekten Namespace-Namen für eine Legal-Seite basierend auf der Sprache zurück
 * @param lang - Aktuelle Sprache (z.B. 'de', 'en', 'de-DE')
 * @param pageType - Typ der Legal-Seite
 * @returns Korrekter Namespace-Name für die gegebene Sprache
 */
export const getNamespaceForLegalPage = (lang: string, pageType: LegalPageType): string => {
  const isDe = lang === 'de' || lang.startsWith('de');
  
  const namespaceMap: Record<LegalPageType, { de: string; en: string }> = {
    privacy: { de: 'legal-datenschutz', en: 'legal-privacy' },
    imprint: { de: 'legal-impressum', en: 'legal-imprint' },
    terms: { de: 'legal-agb', en: 'legal-terms' },
    usage: { de: 'legal-nutzung', en: 'legal-usage' },
    contact: { de: 'legal-kontakt', en: 'legal-contact' }
  };

  const mapping = namespaceMap[pageType];
  if (!mapping) {
    console.warn(`[getLegalNamespace] Unknown pageType: ${pageType}, fallback to privacy`);
    return isDe ? 'legal-datenschutz' : 'legal-privacy';
  }

  const namespace = isDe ? mapping.de : mapping.en;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[getLegalNamespace] Language: ${lang}, PageType: ${pageType} → Namespace: ${namespace}`);
  }
  
  return namespace;
};

/**
 * Prüft, ob ein Namespace bereits für eine Sprache geladen ist
 * @param i18n - i18next Instanz
 * @param language - Sprache
 * @param namespace - Namespace
 * @returns true wenn der Namespace verfügbar ist
 */
export const isNamespaceLoaded = (i18n: any, language: string, namespace: string): boolean => {
  return i18n.hasResourceBundle(language, namespace);
};

/**
 * Lädt einen Legal-Namespace dynamisch und wartet auf das Laden
 * @param i18n - i18next Instanz
 * @param namespace - Namespace der geladen werden soll
 * @returns Promise das resolves wenn der Namespace geladen ist
 */
export const loadLegalNamespace = async (i18n: any, namespace: string): Promise<void> => {
  if (!isNamespaceLoaded(i18n, i18n.language, namespace)) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[loadLegalNamespace] Loading namespace: ${namespace} for language: ${i18n.language}`);
    }
    
    try {
      await i18n.loadNamespaces(namespace);
    } catch (error) {
      console.error(`[loadLegalNamespace] Failed to load namespace ${namespace}:`, error);
    }
  }
};
