
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGoogleConnection() {
  return useQuery({
    queryKey: ['google-connection'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isGoogleConnected: false, profile: null };

      // Check for valid Google OAuth token
      const { data: token, error: tokenError } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check business profile Google connection status
      const { data: partner } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let profile = null;
      if (partner) {
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('partner_id', partner.id)
          .maybeSingle();
        profile = businessProfile;
      }

      const isGoogleConnected = !!(token && token.access_token && profile?.google_connected);

      return {
        isGoogleConnected,
        profile,
        token
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true
  });
}
