import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { ServicePackage } from '@/hooks/useServicePackages';

interface PricingCardProps {
  package: ServicePackage;
  viewOnly?: boolean;
  language?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ package: pkg, viewOnly = false, language = 'de' }) => {
  const { t } = useTranslation();

  // Package name mapping for new package structure
  const packageNameMap: Record<string, Record<'de' | 'en', string>> = {
    'profile_dashboard_basic': {
      de: 'Dashboard Basic',
      en: 'Dashboard Basic'
    },
    'google_profile_setup': {
      de: 'Google Profil Setup',
      en: 'Google Profile Setup'
    },
    'profile_management_classic': {
      de: 'Profil Management Classic',
      en: 'Profile Management Classic'
    },
    'profile_management_premium': {
      de: 'Profil Management Premium',
      en: 'Profile Management Premium'
    },
    'meta_business_suite_setup': {
      de: 'Meta Business Suite Setup',
      en: 'Meta Business Suite Setup'
    },
    'starter_kit': {
      de: 'Starter Kit',
      en: 'Starter Kit'
    }
  };

  const getFeaturesBySlug = (packageSlug: string) => {
    try {
      // Try to get features from translation files first
      const translatedFeatures = t(`packages.${packageSlug}.features`, { returnObjects: true });
      if (Array.isArray(translatedFeatures)) {
        return translatedFeatures;
      }
    } catch (error) {
      console.warn(`No translation found for packages.${packageSlug}.features`);
    }
    
    // Fallback to package.features if translation fails
    return pkg.features || [];
  };

  const getPackageName = (packageSlug: string) => {
    // First try translation key, then fallback to mapping, then default name
    try {
      const translatedName = t(`packages.${packageSlug}.title`);
      if (translatedName && translatedName !== `packages.${packageSlug}.title`) {
        return translatedName;
      }
    } catch (error) {
      console.warn(`No translation found for packages.${packageSlug}.title`);
    }
    
    return packageNameMap[packageSlug]?.[language as 'de' | 'en'] || pkg.name;
  };

  const packageFeatures = getFeaturesBySlug(pkg.slug);
  
  // Ensure packageFeatures is always an array
  const safeFeatures = Array.isArray(packageFeatures) ? packageFeatures : (pkg.features || []);

  return (
    <Card className={`relative bg-white ${pkg.is_recommended ? 'border-black border-2' : 'border-gray-200'} ${viewOnly ? 'opacity-90' : ''}`}>
      {pkg.is_recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-black text-white px-4 py-1">
            {t('pricing.recommended')}
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold text-black">
          {getPackageName(pkg.slug)}
        </CardTitle>
        <div className="mt-4">
          {/* Handle missing price gracefully */}
          {pkg.base_price === 0 ? (
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-600">
                {t('pricing.priceOnRequest')}
              </span>
              <p className="text-gray-500 mt-1 text-sm">
                {t('pricing.contactUs')}
              </p>
            </div>
          ) : (
            <>
              {pkg.original_price && pkg.original_price > pkg.base_price && (
                <>
                  <p className="text-sm text-red-600 font-medium mb-1">
                    {t('pricing.limitedTime')}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl text-gray-400 line-through">
                      {pkg.original_price.toFixed(2)} €
                    </span>
                    <span className="text-3xl font-bold text-black">
                      {pkg.base_price.toFixed(2)} €
                    </span>
                  </div>
                </>
              )}
              {(!pkg.original_price || pkg.original_price <= pkg.base_price) && (
                <span className="text-3xl font-bold text-black">
                  {pkg.base_price.toFixed(2)} €
                </span>
              )}
              <p className="text-gray-600 mt-1">
                {pkg.period === 'monthly' ? `/${t('pricing.month')}` : 
                 pkg.slug === 'starter_kit' ? t('pricing.sixMonths') : 
                 t('pricing.oneTime')}
              </p>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-6">
          {safeFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm leading-relaxed">
                {feature}
              </span>
            </div>
          ))}
        </div>
        
        <Button 
          className={`w-full ${viewOnly ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}
          size="lg"
          disabled={viewOnly}
        >
          {viewOnly ? t('pricing.viewOnly') : t('pricing.selectPackage')}
        </Button>
        
        {pkg.min_duration_months > 0 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            {t('pricing.minDuration')}: {pkg.min_duration_months} {language === 'de' ? 'Monate' : 'Months'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingCard;
