import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// MIGRATED: Supabase removed - use AWS services
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
      // Claim in one step with RLS-compatible conditions
      const { data, error } = await supabase
        .from('unclaimed_business_profiles')
        .update({
          claim_status: 'claimed',
          claimed_by_user_id: userId,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('claim_status', 'unclaimed')          // prevents race conditions & matches RLS policy
        .is('claimed_by_user_id', null)           // ensures profile is truly unclaimed
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