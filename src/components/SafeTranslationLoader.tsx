import React from 'react';
import { useSafeTranslation } from '@/hooks/useSafeTranslation';

/**
 * Komponente die i18n-Kontext erfordert
 */
export const RequireI18nContext: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { isReady } = useSafeTranslation();
  
  if (!isReady) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-800 font-semibold">🔤 i18n wird geladen...</div>
        <div className="text-blue-600 text-sm">
          Übersetzungen werden initialisiert.
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

/**
 * Einfacher Loader für i18n-Initialisierung
 */
export const SafeTranslationLoader: React.FC = () => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="text-blue-800 font-semibold">🔤 i18n wird geladen...</div>
    <div className="text-blue-600 text-sm">
      Übersetzungen werden initialisiert.
    </div>
  </div>
);