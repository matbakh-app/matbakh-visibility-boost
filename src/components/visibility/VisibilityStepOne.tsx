import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MainCategorySelector } from '@/components/onboarding/MainCategorySelector';
import { SubCategorySelector } from '@/components/onboarding/SubCategorySelector';

const stepOneSchema = z.object({
  businessName: z.string().min(1, 'visibilityStepOne.validation.businessNameRequired'),
  location: z.string().min(1, 'visibilityStepOne.validation.locationRequired'),
  postalCode: z.string().optional(),
  mainCategories: z.array(z.string()).min(1, 'visibilityStepOne.validation.mainCategoriesRequired'),
  subCategories: z.array(z.string()).optional(),
});

type StepOneValues = z.infer<typeof stepOneSchema>;

interface Props {
  onNext: (values: StepOneValues) => void;
  defaultValues?: Partial<StepOneValues>;
}

const VisibilityStepOne: React.FC<Props> = ({ onNext, defaultValues }) => {
  const { t } = useTranslation('onboarding');
  
  const form = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      businessName: defaultValues?.businessName || '',
      location: defaultValues?.location || '',
      postalCode: defaultValues?.postalCode || '',
      mainCategories: defaultValues?.mainCategories || [],
      subCategories: defaultValues?.subCategories || [],
      businessModel: defaultValues?.businessModel || [],
      revenueStreams: defaultValues?.revenueStreams || [],
      targetAudience: defaultValues?.targetAudience || [],
      seatingCapacity: defaultValues?.seatingCapacity || '',
      openingHours: defaultValues?.openingHours || '',
      specialFeatures: defaultValues?.specialFeatures || [],
    },
    mode: 'onChange',
  });

  const isValid = form.formState.isValid;

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
    fieldName: keyof StepOneValues,
    options: Array<{ value: string; label: string }>,
    title: string,
    tooltip: string
  ) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2 mb-3">
            <FormLabel className="text-base font-medium">{title} *</FormLabel>
            {renderTooltip(tooltip)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldName}-${option.value}`}
                  checked={(field.value as string[])?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = field.value as string[] || [];
                    if (checked) {
                      field.onChange([...currentValues, option.value]);
                    } else {
                      field.onChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <label
                  htmlFor={`${fieldName}-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-8">
          {/* Basis-Informationen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                {t('visibilityStepOne.sections.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>{t('visibilityStepOne.fields.businessName.label')} *</FormLabel>
                        {renderTooltip(t('visibilityStepOne.fields.businessName.tooltip'))}
                      </div>
                      <Input placeholder={t('visibilityStepOne.fields.businessName.placeholder')} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>{t('visibilityStepOne.fields.location.label')} *</FormLabel>
                        {renderTooltip(t('visibilityStepOne.fields.location.tooltip'))}
                      </div>
                      <Input placeholder={t('visibilityStepOne.fields.location.placeholder')} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('visibilityStepOne.fields.postalCode.label')}</FormLabel>
                    <Input placeholder={t('visibilityStepOne.fields.postalCode.placeholder')} {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mainCategories"
                render={({ field }) => (
                  <FormItem>
                    <MainCategorySelector 
                      selectedCategories={field.value || []} 
                      onCategoryChange={field.onChange} 
                      maxSelections={3}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subCategories"
                render={({ field }) => (
                  <FormItem>
                    <SubCategorySelector 
                      selectedCategories={field.value || []} 
                      onCategoryChange={field.onChange} 
                      maxSelections={20}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Geschäftsmodell & Zielgruppe */}
          <Card>
            <CardHeader>
              <CardTitle>{t('visibilityStepOne.sections.businessModel')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderCheckboxGroup(
                'businessModel',
                BUSINESS_MODELS,
                t('visibilityStepOne.fields.businessModel.label'),
                t('visibilityStepOne.fields.businessModel.tooltip')
              )}

              {renderCheckboxGroup(
                'revenueStreams',
                REVENUE_STREAMS,
                t('visibilityStepOne.fields.revenueStreams.label'),
                t('visibilityStepOne.fields.revenueStreams.tooltip')
              )}

              {renderCheckboxGroup(
                'targetAudience',
                TARGET_AUDIENCES,
                t('visibilityStepOne.fields.targetAudience.label'),
                t('visibilityStepOne.fields.targetAudience.tooltip')
              )}
            </CardContent>
          </Card>

          {/* Kapazität & Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('visibilityStepOne.sections.capacity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seatingCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>{t('visibilityStepOne.fields.seatingCapacity.label')}</FormLabel>
                        {renderTooltip(t('visibilityStepOne.fields.seatingCapacity.tooltip'))}
                      </div>
                       <Input 
                         type="number" 
                         placeholder={t('visibilityStepOne.fields.seatingCapacity.placeholder')}
                         {...field}
                         onChange={(e) => field.onChange(e.target.value || '')}
                       />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="openingHours"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>{t('visibilityStepOne.fields.openingHours.label')} *</FormLabel>
                        {renderTooltip(t('visibilityStepOne.fields.openingHours.tooltip'))}
                      </div>
                      <Input placeholder={t('visibilityStepOne.fields.openingHours.placeholder')} {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {renderCheckboxGroup(
                'specialFeatures',
                SPECIAL_FEATURES,
                t('visibilityStepOne.fields.specialFeatures.label'),
                t('visibilityStepOne.fields.specialFeatures.tooltip')
              )}
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button type="submit" disabled={!isValid} className="w-full">
              {t('visibilityStepOne.submitButton')}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default VisibilityStepOne;