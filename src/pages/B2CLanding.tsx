
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Star, Search } from 'lucide-react';
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
      title: 'Personalisierte Suche',
      description: 'Finden Sie Restaurants basierend auf Ihren Vorlieben, Allergien und gewünschtem Ambiente.'
    },
    {
      icon: Users,
      title: 'Gruppenabstimmung',
      description: 'Laden Sie Freunde ein und stimmen Sie gemeinsam über Ihr nächstes Restaurant ab.'
    },
    {
      icon: MapPin,
      title: 'Direktbuchung',
      description: 'Reservieren Sie Ihren Tisch direkt über Google-Integration.'
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              Geplante Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diese Funktionen werden in Kürze für Restaurantgäste verfügbar sein
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {b2cServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="bg-white border-0 shadow-sm opacity-75">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-black">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed">
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
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('pricing.title')} - {t('pricing.viewOnly')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Übersicht unserer Restaurant-Services (nicht buchbar auf dieser Seite)
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
