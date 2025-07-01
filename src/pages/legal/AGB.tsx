
import React from 'react';
import { useTranslation } from 'react-i18next';
import LogoSection from '@/components/LogoSection';

const AGB: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <LogoSection />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('legal.agb.title')}</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.agb.scope')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.agb.scopeText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.agb.services')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.agb.servicesText')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AGB;
