
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Impressum: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('legal.impressum.title')}</h1>
        
        <div className="prose max-w-none">
          <h2>{t('legal.impressum.companyInfo')}</h2>
          <p>
            {t('legal.impressum.company')}<br />
            {t('legal.impressum.location')}
          </p>
          
          <h2>{t('legal.impressum.contactTitle')}</h2>
          <p>
            {t('legal.impressum.email')}
          </p>
          
          <h2>{t('legal.impressum.disclaimerTitle')}</h2>
          <p>
            {t('legal.impressum.disclaimer')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Impressum;
