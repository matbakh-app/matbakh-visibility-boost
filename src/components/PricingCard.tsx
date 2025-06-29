
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { ServicePackage } from '@/hooks/useServicePackages';

interface PricingCardProps {
  package: ServicePackage;
  onSelect: (pkg: ServicePackage) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ package: pkg, onSelect }) => {
  const { t } = useTranslation();
  const hasDiscount = pkg.original_price && pkg.original_price > pkg.base_price;

  return (
    <Card className={`relative ${pkg.is_recommended ? 'ring-2 ring-black' : ''}`}>
      {pkg.is_recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-black text-white px-3 py-1 text-sm rounded-full">
            {t('pricing.recommended', 'Empfohlen')}
          </span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl font-bold">{pkg.name || 'Service Package'}</CardTitle>
        {pkg.description && (
          <p className="text-sm text-gray-600">{pkg.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          {hasDiscount && (
            <>
              <div className="text-sm text-red-600 font-medium">
                {t('pricing.limited_time', 'Nur für kurze Zeit')}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">€{pkg.base_price}</span>
                <span className="text-lg text-gray-500 line-through">
                  €{pkg.original_price}
                </span>
              </div>
              <div className="text-sm text-green-600">
                {t('pricing.save', 'Sie sparen {{amount}}€', { amount: (pkg.original_price! - pkg.base_price) })}
              </div>
            </>
          )}
          
          {!hasDiscount && (
            <div className="text-2xl font-bold">€{pkg.base_price}</div>
          )}
          
          <div className="text-sm text-gray-600">
            {pkg.period === 'monthly' ? t('pricing.per_month', 'pro Monat') : t('pricing.one_time', 'einmalig')}
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {pkg.features && pkg.features.length > 0 ? (
            pkg.features.map((feature, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                {feature}
              </li>
            ))
          ) : (
            <li className="text-sm text-gray-500">Details werden geladen...</li>
          )}
        </ul>

        <Button 
          className="w-full" 
          onClick={() => onSelect(pkg)}
        >
          {t('pricing.book_now', 'Jetzt buchen')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
