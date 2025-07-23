
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const stepTwoSchema = z.object({
  website: z.string().url('Bitte gültige URL eingeben').optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  benchmarkOne: z.string().optional(),
  benchmarkTwo: z.string().optional(),
  benchmarkThree: z.string().optional(),
});

type StepTwoValues = z.infer<typeof stepTwoSchema>;

interface Props {
  onNext: (values: StepTwoValues) => void;
  onBack: () => void;
  defaultValues?: Partial<StepTwoValues>;
}

const VisibilityStepTwo: React.FC<Props> = ({ onNext, onBack, defaultValues }) => {
  const { t } = useTranslation();
  const form = useForm<StepTwoValues>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      website: '',
      instagram: '',
      facebook: '',
      benchmarkOne: '',
      benchmarkTwo: '',
      benchmarkThree: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <Input placeholder="https://meinrestaurant.de" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram (Benutzername oder URL)</FormLabel>
                <Input placeholder="@meinrestaurant oder https://instagram.com/..." {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook (Benutzername oder URL)</FormLabel>
                <Input placeholder="z. B. https://facebook.com/..." {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-semibold">Optional: Mitbewerber (zum Vergleich)</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Tragen Sie bis zu 3 Lokale ein, mit denen Sie sich vergleichen möchten.
          </p>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="benchmarkOne"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benchmark 1</FormLabel>
                  <Input placeholder="z. B. Weinbar X in München" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benchmarkTwo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benchmark 2</FormLabel>
                  <Input placeholder="optional" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benchmarkThree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benchmark 3</FormLabel>
                  <Input placeholder="optional" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            Zurück
          </Button>
          <Button type="submit">
            Weiter zur Auswertung
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VisibilityStepTwo;
