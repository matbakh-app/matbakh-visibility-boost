
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useServicePackages } from '@/hooks/useServicePackages';

interface ServiceSelectionStepProps {
  selectedServices: string[];
  onSelectionChange: (services: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  selectedServices,
  onSelectionChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const { data: servicePackages, isLoading } = useServicePackages();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleServiceToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      onSelectionChange(selectedServices.filter(s => s !== serviceId));
    } else {
      onSelectionChange([...selectedServices, serviceId]);
    }
    
    // Clear validation error
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: '' }));
    }
  };

  const validateSelection = () => {
    if (selectedServices.length === 0) {
      setErrors({ services: t('onboarding.validation.servicesRequired') });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateSelection()) {
      onNext();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="break-words hyphens-auto">{t('onboarding.serviceSelection')}</CardTitle>
        <p className="text-gray-600 break-words hyphens-auto">
          {t('onboarding.serviceSelectionDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {servicePackages?.map((service) => (
            <div
              key={service.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedServices.includes(service.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base sm:text-lg break-words hyphens-auto overflow-wrap-anywhere mb-2">
                    {service.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs break-all">
                      {service.slug}
                    </Badge>
                    {service.period === 'monthly' && (
                      <Badge variant="secondary" className="text-xs">
                        {t('services.recurring')}
                      </Badge>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-xs sm:text-sm text-gray-600 break-words hyphens-auto overflow-wrap-anywhere leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 mt-1">
                  {selectedServices.includes(service.id) && (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.services && (
          <p className="text-sm text-red-500 break-words">{errors.services}</p>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2 order-2 sm:order-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="break-words">{t('navigation.back')}</span>
          </Button>
          <Button onClick={handleNext} className="flex items-center gap-2 order-1 sm:order-2">
            <span className="break-words">{t('navigation.next')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
