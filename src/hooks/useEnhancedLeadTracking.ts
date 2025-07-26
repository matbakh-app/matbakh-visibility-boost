import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedLeadData {
  business_name: string;
  location: string;
  postal_code?: string;
  main_category: string;
  sub_category: string;
  matbakh_category: string;
  website?: string;
  facebook_handle?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  linkedin_handle?: string;
  benchmarks?: string[];
  email: string;
  gdpr_consent: boolean;
  marketing_consent?: boolean;
}

interface LeadAction {
  lead_id: string;
  action_type: string;
  platform?: string;
  details?: any;
  duration_ms?: number;
  device_type?: string;
  browser?: string;
}

export const useEnhancedLeadTracking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createEnhancedLead = async (leadData: EnhancedLeadData): Promise<string | null> => {
    setLoading(true);
    try {
      console.log('📝 Creating enhanced lead:', leadData);

      const { data, error } = await supabase
        .from('visibility_check_leads')
        .insert([{
          business_name: leadData.business_name,
          location: leadData.location,
          postal_code: leadData.postal_code,
          main_category: leadData.main_category,
          sub_category: leadData.sub_category,
          matbakh_category: leadData.matbakh_category,
          website: leadData.website,
          facebook_handle: leadData.facebook_handle,
          instagram_handle: leadData.instagram_handle,
          tiktok_handle: leadData.tiktok_handle,
          linkedin_handle: leadData.linkedin_handle,
          benchmarks: leadData.benchmarks,
          email: leadData.email,
          gdpr_consent: leadData.gdpr_consent,
          marketing_consent: leadData.marketing_consent,
          analysis_status: 'pending',
        }])
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating lead:', error);
        toast({
          variant: 'destructive',
          title: 'Fehler beim Speichern',
          description: 'Lead konnte nicht gespeichert werden.',
        });
        return null;
      }

      console.log('✅ Enhanced lead created:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Error in createEnhancedLead:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const trackLeadAction = async (actionData: LeadAction): Promise<boolean> => {
    try {
      console.log('📊 Tracking lead action:', actionData);

      // For now, we'll skip action tracking since the table structure needs to be clarified
      // This will be implemented once the database migration is complete
      console.log('⏳ Action tracking will be implemented after database migration');
      return true;
    } catch (error) {
      console.error('❌ Error in trackLeadAction:', error);
      return false;
    }
  };

  const updateLeadAnalysis = async (
    leadId: string, 
    analysisData: any, 
    status: 'completed' | 'failed' = 'completed'
  ): Promise<boolean> => {
    try {
      console.log('📈 Updating lead analysis:', leadId);

      const { error } = await supabase
        .from('visibility_check_leads')
        .update({
          analysis_data: analysisData,
          analysis_status: status,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) {
        console.error('❌ Error updating analysis:', error);
        return false;
      }

      console.log('✅ Lead analysis updated');
      return true;
    } catch (error) {
      console.error('❌ Error in updateLeadAnalysis:', error);
      return false;
    }
  };

  const processGDPRConsent = async (
    leadId: string,
    email: string,
    gdprConsent: boolean,
    marketingConsent?: boolean
  ): Promise<boolean> => {
    try {
      console.log('🛡️ Processing GDPR consent for lead:', leadId);

      const { error } = await supabase
        .from('visibility_check_leads')
        .update({
          // Use available fields from the existing schema
          analysis_data: {
            gdpr_consent: gdprConsent,
            marketing_consent: marketingConsent,
            consent_timestamp: gdprConsent ? new Date().toISOString() : null,
          }
        })
        .eq('id', leadId);

      if (error) {
        console.error('❌ Error processing GDPR consent:', error);
        return false;
      }

      // Track consent action
      await trackLeadAction({
        lead_id: leadId,
        action_type: 'gdpr_consent',
        details: {
          gdpr_consent: gdprConsent,
          marketing_consent: marketingConsent,
          email,
        },
      });

      console.log('✅ GDPR consent processed');
      return true;
    } catch (error) {
      console.error('❌ Error in processGDPRConsent:', error);
      return false;
    }
  };

  const getLeadAnalysis = async (leadId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('❌ Error fetching lead analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getLeadAnalysis:', error);
      return null;
    }
  };

  const searchLeadsByEmail = async (email: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error searching leads by email:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in searchLeadsByEmail:', error);
      return [];
    }
  };

  return {
    loading,
    createEnhancedLead,
    trackLeadAction,
    updateLeadAnalysis,
    processGDPRConsent,
    getLeadAnalysis,
    searchLeadsByEmail,
  };
};

export default useEnhancedLeadTracking;