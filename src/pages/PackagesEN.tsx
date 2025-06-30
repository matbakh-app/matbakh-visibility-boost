
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

const PackagesEN: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: packages, isLoading, error, isError } = useServicePackages();
  const { data: addons } = useAddonServices();

  // Ensure English language
  React.useEffect(() => {
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
  }, [i18n]);

  const renderPackagesSection = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-gray-600">{t('pricing.loading')}</p>
          </div>
        </div>
      );
    }

    if (isError || error) {
      return (
        <div className="py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('pricing.errorTitle')}:</strong> {error?.message || t('pricing.errorUnknown')}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!packages || packages.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('pricing.noPackagesText')}</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {packages.map((pkg) => (
            <PricingCard key={pkg.id} package={pkg} lang="en" />
          ))}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-red-600 font-semibold mb-2">⏰ {t('pricing.banner.text')}</div>
          <h3 className="text-xl font-bold text-black mb-2">
            {t('pricing.banner.discount')}
          </h3>
          <p className="text-gray-700">
            {t('pricing.banner.description')}
          </p>
        </div>

        {addons && addons.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              {t('pricing.addonsTitle')}
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
                        {addon.period === 'one-time' ? t('pricing.oneTime') : `/${addon.period}`}
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
      
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-black mb-6">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {renderPackagesSection()}
        </div>
      </section>

      <TrustElements lang="en" />
      <ProcessOverview lang="en" />
      {packages && packages.length > 0 && (
        <PackageComparison packages={packages} lang="en" />
      )}
      <PackageFAQ lang="en" />

      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('pricing.cta.headline')}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('pricing.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-black px-8 py-3">
              {t('pricing.cta.consultation')}
            </Button>
            <Button variant="outline" size="lg" className="border-white hover:bg-white px-8 py-3 text-white hover:text-black">
              {t('pricing.cta.whatsapp')}
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-gray-400">
            <p>{t('pricing.cta.phone')}</p>
            <p>{t('pricing.cta.email')}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PackagesEN;
