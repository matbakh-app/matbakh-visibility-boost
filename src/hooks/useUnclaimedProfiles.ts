import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Row, Insert, Update } from '@/integrations/supabase/db-helpers';

export function useUnclaimedProfiles() {
  return useQuery({
    queryKey: ['unclaimed-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .select('*')
        .eq('claim_status', 'unclaimed')
        .order('created_at', { ascending: false })
        .returns<Row<"unclaimed_business_profiles">[]>();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUnclaimedProfileByLead(leadId?: string) {
  return useQuery({
    queryKey: ['unclaimed-profile', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle()
        .returns<Row<"unclaimed_business_profiles"> | null>();

      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUnclaimedProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: Insert<"unclaimed_business_profiles">) => {
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .insert([profileData])
        .select()
        .single()
        .returns<Row<"unclaimed_business_profiles">>();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unclaimed-profiles'] });
    },
  });
}

export function useClaimProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, userId }: { profileId: string; userId: string }) => {
      const updateData: Update<"unclaimed_business_profiles"> = {
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
        claim_status: 'claimed'
      };

      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single()
        .returns<Row<"unclaimed_business_profiles">>();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unclaimed-profiles'] });
    },
  });
}