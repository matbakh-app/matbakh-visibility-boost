
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useKpiSummary() {
  return useQuery({
    queryKey: ['kpi-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: partner } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) throw new Error('No partner found');

      // Get visibility score from business profile
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('rating, review_count, photos')
        .eq('partner_id', partner.id)
        .maybeSingle();

      // Calculate basic visibility score
      const ratingScore = (profile?.rating || 0) * 20; // max 100 for 5 stars
      const reviewScore = Math.min((profile?.review_count || 0) * 2, 20); // max 20 for 10+ reviews
      const photoScore = Math.min((profile?.photos?.length || 0) * 5, 20); // max 20 for 4+ photos
      
      const totalScore = Math.round(ratingScore + reviewScore + photoScore);
      const trend = Math.random() > 0.5 ? '+' : '-'; // Mock trend for now
      const trendValue = Math.round(Math.random() * 30);

      // Get recent insights
      const insights = [
        {
          key: 'visibility',
          value: `${trendValue}%`,
          trend: trend,
          type: 'visibility'
        },
        {
          key: 'reviews',
          value: profile?.review_count || 0,
          trend: '+',
          type: 'reviews'
        }
      ];

      return {
        score: Math.max(totalScore, 65), // Minimum 65 for demo
        insights,
        lastUpdated: new Date().toISOString()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
