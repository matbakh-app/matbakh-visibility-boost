
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTranslation } from 'react-i18next';

const stepOneSchema = z.object({
  companyName: z.string().min(1, 'Pflichtfeld'),
  location: z.string().min(1, 'Pflichtfeld'),
  postalCode: z.string().optional(),
  mainCategory: z.string().min(1, 'Bitte auswählen'),
  subCategory: z.string().min(1, 'Bitte auswählen'),
  matbakhCategory: z.string().min(1, 'Bitte eintragen'),
});

type StepOneValues = z.infer<typeof stepOneSchema>;

interface Props {
  onNext: (values: StepOneValues) => void;
  defaultValues?: Partial<StepOneValues>;
}

const VisibilityStepOne: React.FC<Props> = ({ onNext, defaultValues }) => {
  const { t } = useTranslation();
  const form = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      companyName: '',
      location: '',
      postalCode: '',
      mainCategory: '',
      subCategory: '',
      matbakhCategory: '',
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const isValid = form.formState.isValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unternehmensname *</FormLabel>
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
                <FormLabel>Standort *</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mainCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hauptkategorie *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Other">Andere</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unterkategorie *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="z. B. Italienisches Restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="italian">Italienisch</SelectItem>
                    <SelectItem value="turkish">Türkisch</SelectItem>
                    <SelectItem value="asian">Asiatisch</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="other">Andere</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="matbakhCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matbakh.app Kategorie *</FormLabel>
              <Input placeholder="z. B. libanesisch, Weinbar, Familienbetrieb, …" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" disabled={!isValid} className="w-full">
            Weiter zu optionalen Angaben
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VisibilityStepOne;
