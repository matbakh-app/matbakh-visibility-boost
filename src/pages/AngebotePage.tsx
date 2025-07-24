
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SeoMeta } from '@/components/SeoMeta';
import { useServicePackages } from '@/hooks/useServicePackages';
import PricingCard from '@/components/PricingCard';
import PackageComparison from '@/components/PackageComparison';
import TrustElements from '@/components/TrustElements';
import PackageFAQ from '@/components/PackageFAQ';
import PainPointCards from '@/components/PainPointCards';

const AngebotePage: React.FC = () => {
  const { t } = useTranslation('packages');
  const { data: packages, isLoading, error } = useServicePackages();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">{t('errorTitle')}</h2>
          <p className="text-gray-600 mb-4">{t('errorHint')}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            {t('reloadPage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoMeta 
        title={t('title')}
        description={t('subtitle')}
        namespace="packages"
      />
      
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
                {t('title')}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                {t('subtitle')}
              </p>
            </div>

            {/* Limited Time Banner */}
            <div className="bg-black text-white rounded-lg p-6 text-center mb-16">
              <h2 className="text-xl font-bold mb-2">{t('banner.text')}</h2>
              <p className="text-lg mb-2">{t('banner.discount')}</p>
              <p className="text-sm opacity-90">{t('banner.description')}</p>
            </div>

            {/* Pain Point Cards */}
            <PainPointCards />

            {/* Packages Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-black text-center mb-12">
                {t('packagesTitle', 'Wählen Sie Ihr Paket')}
              </h2>
              
              {!packages || packages.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-bold text-black mb-4">{t('noPackagesTitle')}</h3>
                  <p className="text-gray-600">{t('noPackagesText')}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {packages.map((pkg) => (
                    <PricingCard key={pkg.id} package={pkg} language="de" />
                  ))}
                </div>
              )}
            </div>

            {/* Additional Components */}
            <TrustElements language="de" />
            <PackageComparison packages={packages || []} language="de" />
            <PackageFAQ language="de" />
          </div>
        </div>
      </div>
    </>
  );
};

export default AngebotePage;
