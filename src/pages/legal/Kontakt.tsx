
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogoSection from '@/components/LogoSection';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Kontakt: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LogoSection />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('contact.title')}</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.subtitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{t('contact.company')}</h3>
                  <p>{t('contact.location')}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">{t('contact.email')}</h3>
                  <p>mail(at)matbakh(dot)app</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">
                    {t('contact.responseTime')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <ContactForm />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Kontakt;
