
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Users, Calendar, ChefHat, ShoppingCart, Utensils, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import Logo from '@/components/Logo';
import { SeoMeta } from '@/components/SeoMeta';

const B2CLanding: React.FC = () => {
  const { t: tFeatures } = useTranslation('features');
  const { t } = useTranslation(); // Für landing namespace

  const features = [
    {
      icon: <Search className="h-8 w-8 text-blue-600" />,
      titleKey: 'search.title',
      descriptionKey: 'search.description'
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      titleKey: 'voting.title',
      descriptionKey: 'voting.description'
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      titleKey: 'booking.title',
      descriptionKey: 'booking.description'
    },
    {
      icon: <ChefHat className="h-8 w-8 text-orange-600" />,
      titleKey: 'weeklyMenu.title',
      descriptionKey: 'weeklyMenu.description'
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-red-600" />,
      titleKey: 'shoppingList.title',
      descriptionKey: 'shoppingList.description'
    },
    {
      icon: <Target className="h-8 w-8 text-indigo-600" />,
      titleKey: 'calendarManagement.title',
      descriptionKey: 'calendarManagement.description'
    },
    {
      icon: <Utensils className="h-8 w-8 text-pink-600" />,
      titleKey: 'mealAdjustment.title',
      descriptionKey: 'mealAdjustment.description'
    }
  ];

  const b2cJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Matbakh für Gäste",
    url: "https://matbakh.app/b2c",
    description: "Smart restaurant discovery and group dining solutions for food lovers",
    applicationCategory: "RestaurantApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR"
    }
  };

  return (
    <>
      <SeoMeta
        title={t('landing.heroTitle')}
        description={t('landing.heroSubtitle')}
        namespace="translation"
      />
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero Section with Logo - using unified landing namespace */}
          <div className="text-center mb-16">
            <Logo size="lg" className="mx-auto mb-2" />
            <h1 className="mt-2 text-4xl font-bold text-black mb-4">
              Für Gäste
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Smart Restaurant Discovery
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-block">
              <p className="text-yellow-800 font-medium text-lg">
                Demnächst verfügbar
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-black text-center mb-4">
              {tFeatures('title')}
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12">
              {tFeatures('subtitle')}
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-gray-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {feature.icon}
                      <CardTitle className="text-xl font-bold text-black">
                        {tFeatures(feature.titleKey)}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-gray-600 text-base">
                      {tFeatures(feature.descriptionKey)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">
              Interessiert?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Lassen Sie sich benachrichtigen, wenn wir für Gäste verfügbar sind.
            </p>
            <Button size="lg" disabled className="opacity-50">
              Demnächst verfügbar
            </Button>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default B2CLanding;
