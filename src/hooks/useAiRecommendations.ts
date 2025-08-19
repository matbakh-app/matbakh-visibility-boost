
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAiRecommendations() {
  return useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: partner } = await supabase
        .from('business_partners')
        .select('id')
        .eq('user_id', user.id as any)
        .single();

      if (!partner) return [];

      const { data: recommendations, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('partner_id', (partner as any).id)
        .eq('status', 'pending' as any)
        .order('priority', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      return recommendations || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
