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

  // Package name mapping for internationalization
  const packageNameMap: Record<string, Record<'de' | 'en', string>> = {
    'google-business-setup': {
      de: 'Google Business Setup',
      en: 'Google Business Setup'
    },
    'profilpflege-basis': {
      de: 'Profilpflege Basis',
      en: 'Profile Management Basic'
    },
    'social-media-management': {
      de: 'Social Media Management',
      en: 'Social Media Management'
    },
    'premium-business-paket': {
      de: 'Premium Business Paket',
      en: 'Premium Business Package'
    }
  };

  const getFeaturesBySlug = (packageSlug: string) => {
    const slugMap: Record<string, string> = {
      'google-business-setup': 'google_setup',
      'profilpflege-basis': 'profile_basic',
      'social-media-management': 'social_media',
      'premium-business-paket': 'premium'
    };
    
    const mappedSlug = slugMap[packageSlug] || packageSlug;
    return t(`packages.${mappedSlug}.features`, { returnObjects: true }) as string[] || pkg.features;
  };

  const getPackageName = (packageSlug: string) => {
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
          {pkg.original_price && pkg.original_price > pkg.base_price && (
            <>
              <p className="text-sm text-red-600 font-medium mb-1">
                {t('pricing.limitedTime')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-gray-400 line-through">
                  €{pkg.original_price}
                </span>
                <span className="text-3xl font-bold text-black">
                  €{pkg.base_price}
                </span>
              </div>
            </>
          )}
          {(!pkg.original_price || pkg.original_price <= pkg.base_price) && (
            <span className="text-3xl font-bold text-black">
              €{pkg.base_price}
            </span>
          )}
          <p className="text-gray-600 mt-1">
            {pkg.period === 'monthly' ? `/${t('pricing.month')}` : t('pricing.oneTime')}
          </p>
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
