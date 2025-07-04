
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { kpiMocks } from '@/mocks/kpi';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useKpi(titleKey: string) {
  return useQuery({
    queryKey: ['kpi', titleKey],
    queryFn: async () => {
      if (USE_MOCKS) {
        // Simulate API delay for realistic experience
        await new Promise(resolve => setTimeout(resolve, 300));
        return kpiMocks[titleKey] || { value: 'N/A', trend: '0%' };
      }
      
      // Real API call to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('fetch-kpi', {
        body: { name: titleKey }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchInterval: 30000 // 30 seconds
  });
}
