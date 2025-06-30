
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Search, Calendar, ShoppingCart, Settings, Edit } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';

const B2CLanding: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error } = useServicePackages();

  const b2cServices = [
    {
      icon: Search,
      title: t('features.search.title'),
      description: t('features.search.description'),
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'bg-blue-500'
    },
    {
      icon: Users,
      title: t('features.voting.title'),
      description: t('features.voting.description'),
      color: 'bg-green-50 border-green-200',
      iconColor: 'bg-green-500'
    },
    {
      icon: MapPin,
      title: t('features.booking.title'),
      description: t('features.booking.description'),
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'bg-purple-500'
    },
    {
      icon: Calendar,
      title: t('features.weeklyMenu.title'),
      description: t('features.weeklyMenu.description'),
      color: 'bg-orange-50 border-orange-200',
      iconColor: 'bg-orange-500'
    },
    {
      icon: ShoppingCart,
      title: t('features.shoppingList.title'),
      description: t('features.shoppingList.description'),
      color: 'bg-red-50 border-red-200',
      iconColor: 'bg-red-500'
    },
    {
      icon: Settings,
      title: t('features.calendarManagement.title'),
      description: t('features.calendarManagement.description'),
      color: 'bg-teal-50 border-teal-200',
      iconColor: 'bg-teal-500'
    },
    {
      icon: Edit,
      title: t('features.mealAdjustment.title'),
      description: t('features.mealAdjustment.description'),
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            {t('hero.b2cTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.b2cSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gray-400 hover:bg-gray-400 text-white px-8 py-3 cursor-not-allowed" 
              disabled
            >
              {t('hero.b2cCta')}
            </Button>
            <div className="text-sm text-gray-500 mt-2">
              {t('hero.b2cNote')}
            </div>
          </div>
        </div>
      </section>

      {/* B2C Services Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {b2cServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className={`${service.color} border-2 hover:shadow-lg transition-all duration-300 opacity-90`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-14 h-14 ${service.iconColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-black">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section - View Only */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Lade Pakete...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              <p>Fehler beim Laden der Pakete: {error.message}</p>
            </div>
          ) : packages && packages.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <PricingCard key={pkg.id} package={pkg} viewOnly={true} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p>Keine Pakete verfügbar</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default B2CLanding;
