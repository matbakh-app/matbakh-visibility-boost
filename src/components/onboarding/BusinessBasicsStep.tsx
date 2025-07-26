import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Phone, Globe, Info, Users, TrendingUp, Clock } from 'lucide-react';
import { CategorySelector } from './CategorySelector';

interface BusinessBasicsStepProps {
  data: {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    categories: string[];
    businessModel?: string[];
    revenueStreams?: string[];
    targetAudience?: string[];
    seatingCapacity?: number;
    openingHours?: string;
    specialFeatures?: string[];
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
  const { t } = useTranslation('onboarding'); // ✅ expliziter Namespace
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    onDataChange({
      ...data,
      [field]: value
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNumberChange = (field: string, value: number | undefined) => {
    onDataChange({
      ...data,
      [field]: value
    });
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

  const handleCheckboxGroupChange = (field: string, value: string, checked: boolean) => {
    const currentValues = data[field] || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onDataChange({
      ...data,
      [field]: newValues
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.companyName?.trim()) {
      newErrors.companyName = t('validation.companyNameRequired');
    }

    if (!data.address?.trim()) {
      newErrors.address = t('validation.addressRequired');
    }

    if (!data.phone?.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(data.phone.trim())) {
      newErrors.phone = t('validation.phoneInvalid');
    }

    if (data.website && !/^https?:\/\/.+/.test(data.website.trim())) {
      newErrors.website = t('validation.websiteInvalid');
    }

    if (data.categories.length === 0) {
      newErrors.categories = t('validation.categoriesRequired');
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
            {t('businessBasics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                {t('companyName')} *
              </Label>
              <Input
                id="companyName"
                placeholder={t('companyNamePlaceholder')}
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
                {t('phone')} *
              </Label>
              <Input
                id="phone"
                placeholder={t('phonePlaceholder')}
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
              {t('address')} *
            </Label>
            <Textarea
              id="address"
              placeholder={t('addressPlaceholder')}
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
              {t('website')}
            </Label>
            <Input
              id="website"
              placeholder={t('websitePlaceholder')}
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
              {t('description')}
            </Label>
            <Textarea
              id="description"
              placeholder={t('descriptionPlaceholder')}
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
          <CardTitle>{t('businessCategories')}</CardTitle>
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

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('businessModel.title', 'Geschäftsmodell & Zielgruppe')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Model */}
          <div className="space-y-3">
            <Label>{t('businessModel.label', 'Geschäftsmodell')} *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['restaurant', 'cafe', 'bar', 'fastfood', 'catering', 'delivery'].map((model) => (
                <div key={model} className="flex items-center space-x-2">
                  <Checkbox
                    id={`business-model-${model}`}
                    checked={(data.businessModel || []).includes(model)}
                    onCheckedChange={(checked) => 
                      handleCheckboxGroupChange('businessModel', model, checked as boolean)
                    }
                  />
                  <Label htmlFor={`business-model-${model}`} className="text-sm">
                    {t(`businessModel.options.${model}`, model)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Streams */}
          <div className="space-y-3">
            <Label>{t('revenueStreams.label', 'Einnahmequellen')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['dine_in', 'takeaway', 'delivery', 'catering', 'events', 'retail'].map((stream) => (
                <div key={stream} className="flex items-center space-x-2">
                  <Checkbox
                    id={`revenue-stream-${stream}`}
                    checked={(data.revenueStreams || []).includes(stream)}
                    onCheckedChange={(checked) => 
                      handleCheckboxGroupChange('revenueStreams', stream, checked as boolean)
                    }
                  />
                  <Label htmlFor={`revenue-stream-${stream}`} className="text-sm">
                    {t(`revenueStreams.options.${stream}`, stream)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('targetAudience.label', 'Zielgruppe')}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['families', 'professionals', 'students', 'tourists', 'locals', 'seniors'].map((audience) => (
                <div key={audience} className="flex items-center space-x-2">
                  <Checkbox
                    id={`target-audience-${audience}`}
                    checked={(data.targetAudience || []).includes(audience)}
                    onCheckedChange={(checked) => 
                      handleCheckboxGroupChange('targetAudience', audience, checked as boolean)
                    }
                  />
                  <Label htmlFor={`target-audience-${audience}`} className="text-sm">
                    {t(`targetAudience.options.${audience}`, audience)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('capacity.title', 'Kapazität & Details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seating Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seatingCapacity">
                {t('capacity.seatingCapacity', 'Sitzplätze')}
              </Label>
              <Input
                id="seatingCapacity"
                type="number"
                placeholder="50"
                value={data.seatingCapacity || ''}
                onChange={(e) => handleNumberChange('seatingCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingHours">
                {t('capacity.openingHours', 'Öffnungszeiten')} *
              </Label>
              <Input
                id="openingHours"
                placeholder="Mo-So 10:00-22:00"
                value={data.openingHours || ''}
                onChange={(e) => handleInputChange('openingHours', e.target.value)}
              />
            </div>
          </div>

          {/* Special Features */}
          <div className="space-y-3">
            <Label>{t('capacity.specialFeatures', 'Besondere Merkmale')}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['terrace', 'garden', 'parking', 'wifi', 'live_music', 'kids_area'].map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={`special-feature-${feature}`}
                    checked={(data.specialFeatures || []).includes(feature)}
                    onCheckedChange={(checked) => 
                      handleCheckboxGroupChange('specialFeatures', feature, checked as boolean)
                    }
                  />
                  <Label htmlFor={`special-feature-${feature}`} className="text-sm">
                    {t(`capacity.features.${feature}`, feature)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
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
