
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Globe, Info } from 'lucide-react';
import { CategorySelector } from './CategorySelector';

interface BusinessBasicsStepProps {
  data: {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    categories: string[];
  };
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const BusinessBasicsStep: React.FC<BusinessBasicsStepProps> = ({
  data,
  onDataChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    onDataChange({
      ...data,
      [field]: value
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (categories: string[]) => {
    onDataChange({
      ...data,
      categories
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.companyName?.trim()) {
      newErrors.companyName = t('onboarding.validation.companyNameRequired');
    }

    if (!data.address?.trim()) {
      newErrors.address = t('onboarding.validation.addressRequired');
    }

    if (!data.phone?.trim()) {
      newErrors.phone = t('onboarding.validation.phoneRequired');
    } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(data.phone.trim())) {
      newErrors.phone = t('onboarding.validation.phoneInvalid');
    }

    if (data.website && !/^https?:\/\/.+/.test(data.website.trim())) {
      newErrors.website = t('onboarding.validation.websiteInvalid');
    }

    if (data.categories.length === 0) {
      newErrors.categories = t('onboarding.validation.categoriesRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('onboarding.businessBasics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {t('onboarding.companyName')} *
              </Label>
              <Input
                id="companyName"
                placeholder={t('onboarding.companyNamePlaceholder')}
                value={data.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline h-4 w-4 mr-1" />
                {t('onboarding.phone')} *
              </Label>
              <Input
                id="phone"
                placeholder={t('onboarding.phonePlaceholder')}
                value={data.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              <MapPin className="inline h-4 w-4 mr-1" />
              {t('onboarding.address')} *
            </Label>
            <Textarea
              id="address"
              placeholder={t('onboarding.addressPlaceholder')}
              value={data.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={errors.address ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              <Globe className="inline h-4 w-4 mr-1" />
              {t('onboarding.website')}
            </Label>
            <Input
              id="website"
              placeholder={t('onboarding.websitePlaceholder')}
              value={data.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('onboarding.description')}
            </Label>
            <Textarea
              id="description"
              placeholder={t('onboarding.descriptionPlaceholder')}
              value={data.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('onboarding.businessCategories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategorySelector
            selectedCategories={data.categories || []}
            onCategoryChange={handleCategoryChange}
            maxSelections={3}
          />
          {errors.categories && (
            <p className="text-sm text-red-500 mt-2">{errors.categories}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          {t('common.previous')}
        </Button>
        <Button onClick={handleNext}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
};
