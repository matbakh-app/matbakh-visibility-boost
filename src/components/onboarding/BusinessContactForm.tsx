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
import { Plus, X, MapPin, Phone, Globe, Users, TrendingUp } from 'lucide-react';

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

// Create schema factory to use translations
const createBusinessContactSchema = (t: any) => z.object({
  address: z.object({
    addressLine1: z.string().min(1, t('businessContact.validation.streetRequired', 'Street is required')),
    houseNumber: z.string().min(1, t('businessContact.validation.houseNumberRequired', 'House number is required')),
    addressLine2: z.string().optional(),
    postalCode: z.string().min(1, t('businessContact.validation.postalCodeRequired', 'Postal code is required')),
    city: z.string().min(1, t('businessContact.validation.cityRequired', 'City is required')),
    region: z.string().optional(),
    country: z.string().min(1, t('businessContact.validation.countryRequired', 'Country is required')),
  }),
  contact: z.object({
    email: z.string().email(t('businessContact.validation.emailInvalid', 'Invalid email address')),
    phone: z.string().min(1, t('businessContact.validation.phoneRequired', 'Phone number is required')),
    website: z.string().optional().refine(
      (val) => !val || /^(https?:\/\/)?([\w.-]+)\.[a-z]{2,}/i.test(val),
      t('businessContact.validation.websiteInvalid', 'Invalid website URL')
    ),
  }),
  socials: z.object({
    facebook_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?facebook\.com\/[\w.\-]+$/i.test(val),
      t('businessContact.validation.facebookInvalid', 'Invalid Facebook URL')
    ),
    instagram_handle: z.string().optional().refine(
      (val) => !val || /^@?[\w.-]{1,30}$/.test(val),
      t('businessContact.validation.instagramInvalid', 'Invalid Instagram handle')
    ),
    linkedin_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?linkedin\.com\/(company|in)\/[\w.\-]+$/i.test(val),
      t('businessContact.validation.linkedinInvalid', 'Invalid LinkedIn URL')
    ),
    tiktok_handle: z.string().optional().refine(
      (val) => !val || /^@?[\w.-]{1,24}$/.test(val),
      t('businessContact.validation.tiktokInvalid', 'Invalid TikTok handle')
    ),
    youtube_url: z.string().optional().refine(
      (val) => !val || /^https:\/\/(www\.)?youtube\.com\/(c|channel|user)\/[\w.\-]+$/i.test(val),
      t('businessContact.validation.youtubeInvalid', 'Invalid YouTube URL')
    ),
  }),
  competitors: z.array(z.object({
    name: z.string().min(1, t('businessContact.validation.competitorNameRequired', 'Competitor name is required')),
    website: z.string().optional(),
  })).max(3, t('businessContact.validation.maxCompetitors', 'Maximum 3 competitors allowed')),
});

export type BusinessContactFormData = z.infer<ReturnType<typeof createBusinessContactSchema>>;

