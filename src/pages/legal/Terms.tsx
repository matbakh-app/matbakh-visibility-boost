
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('legal.terms.title')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('legal.terms.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.terms.scope')}</h3>
                <p>{t('legal.terms.scopeText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.terms.services')}</h3>
                <p>{t('legal.terms.servicesText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.terms.payment')}</h3>
                <p>{t('legal.terms.paymentText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.terms.liability')}</h3>
                <p>{t('legal.terms.liabilityText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.terms.law')}</h3>
                <p>{t('legal.terms.lawText')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
