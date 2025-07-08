
import React from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import ContactForm from '@/components/ContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeoMeta } from '@/components/SeoMeta';

const Kontakt: React.FC = () => {
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
        title={t('contact.title', 'Kontakt')}
        description={t('contact.subtitle', 'Kontaktieren Sie uns für Beratung und Service')}
        namespace="translation"
      />
      <AppLayout>
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8">{t('contact.title')}</h1>
            
            {/* Registration Support Section */}
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">
                  {t('contact.registrationHelp', 'Schnelle Hilfe bei Registrierungsproblemen')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-orange-700">
                  <p className="font-medium">
                    {t('contact.registrationHelpText', 'Probleme bei der Anmeldung oder Registrierung?')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>{t('contact.registrationHelpEmail', 'Geben Sie Ihre verwendete E-Mail-Adresse an')}</li>
                    <li>{t('contact.registrationHelpTime', 'Nennen Sie den genauen Zeitpunkt des Fehlers')}</li>
                    <li>{t('contact.registrationHelpDescription', 'Beschreiben Sie das Problem möglichst detailliert')}</li>
                  </ul>
                  <p className="text-sm">
                    {t('contact.registrationHelpResponse', 'Wir antworten normalerweise innerhalb von 2-4 Stunden.')}
                  </p>
                </div>
              </CardContent>
            </Card>

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

export default Kontakt;
