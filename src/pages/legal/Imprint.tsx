
import React from 'react';
import { useTranslation } from 'react-i18next';
import LogoSection from '@/components/LogoSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Imprint: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <LogoSection />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('legal.imprint.title')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('legal.imprint.companyInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{t('nav.contact')}</h3>
                <p>{t('legal.imprint.company')}</p>
                <p>{t('legal.imprint.location')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">{t('legal.imprint.contactTitle')}</h3>
                <p>{t('legal.imprint.email')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">{t('legal.imprint.responsibleTitle')}</h3>
                <p>{t('legal.imprint.responsible')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Imprint;
