
import { useQuery } from '@tanstack/react-query';
// MIGRATED: Supabase removed - use AWS services
import { Row } from '@/integrations/supabase/db-helpers';

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
        .maybeSingle()
        .returns<Row<"google_oauth_tokens"> | null>();

      // Check business profile Google connection status
      const { data: partner } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .returns<Row<"business_partners"> | null>();

      let profile = null;
      if (partner) {
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
          .returns<Row<"business_profiles"> | null>();
        profile = businessProfile;
      }

      const isGoogleConnected = !!(token?.access_token && (profile as any)?.google_connected);

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
