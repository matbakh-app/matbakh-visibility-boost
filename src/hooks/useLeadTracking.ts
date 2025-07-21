
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
      
      // TODO: Replace with proper Supabase types after generation
      const safeData: any = data;
      
      const leadEvent: LeadEvent = {
        id: safeData.id,
        email: safeData.email,
        business_name: safeData.business_name,
        event_type: safeData.event_type,
        event_time: safeData.event_time,
        event_payload: safeData.event_payload,
        processed: safeData.processed || false,
        created_at: safeData.created_at,
        user_id: safeData.user_id,
        partner_id: safeData.partner_id,
        facebook_event_id: safeData.facebook_event_id,
        response_status: safeData.response_status,
        success: safeData.success || false
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
      
      // TODO: Replace with proper Supabase types after generation
      const safeData: any = data;
      
      const leadSource: LeadSource = {
        id: safeData.id,
        lead_id: safeData.lead_id,
        source_system: safeData.source_system,
        ref_id: safeData.ref_id,
        source_url: safeData.source_url,
        utm_source: safeData.utm_source,
        utm_medium: safeData.utm_medium,
        utm_campaign: safeData.utm_campaign,
        created_at: safeData.created_at
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
      
      // TODO: Replace with proper Supabase types after generation
      const safeData: any = data;
      
      const leadTodo: LeadTodo = {
        id: safeData.id,
        lead_id: safeData.lead_id,
        todo_text: safeData.todo_text,
        status: safeData.status || 'offen',
        priority: safeData.priority,
        estimated_impact: safeData.estimated_impact,
        created_at: safeData.created_at,
        completed_at: safeData.completed_at
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
      
      // TODO: Replace with proper Supabase types after generation
      const safeData: any[] = data || [];
      
      const leadEvents: LeadEvent[] = safeData.map((item: any) => ({
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
