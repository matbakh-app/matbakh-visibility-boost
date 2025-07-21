
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
      
      const insertData = {
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
      };

      const { data, error } = await supabase
        .from('lead_events' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      // Transform to our interface
      const leadEvent: LeadEvent = {
        id: data.id,
        email: data.email,
        business_name: data.business_name,
        event_type: data.event_type,
        event_time: data.event_time,
        event_payload: data.event_payload,
        processed: data.processed || false,
        created_at: data.created_at,
        user_id: data.user_id,
        partner_id: data.partner_id,
        facebook_event_id: data.facebook_event_id,
        response_status: data.response_status,
        success: data.success || false
      };
      
      return leadEvent;
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
      const insertData = {
        lead_id: params.lead_id,
        source_system: params.source_system,
        ref_id: params.ref_id,
        source_url: params.source_url,
        utm_source: params.utm_source,
        utm_medium: params.utm_medium,
        utm_campaign: params.utm_campaign
      };

      const { data, error } = await supabase
        .from('lead_sources' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      const leadSource: LeadSource = {
        id: data.id,
        lead_id: data.lead_id,
        source_system: data.source_system,
        ref_id: data.ref_id,
        source_url: data.source_url,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        created_at: data.created_at
      };
      
      return leadSource;
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
      const insertData = {
        lead_id,
        todo_text,
        priority,
        estimated_impact
      };

      const { data, error } = await supabase
        .from('lead_todos' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      const leadTodo: LeadTodo = {
        id: data.id,
        lead_id: data.lead_id,
        todo_text: data.todo_text,
        status: data.status || 'offen',
        priority: data.priority,
        estimated_impact: data.estimated_impact,
        created_at: data.created_at,
        completed_at: data.completed_at
      };
      
      return leadTodo;
    } catch (error) {
      console.error('Error creating lead todo:', error);
      return null;
    }
  }, []);

  const updateLeadProcessed = useCallback(async (lead_id: string, processed: boolean = true): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_events' as any)
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
        .from('lead_events' as any)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters if provided
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
      
      // Transform to our interface
      const leadEvents: LeadEvent[] = (data || []).map((item: any) => ({
        id: item.id,
        email: item.email,
        business_name: item.business_name,
        event_type: item.event_type,
        event_time: item.event_time,
        event_payload: item.event_payload,
        processed: item.processed || false,
        created_at: item.created_at,
        user_id: item.user_id,
        partner_id: item.partner_id,
        facebook_event_id: item.facebook_event_id,
        response_status: item.response_status,
        success: item.success || false
      }));
      
      return leadEvents;
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
