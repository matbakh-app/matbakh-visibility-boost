import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from 'react-i18next';
import { Globe, Facebook, Instagram, Mail, Shield, Linkedin, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import InstagramCandidatePicker from './InstagramCandidatePicker';

const stepTwoSchema = z.object({
  hasSocialMedia: z.enum(['yes', 'no'], {
    required_error: 'Bitte wählen Sie eine Option aus'
  }),
  website: z.string().url('Bitte gültige URL eingeben').optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  linkedin: z.string().optional(),
  benchmarkOne: z.string().optional(),
  benchmarkTwo: z.string().optional(),
  benchmarkThree: z.string().optional(),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'Datenschutz-Einverständnis ist erforderlich'
  }),
  marketingConsent: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Wenn "Ja" zu Social Media gewählt wurde, muss mindestens ein Feld ausgefüllt sein
  if (data.hasSocialMedia === 'yes') {
    const hasInstagram = !!data.instagram?.trim();
    const hasFacebook = !!data.facebook?.trim();
    
    if (!hasInstagram && !hasFacebook) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['instagram'],
        message: 'Bitte geben Sie mindestens Instagram oder Facebook an',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['facebook'],
        message: 'Bitte geben Sie mindestens Instagram oder Facebook an',
      });
    }
  }
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
      hasSocialMedia: undefined,
      website: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      linkedin: '',
      benchmarkOne: '',
      benchmarkTwo: '',
      benchmarkThree: '',
      email: '',
      gdprConsent: false,
      marketingConsent: false,
      ...defaultValues,
    },
  });

  const hasSocialMedia = form.watch('hasSocialMedia');

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
    
    // Clear social media fields if user said "no" to having social media
    if (values.hasSocialMedia === 'no') {
      values.instagram = '';
      values.facebook = '';
      values.tiktok = '';
      values.linkedin = '';
    }
    
    onNext(values);
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

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Social Media Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Social Media Profile
              </CardTitle>
              <p className="text-sm text-gray-600">
                Haben Sie einen Instagram- oder Facebook-Account für dieses Unternehmen?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasSocialMedia"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="social-yes" />
                        <label htmlFor="social-yes" className="text-sm font-medium cursor-pointer">
                          Ja, ich habe Social Media Accounts
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="social-no" />
                        <label htmlFor="social-no" className="text-sm font-medium cursor-pointer">
                          Nein, ich habe keine Social Media Accounts für dieses Unternehmen
                        </label>
                      </div>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info when no social media */}
              {hasSocialMedia === 'no' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Eingeschränkte Sichtbarkeits-Analyse
                    </p>
                    <p className="text-sm text-amber-700">
                      Ohne Social Media Profile ist der Check eingeschränkt (z.B. keine Social Benchmarks). 
                      Nach der Analyse können Sie jederzeit ein Social-Profil nachtragen für eine vollständige Bewertung.
                    </p>
                  </div>
                </div>
              )}

              {/* Social Media Fields - nur wenn "Ja" gewählt */}
              {hasSocialMedia === 'yes' && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Instagram Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram *
                      </FormLabel>
                      {renderTooltip('Instagram-Handle oder Profil-URL für die Analyse Ihrer Instagram-Präsenz.')}
                    </div>
                    
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
                            <Input 
                              placeholder="@meinrestaurant oder https://instagram.com/meinrestaurant" 
                              {...field} 
                            />
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
                        <div className="flex items-center gap-2">
                          <FormLabel className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            Facebook *
                          </FormLabel>
                          {renderTooltip('Facebook-Seite für Ihr Unternehmen.')}
                        </div>
                        <Input 
                          placeholder="Seitenname oder https://facebook.com/meine-seite" 
                          {...field} 
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* TikTok */}
                  <FormField
                    control={form.control}
                    name="tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="flex items-center gap-2">
                            📱 TikTok (optional)
                          </FormLabel>
                          {renderTooltip('TikTok-Profil für zukünftige Analysen (derzeit in Vorbereitung).')}
                        </div>
                        <Input 
                          placeholder="@meinrestaurant oder https://tiktok.com/@meinrestaurant" 
                          {...field} 
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* LinkedIn */}
                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn (optional)
                          </FormLabel>
                          {renderTooltip('LinkedIn-Unternehmensseite für B2B-Analysen.')}
                        </div>
                        <Input 
                          placeholder="https://linkedin.com/company/mein-unternehmen" 
                          {...field} 
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Website & Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Website & Vergleiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website (optional)
                      </FormLabel>
                      {renderTooltip('Ihre Unternehmens-Website für die technische Analyse.')}
                    </div>
                    <Input placeholder="https://meinrestaurant.de" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FormLabel className="text-base font-medium">
                    Vergleichbare Unternehmen (Benchmarks)
                  </FormLabel>
                  {renderTooltip('Konkurrenten oder ähnliche Unternehmen für Vergleichsanalysen.')}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
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
            </CardContent>
          </Card>

          {/* E-Mail & GDPR Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                E-Mail & Datenschutz
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Für den PDF-Report und weitere Analysen benötigen wir Ihre E-Mail-Adresse.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-Mail-Adresse *
                      </FormLabel>
                      {renderTooltip('Benötigt für den PDF-Report und Double-Opt-In-Bestätigung.')}
                    </div>
                    <Input 
                      type="email"
                      placeholder="ihre.email@beispiel.de" 
                      {...field} 
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GDPR Consent */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
                <FormField
                  control={form.control}
                  name="gdprConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Datenschutz-Einverständnis *
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Ich stimme der Verarbeitung meiner Daten für die Sichtbarkeits-Analyse zu. 
                          Der PDF-Report wird nur nach Double-Opt-In per E-Mail versendet. 
                          <a href="/datenschutz" target="_blank" className="underline text-blue-600 ml-1">
                            Datenschutzerklärung
                          </a>
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketingConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Marketing-Einverständnis (optional)
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Ich möchte über neue Features und Gastro-Tipps von matbakh.app informiert werden. 
                          Jederzeit widerrufbar.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Wichtig:</strong> Sie erhalten eine Bestätigungs-E-Mail. 
                  Erst nach Bestätigung wird der vollständige PDF-Report generiert und versendet.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              Zurück
            </Button>
            <Button type="submit">
              Analyse starten
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
};

export default VisibilityStepTwo;