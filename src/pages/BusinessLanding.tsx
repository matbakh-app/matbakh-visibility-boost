
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, BarChart3, Brain, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error } = useServicePackages();

  console.log('BusinessLanding: Current state:');
  console.log('- Packages:', packages);
  console.log('- Loading:', isLoading);
  console.log('- Error:', error);

  const services = [
    {
      icon: Wrench,
      title: t('services.setup.title'),
      description: t('services.setup.description')
    },
    {
      icon: BarChart3,
      title: t('services.management.title'),
      description: t('services.management.description')
    },
    {
      icon: Brain,
      title: t('services.analytics.title'),
      description: t('services.analytics.description')
    }
  ];

  const renderPackagesSection = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-gray-600">Lade Angebote...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Fehler beim Laden der Angebote:</strong> {error.message}
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Bitte versuchen Sie es später erneut oder kontaktieren Sie unseren Support.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!packages || packages.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Angebote verfügbar</h3>
            <p className="text-gray-600 mb-4">
              Unsere Service-Pakete werden gerade aktualisiert. Bitte schauen Sie später wieder vorbei.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <PricingCard key={pkg.id} package={pkg} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3">
              {t('hero.cta')}
            </Button>
            <Button variant="outline" size="lg" className="border-black text-black hover:bg-gray-50 px-8 py-3">
              {t('hero.consultation')}
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('services.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
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

      {/* Pricing Section */}
      <section id="packages" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          {renderPackagesSection()}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BusinessLanding;
