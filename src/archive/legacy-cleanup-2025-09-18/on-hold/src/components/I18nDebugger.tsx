
import React from 'react';
import { useTranslation } from 'react-i18next';

const I18nDebugger: React.FC = () => {
  const { t, i18n } = useTranslation('packages');

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">i18n Debug</h4>
      <p>Language: {i18n.language}</p>
      <p>Namespace: packages</p>
      <p>Ready: {i18n.isInitialized ? 'Yes' : 'No'}</p>
      <hr className="my-2" />
      <p>Test Key: {t('title', 'FALLBACK')}</p>
      <p>Pain Points: {t('painPoints.title', 'FALLBACK')}</p>
      <p>Banner: {t('banner.text', 'FALLBACK')}</p>
      <hr className="my-2" />
      <p>Loaded Resources:</p>
      <pre className="text-xs overflow-auto max-h-20">
        {JSON.stringify(i18n.getResourceBundle(i18n.language, 'packages'), null, 2)}
      </pre>
    </div>
  );
};

export default I18nDebugger;
