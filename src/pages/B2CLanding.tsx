
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Users, Calendar, ChefHat, ShoppingCart, Utensils, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackHomeButtons from '@/components/navigation/BackHomeButtons';

const B2CLanding: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Search className="h-8 w-8 text-blue-600" />,
      titleKey: 'features.search.title',
      descriptionKey: 'features.search.description'
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      titleKey: 'features.voting.title',
      descriptionKey: 'features.voting.description'
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      titleKey: 'features.booking.title',
      descriptionKey: 'features.booking.description'
    },
    {
      icon: <ChefHat className="h-8 w-8 text-orange-600" />,
      titleKey: 'features.weeklyMenu.title',
      descriptionKey: 'features.weeklyMenu.description'
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-red-600" />,
      titleKey: 'features.shoppingList.title',
      descriptionKey: 'features.shoppingList.description'
    },
    {
      icon: <Target className="h-8 w-8 text-indigo-600" />,
      titleKey: 'features.calendarManagement.title',
      descriptionKey: 'features.calendarManagement.description'
    },
    {
      icon: <Utensils className="h-8 w-8 text-pink-600" />,
      titleKey: 'features.mealAdjustment.title',
      descriptionKey: 'features.mealAdjustment.description'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <BackHomeButtons />
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4">
            {t('hero.b2cTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('hero.b2cSubtitle')}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-block">
            <p className="text-yellow-800 font-medium text-lg">
              {t('hero.b2cNote')}
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black text-center mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            {t('features.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-gray-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <CardTitle className="text-xl font-bold text-black">
                      {t(feature.titleKey)}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 text-base">
                    {t(feature.descriptionKey)}
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
            Bleiben Sie auf dem Laufenden und erfahren Sie als Erste, wenn diese Features verfügbar sind.
          </p>
          <Button size="lg" disabled className="opacity-50">
            {t('hero.b2cNote')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default B2CLanding;
