
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogoSection from '@/components/LogoSection';
import PricingCard from '@/components/PricingCard';
import PackageComparison from '@/components/PackageComparison';
import PackageFAQ from '@/components/PackageFAQ';
import TrustElements from '@/components/TrustElements';
import ProcessOverview from '@/components/ProcessOverview';
import { useServicePackages, useAddonServices } from '@/hooks/useServicePackages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AngebotePage: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error, isError } = useServicePackages();
  const { data: addons } = useAddonServices();

  // Debug logging
  React.useEffect(() => {
    console.log('AngebotePage: Component mounted/updated');
    console.log('AngebotePage: packages:', packages);
    console.log('AngebotePage: isLoading:', isLoading);
    console.log('AngebotePage: error:', error);
    console.log('AngebotePage: isError:', isError);
  }, [packages, isLoading, error, isError]);

  const renderPackagesSection = () => {
    if (isLoading) {
      console.log('AngebotePage: Rendering loading state');
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-gray-600">Lade Angebote...</p>
          </div>
        </div>
      );
    }

    if (isError || error) {
      console.log('AngebotePage: Rendering error state');
      return (
        <div className="py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Fehler beim Laden der Angebote:</strong> {error?.message || 'Unbekannter Fehler'}
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Bitte versuchen Sie es später erneut oder kontaktieren Sie unseren Support.
              </span>
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
          </div>
        </div>
      );
    }

    if (!packages || packages.length === 0) {
      console.log('AngebotePage: Rendering no packages state');
      console.log('AngebotePage: packages value:', packages);
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Angebote verfügbar</h3>
            <p className="text-gray-600 mb-4">
              Unsere Service-Pakete werden gerade aktualisiert. Bitte schauen Sie später wieder vorbei.
            </p>
            <div className="space-y-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Seite neu laden
              </Button>
              <div className="text-xs text-gray-500 mt-2">
                Debug: packages = {JSON.stringify(packages)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    console.log('AngebotePage: Rendering packages successfully, count:', packages.length);
    
    return (
      <>
        {/* Main Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {packages.map((pkg) => (
            <PricingCard key={pkg.id} package={pkg} />
          ))}
        </div>

        {/* Limited Time Offer Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-red-600 font-semibold mb-2">⏰ Nur für kurze Zeit</div>
          <h3 className="text-xl font-bold text-black mb-2">
            Bis zu 47% sparen auf alle Pakete
          </h3>
          <p className="text-gray-700">
            Profitieren Sie von unseren Einführungspreisen und sichern Sie sich 
            professionelle Online-Betreuung zu unschlagbaren Konditionen.
          </p>
        </div>

        {/* Addon Services */}
        {addons && addons.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              Zusätzlich buchbare Services
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {addons.map((addon) => (
                <div key={addon.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-black">{addon.name}</h4>
                      <p className="text-gray-600 text-sm">{addon.description}</p>
                    </div>
                    <div className="text-right">
                      {addon.original_price && addon.original_price > addon.price && (
                        <div className="text-sm text-gray-400 line-through">€{addon.original_price}</div>
                      )}
                      <div className="text-xl font-bold text-black">€{addon.price}</div>
                      <div className="text-sm text-gray-600">
                        {addon.period === 'one-time' ? 'einmalig' : `/${addon.period}`}
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {addon.features?.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LogoSection />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            Unsere Service-Pakete
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Wählen Sie das passende Paket für Ihr Restaurant und starten Sie durch mit maximaler Online-Sichtbarkeit. 
            Alle Preise verstehen sich ohne versteckte Kosten.
          </p>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {renderPackagesSection()}
        </div>
      </section>

      {/* Trust Elements */}
      <TrustElements />

      {/* Process Overview */}
      <ProcessOverview />

      {/* Package Comparison */}
      {packages && packages.length > 0 && (
        <PackageComparison packages={packages} />
      )}

      {/* FAQ Section */}
      <PackageFAQ />

      {/* Final CTA */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für mehr Online-Erfolg?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Lassen Sie uns gemeinsam Ihre Online-Präsenz auf das nächste Level bringen. 
            Kostenlose Beratung, faire Preise, messbare Ergebnisse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-black px-8 py-3">
              Kostenloses Beratungsgespräch
            </Button>
            <Button variant="outline" size="lg" className="border-white hover:bg-white px-8 py-3 text-white hover:text-black">
              WhatsApp: +49 89 123 456 789
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-gray-400">
            <p>📞 Telefonberatung: Mo-Fr 9:00-18:00 Uhr</p>
            <p>✉️ E-Mail: mail(at)matbakh(dot)app</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AngebotePage;
