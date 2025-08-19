import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Row, Insert, Update } from '@/integrations/supabase/db-helpers';

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
  details?: Record<string, unknown>;
}

type LeadId = Row<"visibility_check_leads">["id"];

export const useEnhancedLeadTracking = () => {
  const [loading, setLoading] = useState(false);

  const createEnhancedLead = async (leadData: EnhancedLeadData): Promise<string | null> => {
    try {
      setLoading(true);

      const payload: Insert<"visibility_check_leads"> = {
        business_name: leadData.businessName,
        location: leadData.location,
        postal_code: leadData.postalCode || '',
        main_category: leadData.mainCategory,
        sub_category: leadData.subCategory,
        matbakh_category: leadData.matbakhTags?.[0] || '',
        website: leadData.website || '',
        facebook_handle: leadData.facebookName || '',
        instagram_handle: leadData.instagramName || '',
        benchmarks: leadData.benchmarks as any || [],
        email: leadData.email || '',
        phone_number: leadData.phoneNumber || '',
        gdpr_consent: leadData.gdprConsent || false,
        marketing_consent: leadData.marketingConsent || false,
        language: leadData.language || 'de',
        analysis_status: 'pending'
      };

      const { data: newLead, error } = await supabase
        .from('visibility_check_leads')
        .insert([payload])
        .select('id')
        .single()
        .returns<Row<"visibility_check_leads">>();

      if (error || !newLead) {
        console.error('Error creating enhanced lead:', error);
        throw new Error(`Failed to create lead: ${error?.message || 'Unknown error'}`);
      }

      // Log the lead creation action
      try {
        await trackLeadAction({
          leadId: newLead.id,
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

      return newLead.id;
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

      const changes: Update<"visibility_check_leads"> = {
        analysis_data: analysisData,
        analysis_status: status || 'completed',
        analyzed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('visibility_check_leads')
        .update(changes)
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

      const changes: Update<"visibility_check_leads"> = {
        analysis_data: {
          gdpr_consent: gdprConsent,
          marketing_consent: marketingConsent || false,
          consent_timestamp: new Date().toISOString()
        } as any
      };

      const { error } = await supabase
        .from('visibility_check_leads')
        .update(changes)
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
        .from('visibility_check_leads')
        .select('analysis_data')
        .eq('id', leadId as any)
        .single()
        .returns<Row<"visibility_check_leads">>();

      if (error) {
        console.error('Error fetching lead analysis:', error);
        return null;
      }

      return data?.analysis_data || null;
    } catch (error) {
      console.error('Error in getLeadAnalysis:', error);
      return null;
    }
  };

  const searchLeadsByEmail = async (email: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('email', email as any)
        .order('created_at', { ascending: false })
        .returns<Row<"visibility_check_leads">[]>();

      if (error) {
        console.error('Error searching leads by email:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchLeadsByEmail:', error);
      return [];
    }
  };

  const trackLeadAction = async (actionData: LeadAction): Promise<boolean> => {
    try {
      const payload: Insert<"lead_events"> = {
        email: null,
        business_name: null,
        event_type: actionData.actionType,
        event_time: new Date().toISOString(),
        event_payload: (actionData.details || {}) as any,
        user_id: null,
        partner_id: null,
        facebook_event_id: null,
        response_status: null,
        success: true
      };
      
      await supabase
        .from('lead_events')
        .insert([payload]);
        
      console.log('Tracking lead action:', actionData);
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