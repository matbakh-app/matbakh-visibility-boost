
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AGB: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('legal.agb.title')}</h1>
        
        <div className="prose max-w-none">
          <h2>{t('legal.agb.scope')}</h2>
          <p>
            {t('legal.agb.scopeText')}
          </p>
          
          <h2>{t('legal.agb.services')}</h2>
          <p>
            {t('legal.agb.servicesText')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AGB;
