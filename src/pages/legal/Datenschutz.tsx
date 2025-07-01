
import React from 'react';
import { useTranslation } from 'react-i18next';
import LogoSection from '@/components/LogoSection';

const Datenschutz: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <LogoSection />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('legal.datenschutz.title')}</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Datenschutz</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.datenschutz.intro')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('legal.datenschutz.googleTitle')}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.datenschutz.googleInfo')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
              {(t('legal.datenschutz.dataList', { returnObjects: true }) as string[]).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <p className="text-gray-700 leading-relaxed mt-4">
              {t('legal.datenschutz.dataUsage')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
