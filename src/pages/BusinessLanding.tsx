
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';
import { useAuth } from '@/contexts/AuthContext';

const BusinessLanding: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error } = useServicePackages();
  const { signInWithGoogle } = useAuth();

  console.log('BusinessLanding: Packages data:', packages);
  console.log('BusinessLanding: Loading state:', isLoading);
  console.log('BusinessLanding: Error:', error);

  const handlePackageSelect = (pkg: any) => {
    console.log('BusinessLanding: Package selected:', pkg.name);
    // Redirect to Google Login first
    signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-black mb-4">
            matbakh
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('landing.tagline', 'Sichtbarkeit für die Gastronomie')}
          </p>
          
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-lg text-gray-700 mb-4">
              {t('landing.hero.title', 'Verbessern Sie Ihre Online-Präsenz mit Google Business Profile')}
            </p>
            <p className="text-lg text-gray-600">
              {t('landing.hero.subtitle', 'Automatisierte Lösungen für Restaurants')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3"
              onClick={signInWithGoogle}
            >
              {t('landing.cta.primary', 'Jetzt starten')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-3"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('landing.cta.secondary', 'Mehr erfahren')}
            </Button>
          </div>
        </div>
      </section>

      {/* Info Boxes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('info.target_group.title', 'Für Gastronomen')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('info.target_group.content', 'Speziell entwickelt für Restaurants, Cafés und Imbisse')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('info.usp.title', 'Automatisierte Lösungen')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('info.usp.content', 'KI-gestützte Optimierung Ihres Google Business Profils')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Services</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-2xl mr-2">🛠</span>
                  {t('services.profile.title', 'Profil Setup')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('services.profile.description', 'Komplette Einrichtung Ihres Google Business Profils')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  {t('services.analysis.title', 'Analyse & Optimierung')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('services.analysis.description', 'Kontinuierliche Überwachung und Verbesserung')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-2xl mr-2">🧠</span>
                  {t('services.analytics.title', 'KI-Analytics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {t('services.analytics.description', 'Intelligente Auswertungen und Empfehlungen')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Angebote</h2>
          
          {isLoading ? (
            <div className="text-center">
              <div className="animate-pulse">Lade Angebote...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              Fehler beim Laden der Angebote. Bitte versuchen Sie es später erneut.
            </div>
          ) : !packages || packages.length === 0 ? (
            <div className="text-center text-gray-600">
              Momentan sind keine Angebote verfügbar. Bitte kontaktieren Sie uns direkt.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <PricingCard
                  key={pkg.id}
                  package={pkg}
                  onSelect={handlePackageSelect}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BusinessLanding;
