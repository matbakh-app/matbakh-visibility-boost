import React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

const COUNTRY_OPTIONS = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
];

const REGION_OPTIONS: Record<string, string[]> = {
  DE: [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen'
  ],
  US: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ]
};

const businessContactSchema = z.object({
  address: z.object({
    addressLine1: z.string().min(1, 'Straße ist erforderlich'),
    houseNumber: z.string().min(1, 'Hausnummer ist erforderlich'),
    addressLine2: z.string().optional(),
    postalCode: z.string().min(1, 'Postleitzahl ist erforderlich'),
    city: z.string().min(1, 'Ort ist erforderlich'),
    region: z.string().optional(),
    country: z.string().min(1, 'Land ist erforderlich'),
  }),
  contact: z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
    website: z.string().optional().refine(
      (val) => !val || /^(https?:\/\/)?([\w.-]+)\.[a-z]{2,}/i.test(val),
      'Ungültige Website-URL'
    ),
  }),
  socials: z.object({
    facebook_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?facebook\.com\/[\w.\-]+$/i.test(val),
      'Ungültige Facebook-URL'
    ),
    instagram_handle: z.string().optional().refine(
      (val) => !val || /^@?[\w.-]{1,30}$/.test(val),
      'Ungültiger Instagram-Handle'
    ),
    linkedin_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?linkedin\.com\/(company|in)\/[\w.\-]+$/i.test(val),
      'Ungültige LinkedIn-URL'
    ),
    tiktok_handle: z.string().optional().refine(
      (val) => !val || /^@?[\w.-]{1,24}$/.test(val),
      'Ungültiger TikTok-Handle'
    ),
    youtube_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?youtube\.com\/(c|channel|user)\/[\w.\-]+$/i.test(val),
      'Ungültige YouTube-URL'
    ),
  }),
  competitors: z.array(z.object({
    name: z.string().min(1, 'Name des Wettbewerbers ist erforderlich'),
    website: z.string().optional(),
  })).max(3, 'Maximal 3 Wettbewerber erlaubt'),
});

export type BusinessContactFormData = z.infer<typeof businessContactSchema>;

interface BusinessContactFormProps {
  onSubmit: (data: BusinessContactFormData) => void;
  defaultValues?: Partial<BusinessContactFormData>;
  isLoading?: boolean;
}

export function BusinessContactForm({ onSubmit, defaultValues, isLoading = false }: BusinessContactFormProps) {
  const { t } = useTranslation('onboarding');
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BusinessContactFormData>({
    resolver: zodResolver(businessContactSchema),
    defaultValues: {
      address: {
        country: 'DE',
        ...defaultValues?.address
      },
      contact: defaultValues?.contact || {},
      socials: defaultValues?.socials || {},
      competitors: defaultValues?.competitors || [{ name: '', website: '' }],
    },
    mode: 'onBlur'
  });

  const country = watch('address.country') || 'DE';
  const regions = REGION_OPTIONS[country] || [];

  const { fields: competitorFields, append: addCompetitor, remove: removeCompetitor } = useFieldArray({
    control,
    name: 'competitors'
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Address Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Geschäftsadresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Land *</Label>
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Land auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.address?.country && (
                <p className="text-sm text-destructive">{errors.address.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postleitzahl *</Label>
              <Input
                {...register('address.postalCode')}
                id="postalCode"
                placeholder="12345"
                autoComplete="postal-code"
              />
              {errors.address?.postalCode && (
                <p className="text-sm text-destructive">{errors.address.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressLine1">Straße *</Label>
              <Input
                {...register('address.addressLine1')}
                id="addressLine1"
                placeholder="Musterstraße"
                autoComplete="address-line1"
              />
              {errors.address?.addressLine1 && (
                <p className="text-sm text-destructive">{errors.address.addressLine1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseNumber">Hausnummer *</Label>
              <Input
                {...register('address.houseNumber')}
                id="houseNumber"
                placeholder="123"
                autoComplete="address-line2"
              />
              {errors.address?.houseNumber && (
                <p className="text-sm text-destructive">{errors.address.houseNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ort *</Label>
              <Input
                {...register('address.city')}
                id="city"
                placeholder="Musterstadt"
                autoComplete="address-level2"
              />
              {errors.address?.city && (
                <p className="text-sm text-destructive">{errors.address.city.message}</p>
              )}
            </div>

            {regions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="region">Bundesland/Region</Label>
                <Controller
                  name="address.region"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Zusatz (optional)</Label>
            <Input
              {...register('address.addressLine2')}
              id="addressLine2"
              placeholder="Etage, Raum, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kontaktdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                {...register('contact.email')}
                id="email"
                type="email"
                placeholder="mail@unternehmen.de"
                autoComplete="email"
              />
              {errors.contact?.email && (
                <p className="text-sm text-destructive">{errors.contact.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer *</Label>
              <Input
                {...register('contact.phone')}
                id="phone"
                type="tel"
                placeholder="+49 123 456789"
                autoComplete="tel"
              />
              {errors.contact?.phone && (
                <p className="text-sm text-destructive">{errors.contact.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              {...register('contact.website')}
              id="website"
              type="url"
              placeholder="https://www.unternehmen.de"
              autoComplete="url"
            />
            {errors.contact?.website && (
              <p className="text-sm text-destructive">{errors.contact.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Media (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                {...register('socials.facebook_url')}
                id="facebook"
                type="url"
                placeholder="https://facebook.com/meinunternehmen"
              />
              {errors.socials?.facebook_url && (
                <p className="text-sm text-destructive">{errors.socials.facebook_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                {...register('socials.instagram_handle')}
                id="instagram"
                placeholder="@meinunternehmen"
              />
              {errors.socials?.instagram_handle && (
                <p className="text-sm text-destructive">{errors.socials.instagram_handle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                {...register('socials.linkedin_url')}
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/company/meinunternehmen"
              />
              {errors.socials?.linkedin_url && (
                <p className="text-sm text-destructive">{errors.socials.linkedin_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                {...register('socials.tiktok_handle')}
                id="tiktok"
                placeholder="@meinunternehmen"
              />
              {errors.socials?.tiktok_handle && (
                <p className="text-sm text-destructive">{errors.socials.tiktok_handle.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                {...register('socials.youtube_url')}
                id="youtube"
                type="url"
                placeholder="https://youtube.com/c/meinkanal"
              />
              {errors.socials?.youtube_url && (
                <p className="text-sm text-destructive">{errors.socials.youtube_url.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wettbewerber (bis zu 3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitorFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`competitor-name-${index}`}>Name/Unternehmen</Label>
                  <Input
                    {...register(`competitors.${index}.name`)}
                    id={`competitor-name-${index}`}
                    placeholder="Konkurrent GmbH"
                  />
                  {errors.competitors?.[index]?.name && (
                    <p className="text-sm text-destructive">{errors.competitors[index]?.name?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`competitor-website-${index}`}>Website (optional)</Label>
                  <Input
                    {...register(`competitors.${index}.website`)}
                    id={`competitor-website-${index}`}
                    type="url"
                    placeholder="https://konkurrent.de"
                  />
                </div>
              </div>

              {competitorFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeCompetitor(index)}
                  className="mt-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {competitorFields.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => addCompetitor({ name: '', website: '' })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Wettbewerber hinzufügen
            </Button>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Wird gespeichert...' : 'Speichern & Weiter'}
      </Button>
    </form>
  );
}