
import React from 'react';
import { useTranslation } from 'react-i18next';
import TrustElements from '@/components/TrustElements';
import ProcessOverview from '@/components/ProcessOverview';
import PackageComparison from '@/components/PackageComparison';
import PackageFAQ from '@/components/PackageFAQ';
import PricingCard from '@/components/PricingCard';
import { useServicePackages } from '@/hooks/useServicePackages';
import AppLayout from '@/components/layout/AppLayout';
import { SeoHead } from '@/components/SeoHead';

const PackagesEN: React.FC = () => {
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

  const packagesJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Matbakh",
    url: "https://matbakh.app",
    description: "Professional Google Business management packages for restaurants",
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
      <SeoHead
        title="Packages – Matbakh | Google Business Management for Restaurants"
        description="Professional Google Business management packages for restaurants. Setup, maintenance, and optimization services with transparent pricing."
        canonical="https://matbakh.app/packages"
        jsonLd={packagesJsonLd}
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
              <PricingCard key={pkg.id} package={pkg} language="en" />
            ))}
          </div>

          {/* Components */}
          <TrustElements language="en" />
          <ProcessOverview language="en" />
          <PackageComparison packages={packages} language="en" />
          <PackageFAQ language="en" />
        </div>
      </AppLayout>
    </>
  );
};

export default PackagesEN;
