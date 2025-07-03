
import React from 'react';
import { useTranslation } from 'react-i18next';
import TrustElements from '@/components/TrustElements';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import PackageFAQ from '@/components/PackageFAQ';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';
import AppLayout from '@/components/layout/AppLayout';
import { SeoMeta } from '@/components/SeoMeta';

const AngeboteDE: React.FC = () => {
  const { t } = useTranslation();
  const { data: packages, isLoading, error } = useServicePackages();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{t('pricing.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">{t('pricing.errorTitle')}</h2>
          <p className="text-gray-600 mb-4">{t('pricing.errorHint')}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            {t('pricing.reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">{t('pricing.noPackagesTitle')}</h2>
          <p className="text-gray-600">{t('pricing.noPackagesText')}</p>
        </div>
      </div>
    );
  }

  const angeboteJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Matbakh",
    url: "https://matbakh.app",
    description: "Professionelle Google Business Verwaltung für Restaurants und Gastronomie",
    offers: packages?.map(pkg => ({
      "@type": "Offer",
      name: pkg.name,
      description: pkg.description,
      price: pkg.base_price,
      priceCurrency: "EUR"
    })) || []
  };

  return (
    <>
      <SeoMeta
        title={t('pricing.title', 'Angebote')}
        description={t('pricing.subtitle', 'Professionelle Google Business Verwaltung für Restaurants')}
        namespace="translation"
      />
      <AppLayout>
        <div className="py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              {t('pricing.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* Limited Time Banner */}
          <div className="bg-black text-white rounded-lg p-6 text-center mb-12">
            <h2 className="text-xl font-bold mb-2">{t('pricing.banner.text')}</h2>
            <p className="text-lg mb-2">{t('pricing.banner.discount')}</p>
            <p className="text-sm opacity-90">{t('pricing.banner.description')}</p>
          </div>

          {/* Packages Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {packages.map((pkg) => (
              <PricingCard key={pkg.id} package={pkg} language="de" />
            ))}
          </div>

          {/* Components */}
          <TrustElements language="de" />
          <ProcessOverview language="de" />
          <PackageComparison packages={packages} language="de" />
          <PackageFAQ language="de" />
        </div>
      </AppLayout>
    </>
  );
};

export default AngeboteDE;
