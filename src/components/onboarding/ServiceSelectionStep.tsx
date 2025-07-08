import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useServicePackages, useAddonServices } from '@/hooks/useServicePackages';
import { Info, Check, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ServiceSelectionStepProps {
  selectedServices: string[];
  onChange: (services: string[]) => void;
  language: 'de' | 'en';
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  selectedServices,
  onChange,
  language
}) => {
  const { t } = useTranslation('onboarding');
  const { data: packages = [], isLoading: packagesLoading } = useServicePackages();
  const { data: addons = [], isLoading: addonsLoading } = useAddonServices();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatPeriod = (period: string) => {
    if (period === 'one-time') {
      return language === 'de' ? 'einmalig' : 'one-time';
    }
    return language === 'de' ? 'monatlich' : 'monthly';
  };

  const getServiceDependencies = (serviceId: string) => {
    const addon = addons.find(a => a.id === serviceId);
    if (addon?.requires_base_package) {
      return packages.filter(p => addon.compatible_packages?.includes(p.slug) || addon.compatible_packages?.length === 0);
    }
    return [];
  };

  const isServiceAvailable = (serviceId: string) => {
    const dependencies = getServiceDependencies(serviceId);
    if (dependencies.length === 0) return true;
    
    return dependencies.some(dep => selectedServices.includes(dep.id));
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    let newServices = [...selectedServices];
    
    if (checked) {
      // Add service
      if (!newServices.includes(serviceId)) {
        newServices.push(serviceId);
      }
    } else {
      // Remove service and dependent services
      newServices = newServices.filter(id => {
        if (id === serviceId) return false;
        
        // Check if this service depends on the one being removed
        const dependencies = getServiceDependencies(id);
        return !dependencies.some(dep => dep.id === serviceId);
      });
    }
    
    onChange(newServices);
  };

  const getServicePrice = (service: any) => {
    return service.base_price || service.price || 0;
  };

  const renderPackageCard = (pkg: any) => {
    const isSelected = selectedServices.includes(pkg.id);
    const dependencies = getServiceDependencies(pkg.id);
    const isAvailable = isServiceAvailable(pkg.id);

    return (
      <Card 
        key={pkg.id} 
        className={`transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
        } ${!isAvailable ? 'opacity-50' : ''}`}
        onClick={() => isAvailable && handleServiceToggle(pkg.id, !isSelected)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              disabled={!isAvailable}
              onCheckedChange={(checked) => handleServiceToggle(pkg.id, !!checked)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                {pkg.is_recommended && (
                  <Badge variant="secondary" className="text-xs">
                    {language === 'de' ? 'Empfohlen' : 'Recommended'}
                  </Badge>
                )}
                {isSelected && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-gray-900">
                    {formatPrice(getServicePrice(pkg))}
                  </span>
                  {pkg.original_price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(pkg.original_price)}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    / {formatPeriod(pkg.period)}
                  </span>
                </div>
                
                {pkg.min_duration_months > 0 && (
                  <p className="text-xs text-gray-500">
                    {language === 'de' 
                      ? `Mindestlaufzeit: ${pkg.min_duration_months} Monate`
                      : `Minimum duration: ${pkg.min_duration_months} months`
                    }
                  </p>
                )}
              </div>
              
              {pkg.features && pkg.features.length > 0 && (
                <div className="mt-3">
                  <ul className="text-sm text-gray-600 space-y-1">
                    {pkg.features.slice(0, 3).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {pkg.features.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{pkg.features.length - 3} {language === 'de' ? 'weitere' : 'more'}
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {dependencies.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-yellow-700">
                    <AlertCircle className="w-3 h-3" />
                    {language === 'de' 
                      ? 'Benötigt einen der folgenden Basis-Services:'
                      : 'Requires one of the following base services:'
                    }
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {dependencies.map(dep => dep.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (packagesLoading || addonsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('step2.selectServices')}
        </h3>
        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          {t('step2.serviceInfo')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Packages */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            {language === 'de' ? 'Hauptservices' : 'Main Services'}
          </h4>
          <div className="space-y-3">
            {packages.map(renderPackageCard)}
          </div>
        </div>

        {/* Add-on Services */}
        {addons.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              {language === 'de' ? 'Zusätzliche Services' : 'Additional Services'}
            </h4>
            <div className="space-y-3">
              {addons.map(renderPackageCard)}
            </div>
          </div>
        )}
      </div>

      {selectedServices.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">
            {language === 'de' ? 'Ausgewählte Services:' : 'Selected Services:'}
          </h4>
          <div className="space-y-1">
            {selectedServices.map(serviceId => {
              const service = [...packages, ...addons].find(s => s.id === serviceId);
              return service ? (
                <div key={serviceId} className="flex justify-between text-sm">
                  <span className="text-green-700">{service.name}</span>
                  <span className="font-medium text-green-900">
                    {formatPrice(getServicePrice(service))} / {formatPeriod(service.period)}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};