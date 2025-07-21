
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadEvent, LeadTodo, LeadSource, LeadCheckReport } from '@/types/facebook-events';
import { useToast } from '@/hooks/use-toast';

interface CreateLeadEventParams {
  email?: string;
  business_name?: string;
  event_type: string;
  event_payload: Record<string, any>;
  user_id?: string;
  partner_id?: string;
  facebook_event_id?: string;
  response_status?: number;
  success?: boolean;
}

interface CreateLeadSourceParams {
  lead_id: string;
  source_system: 'google' | 'meta' | 'website' | 'direct';
  ref_id?: string;
  source_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export const useLeadTracking = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createLeadEvent = useCallback(async (params: CreateLeadEventParams): Promise<LeadEvent | null> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('lead_events')
        .insert({
          email: params.email,
          business_name: params.business_name,
          event_type: params.event_type,
          event_time: new Date().toISOString(),
          event_payload: params.event_payload,
          user_id: params.user_id,
          partner_id: params.partner_id,
          facebook_event_id: params.facebook_event_id,
          response_status: params.response_status,
          success: params.success || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead event:', error);
      toast({
        title: 'Fehler',
        description: 'Lead Event konnte nicht erstellt werden.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createLeadSource = useCallback(async (params: CreateLeadSourceParams): Promise<LeadSource | null> => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .insert(params)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead source:', error);
      return null;
    }
  }, []);

  const createLeadTodo = useCallback(async (
    lead_id: string, 
    todo_text: string, 
    priority: number = 1,
    estimated_impact?: string
  ): Promise<LeadTodo | null> => {
    try {
      const { data, error } = await supabase
        .from('lead_todos')
        .insert({
          lead_id,
          todo_text,
          priority,
          estimated_impact
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead todo:', error);
      return null;
    }
  }, []);

  const updateLeadProcessed = useCallback(async (lead_id: string, processed: boolean = true): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_events')
        .update({ processed })
        .eq('id', lead_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating lead processed status:', error);
      return false;
    }
  }, []);

  const getLeadEvents = useCallback(async (filters?: {
    event_type?: string;
    processed?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<LeadEvent[]> => {
    try {
      let query = supabase
        .from('lead_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      
      if (filters?.processed !== undefined) {
        query = query.eq('processed', filters.processed);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching lead events:', error);
      return [];
    }
  }, []);

  return {
    loading,
    createLeadEvent,
    createLeadSource,
    createLeadTodo,
    updateLeadProcessed,
    getLeadEvents
  };
};
