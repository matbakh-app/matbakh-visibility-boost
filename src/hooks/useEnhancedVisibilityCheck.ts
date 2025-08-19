import { useMutation } from '@tanstack/react-query';
import { supabase, FUNCTIONS_URL } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Row, Insert } from '@/integrations/supabase/db-helpers';

interface EnhancedLeadData {
  businessName: string;
  location: string;
  mainCategory: string;
  subCategory: string;
  matbakhTags: string[];
  website?: string;
  facebookName?: string;
  instagramName?: string;
  benchmarks: string[];
  email?: string;
  leadId?: string;
  // Enhanced fields
  categoryId?: number;
  categoryName?: string;
  competitorUrls?: string[];
  language?: string;
  locationData?: {
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  socialLinks?: Record<string, string>;
  gdprConsent?: boolean;
  marketingConsent?: boolean;
}

export function useEnhancedVisibilityCheck() {
  const { i18n } = useTranslation();

  return useMutation({
    mutationFn: async (leadData: EnhancedLeadData) => {
      console.log('🚀 Starting enhanced visibility check:', leadData.businessName);
      
      // Enrich data with language and enhanced context
      const enhancedData = {
        ...leadData,
        language: leadData.language || i18n.language || 'de',
        categoryName: leadData.categoryName || leadData.mainCategory,
        competitorUrls: leadData.competitorUrls || leadData.benchmarks.map(name => 
          `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + leadData.location)}`
        ),
        socialLinks: {
          ...leadData.socialLinks,
          facebook: leadData.facebookName ? `https://www.facebook.com/${leadData.facebookName}` : undefined,
          instagram: leadData.instagramName ? `https://www.instagram.com/${leadData.instagramName}` : undefined,
          website: leadData.website
        }
      };

      // Call edge function directly using fetch with FUNCTIONS_URL
      const response = await fetch(`${FUNCTIONS_URL}/enhanced-visibility-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(enhancedData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Enhanced visibility check completed:', data);
      return data;
    },
  });
}

export function useCreateVisibilityLead() {
  return useMutation({
    mutationFn: async (leadData: Partial<EnhancedLeadData>) => {
      const payload: Insert<"visibility_check_leads"> = {
        business_name: leadData.businessName || '',
        location: leadData.location || '',
        main_category: leadData.mainCategory || '',
        sub_category: leadData.subCategory || '',
        matbakh_category: leadData.matbakhTags?.[0] || '',
        website: leadData.website || '',
        facebook_handle: leadData.facebookName || '',
        instagram_handle: leadData.instagramName || '',
        benchmarks: leadData.benchmarks as any || [],
        email: leadData.email || '',
        phone_number: '',
        gdpr_consent: leadData.gdprConsent || false,
        marketing_consent: leadData.marketingConsent || false,
        language: leadData.language || 'de',
        analysis_status: 'pending'
      };

      const { data, error } = await supabase
        .from('visibility_check_leads')
        .insert([payload])
        .select()
        .single()
        .returns<Row<"visibility_check_leads">>();

      if (error) throw error;
      return data;
    },
  });
}