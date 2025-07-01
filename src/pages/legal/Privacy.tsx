
import React from 'react';
import { useTranslation } from 'react-i18next';
import LogoSection from '@/components/LogoSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="py-8">
      <LogoSection />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('legal.privacy.title')}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('legal.privacy.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.controller')}</h3>
                <p>{t('legal.privacy.controllerInfo')}</p>
                <p>Contact: mail(at)matbakh(dot)app</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.collection')}</h3>
                <p>{t('legal.privacy.collectionText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.purpose')}</h3>
                <p>{t('legal.privacy.purposeText')}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.rights')}</h3>
                <p>{t('legal.privacy.rightsText')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