interface BusinessContactFormProps {
  onSubmit: (data: BusinessContactFormData) => void;
  defaultValues?: Partial<BusinessContactFormData>;
  isLoading?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function BusinessContactForm({ onSubmit, defaultValues, isLoading = false, onNext, onPrevious }: BusinessContactFormProps) {
  const { t } = useTranslation('onboarding');
  const businessContactSchema = createBusinessContactSchema(t);
  
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            {t('businessContact.address.title', 'Business Address')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('businessContact.address.country', 'Country')} *</Label>
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('businessContact.address.countryPlaceholder', 'Select country')} />
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
              <Label htmlFor="postalCode">{t('businessContact.address.postalCode', 'Postal Code')} *</Label>
              <Input
                {...register('address.postalCode')}
                id="postalCode"
                placeholder={t('businessContact.address.postalCodePlaceholder', '12345')}
                autoComplete="postal-code"
              />
              {errors.address?.postalCode && (
                <p className="text-sm text-destructive">{errors.address.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addressLine1">{t('businessContact.address.street', 'Street')} *</Label>
              <Input
                {...register('address.addressLine1')}
                id="addressLine1"
                placeholder={t('businessContact.address.streetPlaceholder', 'Main Street')}
                autoComplete="address-line1"
              />
              {errors.address?.addressLine1 && (
                <p className="text-sm text-destructive">{errors.address.addressLine1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseNumber">{t('businessContact.address.houseNumber', 'House Number')} *</Label>
              <Input
                {...register('address.houseNumber')}
                id="houseNumber"
                placeholder={t('businessContact.address.houseNumberPlaceholder', '123')}
                autoComplete="address-line2"
              />
              {errors.address?.houseNumber && (
                <p className="text-sm text-destructive">{errors.address.houseNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t('businessContact.address.city', 'City')} *</Label>
              <Input
                {...register('address.city')}
                id="city"
                placeholder={t('businessContact.address.cityPlaceholder', 'Your City')}
                autoComplete="address-level2"
              />
              {errors.address?.city && (
                <p className="text-sm text-destructive">{errors.address.city.message}</p>
              )}
            </div>

            {regions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="region">{t('businessContact.address.region', 'State/Region')}</Label>
                <Controller
                  name="address.region"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('businessContact.address.regionPlaceholder', 'Select (optional)')} />
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
            <Label htmlFor="addressLine2">{t('businessContact.address.additional', 'Additional Info')} ({t('businessContact.optional', 'optional')})</Label>
            <Input
              {...register('address.addressLine2')}
              id="addressLine2"
              placeholder={t('businessContact.address.additionalPlaceholder', 'Floor, Room, etc.')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5" />
            {t('businessContact.contact.title', 'Contact Information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('businessContact.contact.email', 'Email')} *</Label>
              <Input
                {...register('contact.email')}
                id="email"
                type="email"
                placeholder={t('businessContact.contact.emailPlaceholder', 'mail@company.com')}
                autoComplete="email"
              />
              {errors.contact?.email && (
                <p className="text-sm text-destructive">{errors.contact.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('businessContact.contact.phone', 'Phone Number')} *</Label>
              <Input
                {...register('contact.phone')}
                id="phone"
                type="tel"
                placeholder={t('businessContact.contact.phonePlaceholder', '+49 123 456789')}
                autoComplete="tel"
              />
              {errors.contact?.phone && (
                <p className="text-sm text-destructive">{errors.contact.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {t('businessContact.contact.website', 'Website')}
            </Label>
            <Input
              {...register('contact.website')}
              id="website"
              type="url"
              placeholder={t('businessContact.contact.websitePlaceholder', 'https://www.company.com')}
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            {t('businessContact.socials.title', 'Social Media')} ({t('businessContact.optional', 'optional')})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">{t('businessContact.socials.facebook', 'Facebook')}</Label>
              <Input
                {...register('socials.facebook_url')}
                id="facebook"
                type="url"
                placeholder={t('businessContact.socials.facebookPlaceholder', 'https://facebook.com/yourcompany')}
              />
              {errors.socials?.facebook_url && (
                <p className="text-sm text-destructive">{errors.socials.facebook_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">{t('businessContact.socials.instagram', 'Instagram')}</Label>
              <Input
                {...register('socials.instagram_handle')}
                id="instagram"
                placeholder={t('businessContact.socials.instagramPlaceholder', '@yourcompany')}
              />
              {errors.socials?.instagram_handle && (
                <p className="text-sm text-destructive">{errors.socials.instagram_handle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">{t('businessContact.socials.linkedin', 'LinkedIn')}</Label>
              <Input
                {...register('socials.linkedin_url')}
                id="linkedin"
                type="url"
                placeholder={t('businessContact.socials.linkedinPlaceholder', 'https://linkedin.com/company/yourcompany')}
              />
              {errors.socials?.linkedin_url && (
                <p className="text-sm text-destructive">{errors.socials.linkedin_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">{t('businessContact.socials.tiktok', 'TikTok')}</Label>
              <Input
                {...register('socials.tiktok_handle')}
                id="tiktok"
                placeholder={t('businessContact.socials.tiktokPlaceholder', '@yourcompany')}
              />
              {errors.socials?.tiktok_handle && (
                <p className="text-sm text-destructive">{errors.socials.tiktok_handle.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="youtube">{t('businessContact.socials.youtube', 'YouTube')}</Label>
              <Input
                {...register('socials.youtube_url')}
                id="youtube"
                type="url"
                placeholder={t('businessContact.socials.youtubePlaceholder', 'https://youtube.com/c/yourchannel')}
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            {t('businessContact.competitors.title', 'Competitors')} ({t('businessContact.competitors.maxThree', 'up to 3')})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitorFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`competitor-name-${index}`}>{t('businessContact.competitors.name', 'Name/Company')}</Label>
                  <Input
                    {...register(`competitors.${index}.name`)}
                    id={`competitor-name-${index}`}
                    placeholder={t('businessContact.competitors.namePlaceholder', 'Competitor Corp')}
                  />
                  {errors.competitors?.[index]?.name && (
                    <p className="text-sm text-destructive">{errors.competitors[index]?.name?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`competitor-website-${index}`}>{t('businessContact.competitors.website', 'Website')} ({t('businessContact.optional', 'optional')})</Label>
                  <Input
                    {...register(`competitors.${index}.website`)}
                    id={`competitor-website-${index}`}
                    type="url"
                    placeholder={t('businessContact.competitors.websitePlaceholder', 'https://competitor.com')}
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
              {t('businessContact.competitors.add', 'Add Competitor')}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {onPrevious && (
          <Button type="button" variant="outline" onClick={onPrevious} className="flex-1">
            {t('navigation.back', 'Back')}
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? t('businessContact.saving', 'Saving...') : t('navigation.next', 'Next')}
        </Button>
      </div>
    </form>
  );
}