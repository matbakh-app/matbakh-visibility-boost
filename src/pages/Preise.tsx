import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const Preise = () => {
  const { t } = useTranslation('legal');

  const packages = [
    {
      key: 'setupPackage',
      originalPrice: 299,
      currentPrice: 149,
      features: [
        'Vollständige Google Business Profil-Erstellung',
        'SEO-Optimierung für lokale Suche', 
        'Kategorien und Attribute einrichten',
        'Öffnungszeiten und Kontaktdaten pflegen',
        'Werbestrategie mit Zielgruppen-Ermittlung'
      ]
    },
    {
      key: 'managementPackage',
      originalPrice: 69,
      currentPrice: 39,
      isMonthly: true,
      features: [
        '4 monatliche Updates Ihrer Daten',
        'Neue Speisekarten hochladen',
        'Angebote und Aktionen erstellen',
        'Monatlicher Erfolgsbericht'
      ]
    },
    {
      key: 'socialPackage',
      originalPrice: 39,
      currentPrice: 24,
      isMonthly: true,
      features: [
        'Einheitliches Design für Posts',
        '1 Post pro Tag (30 Posts/Monat)',
        'Content-Vorabprüfung durch Sie',
        'Performance-Tracking und Analytics'
      ]
    },
    {
      key: 'premiumPackage',
      originalPrice: 947,
      currentPrice: 547,
      isPremium: true,
      features: [
        'Google Business Setup inklusive',
        '6 Monate Profilpflege inklusive', 
        '1 Social Media Kanal für 6 Monate',
        'Persönlicher Account Manager'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t('preise.title')}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('preise.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {packages.map((pkg) => (
              <Card key={pkg.key} className={`relative ${pkg.isPremium ? 'ring-2 ring-black' : ''}`}>
                {pkg.isPremium && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white">
                    {t('preise.limitedOffer')}
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl mb-2">
                    {t(`preise.${pkg.key}.name`)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-4">
                    {t(`preise.${pkg.key}.description`)}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 line-through">
                      €{pkg.originalPrice}{pkg.isMonthly ? '/Monat' : ''}
                    </div>
                    <div className="text-3xl font-bold">
                      €{pkg.currentPrice}
                      <span className="text-sm text-gray-600">
                        {pkg.isMonthly ? `/${t('preise.monthly')}` : ` ${t('preise.oneTime')}`}
                      </span>
                    </div>
                    {pkg.isPremium && (
                      <div className="text-sm text-green-600 font-medium">
                        {t('preise.premiumPackage.savings')}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {t(`preise.${pkg.key}.duration`)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>{t('preise.additionalServices.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('preise.additionalServices.uploadFee')}</li>
                  <li>• {t('preise.additionalServices.chatbotSetup')}</li>
                  <li>• {t('preise.additionalServices.socialSetup')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('preise.paymentInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('preise.paymentInfo.methods')}</li>
                  <li>• {t('preise.paymentInfo.billing')}</li>
                  <li>• {t('preise.paymentInfo.cancellation')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-gray-500">
            {t('preise.vatNote')}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Preise;