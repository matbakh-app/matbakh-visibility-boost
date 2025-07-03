import React from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoMeta } from '@/components/SeoMeta';

const Contact: React.FC = () => {
  const { t } = useTranslation();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BaSSco (Bavarian Software Solution)",
    url: "https://matbakh.app",
    contactPoint: {
      "@type": "ContactPoint",
      email: "mail@matbakh.app",
      contactType: "customer support",
      areaServed: "DE"
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "München",
      addressCountry: "DE"
    }
  };

  return (
    <>
      <SeoMeta
        title={t('contact.title', 'Contact')}
        description={t('contact.subtitle', 'Contact us for consultation and service')}
        namespace="translation"
      />
      <AppLayout>
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4">
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
        </div>
      </AppLayout>
    </>
  );
};

export default Contact;