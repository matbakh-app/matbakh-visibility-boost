import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Phone, Globe, Info, Users, TrendingUp, Clock, HelpCircle } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { MainCategorySelector } from './MainCategorySelector';
import { SubCategorySelector } from './SubCategorySelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BusinessBasicsStepProps {
  data: {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    categories: string[];
    mainCategories?: string[];
    subCategories?: string[];
    businessModel?: string[];
    revenueStreams?: string[];
    targetAudience?: string[];
    seatingCapacity?: string;
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

  const handleNumberChange = (field: string, value: string) => {
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

  const handleMainCategoryChange = (categories: string[]) => {
    onDataChange({
      ...data,
      mainCategories: categories
    });
  };

  const handleSubCategoryChange = (categories: string[]) => {
    onDataChange({
      ...data,
      subCategories: categories
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

    // Validate main categories
    if (!data.mainCategories || data.mainCategories.length === 0) {
      newErrors.mainCategories = t('visibilityStepOne.validation.mainCategoriesRequired');
    }

    // Validate business model  
    if (!data.businessModel || data.businessModel.length === 0) {
      newErrors.businessModel = t('visibilityStepOne.validation.businessModelRequired');
    }

    // Validate revenue streams
    if (!data.revenueStreams || data.revenueStreams.length === 0) {
      newErrors.revenueStreams = t('visibilityStepOne.validation.revenueStreamsRequired');
    }

    // Validate target audience
    if (!data.targetAudience || data.targetAudience.length === 0) {
      newErrors.targetAudience = t('visibilityStepOne.validation.targetAudienceRequired');
    }

    // Validate opening hours
    if (!data.openingHours?.trim()) {
      newErrors.openingHours = t('visibilityStepOne.validation.openingHoursRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const renderTooltip = (text: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderCheckboxGroup = (
    fieldName: string,
    options: Array<{ value: string; label: string }>,
    title: string,
    tooltip: string,
    required: boolean = false
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>{title} {required && '*'}</Label>
        {renderTooltip(tooltip)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${fieldName}-${option.value}`}
              checked={(data[fieldName] as string[])?.includes(option.value) || false}
              onCheckedChange={(checked) => {
                handleCheckboxGroupChange(fieldName, option.value, checked as boolean);
              }}
            />
            <Label
              htmlFor={`${fieldName}-${option.value}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      {errors[fieldName] && (
        <p className="text-sm text-red-500">{errors[fieldName]}</p>
      )}
    </div>
  );

  // Define business data arrays using i18n
  const BUSINESS_MODELS = [
    { value: 'restaurant', label: t('visibilityStepOne.businessModels.restaurant') },
    { value: 'cafe', label: t('visibilityStepOne.businessModels.cafe') },
    { value: 'bar', label: t('visibilityStepOne.businessModels.bar') },
    { value: 'foodtruck', label: t('visibilityStepOne.businessModels.foodtruck') },
    { value: 'catering', label: t('visibilityStepOne.businessModels.catering') },
    { value: 'delivery', label: t('visibilityStepOne.businessModels.delivery') },
    { value: 'retail', label: t('visibilityStepOne.businessModels.retail') },
    { value: 'hybrid', label: t('visibilityStepOne.businessModels.hybrid') },
  ];

  const REVENUE_STREAMS = [
    { value: 'dine_in', label: t('visibilityStepOne.revenueStreams.dine_in') },
    { value: 'takeaway', label: t('visibilityStepOne.revenueStreams.takeaway') },
    { value: 'delivery', label: t('visibilityStepOne.revenueStreams.delivery') },
    { value: 'catering', label: t('visibilityStepOne.revenueStreams.catering') },
    { value: 'retail', label: t('visibilityStepOne.revenueStreams.retail') },
    { value: 'beverages', label: t('visibilityStepOne.revenueStreams.beverages') },
    { value: 'courses', label: t('visibilityStepOne.revenueStreams.courses') },
    { value: 'merchandise', label: t('visibilityStepOne.revenueStreams.merchandise') },
  ];

  const TARGET_AUDIENCES = [
    { value: 'families', label: t('visibilityStepOne.targetAudiences.families') },
    { value: 'young_adults', label: t('visibilityStepOne.targetAudiences.young_adults') },
    { value: 'professionals', label: t('visibilityStepOne.targetAudiences.professionals') },
    { value: 'seniors', label: t('visibilityStepOne.targetAudiences.seniors') },
    { value: 'students', label: t('visibilityStepOne.targetAudiences.students') },
    { value: 'tourists', label: t('visibilityStepOne.targetAudiences.tourists') },
    { value: 'locals', label: t('visibilityStepOne.targetAudiences.locals') },
    { value: 'business', label: t('visibilityStepOne.targetAudiences.business') },
  ];

  const SPECIAL_FEATURES = [
    { value: 'outdoor_seating', label: t('visibilityStepOne.specialFeatures.outdoor_seating') },
    { value: 'parking', label: t('visibilityStepOne.specialFeatures.parking') },
    { value: 'wheelchair_accessible', label: t('visibilityStepOne.specialFeatures.wheelchair_accessible') },
    { value: 'pet_friendly', label: t('visibilityStepOne.specialFeatures.pet_friendly') },
    { value: 'wifi', label: t('visibilityStepOne.specialFeatures.wifi') },
    { value: 'live_music', label: t('visibilityStepOne.specialFeatures.live_music') },
    { value: 'private_dining', label: t('visibilityStepOne.specialFeatures.private_dining') },
    { value: 'vegan_options', label: t('visibilityStepOne.specialFeatures.vegan_options') },
    { value: 'organic', label: t('visibilityStepOne.specialFeatures.organic') },
    { value: 'local_products', label: t('visibilityStepOne.specialFeatures.local_products') },
  ];

  return (
    <TooltipProvider>
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

      {/* Main and Sub Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Google Business Kategorien
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <MainCategorySelector 
              selectedCategories={data.mainCategories || []} 
              onCategoryChange={handleMainCategoryChange} 
              maxSelections={3}
            />
            {errors.mainCategories && (
              <p className="text-sm text-red-500 mt-2">{errors.mainCategories}</p>
            )}
          </div>

          <div>
            <SubCategorySelector 
              selectedMainCategories={data.mainCategories || []}
              selectedSubCategories={data.subCategories || []} 
              onSubCategoryChange={handleSubCategoryChange} 
              maxSelectionsPerMainCategory={7}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Business Model & Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('visibilityStepOne.sections.businessModel')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderCheckboxGroup(
            'businessModel',
            BUSINESS_MODELS,
            t('visibilityStepOne.fields.businessModel.label'),
            t('visibilityStepOne.fields.businessModel.tooltip'),
            true
          )}

          {renderCheckboxGroup(
            'revenueStreams',
            REVENUE_STREAMS,
            t('visibilityStepOne.fields.revenueStreams.label'),
            t('visibilityStepOne.fields.revenueStreams.tooltip'),
            true
          )}

          {renderCheckboxGroup(
            'targetAudience',
            TARGET_AUDIENCES,
            t('visibilityStepOne.fields.targetAudience.label'),
            t('visibilityStepOne.fields.targetAudience.tooltip'),
            true
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Capacity & Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('visibilityStepOne.sections.capacity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="seatingCapacity">
                  {t('visibilityStepOne.fields.seatingCapacity.label')}
                </Label>
                {renderTooltip(t('visibilityStepOne.fields.seatingCapacity.tooltip'))}
              </div>
              <Input
                id="seatingCapacity"
                type="number"
                placeholder={t('visibilityStepOne.fields.seatingCapacity.placeholder')}
                value={data.seatingCapacity || ''}
                onChange={(e) => handleNumberChange('seatingCapacity', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="openingHours">
                  {t('visibilityStepOne.fields.openingHours.label')} *
                </Label>
                {renderTooltip(t('visibilityStepOne.fields.openingHours.tooltip'))}
              </div>
              <Input
                id="openingHours"
                placeholder={t('visibilityStepOne.fields.openingHours.placeholder')}
                value={data.openingHours || ''}
                onChange={(e) => handleInputChange('openingHours', e.target.value)}
                className={errors.openingHours ? 'border-red-500' : ''}
              />
              {errors.openingHours && (
                <p className="text-sm text-red-500">{errors.openingHours}</p>
              )}
            </div>
          </div>

          {renderCheckboxGroup(
            'specialFeatures',
            SPECIAL_FEATURES,
            t('visibilityStepOne.fields.specialFeatures.label'),
            t('visibilityStepOne.fields.specialFeatures.tooltip')
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          {t('navigation.back')}
        </Button>
        <Button onClick={handleNext}>
          {t('navigation.next')}
        </Button>
      </div>
    </div>
    </TooltipProvider>
  );
};
