
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { ServicePackage } from '@/hooks/useServicePackages';
import { useIsMobile } from '@/hooks/use-mobile';

interface PackageComparisonProps {
  packages?: ServicePackage[];
  language?: string;
}

const PackageComparison: React.FC<PackageComparisonProps> = ({ packages = [], language = 'de' }) => {
  const { t } = useTranslation('pricing');
  const isMobile = useIsMobile();

  const hasFeature = (pkg: ServicePackage, featureKey: string): boolean => {
    // Map features to actual package codes from database
    const featureMap: Record<string, string[]> = {
      'google_setup': ['google_profile_setup', 'starter_kit'],
      'profile_maintenance': ['profile_management_classic', 'profile_management_premium', 'starter_kit'],
      'social_media': ['meta_business_suite_setup', 'starter_kit'],
      'monthly_reports': ['profile_dashboard_basic', 'profile_management_classic', 'profile_management_premium', 'starter_kit'],
      'priority_support': ['profile_management_premium', 'starter_kit'],
      'strategy_calls': ['profile_management_premium', 'starter_kit'],
      'analytics': ['profile_management_classic', 'profile_management_premium', 'starter_kit']
    };
    
    return featureMap[featureKey]?.includes(pkg.slug) || false;
  };

  const features = [
    'google_setup',
    'profile_maintenance', 
    'social_media',
    'monthly_reports',
    'priority_support',
    'strategy_calls',
    'analytics'
  ];

  // If no packages provided, don't render the component
  if (!packages || packages.length === 0) {
    return null;
  }

  // Mobile Card Layout
  if (isMobile) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4 break-words">
              {t('comparison.title')}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto break-words">
              {t('comparison.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                <CardHeader className="bg-gray-100 pb-3">
                  <CardTitle className="text-center">
                    <div className="space-y-2">
                      <div className="text-base sm:text-lg font-medium break-words hyphens-auto overflow-wrap-anywhere">
                        {pkg.name}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-black">
                        €{pkg.base_price}
                        {pkg.period === 'monthly' && <span className="text-sm">/{t('comparison.monthLabel')}</span>}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {features.map((featureKey) => (
                      <div key={featureKey} className="flex items-center justify-between gap-2 min-h-[2rem]">
                        <span className="text-xs sm:text-sm font-medium flex-1 break-words hyphens-auto overflow-wrap-anywhere leading-tight">
                          {t(`comparison.features.${featureKey}`)}
                        </span>
                        <div className="flex-shrink-0">
                          {hasFeature(pkg, featureKey) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop Table Layout
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">
            {t('comparison.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('comparison.subtitle')}
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="sr-only">{t('comparison.screenReaderTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-4 font-semibold">{t('comparison.featuresHeader')}</th>
                    {packages.map((pkg) => (
                      <th key={pkg.id} className="text-center p-4 font-semibold min-w-[200px]">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{pkg.name}</div>
                          <div className="text-lg font-bold text-black">
                            €{pkg.base_price}
                            {pkg.period === 'monthly' && `/${t('comparison.monthLabel')}`}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((featureKey, index) => (
                    <tr key={featureKey} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium">{t(`comparison.features.${featureKey}`)}</td>
                      {packages.map((pkg) => (
                        <td key={pkg.id} className="text-center p-4">
                          {hasFeature(pkg, featureKey) ? (
                            <Check className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PackageComparison;
