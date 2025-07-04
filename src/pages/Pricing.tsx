import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const Pricing = () => {
  const { t } = useTranslation('legal');

  const packages = [
    {
      key: 'setupPackage',
      originalPrice: 299,
      currentPrice: 149,
      features: [
        'Complete Google Business profile creation',
        'SEO optimization for local search',
        'Categories and attributes setup',
        'Opening hours and contact data maintenance',
        'Advertising strategy with target group analysis'
      ]
    },
    {
      key: 'managementPackage',
      originalPrice: 69,
      currentPrice: 39,
      isMonthly: true,
      features: [
        '4 monthly updates of your data',
        'Upload new menus',
        'Create offers and promotions',
        'Monthly success report'
      ]
    },
    {
      key: 'socialPackage',
      originalPrice: 39,
      currentPrice: 24,
      isMonthly: true,
      features: [
        'Consistent design for posts',
        '1 post per day (30 posts/month)',
        'Content preview by you',
        'Performance tracking and analytics'
      ]
    },
    {
      key: 'premiumPackage',
      originalPrice: 947,
      currentPrice: 547,
      isPremium: true,
      features: [
        'Google Business setup included',
        '6 months profile management included',
        '1 social media channel for 6 months',
        'Personal account manager'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t('pricing.title')}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {packages.map((pkg) => (
              <Card key={pkg.key} className={`relative ${pkg.isPremium ? 'ring-2 ring-black' : ''}`}>
                {pkg.isPremium && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white">
                    {t('pricing.limitedOffer')}
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl mb-2">
                    {t(`pricing.${pkg.key}.name`)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-4">
                    {t(`pricing.${pkg.key}.description`)}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 line-through">
                      €{pkg.originalPrice}{pkg.isMonthly ? '/month' : ''}
                    </div>
                    <div className="text-3xl font-bold">
                      €{pkg.currentPrice}
                      <span className="text-sm text-gray-600">
                        {pkg.isMonthly ? `/${t('pricing.monthly')}` : ` ${t('pricing.oneTime')}`}
                      </span>
                    </div>
                    {pkg.isPremium && (
                      <div className="text-sm text-green-600 font-medium">
                        {t('pricing.premiumPackage.savings')}
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
                      {t(`pricing.${pkg.key}.duration`)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.additionalServices.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('pricing.additionalServices.uploadFee')}</li>
                  <li>• {t('pricing.additionalServices.chatbotSetup')}</li>
                  <li>• {t('pricing.additionalServices.socialSetup')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.paymentInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• {t('pricing.paymentInfo.methods')}</li>
                  <li>• {t('pricing.paymentInfo.billing')}</li>
                  <li>• {t('pricing.paymentInfo.cancellation')}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-gray-500">
            {t('pricing.vatNote')}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;