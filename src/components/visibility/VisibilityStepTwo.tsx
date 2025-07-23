
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import InstagramCandidatePicker from './InstagramCandidatePicker';

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
  instagramCandidates?: Array<{
    handle: string;
    score: number;
    profilePicture?: string;
    followerCount?: number;
    bio?: string;
    confidence: 'high' | 'medium' | 'low';
    matchReason: string;
  }>;
}

const VisibilityStepTwo: React.FC<Props> = ({ 
  onNext, 
  onBack, 
  defaultValues,
  instagramCandidates = []
}) => {
  const { t } = useTranslation();
  const [selectedInstagramCandidate, setSelectedInstagramCandidate] = useState<string>('');
  const [showManualInstagram, setShowManualInstagram] = useState<boolean>(false);
  
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

  // Show manual input if we have manual default value or user selected manual
  useEffect(() => {
    if (defaultValues?.instagram) {
      setShowManualInstagram(true);
    }
  }, [defaultValues?.instagram]);

  const handleInstagramCandidateSelect = (handle: string) => {
    setSelectedInstagramCandidate(handle);
    if (handle === 'manual') {
      setShowManualInstagram(true);
      form.setValue('instagram', '');
    } else {
      setShowManualInstagram(false);
      form.setValue('instagram', handle);
    }
  };

  const handleSubmit = (values: StepTwoValues) => {
    // If user selected a candidate, use that instead of manual input
    if (selectedInstagramCandidate && selectedInstagramCandidate !== 'manual') {
      values.instagram = selectedInstagramCandidate;
    }
    onNext(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Profile</h3>
          
          {/* Instagram Section */}
          <div className="space-y-3">
            <FormLabel>Instagram</FormLabel>
            
            {/* Show candidates if available and no manual input yet */}
            {instagramCandidates.length > 0 && !showManualInstagram && (
              <InstagramCandidatePicker
                candidates={instagramCandidates}
                onSelect={handleInstagramCandidateSelect}
                value={selectedInstagramCandidate}
              />
            )}

            {/* Manual Instagram input */}
            {(showManualInstagram || instagramCandidates.length === 0) && (
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <Input placeholder="@meinrestaurant oder https://instagram.com/..." {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Toggle back to candidates if they exist */}
            {instagramCandidates.length > 0 && showManualInstagram && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowManualInstagram(false)}
              >
                ← Zurück zu Vorschlägen
              </Button>
            )}
          </div>

          {/* Facebook */}
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
