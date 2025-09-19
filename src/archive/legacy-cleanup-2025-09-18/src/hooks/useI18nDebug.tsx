import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface I18nDebugInfo {
  currentLanguage: string;
  loadedNamespaces: string[];
  missingKeys: Array<{
    key: string;
    languages: string[];
    timestamp: string;
    fallback: string;
  }>;
  validationLogs: any[];
}

/**
 * Development Hook für i18n Debugging
 * Zeigt fehlende Keys und Validation Status an
 */
export const useI18nDebug = () => {
  const { i18n } = useTranslation();
  const [debugInfo, setDebugInfo] = useState<I18nDebugInfo>({
    currentLanguage: 'de',
    loadedNamespaces: [],
    missingKeys: [],
    validationLogs: []
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateDebugInfo = () => {
      try {
        const missingKeys = JSON.parse(sessionStorage.getItem('i18n-missing-keys') || '[]');
        const validationLogs = JSON.parse(sessionStorage.getItem('i18n-validation-logs') || '[]');
        
        setDebugInfo({
          currentLanguage: i18n.language,
          loadedNamespaces: Object.keys(i18n.store?.data?.[i18n.language] || {}),
          missingKeys,
          validationLogs
        });
      } catch (error) {
        console.error('Failed to update i18n debug info:', error);
      }
    };

    // Initial update
    updateDebugInfo();

    // Listen to language changes
    const handleLanguageChange = () => {
      updateDebugInfo();
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    // Update every 5 seconds in development
    const interval = setInterval(updateDebugInfo, 5000);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      clearInterval(interval);
    };
  }, [i18n]);

  const clearDebugLogs = () => {
    if (process.env.NODE_ENV === 'development') {
      sessionStorage.removeItem('i18n-missing-keys');
      sessionStorage.removeItem('i18n-validation-logs');
      setDebugInfo(prev => ({
        ...prev,
        missingKeys: [],
        validationLogs: []
      }));
    }
  };

  const exportDebugReport = () => {
    if (process.env.NODE_ENV === 'development') {
      const report = {
        timestamp: new Date().toISOString(),
        currentLanguage: debugInfo.currentLanguage,
        loadedNamespaces: debugInfo.loadedNamespaces,
        missingKeys: debugInfo.missingKeys,
        validationLogs: debugInfo.validationLogs,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `i18n-debug-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    debugInfo,
    clearDebugLogs,
    exportDebugReport,
    hasMissingKeys: debugInfo.missingKeys.length > 0,
    isDebugMode: process.env.NODE_ENV === 'development'
  };
};

/**
 * Development Component für i18n Status Display
 */
export const I18nDebugPanel: React.FC = () => {
  const { debugInfo, clearDebugLogs, exportDebugReport, hasMissingKeys, isDebugMode } = useI18nDebug();

  if (!isDebugMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded-lg shadow-lg max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">🔍 i18n Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={clearDebugLogs}
            className="text-xs px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
          >
            Clear
          </button>
          <button
            onClick={exportDebugReport}
            className="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500"
          >
            Export
          </button>
        </div>
      </div>
      
      <div className="text-xs space-y-1">
        <div>Language: <span className="text-green-400">{debugInfo.currentLanguage}</span></div>
        <div>Namespaces: <span className="text-blue-400">{debugInfo.loadedNamespaces.length}</span></div>
        <div className={hasMissingKeys ? 'text-red-400' : 'text-green-400'}>
          Missing Keys: {debugInfo.missingKeys.length}
        </div>
        
        {hasMissingKeys && (
          <details className="mt-2">
            <summary className="cursor-pointer text-red-400">Show Missing Keys</summary>
            <div className="mt-1 max-h-32 overflow-y-auto">
              {debugInfo.missingKeys.slice(-5).map((item, index) => (
                <div key={index} className="text-xs text-red-300 truncate">
                  {item.key}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};