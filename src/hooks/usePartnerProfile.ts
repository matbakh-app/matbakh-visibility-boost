
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePartnerProfile() {
  return useQuery({
    queryKey: ['partner-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .select('*')
        .eq('user_id', user.id as any)
        .single();

      if (partnerError) throw partnerError;

      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id as any)
        .maybeSingle();

      return {
        partner,
        profile,
        displayName: (profile as any)?.company_name || (partner as any)?.company_name || (partner as any)?.contact_email?.split('@')[0] || 'Partner'
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
