
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrialBanner from '@/components/TrialBanner';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Verarbeitung Ihrer Zahlung...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <TrialBanner daysRemaining={14} />
          
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">
                Willkommen bei Matbakh!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">Ihre kostenlose Testphase beginnt jetzt</h3>
                <p className="text-gray-600 mb-4">
                  Sie haben 14 Tage kostenlosen Zugang zu allen Premium-Funktionen. 
                  Keine Gebühren bis zum Ende Ihrer Testphase.
                </p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                  <Calendar className="h-4 w-4" />
                  <span>Trial endet am {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Was Sie als nächstes tun können:</h4>
                <div className="grid gap-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Google Business Profil verbinden</p>
                      <p className="text-sm text-gray-600">Verbinden Sie Ihr Restaurant mit Google für maximale Sichtbarkeit</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Ihr Profil vervollständigen</p>
                      <p className="text-sm text-gray-600">Fügen Sie Fotos, Öffnungszeiten und Speisekarten hinzu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Live schalten</p>
                      <p className="text-sm text-gray-600">Aktivieren Sie Ihr Profil für Kunden</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                    Zum Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {sessionId && (
                <div className="text-xs text-gray-400 pt-4 border-t">
                  Session ID: {sessionId}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
</rov-write>

Jetzt aktualisiere ich die PricingCard Komponente, um den CheckoutButton zu integrieren:

<lov-write file_path="src/components/PricingCard.tsx">
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { ServicePackage } from '@/hooks/useServicePackages';
import CheckoutButton from './CheckoutButton';

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
    return packageNameMap[packageSlug]?.[language as 'de' | 'en'] || pkg.name;
  };

  const getFeatureText = (featureIndex: number) => {
    const packageSlug = pkg.slug;
    return featureMap[packageSlug]?.[featureIndex.toString()]?.[language as 'de' | 'en'] || pkg.features[featureIndex];
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
          
          {/* Trial indicator for recurring packages */}
          {pkg.period === 'monthly' && (
            <div className="mt-2">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                14 Tage kostenlos testen
              </Badge>
            </div>
          )}
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
        
        {viewOnly ? (
          <Button 
            className="w-full bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white"
            size="lg"
            disabled
          >
            {t('pricing.viewOnly')}
          </Button>
        ) : (
          <CheckoutButton
            packageCode={pkg.slug}
            packageName={getPackageName(pkg.slug)}
            price={pkg.base_price}
            className="bg-black hover:bg-gray-800 text-white"
          />
        )}
        
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
