
import React from 'react';
import { useTranslation } from 'react-i18next';
import LogoSection from '@/components/LogoSection';

const Nutzung: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <LogoSection />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('legal.usage.title')}</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.scope')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.scopeText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.services')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.servicesText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.userRights')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.userRightsText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.userObligations')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.userObligationsText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.liability')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.liabilityText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.termination')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.terminationText')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.usage.law')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.usage.lawText')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Nutzung;
