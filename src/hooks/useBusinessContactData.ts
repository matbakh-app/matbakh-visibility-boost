import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BusinessContactFormData } from '@/components/onboarding/BusinessContactForm';

interface BusinessContactData {
  id: string;
  customer_id: string;
  address_line1: string;
  house_number: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  region?: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  contact_website?: string;
  socials?: {
    facebook_url?: string;
    instagram_handle?: string;
    linkedin_url?: string;
    tiktok_handle?: string;
    youtube_url?: string;
  };
  competitors?: Array<{
    name: string;
    website?: string;
  }>;
  data_source: string;
  verified: boolean;
  last_enriched_at?: string;
  created_at: string;
  updated_at: string;
}

export function useBusinessContactData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get business contact data for current user
  const { data: contactData, isLoading, error } = useQuery({
    queryKey: ['business-contact-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get the customer_id from business_partners table
      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partner) {
        return null; // No partner data yet
      }

      // Get business contact data using customer_id
      const { data, error } = await supabase
        .from('business_contact_data')
        .select('*')
        .eq('customer_id', partner.id)
        .maybeSingle();

      if (error) throw error;
      return data as BusinessContactData | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create or update business contact data
  const { mutate: saveContactData, isPending: isSaving } = useMutation({
    mutationFn: async (formData: BusinessContactFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get or create business partner
      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partner) {
        throw new Error('No business partner found. Please complete basic onboarding first.');
      }

      // Prepare data for insertion/update
      const contactDataToSave = {
        customer_id: partner.id,
        address_line1: formData.address.addressLine1,
        house_number: formData.address.houseNumber,
        address_line2: formData.address.addressLine2 || null,
        postal_code: formData.address.postalCode,
        city: formData.address.city,
        region: formData.address.region || null,
        country: formData.address.country,
        contact_email: formData.contact.email,
        contact_phone: formData.contact.phone,
        contact_website: formData.contact.website || null,
        socials: {
          facebook_url: formData.socials.facebook_url || null,
          instagram_handle: formData.socials.instagram_handle || null,
          linkedin_url: formData.socials.linkedin_url || null,
          tiktok_handle: formData.socials.tiktok_handle || null,
          youtube_url: formData.socials.youtube_url || null,
        },
        competitors: formData.competitors.filter(c => c.name.trim() !== ''),
        data_source: 'user_input',
        verified: false,
        last_enriched_at: new Date().toISOString(),
      };

      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('business_contact_data')
        .upsert(contactDataToSave, {
          onConflict: 'customer_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-contact-data'] });
      toast({
        title: 'Kontaktdaten gespeichert',
        description: 'Ihre Geschäftsdaten wurden erfolgreich aktualisiert.',
      });
    },
    onError: (error) => {
      console.error('Error saving contact data:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Kontaktdaten konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    },
  });

  // Transform database data to form format
  const transformToFormData = (dbData: BusinessContactData | null): Partial<BusinessContactFormData> | null => {
    if (!dbData) return null;

    return {
      address: {
        addressLine1: dbData.address_line1,
        houseNumber: dbData.house_number,
        addressLine2: dbData.address_line2 || '',
        postalCode: dbData.postal_code,
        city: dbData.city,
        region: dbData.region || '',
        country: dbData.country,
      },
      contact: {
        email: dbData.contact_email,
        phone: dbData.contact_phone,
        website: dbData.contact_website || '',
      },
      socials: {
        facebook_url: dbData.socials?.facebook_url || '',
        instagram_handle: dbData.socials?.instagram_handle || '',
        linkedin_url: dbData.socials?.linkedin_url || '',
        tiktok_handle: dbData.socials?.tiktok_handle || '',
        youtube_url: dbData.socials?.youtube_url || '',
      },
      competitors: dbData.competitors || [{ name: '', website: '' }],
    };
  };

  // Delete business contact data (GDPR compliance)
  const { mutate: deleteContactData, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partner) {
        throw new Error('No business partner found');
      }

      const { error } = await supabase
        .from('business_contact_data')
        .delete()
        .eq('customer_id', partner.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-contact-data'] });
      toast({
        title: 'Daten gelöscht',
        description: 'Ihre Kontaktdaten wurden erfolgreich gelöscht.',
      });
    },
    onError: (error) => {
      console.error('Error deleting contact data:', error);
      toast({
        title: 'Fehler beim Löschen',
        description: 'Die Kontaktdaten konnten nicht gelöscht werden.',
        variant: 'destructive',
      });
    },
  });

  return {
    contactData,
    isLoading,
    error,
    saveContactData,
    isSaving,
    deleteContactData,
    isDeleting,
    transformToFormData,
    formData: transformToFormData(contactData),
  };
}