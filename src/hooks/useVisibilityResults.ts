import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VisibilityCheckResult } from '@/types/visibility';

export function useVisibilityResults(leadId?: string) {
  return useQuery({
    queryKey: ['visibility-results', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as VisibilityCheckResult | null;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePartnerVisibilityResults(partnerId?: string) {
  return useQuery({
    queryKey: ['partner-visibility-results', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await supabase
        .from('visibility_check_results')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisibilityCheckResult[];
    },
    enabled: !!partnerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateVisibilityResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultData: Partial<VisibilityCheckResult>) => {
      const { data, error } = await supabase
        .from('visibility_check_results')
        .insert(resultData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['visibility-results'] });
      queryClient.invalidateQueries({ queryKey: ['partner-visibility-results'] });
    },
  });
}