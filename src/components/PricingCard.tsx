
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
  lang?: 'de' | 'en';
}

const PricingCard: React.FC<PricingCardProps> = ({ package: pkg, viewOnly = false, lang = 'de' }) => {
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

  // Feature mapping for internationalization
  const featureMap: Record<string, Record<string, Record<'de' | 'en', string>>> = {
    'google-business-setup': {
      '0': { de: 'Vollständige Google Business Profil-Erstellung', en: 'Complete Google Business Profile setup' },
      '1': { de: 'SEO-Optimierung für lokale Suche', en: 'SEO optimization for local search' },
      '2': { de: 'Kategorien und Attribute einrichten', en: 'Categories and attributes setup' },
      '3': { de: 'Öffnungszeiten und Kontaktdaten pflegen', en: 'Opening hours and contact data management' }
    },
    'profilpflege-basis': {
      '0': { de: '4 monatliche Updates Ihrer Daten', en: '4 monthly data updates' },
      '1': { de: 'Neue Speisekarten hochladen', en: 'New menu uploads' },
      '2': { de: 'Angebote und Aktionen erstellen', en: 'Create offers and promotions' },
      '3': { de: 'Monatlicher Erfolgsbericht', en: 'Monthly success report' }
    },
    'social-media-management': {
      '0': { de: 'Einheitliches Design für wiederkehrende Posts', en: 'Consistent design for recurring posts' },
      '1': { de: '1 Post pro Tag (30 Posts/Monat)', en: '1 post per day (30 posts/month)' },
      '2': { de: 'Content-Vorabprüfung durch Sie', en: 'Content pre-approval by you' },
      '3': { de: 'Performance-Tracking und Analytics', en: 'Performance tracking and analytics' }
    },
    'premium-business-paket': {
      '0': { de: 'Google Business Setup inklusive', en: 'Google Business Setup included' },
      '1': { de: '6 Monate Profilpflege inklusive', en: '6 months profile management included' },
      '2': { de: '1 Social Media Kanal für 6 Monate', en: '1 social media channel for 6 months' },
      '3': { de: 'Persönlicher Account Manager', en: 'Personal account manager' }
    }
  };

  const getPackageName = (packageSlug: string) => {
    return packageNameMap[packageSlug]?.[lang] || pkg.name;
  };

  const getFeatureText = (featureIndex: number) => {
    const packageSlug = pkg.slug;
    return featureMap[packageSlug]?.[featureIndex.toString()]?.[lang] || pkg.features[featureIndex];
  };

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
          {pkg.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm leading-relaxed">
                {getFeatureText(index)}
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
            {t('pricing.minDuration')}: {pkg.min_duration_months} {lang === 'de' ? 'Monate' : 'Months'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingCard;
