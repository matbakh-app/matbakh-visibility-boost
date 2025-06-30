
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Datenschutz: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('legal.datenschutz.title')}</h1>
        
        <div className="prose max-w-none">
          <h2>Datenschutz</h2>
          <p>
            {t('legal.datenschutz.intro')}
          </p>
          
          <h2>{t('legal.datenschutz.googleTitle')}</h2>
          <p>
            {t('legal.datenschutz.googleInfo')}
          </p>
          <ul>
            {(t('legal.datenschutz.dataList', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          
          <p>
            {t('legal.datenschutz.dataUsage')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Datenschutz;
