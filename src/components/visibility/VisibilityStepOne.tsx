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
import { CategorySelector } from '@/components/onboarding/CategorySelector';

const stepOneSchema = z.object({
  businessName: z.string().min(1, 'Pflichtfeld'),
  location: z.string().min(1, 'Pflichtfeld'),
  postalCode: z.string().optional(),
  selectedCategories: z.array(z.string()).min(1, 'Mindestens eine Kategorie wählen'),
  matbakhCategory: z.string().min(1, 'Bitte eintragen'),
  businessModel: z.array(z.string()).min(1, 'Mindestens ein Geschäftsmodell wählen'),
  revenueStreams: z.array(z.string()).min(1, 'Mindestens eine Einnahmequelle wählen'),
  targetAudience: z.array(z.string()).min(1, 'Mindestens eine Zielgruppe wählen'),
  seatingCapacity: z.string().optional(),
  openingHours: z.string().min(1, 'Öffnungszeiten sind Pflicht'),
  specialFeatures: z.array(z.string()).optional(),
});

type StepOneValues = z.infer<typeof stepOneSchema>;

interface Props {
  onNext: (values: StepOneValues) => void;
  defaultValues?: Partial<StepOneValues>;
}

const BUSINESS_MODELS = [
  { value: 'restaurant', label: 'Restaurant/Gaststätte' },
  { value: 'cafe', label: 'Café/Bistro' },
  { value: 'bar', label: 'Bar/Club' },
  { value: 'foodtruck', label: 'Food Truck/Mobile Gastronomie' },
  { value: 'catering', label: 'Catering/Event-Service' },
  { value: 'delivery', label: 'Lieferservice' },
  { value: 'retail', label: 'Einzelhandel/Shop' },
  { value: 'hybrid', label: 'Hybrid (Restaurant + Retail)' },
];

const REVENUE_STREAMS = [
  { value: 'dine_in', label: 'Vor-Ort-Verzehr' },
  { value: 'takeaway', label: 'Außer-Haus-Verkauf' },
  { value: 'delivery', label: 'Lieferservice' },
  { value: 'catering', label: 'Catering/Events' },
  { value: 'retail', label: 'Produktverkauf' },
  { value: 'beverages', label: 'Getränke/Bar' },
  { value: 'courses', label: 'Kurse/Workshops' },
  { value: 'merchandise', label: 'Merchandise' },
];

const TARGET_AUDIENCES = [
  { value: 'families', label: 'Familien mit Kindern' },
  { value: 'young_adults', label: 'Junge Erwachsene (18-35)' },
  { value: 'professionals', label: 'Berufstätige' },
  { value: 'seniors', label: 'Senioren (55+)' },
  { value: 'students', label: 'Studenten' },
  { value: 'tourists', label: 'Touristen/Besucher' },
  { value: 'locals', label: 'Einheimische/Stammkunden' },
  { value: 'business', label: 'Geschäftskunden' },
];

const SPECIAL_FEATURES = [
  { value: 'outdoor_seating', label: 'Außenbereich/Terrasse' },
  { value: 'parking', label: 'Parkplätze verfügbar' },
  { value: 'wheelchair_accessible', label: 'Barrierefrei' },
  { value: 'pet_friendly', label: 'Haustierfreundlich' },
  { value: 'wifi', label: 'Kostenloses WLAN' },
  { value: 'live_music', label: 'Live-Musik/Events' },
  { value: 'private_dining', label: 'Private Räume' },
  { value: 'vegan_options', label: 'Vegane Optionen' },
  { value: 'organic', label: 'Bio/Nachhaltig' },
  { value: 'local_products', label: 'Regionale Produkte' },
];

const VisibilityStepOne: React.FC<Props> = ({ onNext, defaultValues }) => {
  const { t } = useTranslation();
  const form = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      businessName: defaultValues?.businessName || '',
      location: defaultValues?.location || '',
      postalCode: defaultValues?.postalCode || '',
      selectedCategories: defaultValues?.selectedCategories || [],
      matbakhCategory: defaultValues?.matbakhCategory || '',
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
                Basis-Informationen
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
                        <FormLabel>Unternehmensname *</FormLabel>
                        {renderTooltip('Der offizielle Name Ihres Unternehmens, wie er auch bei Google My Business erscheinen soll.')}
                      </div>
                      <Input placeholder="z. B. Trattoria Bella Vista" {...field} />
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
                        <FormLabel>Standort *</FormLabel>
                        {renderTooltip('Stadt oder Stadtteil, in dem sich Ihr Unternehmen befindet.')}
                      </div>
                      <Input placeholder="z. B. München" {...field} />
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
                    <FormLabel>Postleitzahl (optional)</FormLabel>
                    <Input placeholder="z. B. 80333" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedCategories"
                render={({ field }) => (
                  <FormItem>
                    <CategorySelector 
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
                name="matbakhCategory"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Matbakh.app Kategorie *</FormLabel>
                      {renderTooltip('Besondere Merkmale oder Küchenstil, die Ihr Unternehmen auszeichnen.')}
                    </div>
                    <Input placeholder="z. B. libanesisch, Weinbar, Familienbetrieb, …" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Geschäftsmodell & Zielgruppe */}
          <Card>
            <CardHeader>
              <CardTitle>Geschäftsmodell & Zielgruppe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderCheckboxGroup(
                'businessModel',
                BUSINESS_MODELS,
                'Geschäftsmodell',
                'Wählen Sie alle zutreffenden Geschäftsmodelle. Dies hilft uns, passende Empfehlungen zu erstellen.'
              )}

              {renderCheckboxGroup(
                'revenueStreams',
                REVENUE_STREAMS,
                'Einnahmequellen',
                'Wie verdienen Sie Geld? Mehrfachauswahl möglich.'
              )}

              {renderCheckboxGroup(
                'targetAudience',
                TARGET_AUDIENCES,
                'Zielgruppe',
                'Wer sind Ihre Hauptkunden? Diese Information hilft bei der Optimierung Ihrer Online-Präsenz.'
              )}
            </CardContent>
          </Card>

          {/* Kapazität & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Kapazität & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seatingCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Sitzplätze (optional)</FormLabel>
                        {renderTooltip('Anzahl der Sitzplätze in Ihrem Lokal. Hilft bei der Einschätzung der Unternehmensgröße.')}
                      </div>
                       <Input 
                         type="number" 
                         placeholder="z. B. 50" 
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
                        <FormLabel>Öffnungszeiten *</FormLabel>
                        {renderTooltip('Grundlegende Öffnungszeiten. Detaillierte Zeiten können später ergänzt werden.')}
                      </div>
                      <Input placeholder="z. B. Mo-So 11:00-22:00" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {renderCheckboxGroup(
                'specialFeatures',
                SPECIAL_FEATURES,
                'Besondere Merkmale (optional)',
                'Besonderheiten, die Ihr Unternehmen auszeichnen und in der Online-Präsenz hervorgehoben werden sollten.'
              )}
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button type="submit" disabled={!isValid} className="w-full">
              Weiter zu Social Media & Website
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default VisibilityStepOne;