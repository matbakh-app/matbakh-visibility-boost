import React from 'react';
import { useTranslation } from 'react-i18next';

const WhyMatbakhBanner: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center relative">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm sm:text-base font-medium">
          <span className="font-semibold">{t('whyMatbakh.prefix')}</span> {t('whyMatbakh.message')}
        </p>
      </div>
    </div>
  );
};

export default WhyMatbakhBanner;