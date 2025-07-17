
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
        <CardTitle>{t('onboarding.serviceSelection')}</CardTitle>
        <p className="text-gray-600">
          {t('onboarding.serviceSelectionDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{service.slug}</Badge>
                    {service.period === 'monthly' && (
                      <Badge variant="secondary">
                        {t('services.recurring')}
                      </Badge>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                  )}
                </div>
                {selectedServices.includes(service.id) && (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.services && (
          <p className="text-sm text-red-500">{errors.services}</p>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('navigation.back')}
          </Button>
          <Button onClick={handleNext} className="flex items-center gap-2">
            {t('navigation.next')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
