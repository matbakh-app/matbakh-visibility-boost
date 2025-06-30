
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AngebotePage: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error } = useServicePackages();

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
            Unsere Angebote
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Wählen Sie das passende Paket für Ihr Restaurant und starten Sie durch mit maximaler Online-Sichtbarkeit.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {renderPackagesSection()}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AngebotePage;
