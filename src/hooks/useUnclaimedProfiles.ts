import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UnclaimedBusinessProfile } from '@/types/visibility';

export function useUnclaimedProfiles() {
  return useQuery({
    queryKey: ['unclaimed-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .select('*')
        .eq('claim_status', 'unclaimed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UnclaimedBusinessProfile[];
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
        .maybeSingle();

      if (error) throw error;
      return data as UnclaimedBusinessProfile | null;
    },
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUnclaimedProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: Partial<UnclaimedBusinessProfile>) => {
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .insert(profileData)
        .select()
        .single();

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
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .update({
          claimed_by_user_id: userId,
          claimed_at: new Date().toISOString(),
          claim_status: 'claimed'
        })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unclaimed-profiles'] });
    },
  });
}