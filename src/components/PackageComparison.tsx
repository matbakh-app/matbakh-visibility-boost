
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { ServicePackage } from '@/hooks/useServicePackages';

interface PackageComparisonProps {
  packages: ServicePackage[];
  lang?: 'de' | 'en';
}

const PackageComparison: React.FC<PackageComparisonProps> = ({ packages, lang = 'de' }) => {
  const { t } = useTranslation();

  const hasFeature = (pkg: ServicePackage, featureKey: string): boolean => {
    const featureMap: Record<string, string[]> = {
      'google_setup': ['google-business-setup', 'premium-business-paket'],
      'profile_maintenance': ['profilpflege-basis', 'premium-business-paket'],
      'social_media': ['social-media-management', 'premium-business-paket'],
      'monthly_reports': ['profilpflege-basis', 'premium-business-paket'],
      'priority_support': ['premium-business-paket'],
      'strategy_calls': ['premium-business-paket'],
      'analytics': ['premium-business-paket']
    };
    
    return featureMap[featureKey]?.includes(pkg.slug) || false;
  };

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
                  {['google_setup', 'profile_maintenance', 'social_media', 'monthly_reports', 'priority_support', 'strategy_calls', 'analytics'].map((featureKey, index) => (
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
