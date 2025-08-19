import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Lead Data Types
interface EnhancedLeadData {
  businessName: string;
  location: string;
  postalCode?: string;
  mainCategory: string;
  subCategory: string;
  matbakhTags: string[];
  website?: string;
  facebookName?: string;
  instagramName?: string;
  benchmarks: string[];
  email?: string;
  phoneNumber?: string;
  gdprConsent?: boolean;
  marketingConsent?: boolean;
  language?: string;
  locationData?: {
    city: string;
    country: string;
    coordinates?: [number, number];
  };
  competitorUrls?: string[];
  socialLinks?: Record<string, string>;
}

interface LeadAction {
  leadId: string;
  actionType: string;
  platform?: string;
  details?: Record<string, any>;
}

export const useEnhancedLeadTracking = () => {
  const [loading, setLoading] = useState(false);

  const createEnhancedLead = async (leadData: EnhancedLeadData): Promise<string | null> => {
    try {
      setLoading(true);

      const leadPayload = {
        business_name: leadData.businessName,
        location: leadData.location,
        postal_code: leadData.postalCode || '',
        main_category: leadData.mainCategory,
        sub_category: leadData.subCategory,
        matbakh_category: leadData.matbakhTags?.[0] || '',
        website: leadData.website || '',
        facebook_handle: leadData.facebookName || '',
        instagram_handle: leadData.instagramName || '',
        benchmarks: leadData.benchmarks || [],
        email: leadData.email || '',
        phone_number: leadData.phoneNumber || '',
        gdpr_consent: leadData.gdprConsent || false,
        marketing_consent: leadData.marketingConsent || false,
        language: leadData.language || 'de',
        analysis_status: 'pending'
      };

      const { data: newLead, error } = await supabase
        .from('visibility_check_leads' as any)
        .insert([leadPayload] as any)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating enhanced lead:', error);
        throw new Error(`Failed to create lead: ${error.message}`);
      }

      // Log the lead creation action
      try {
        await trackLeadAction({
          leadId: (newLead as any).id,
          actionType: 'lead_created',
          platform: 'visibility_check',
          details: {
            businessName: leadData.businessName,
            location: leadData.location,
            mainCategory: leadData.mainCategory,
            hasWebsite: Boolean(leadData.website),
            hasSocialMedia: Boolean(leadData.facebookName || leadData.instagramName),
            gdprConsent: leadData.gdprConsent,
            marketingConsent: leadData.marketingConsent
          }
        });
      } catch (actionError) {
        console.warn('Failed to log lead creation action:', actionError);
      }

      return (newLead as any)?.id || null;
    } catch (error) {
      console.error('Error in createEnhancedLead:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateLeadAnalysis = async (
    leadId: string, 
    analysisData: any, 
    status?: 'completed' | 'failed'
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('visibility_check_leads' as any)
        .update({
          analysis_data: analysisData,
          analysis_status: status || 'completed',
          analyzed_at: new Date().toISOString()
        } as any)
        .eq('id', leadId as any);

      if (error) {
        console.error('Error updating lead analysis:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLeadAnalysis:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const processGDPRConsent = async (
    leadId: string,
    email: string,
    gdprConsent: boolean,
    marketingConsent?: boolean
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('visibility_check_leads' as any)
        .update({
          analysis_data: {
            gdpr_consent: gdprConsent,
            marketing_consent: marketingConsent || false,
            consent_timestamp: new Date().toISOString()
          }
        } as any)
        .eq('id', leadId as any);

      if (error) {
        console.error('Error processing GDPR consent:', error);
        return false;
      }

      // Track consent processing
      try {
        await trackLeadAction({
          leadId,
          actionType: 'gdpr_consent_processed',
          platform: 'visibility_check',
          details: {
            email,
            gdprConsent,
            marketingConsent: marketingConsent || false,
            timestamp: new Date().toISOString()
          }
        });
      } catch (actionError) {
        console.warn('Failed to log GDPR consent action:', actionError);
      }

      return true;
    } catch (error) {
      console.error('Error in processGDPRConsent:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getLeadAnalysis = async (leadId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('visibility_check_leads' as any)
        .select('analysis_data')
        .eq('id', leadId as any)
        .single();

      if (error) {
        console.error('Error fetching lead analysis:', error);
        return null;
      }

      return (data as any)?.analysis_data || null;
    } catch (error) {
      console.error('Error in getLeadAnalysis:', error);
      return null;
    }
  };

  const searchLeadsByEmail = async (email: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('visibility_check_leads' as any)
        .select('*')
        .eq('email', email as any)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching leads by email:', error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      console.error('Error in searchLeadsByEmail:', error);
      return [];
    }
  };

  const trackLeadAction = async (actionData: LeadAction): Promise<boolean> => {
    try {
      // TODO: Implement lead action tracking
      // This would typically insert into a lead_actions table
      console.log('Tracking lead action:', actionData);
      
      // For now, just return true as we don't have the lead_actions table implemented yet
      return true;
    } catch (error) {
      console.error('Error in trackLeadAction:', error);
      return false;
    }
  };

  return {
    loading,
    createEnhancedLead,
    updateLeadAnalysis,
    processGDPRConsent,
    getLeadAnalysis,
    searchLeadsByEmail,
    trackLeadAction
  };
};