
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
            <p className="text-gray-600">{t('pricing.loading')}</p>
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
              <strong>{t('pricing.errorTitle')}:</strong> {error?.message || t('pricing.errorUnknown')}
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                {t('pricing.errorHint')}
              </span>
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t('pricing.reloadPage')}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('pricing.noPackagesTitle')}</h3>
            <p className="text-gray-600 mb-4">
              {t('pricing.noPackagesText')}
            </p>
            <div className="space-y-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                {t('pricing.reloadPage')}
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
          <div className="text-red-600 font-semibold mb-2">⏰ {t('pricing.banner.text')}</div>
          <h3 className="text-xl font-bold text-black mb-2">
            {t('pricing.banner.discount')}
          </h3>
          <p className="text-gray-700">
            {t('pricing.banner.description')}
          </p>
        </div>

        {/* Addon Services */}
        {addons && addons.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">
              {t('pricing.addonsTitle')}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {addons.map((addon) => {
                // Map addon slugs to translation keys
                const getAddonTranslation = (addonSlug: string) => {
                  const slugMap: Record<string, string> = {
                    'social-media-setup': 'social_setup',
                    'google-chatbot-setup': 'google_chatbot',
                    'instagram-setup': 'instagram_setup',
                    'facebook-setup': 'facebook_setup',
                    'social-media-chatbot': 'social_chatbot'
                  };
                  // Temporäres Debug-Logging
                  console.log('Addon slug:', addonSlug, 'mapped to:', slugMap[addonSlug] || addonSlug);
                  return slugMap[addonSlug] || addonSlug;
                };

                const translationKey = getAddonTranslation(addon.slug);
                const translatedName = t(`addons.${translationKey}.name`, { defaultValue: addon.name });
                const translatedDescription = t(`addons.${translationKey}.description`, { defaultValue: addon.description });
                const translatedFeatures = t(`addons.${translationKey}.features`, { returnObjects: true, defaultValue: addon.features }) as string[];

                return (
                  <div key={addon.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-black">{translatedName}</h4>
                        <p className="text-gray-600 text-sm">{translatedDescription}</p>
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
                      {translatedFeatures?.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <span className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
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
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('pricing.subtitle')}
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

export default AngebotePage;
