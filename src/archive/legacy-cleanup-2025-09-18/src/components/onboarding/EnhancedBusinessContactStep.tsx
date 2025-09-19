import React from 'react';
import { useTranslation } from 'react-i18next';
import { BusinessContactForm, type BusinessContactFormData } from './BusinessContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBusinessContactStepProps {
  data: {
    // Legacy fields that might exist from old data structure
    companyName?: string;
    address?: string;
    phone?: string;
    website?: string;
    email?: string;
    // Social media fields
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
    // Competitors
    competitors?: Array<{ name: string; website?: string }>;
    // Enhanced contact data (new structure)
    contactData?: BusinessContactFormData;
  };
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  vcData?: any; // Data from Visibility Check if user comes from there
}

export const EnhancedBusinessContactStep: React.FC<EnhancedBusinessContactStepProps> = ({
  data,
  onDataChange,
  onNext,
  onPrevious,
  vcData
}) => {
  const { t } = useTranslation('onboarding');
  const { toast } = useToast();

  // Transform legacy data or VC data to new structure
  const getDefaultValues = (): Partial<BusinessContactFormData> => {
    // If we already have new structure data, use it
    if (data.contactData) {
      return data.contactData;
    }

    // Transform legacy data or VC data to new structure
    const defaultValues: Partial<BusinessContactFormData> = {
      address: {
        addressLine1: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: 'DE',
        region: '',
        addressLine2: ''
      },
      contact: {
        email: data.email || vcData?.email || '',
        phone: data.phone || vcData?.phone || '',
        website: data.website || vcData?.website || ''
      },
      socials: {
        facebook_url: data.facebook || vcData?.facebook || '',
        instagram_handle: data.instagram || vcData?.instagram || '',
        linkedin_url: data.linkedin || vcData?.linkedin || '',
        tiktok_handle: data.tiktok || vcData?.tiktok || '',
        youtube_url: data.youtube || vcData?.youtube || ''
      },
      competitors: data.competitors || vcData?.competitors || [{ name: '', website: '' }]
    };

    // If we have legacy address as single string, try to parse it
    if (data.address) {
      // Simple parsing - in real implementation, you might want more sophisticated parsing
      const addressParts = data.address.split(',').map(part => part.trim());
      if (addressParts.length >= 2) {
        defaultValues.address!.addressLine1 = addressParts[0] || '';
        defaultValues.address!.city = addressParts[addressParts.length - 1] || '';
        // Try to extract postal code if it looks like one
        const postalCodeMatch = data.address.match(/\b\d{5}\b/);
        if (postalCodeMatch) {
          defaultValues.address!.postalCode = postalCodeMatch[0];
        }
      }
    }

    // Import VC location data if available
    if (vcData?.location) {
      defaultValues.address!.city = vcData.location;
    }
    if (vcData?.postalCode) {
      defaultValues.address!.postalCode = vcData.postalCode;
    }

    return defaultValues;
  };

  const handleSubmit = (formData: BusinessContactFormData) => {
    try {
      // Update the onboarding data with the new structure
      const updatedData = {
        ...data,
        // Store the complete contact data in new structure
        contactData: formData,
        // Also maintain legacy fields for backward compatibility during transition
        companyName: data.companyName, // Keep existing company name
        email: formData.contact.email,
        phone: formData.contact.phone,
        website: formData.contact.website,
        // Create legacy address string for backward compatibility
        address: `${formData.address.addressLine1} ${formData.address.houseNumber}, ${formData.address.postalCode} ${formData.address.city}`,
        // Store socials in both new and legacy format
        facebook: formData.socials.facebook_url,
        instagram: formData.socials.instagram_handle,
        linkedin: formData.socials.linkedin_url,
        tiktok: formData.socials.tiktok_handle,
        youtube: formData.socials.youtube_url,
        competitors: formData.competitors
      };

      onDataChange(updatedData);
      
      toast({
        title: t('businessContact.success', 'Contact information saved'),
        description: t('businessContact.successDescription', 'Your contact information has been successfully updated.')
      });

      onNext();
    } catch (error) {
      console.error('Error saving contact data:', error);
      toast({
        title: t('messages.errorTitle'),
        description: t('messages.errorDescription'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            {t('businessContact.infoTitle', 'Enhanced Contact Information')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-700">
            <p className="text-sm">
            {t('businessContact.infoDescription', 
                'Please provide your complete business contact information. This helps us:'
              )}
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside ml-4">
              <li>{t('businessContact.infoBenefit1', 'Automatically set up your Google My Business profile')}</li>
              <li>{t('businessContact.infoBenefit2', 'Connect with your social media accounts')}</li>
              <li>{t('businessContact.infoBenefit3', 'Analyze your competition and market position')}</li>
              <li>{t('businessContact.infoBenefit4', 'Provide personalized recommendations')}</li>
            </ul>
            
            {vcData && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {t('businessContact.vcDataImported', 
                    'Data from your Visibility Check has been pre-filled where possible.'
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Contact Form */}
      <BusinessContactForm
        onSubmit={handleSubmit}
        defaultValues={getDefaultValues()}
        onNext={onNext}
        onPrevious={onPrevious}
        isLoading={false}
      />
    </div>
  );
};