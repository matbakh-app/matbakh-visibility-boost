/**
 * Sichere i18n-Konfiguration mit 0-Fehler-Toleranz
 * Re-export der lib/i18n.ts mit zusätzlicher Sicherheit
 */

import i18n from './lib/i18n';

// Sicherstellen, dass i18n initialisiert ist
if (!i18n.isInitialized) {
  console.warn('⚠️ i18n not initialized, forcing initialization...');
  
  // Fallback-Initialisierung falls Backend fehlschlägt
  i18n.init({
    lng: 'de',
    fallbackLng: 'de',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      de: {
        common: {
          loading: 'Lädt...',
          error: 'Fehler',
          retry: 'Wiederholen',
          cancel: 'Abbrechen',
          save: 'Speichern',
          delete: 'Löschen',
          edit: 'Bearbeiten',
          close: 'Schließen',
        },
        navigation: {
          home: 'Startseite',
          dashboard: 'Dashboard',
          settings: 'Einstellungen',
          logout: 'Abmelden',
        }
      },
      en: {
        common: {
          loading: 'Loading...',
          error: 'Error',
          retry: 'Retry',
          cancel: 'Cancel',
          save: 'Save',
          delete: 'Delete',
          edit: 'Edit',
          close: 'Close',
        },
        navigation: {
          home: 'Home',
          dashboard: 'Dashboard',
          settings: 'Settings',
          logout: 'Logout',
        }
      }
    }
  }).catch(error => {
    console.error('❌ i18n initialization failed:', error);
  });
}

export default i18n;