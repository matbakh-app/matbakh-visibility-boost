
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSyncGa4() {
  return useQuery({
    queryKey: ['sync-ga4'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-ga4');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  });
}
