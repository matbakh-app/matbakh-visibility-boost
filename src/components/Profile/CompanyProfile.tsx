import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useToast } from '@/hooks/use-toast';
import {
  ProfileLayout,
  ProfileHeader,
  ProfileContent,
  ProfileSection,
  ProfileGrid
} from './ProfileLayout';
import { 
  InputField, 
  TextAreaField, 
  SelectField, 
  MultiSelectField 
} from './ProfileFields';
import { 
  Building, 
  Upload,
  Check,
  TrendingUp,
  Save
} from 'lucide-react';

// Form validation schema
const CompanySchema = z.object({
  company_name: z.string()
    .min(2, 'Firmenname muss mindestens 2 Zeichen lang sein')
    .max(100, 'Firmenname darf maximal 100 Zeichen lang sein'),
  phone: z.string().optional(),
  address: z.string()
    .min(5, 'Adresse muss mindestens 5 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .optional()
    .or(z.literal('')),
  website: z.string()
    .url('Bitte geben Sie eine gültige URL ein')
    .optional()
    .or(z.literal('')),
  description: z.string()
    .max(500, 'Beschreibung darf maximal 500 Zeichen lang sein')
    .optional(),
  categories: z.array(z.string())
    .min(1, 'Bitte wählen Sie mindestens eine Kategorie aus'),
  cuisines: z.array(z.string()).optional(),
  // Steuer- und rechtliche Felder
  tax_number: z.string()
    .min(3, 'Steuernummer ist ein Pflichtfeld'),
  tax_id: z.string().optional(),
  legal_entity: z.string()
    .min(3, 'Rechtsform muss mindestens 3 Zeichen lang sein'),
  commercial_register: z.string().optional(),
  bank_account: z.string().optional(),
  owner_name: z.string()
    .min(2, 'Name des Inhabers muss mindestens 2 Zeichen lang sein'),
  business_license: z.string().optional(),
  // Zahlungsdaten
  payment_methods: z.array(z.enum(['IBAN', 'PayPal', 'Stripe', 'Sonstiges'])).optional(),
  paypal_email: z.string().optional(),
  stripe_account: z.string().optional(),
  // Subscription
  subscription: z.enum(['free', 'pro', 'enterprise']).default('free')
});

type CompanyFormData = z.infer<typeof CompanySchema>;

export const CompanyProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, isError, save } = useCompanyProfile();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch
  } = useForm<CompanyFormData>({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      company_name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      description: '',
      categories: [],
      cuisines: [],
      tax_number: '',
      tax_id: '',
      legal_entity: '',
      commercial_register: '',
      bank_account: '',
      owner_name: '',
      business_license: '',
      payment_methods: [],
      paypal_email: '',
      stripe_account: '',
      subscription: 'free'
    }
  });

  // Reset form when data loads
  useEffect(() => {
    if (data) {
      reset({
        company_name: data.company_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: `${data.street || ''} ${data.house_number || ''}`.trim() || '',
        website: data.website || '',
        description: data.description || '',
        categories: data.categories || [],
        cuisines: [],
        tax_number: data.tax_number || '',
        tax_id: data.vat_id || '',
        legal_entity: data.legal_entity || '',
        commercial_register: data.commercial_register || '',
        bank_account: data.bank_account || '',
        owner_name: data.owner_name || '',
        business_license: data.business_license || '',
        payment_methods: (data.payment_methods as any) || [],
        paypal_email: data.paypal_email || '',
        stripe_account: data.stripe_account || '',
        subscription: (data.subscription as any) || 'free'
      });
    }
  }, [data, reset]);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBanner message="Unternehmensprofil konnte nicht geladen werden" />;

  const onSubmit = async (values: CompanyFormData) => {
    try {
      console.log('Submitting company profile data:', values);
      const success = await save(values);
      
      if (success) {
        toast({
          title: "Firmenprofil gespeichert",
          description: "Ihre Unternehmensangaben wurden erfolgreich gespeichert.",
        });
        // 🔧 NUR nach Profil-Bearbeitung weiterleiten
        const currentPath = window.location.pathname;
        if (currentPath.includes('/profile') || currentPath.includes('/onboarding')) {
          navigate('/dashboard');
        } else {
          console.log('CompanyProfile: Staying on current path:', currentPath);
        }
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Das Firmenprofil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate('/profile'); // Explicit navigation to profile
  };

  // Watch company name for avatar fallback
  const companyName = watch('company_name');
  const paymentMethods = watch('payment_methods') || [];
  const subscription = watch('subscription');

  // Options for various selects
  const categoryOptions = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Café' },
    { value: 'bar', label: 'Bar' },
    { value: 'bistro', label: 'Bistro' },
    { value: 'pizzeria', label: 'Pizzeria' },
    { value: 'fastfood', label: 'Fast Food' },
    { value: 'finedining', label: 'Fine Dining' }
  ];

  const cuisineOptions = [
    { value: 'italienisch', label: 'Italienisch' },
    { value: 'deutsch', label: 'Deutsch' },
    { value: 'international', label: 'International' },
    { value: 'vegetarisch', label: 'Vegetarisch' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'asiatisch', label: 'Asiatisch' },
    { value: 'mediterran', label: 'Mediterran' }
  ];

  const paymentMethodOptions = [
    { value: 'IBAN', label: 'IBAN' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Stripe', label: 'Stripe' },
    { value: 'Sonstiges', label: 'Sonstiges' }
  ];

  const subscriptionOptions = [
    { value: 'free', label: 'Kostenlos' },
    { value: 'pro', label: 'Pro (49 €/Monat)' },
    { value: 'enterprise', label: 'Enterprise (auf Anfrage)' }
  ];

  return (
    <ProfileLayout>
      <ProfileHeader
        title="Firmenprofil"
        subtitle="Verwalten Sie Ihre Unternehmensinformationen"
        onBack={handleBack}
        actions={
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            In Bearbeitung
          </Badge>
        }
      />

      <ProfileContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Basic Info */}
              <Card className="p-6">
                <ProfileSection
                  title="Grundinformationen"
                  description="Basis-Unternehmensdaten für Ihr Profil"
                >
                  <ProfileGrid columns={2}>
                    <Controller
                      name="company_name"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="Firmenname"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="z.B. Bella Vista Restaurant"
                          error={errors.company_name?.message}
                          required
                        />
                      )}
                    />
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="Telefon"
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="+49 89 12345678"
                          type="tel"
                          error={errors.phone?.message}
                        />
                      )}
                    />
                  </ProfileGrid>

                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        label="Adresse"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Musterstraße 123, 80331 München"
                        error={errors.address?.message}
                      />
                    )}
                  />

                  <ProfileGrid columns={2}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="E-Mail"
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="info@bellavista.de"
                          type="email"
                          error={errors.email?.message}
                        />
                      )}
                    />
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="Website"
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="https://www.bellavista.de"
                          type="url"
                          error={errors.website?.message}
                        />
                      )}
                    />
                  </ProfileGrid>

                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextAreaField
                        label="Beschreibung"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Beschreiben Sie Ihr Restaurant..."
                        rows={4}
                        description="Eine kurze Beschreibung Ihres Unternehmens für Kunden"
                        error={errors.description?.message}
                      />
                    )}
                  />
                </ProfileSection>
              </Card>

              {/* Categories & Specialization */}
              <Card className="p-6">
                <ProfileSection
                  title="Kategorien & Spezialisierung"
                  description="Definieren Sie Ihr Angebot und Ihre Küche"
                >
                  <Controller
                    name="categories"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="Hauptkategorie"
                        value={field.value[0] || ''}
                        onChange={(value) => field.onChange([value, ...field.value.slice(1)])}
                        options={categoryOptions}
                        placeholder="Wählen Sie eine Kategorie"
                        error={errors.categories?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="cuisines"
                    control={control}
                    render={({ field }) => (
                      <MultiSelectField
                        label="Küchenstil"
                        value={field.value || []}
                        onChange={field.onChange}
                        options={cuisineOptions}
                        placeholder="Wählen Sie Küchenstile"
                        maxItems={5}
                        description="Bis zu 5 Küchenstile auswählen"
                        error={errors.cuisines?.message}
                      />
                    )}
                  />
                </ProfileSection>
              </Card>

              {/* Steuer- und Rechtsdaten */}
              <Card className="p-6">
                <ProfileSection
                  title="Steuer- und Rechtsdaten"
                  description="Erforderliche Angaben für Stripe und Abrechnung"
                >
                   <ProfileGrid columns={2}>
                     <Controller
                       name="tax_number"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Steuernummer"
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="12345/67890"
                           error={errors.tax_number?.message}
                           required
                         />
                       )}
                     />
                     <Controller
                       name="tax_id"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="USt-ID (optional)"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="DE123456789"
                           error={errors.tax_id?.message}
                         />
                       )}
                     />
                   </ProfileGrid>

                   <ProfileGrid columns={2}>
                     <Controller
                       name="legal_entity"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Rechtsform"
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="GmbH, UG, GbR, Einzelunternehmen"
                           error={errors.legal_entity?.message}
                           required
                         />
                       )}
                     />
                     <Controller
                       name="owner_name"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Name des Inhabers/Geschäftsführers"
                           value={field.value}
                           onChange={field.onChange}
                           placeholder="Max Mustermann"
                           error={errors.owner_name?.message}
                           required
                         />
                       )}
                     />
                   </ProfileGrid>

                   <ProfileGrid columns={2}>
                     <Controller
                       name="commercial_register"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Handelsregisternummer (optional)"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="HRB 123456"
                           error={errors.commercial_register?.message}
                         />
                       )}
                     />
                     <Controller
                       name="business_license"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Gewerbeschein/Lizenz (optional)"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="Gewerbe-Nr. oder Lizenz-Nr."
                           error={errors.business_license?.message}
                         />
                       )}
                     />
                   </ProfileGrid>
                 </ProfileSection>
               </Card>

               {/* Zahlungsdaten */}
               <Card className="p-6">
                 <ProfileSection
                   title="Zahlungsdaten"
                   description="Ihre bevorzugten Zahlungsmethoden"
                 >
                   <Controller
                     name="payment_methods"
                     control={control}
                     render={({ field }) => (
                       <MultiSelectField
                         label="Zahlungsmethoden"
                         value={field.value || []}
                         onChange={field.onChange}
                         options={paymentMethodOptions}
                         placeholder="Wählen Sie Zahlungsmethoden"
                         maxItems={4}
                         description="Bis zu 4 Zahlungsmethoden auswählen"
                         error={errors.payment_methods?.message}
                       />
                     )}
                   />

                   {paymentMethods.includes('IBAN') && (
                     <Controller
                       name="bank_account"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="IBAN"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="DE89 3704 0044 0532 0130 00"
                           error={errors.bank_account?.message}
                         />
                       )}
                     />
                   )}

                   {paymentMethods.includes('PayPal') && (
                     <Controller
                       name="paypal_email"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="PayPal E-Mail"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="paypal@bellavista.de"
                           type="email"
                           error={errors.paypal_email?.message}
                         />
                       )}
                     />
                   )}

                   {paymentMethods.includes('Stripe') && (
                     <Controller
                       name="stripe_account"
                       control={control}
                       render={({ field }) => (
                         <InputField
                           label="Stripe Konto-ID"
                           value={field.value || ''}
                           onChange={field.onChange}
                           placeholder="acct_1234567890"
                           error={errors.stripe_account?.message}
                         />
                       )}
                     />
                   )}
                 </ProfileSection>
               </Card>

               {/* Subscription */}
               <Card className="p-6">
                 <ProfileSection
                   title="Abo-Typ & Upgrade"
                   description="Ihr aktueller Plan und Upgrade-Optionen"
                 >
                   <Controller
                     name="subscription"
                     control={control}
                     render={({ field }) => (
                       <SelectField
                         label="Aktueller Abo-Typ"
                         value={field.value}
                         onChange={field.onChange}
                         options={subscriptionOptions}
                         error={errors.subscription?.message}
                         required
                       />
                     )}
                   />

                   {subscription === 'free' && (
                     <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                       <h4 className="font-medium text-primary mb-2">Jetzt upgraden</h4>
                       <p className="text-sm text-muted-foreground mb-3">
                         Profitieren Sie von erweiterten Funktionen und besserer Sichtbarkeit.
                       </p>
                       <Button 
                         type="button" 
                         variant="default" 
                         onClick={() => navigate('/billing/upgrade')}
                       >
                         Upgrade auf Pro
                       </Button>
                     </div>
                   )}
                  </ProfileSection>
                </Card>

              {/* Action Buttons for mobile */}
              <div className="flex justify-between lg:hidden">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Abbrechen
                </Button>
                <Button 
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <Card className="p-6">
                <ProfileSection title="Logo">
                  <div className="text-center space-y-4">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {companyName ? companyName.charAt(0) : 'B'}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Logo hochladen
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG oder SVG. Max. 2MB
                    </p>
                  </div>
                </ProfileSection>
              </Card>

              {/* Profile Status */}
              <Card className="p-6">
                <ProfileSection title="Profil-Status">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grunddaten</span>
                      <div className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">60%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Google Business</span>
                      <span className="text-sm text-muted-foreground">Ausstehend</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Social Media</span>
                      <span className="text-sm text-muted-foreground">Nicht verknüpft</span>
                    </div>
                  </div>
                </ProfileSection>
              </Card>

              {/* Action Buttons for desktop */}
              <div className="hidden lg:block space-y-3">
                <Button 
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Firmenprofil speichern
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleBack}
                  className="w-full"
                >
                  Zurück zu Mein Profil
                </Button>
              </div>

              {/* Next Steps */}
              <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Nächste Schritte</h3>
                    <p className="text-sm text-muted-foreground">
                      Google Business & Social Media verknüpfen
                    </p>
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled
                  >
                    Bald verfügbar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </ProfileContent>
    </ProfileLayout>
  );
};