
import React from 'react';
import { useTranslation } from 'react-i18next';

const HeroSection: React.FC = () => {
  const { t } = useTranslation('dashboard');
  
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg p-6 mb-8">
      <h2 className="text-3xl font-bold mb-2">{t('hero.title')}</h2>
      <p className="mb-4">{t('hero.subtitle')}</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="text-5xl font-extrabold">87<span className="text-lg">/100</span></div>
        <ul className="mt-4 md:mt-0 space-y-2">
          <li>📈 {t('hero.topInsight1')}</li>
          <li>💬 {t('hero.topInsight2')}</li>
        </ul>
      </div>
      <div className="mt-4 text-sm italic">{t('hero.poweredBy')}</div>
    </section>
  );
};

export default HeroSection;
